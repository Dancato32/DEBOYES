import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from .models import Order, OrderItem, DeliveryBatch, OrderMessage
from . import services
from menu.models import FoodItem
from users.auth import token_required
from django.core.cache import cache

def clear_admin_stats_cache():
    """Invalidates the admin dashboard statistics cache."""
    cache.delete('admin_dashboard_stats')

User = get_user_model()

@csrf_exempt
@token_required
def get_order_messages(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        # Auth check: only customer or rider associated with order can see messages
        if request.user != order.customer and request.user != order.rider:
            return JsonResponse({"error": "Unauthorized"}, status=403)
        
        messages = order.messages.all().order_by('created_at')
        data = [
            {
                "id": m.id,
                "sender_id": m.sender.id,
                "sender_name": m.sender.username,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat(),
                "is_me": m.sender == request.user
            }
            for m in messages
        ]
        return JsonResponse({"messages": data})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

@csrf_exempt
@token_required
def send_order_message(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        if request.user != order.customer and request.user != order.rider:
            return JsonResponse({"error": "Unauthorized"}, status=403)
        
        data = json.loads(request.body)
        content = data.get('content')
        if not content:
            return JsonResponse({"error": "Content required"}, status=400)
        
        message = OrderMessage.objects.create(
            order=order,
            sender=request.user,
            content=content
        )

        # Broadcast via WebSocket
        room_group_name = f"order_{order_id}"
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": message.id,
                    "sender_id": message.sender.id,
                    "sender_name": message.sender.username,
                    "content": message.content,
                    "created_at": message.created_at.isoformat()
                }
            }
        )

        # Notify the recipient specifically (Rider or Customer)
        recipient = order.rider if request.user == order.customer else order.customer
        if recipient:
            recipient_group = f"user_{recipient.id}"
            async_to_sync(channel_layer.group_send)(
                recipient_group,
                {
                    "type": "rider_order_event", # Common handler for UI updates
                    "data": {
                        "event": "NEW_CHAT_MESSAGE",
                        "payload": {
                            "order_id": order_id,
                            "sender_name": request.user.username,
                            "content": content
                        }
                    }
                }
            )

        return JsonResponse({"message": "Sent", "id": message.id})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

@csrf_exempt
@token_required
def mark_messages_as_read(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        if request.user != order.customer and request.user != order.rider:
            return JsonResponse({"error": "Unauthorized"}, status=403)
        
        # Mark all messages sent by the OTHER party as read
        unread = order.messages.filter(is_read=False).exclude(sender=request.user)
        unread_count = unread.count()
        unread.update(is_read=True)

        if unread_count > 0:
            # Broadcast read notification
            room_group_name = f"order_{order_id}"
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "messages_read",
                    "reader_id": request.user.id
                }
            )

        return JsonResponse({"message": "Marked as read", "count_updated": unread_count})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

def broadcast_admin_update(event_type, data=None):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "admin_updates",
        {
            "type": "admin_update",
            "data": {"event": event_type, "payload": data}
        }
    )

def broadcast_rider_event(event_type, data):
    """Broadcast an event to ALL online riders across the entire system."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "all_riders",
        {
            "type": "rider_order_event",
            "data": {"event": event_type, "payload": data}
        }
    )

def broadcast_customer_event(customer_id, event_type, data):
    """Broadcast an event to a specific customer's private group."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{customer_id}",
        {
            "type": "customer_order_event",
            "data": {"event": event_type, "payload": data}
        }
    )

# SMART BATCHING ENGINE
def create_batch(order):
    """
    Automatically group ready orders into a Super Order (Batch).
    Grouping criteria: Area and Proximity. 
    Constraint: Max 3 orders per batch.
    """
    with transaction.atomic():
        # Look for an existing 'available' batch in the same area that has < 3 orders
        batch = DeliveryBatch.objects.annotate(order_count=Count('orders')).filter(
            status='available',
            orders__area=order.area,
            order_count__lt=3
        ).distinct().first()

        if not batch:
            # Create a new Super Order
            # 'window_expires_at' ensures it becomes available even if not full after 15 mins
            batch = DeliveryBatch.objects.create(
                status='available',
                total_payout=0,
                estimated_time=25,
                window_expires_at=timezone.now() + timezone.timedelta(minutes=15)
            )
        
        # Add order to batch
        order.batch = batch
        order.save()
        
        # Recalculate batch totals (Payout = Sum of delivery fees)
        orders_in_batch = list(batch.orders.all())
        total_payout = sum(o.delivery_fee for o in orders_in_batch)
        batch.total_payout = total_payout
        
        # Add time per stop
        batch.estimated_time = 20 + (len(orders_in_batch) * 8)
        batch.save()
        
        # Sort the route automatically
        services.optimize_delivery_route(batch)

    # Notify riders about the updated/new Super Order
    broadcast_rider_event("NEW_BATCH", {
        "batch_id": batch.id,
        "area": order.area,
        "stops": batch.orders.count(),
        "total_payout": str(batch.total_payout),
        "estimated_time": batch.estimated_time
    })
    return batch

# AUTO ASSIGN RIDER (kept for manual/fallback use only)
def auto_assign_rider(order):
    eligible_riders = User.objects.filter(
        user_type='rider',
        is_available=True,
        current_area=order.area
    ).annotate(
        active_orders=Count('deliveries', filter=Q(deliveries__status__in=['assigned', 'on_the_way']))
    ).filter(
        active_orders__lt=3
    ).order_by('active_orders', 'last_assigned_at')

    rider = eligible_riders.first()

    if rider:
        order.rider = rider
        order.status = 'assigned'
        order.assigned_at = timezone.now()
        order.save()
        rider.last_assigned_at = timezone.now()
        rider.save()


from .utils import calculate_delivery_fee

# CANCEL ORDER (Customer only — before a rider is assigned)
@csrf_exempt
@token_required
def cancel_order(request, order_id):
    """Allow a customer to cancel their order ONLY if it hasn't been assigned to a rider yet."""
    if not request.user.is_customer():
        return JsonResponse({"error": "Only customers can cancel orders"}, status=403)

    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

    # Only allow cancellation while order is in preparation (not yet assigned)
    cancellable_statuses = ['new', 'pending']
    if order.status not in cancellable_statuses:
        return JsonResponse({
            "error": "This order can no longer be cancelled. A rider has already been assigned."
        }, status=400)

    order.status = 'cancelled'
    order.save(update_fields=['status'])

    clear_admin_stats_cache()
    broadcast_admin_update("ORDER_CANCELLED", {"order_id": order.id})

    return JsonResponse({"message": "Order cancelled successfully"})


# GET ESTIMATED DELIVERY FEE
@csrf_exempt
@token_required
def get_delivery_fee(request):
    try:
        data = json.loads(request.body)
        lat = data.get('lat')
        lng = data.get('lng')
        area = data.get('area', '')
        
        fee, zone_name, meta = calculate_delivery_fee(lat, lng, area)
        return JsonResponse({
            "fee": fee,
            "currency": "GHS",
            "distance_km": meta["distance_km"],
            "zone": zone_name,
            "eta_mins": meta["eta_mins"],
            "method": meta["method"]
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# PLACE ORDER
@csrf_exempt
@token_required
def place_order(request):
    if not request.user.is_customer():
        return JsonResponse({"error": "Only customers allowed"}, status=403)

    data = json.loads(request.body)
    
    # Backend-driven fee calculation to ensure integrity
    lat = data.get('lat')
    lng = data.get('lng')
    area = data.get('area', '')
    payment_method = data.get('payment_method', 'pay_in_person')
    
    fee, zone_name, meta = calculate_delivery_fee(lat, lng, area)

    # Initial order creation
    order = Order.objects.create(
        customer=request.user,
        address=data['address'],
        area=area,
        delivery_fee=fee,
        delivery_zone_name=zone_name,
        lat=lat,
        lng=lng,
        restaurant_lat=data.get('restaurant_lat', 5.6037),
        restaurant_lng=data.get('restaurant_lng', -0.1870),
        payment_method=payment_method,
        payment_status='pending',
    )

    items = data.get('items', [])
    food_total = 0
    for item in items:
        food = FoodItem.objects.get(id=item['food_id'])
        qty = int(item.get('qty', 1))
        OrderItem.objects.create(order=order, food=food, quantity=qty)
        food_total += (float(food.price) * qty)

    # Finalize total price (Food + Delivery)
    order.total_price = food_total + float(fee)
    order.save()

    # Handle payment method
    if payment_method == 'pay_on_app':
        try:
            from .payment import initialize_payment
            email = request.user.email or f"{request.user.username}@placeholder.com"
            payment_data = initialize_payment(order, email)
            
            # CLEAR CACHE: New order placed (even if pending payment)
            clear_admin_stats_cache()
            
            return JsonResponse({
                "message": "Payment initialized",
                "order_id": order.id,
                "delivery_fee": fee,
                "total_price": order.total_price,
                "payment": {
                    "authorization_url": payment_data["authorization_url"],
                    "reference": payment_data["reference"],
                    "access_code": payment_data["access_code"],
                }
            })
        except Exception as e:
            # If payment init fails, still keep the order but notify user
            return JsonResponse({
                "error": f"Order created but payment failed to initialize: {str(e)}",
                "order_id": order.id,
            }, status=500)
    else:
        # Pay in person — proceed normally
        clear_admin_stats_cache()
        broadcast_admin_update("ORDER_PLACED", {"order_id": order.id})
        return JsonResponse({
            "message": "Order placed", 
            "order_id": order.id,
            "delivery_fee": fee,
            "total_price": order.total_price
        })


# VERIFY PAYMENT (Paystack callback)
@csrf_exempt
@token_required
def verify_payment_view(request, reference):
    """Verify a Paystack payment after the customer returns from the checkout page."""
    try:
        order = Order.objects.get(payment_reference=reference)
    except Order.DoesNotExist:
        return JsonResponse({"error": "No order found with this payment reference"}, status=404)

    # Security: only the order owner can verify
    if order.customer != request.user:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    from .payment import verify_payment
    result = verify_payment(reference)

    if result["success"]:
        order.payment_status = 'paid'
        order.save(update_fields=['payment_status'])

        # Now notify admin that a paid order has arrived
        broadcast_admin_update("ORDER_PLACED", {
            "order_id": order.id,
            "payment_method": "pay_on_app",
            "payment_status": "paid"
        })

        return JsonResponse({
            "message": "Payment verified successfully!",
            "order_id": order.id,
            "status": "paid",
            "amount": result["amount"],
            "channel": result["channel"],
        })
    else:
        order.payment_status = 'failed'
        order.save(update_fields=['payment_status'])
        return JsonResponse({
            "error": "Payment verification failed",
            "message": result.get("message", "Unknown error"),
            "order_id": order.id,
        }, status=400)


# GET AVAILABLE RIDERS
@csrf_exempt
@token_required
def get_available_riders(request):
    if not request.user.is_customer():
        return JsonResponse({"error": "Only customers allowed"}, status=403)

    area = request.GET.get('area')

    riders = User.objects.filter(
        user_type='rider',
        is_available=True,
        current_area=area
    ).annotate(
        active_orders=Count('deliveries', filter=Q(deliveries__status__in=['assigned', 'on_the_way']))
    ).filter(
        active_orders__lt=3
    )

    data = [
        {"id": r.id, "username": r.username, "active_load": r.active_orders}
        for r in riders
    ]

    return JsonResponse({"riders": data})


# RIDER ACCEPTS ORDER (Classic Single-Order Flow)
@csrf_exempt
@token_required
def accept_order(request, order_id):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    active_count = Order.objects.filter(
        rider=request.user, 
        status__in=['assigned', 'on_the_way']
    ).count()

    if active_count >= 3:
        return JsonResponse({"error": "You already have the maximum of 3 active orders"}, status=400)

    with transaction.atomic():
        # Riders can ONLY accept 'ready' orders
        order = Order.objects.select_for_update(skip_locked=True).filter(
            id=order_id, status='ready'
        ).first()

        if not order:
            return JsonResponse({"error": "Order no longer available or not yet ready"}, status=409)

        order.rider = request.user
        order.status = 'assigned'
        order.assigned_at = timezone.now()
        
        # Initialize Dynamic Batching for the rider
        request.user.batch_open = True
        request.user.save()
        
        # Initialize the batch window if it's a new batch
        if order.batch:
            if not order.batch.accepted_at:
                order.batch.accepted_at = timezone.now()
                order.batch.window_expires_at = timezone.now() + timezone.timedelta(minutes=10)
                order.batch.rider = request.user
                order.batch.status = 'accepted'
                order.batch.save()
        else:
            # Create a single-order batch for tracking purposes if one doesn't exist
            batch = DeliveryBatch.objects.create(
                rider=request.user,
                status='accepted',
                accepted_at=timezone.now(),
                window_expires_at=timezone.now() + timezone.timedelta(minutes=10)
            )
            order.batch = batch
        
        order.save()
        
        # Recalculate priorities in the batch
        services.optimize_delivery_route(order.batch)

        request.user.last_assigned_at = timezone.now()
        request.user.save()

    broadcast_admin_update("ORDER_ACCEPTED", {"order_id": order.id, "rider": request.user.username})
    broadcast_rider_event("ORDER_TAKEN", {"order_id": order.id})
    broadcast_customer_event(order.customer.id, "ORDER_CONFIRMED", {
        "order_id": order.id,
        "status": "assigned",
        "message": f"Your order has been confirmed by {request.user.username}!"
    })
    return JsonResponse({"message": "Order accepted"})

# RIDER ACCEPTS BATCH (SUPER ORDER)
@csrf_exempt
@token_required
def accept_batch(request, batch_id):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    with transaction.atomic():
        batch = DeliveryBatch.objects.select_for_update().filter(id=batch_id, status='available').first()
        if not batch:
            return JsonResponse({"error": "Batch no longer available"}, status=409)

        batch.rider = request.user
        batch.status = 'accepted'
        batch.accepted_at = timezone.now()
        batch.save()

        # Update all orders in the batch
        for order in batch.orders.all():
            order.rider = request.user
            order.status = 'assigned'
            order.assigned_at = timezone.now()
            order.save()

    broadcast_rider_event("BATCH_TAKEN", {"batch_id": batch.id})
    return JsonResponse({"message": "Batch accepted", "batch_id": batch.id})

# GET AVAILABLE BATCHES
@csrf_exempt
@token_required
def get_available_batches(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)
    
    # Only show batches that have 3 orders OR have been waiting longer than 15 mins (window expired)
    batches = DeliveryBatch.objects.annotate(order_count=Count('orders')).filter(
        status='available',
        order_count__gt=0
    ).filter(
        Q(order_count=3) | Q(window_expires_at__lte=timezone.now())
    ).prefetch_related('orders').order_by('-created_at')

    data = []
    for b in batches:
        data.append({
            "id": b.id,
            "stops_count": b.orders.count(),
            "area": b.orders.first().area if b.orders.exists() else "Unknown",
            "total_payout": str(b.total_payout),
            "estimated_time": b.estimated_time,
        })
    return JsonResponse({"batches": data})

# GET BATCH DETAILS
@csrf_exempt
@token_required
def get_batch_details(request, batch_id):
    try:
        batch = DeliveryBatch.objects.prefetch_related('orders__items__food').get(id=batch_id)
        stops = []
        for o in batch.orders.all().order_by('stop_number'):
            stops.append({
                "id": o.id,
                "customer": o.customer.username,
                "address": o.address,
                "status": o.status,
                "stop_number": o.stop_number,
                "items": [{"food": i.food.name, "qty": i.quantity, "image": i.food.image.url if i.food.image else None} for i in o.items.all()]
            })
        
        return JsonResponse({
            "id": batch.id,
            "status": batch.status,
            "total_payout": str(batch.total_payout),
            "estimated_time": batch.estimated_time,
            "stops": stops
        })
    except DeliveryBatch.DoesNotExist:
        return JsonResponse({"error": "Batch not found"}, status=404)


# CONFIRM A SPECIFIC STOP IN A BATCH
@csrf_exempt
@token_required
def confirm_batch_stop(request, batch_id, order_id):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    try:
        batch = DeliveryBatch.objects.get(id=batch_id, rider=request.user)
        order = Order.objects.get(id=order_id, batch=batch)

        if order.status == 'delivered':
             return JsonResponse({"message": "Order already delivered"})

        with transaction.atomic():
            order.status = 'delivered'
            order.delivered_at = timezone.now()
            order.save()

            # Check if all orders in batch are delivered
            delivered_count = batch.orders.filter(status='delivered').count()
            total_count = batch.orders.count()

            if delivered_count == total_count:
                batch.status = 'completed'
                batch.completed_at = timezone.now()
                batch.save()
            elif batch.status != 'in_progress':
                # First delivery marks batch as 'in_progress'
                batch.status = 'in_progress'
                batch.save()

        # Notify admin and customer
        broadcast_admin_update("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": "delivered"})
        broadcast_customer_event(order.customer.id, "STATUS_CHANGE", {
            "order_id": order.id,
            "status": "delivered",
            "message": "📦 Your order has been delivered! Enjoy your meal."
        })
        return JsonResponse({
            "message": "Stop confirmed!",
            "all_done": batch.status == 'completed',
            "stops_remaining": total_count - delivered_count
        })

    except (DeliveryBatch.DoesNotExist, Order.DoesNotExist):
        return JsonResponse({"error": "Batch or Order not found"}, status=404)

# RIDER STARTS TRIP (Self-confirm pickup at restaurant)
@csrf_exempt
@token_required
def start_batch_trip(request, batch_id):
    """Rider confirms they have picked up ALL orders from the restaurant.
    Transitions every 'assigned' order in the batch to 'on_the_way'."""
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    try:
        with transaction.atomic():
            batch = DeliveryBatch.objects.select_for_update().get(
                id=batch_id, rider=request.user
            )

            if batch.status not in ('accepted', 'in_progress'):
                return JsonResponse(
                    {"error": f"Batch status '{batch.status}' cannot be started."},
                    status=400
                )

            updated = 0
            for order in batch.orders.filter(status='assigned'):
                order.status = 'on_the_way'
                order.picked_up_at = timezone.now()
                order.save()
                updated += 1
                broadcast_customer_event(order.customer.id, "STATUS_CHANGE", {
                    "order_id": order.id,
                    "status": "on_the_way",
                    "message": "Your rider has picked up your order and is on the way!"
                })

            if batch.status != 'in_progress':
                batch.status = 'in_progress'
                batch.save()

        broadcast_admin_update("ORDER_STATUS_UPDATED", {
            "batch_id": batch.id,
            "status": "on_the_way",
            "orders_updated": updated
        })
        broadcast_rider_event("ORDER_STATUS_UPDATED", {
            "batch_id": batch.id,
            "status": "on_the_way"
        })

        return JsonResponse({
            "message": f"Trip started! {updated} order(s) now on the way.",
            "orders_updated": updated
        })

    except DeliveryBatch.DoesNotExist:
        return JsonResponse({"error": "Batch not found"}, status=404)


# UPDATE STATUS
@csrf_exempt
@token_required
def update_status(request, order_id):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    data = json.loads(request.body)

    order = Order.objects.get(id=order_id, rider=request.user)
    new_status = data['status']

    # Validate legal transitions for riders
    valid_transitions = {
        'ready':      'on_the_way',
        'assigned':   'on_the_way',  # fallback if rider accepted before ready
        'on_the_way': 'delivered',
    }
    if valid_transitions.get(order.status) != new_status:
        return JsonResponse({"error": f"Cannot transition from '{order.status}' to '{new_status}'"}, status=400)

    order.status = new_status
    
    if new_status == 'on_the_way' and not order.picked_up_at:
        order.picked_up_at = timezone.now()
    elif new_status == 'delivered' and not order.delivered_at:
        order.delivered_at = timezone.now()
        
    order.save()

    broadcast_admin_update("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": order.status})
    return JsonResponse({"message": "Status updated"})


@csrf_exempt
@token_required
def assigned_orders(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    orders = Order.objects.filter(
        rider=request.user,
        status__in=['assigned', 'on_the_way']
    ).select_related('customer').prefetch_related('items__food').order_by('stop_number')
    data = [
        {
            'id': order.id,
            'status': order.status,
            'address': order.address,
            'area': order.area,
            'lat': order.lat,
            'lng': order.lng,
            'restaurant_lat': order.restaurant_lat,
            'restaurant_lng': order.restaurant_lng,
            'total': str(order.total_price),
            'batch_id': order.batch_id,
            'stop_number': order.stop_number,
            'customer': order.customer.username,
            'items': [
                {
                    'food': item.food.name,
                    'qty': item.quantity,
                    'price': str(item.get_price()),
                    'image': item.food.image.url if item.food.image else None
                }
                for item in order.items.all()
            ]
        }
        for order in orders
    ]

    return JsonResponse({'orders': data})


@csrf_exempt
@token_required
def pending_orders(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    # Riders now see ALL ready orders in the entire system (Global Feed)
    orders = Order.objects.filter(
        status='ready', 
        rider__isnull=True
    ).select_related('customer').prefetch_related('items__food').order_by('-created_at')
    
    data = [
        {
            'id': order.id,
            'address': order.address,
            'area': order.area,
            'total': str(order.total_price),
            'items': [
                {
                    'food': item.food.name,
                    'qty': item.quantity,
                    'price': str(item.get_price()),
                    'image': item.food.image.url if item.food.image else None
                }
                for item in order.items.all()
            ]
        }
        for order in orders
    ]

    return JsonResponse({'orders': data})



@csrf_exempt
@token_required
def track_order(request, order_id):
    order = Order.objects.select_related('rider', 'batch').prefetch_related('items__food').get(id=order_id, customer=request.user)

    items = [
        {
            "food": i.food.name,
            "qty": i.quantity,
            "price": str(i.get_price()),
            "image": i.food.image.url if i.food.image else None
        }
        for i in order.items.all()
    ]

    batch_info = None
    if order.batch:
        # Calculate how many stops are ahead of this order
        stops_ahead = order.batch.orders.filter(
            status__in=['ready', 'assigned', 'on_the_way'],
            stop_number__lt=order.stop_number
        ).count()
        
        batch_info = {
            "batch_id": order.batch.id,
            "stops_ahead": stops_ahead,
            "is_batched": True,
            "estimated_wait": stops_ahead * 15 # Simple heuristic: 15 mins per stop
        }

    return JsonResponse({
        "status": order.status,
        "rider": order.rider.username if order.rider else None,
        "total": str(order.total_price),
        "items": items,
        "batch_info": batch_info,
        "lat": order.lat,
        "lng": order.lng,
        "restaurant_lat": order.restaurant_lat,
        "restaurant_lng": order.restaurant_lng,
    })

@csrf_exempt
@token_required
def get_history(request):
    if request.user.is_rider():
        orders = Order.objects.filter(rider=request.user, status='delivered').select_related('customer').prefetch_related('items__food').order_by('-delivered_at')[:50]
    else:
        orders = Order.objects.filter(customer=request.user).exclude(status='new').prefetch_related('items__food').order_by('-created_at')[:20]

    data = [
        {
            'id': order.id,
            'status': order.status.replace('_', ' ').title(),
            'address': order.address,
            'total': str(order.total_price),
            'date': (order.delivered_at or order.created_at).strftime('%H:%M • %b %d, %Y'),
            'items': [
                {'food': i.food.name, 'qty': i.quantity, 'image': i.food.image.url if i.food.image else None}
                for i in order.items.all()
            ]
        }
        for order in orders
    ]
    return JsonResponse({'orders': data})