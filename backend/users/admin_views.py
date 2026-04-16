import json
from django.http import JsonResponse
from django.db.models import Sum, Count
from django.utils import timezone
from users.models import User
from orders.models import Order
from menu.models import FoodItem
from django.views.decorators.csrf import csrf_exempt
from .auth import admin_token_required


from datetime import timedelta

@admin_token_required
def get_admin_stats(request):
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    # Today's Stats
    total_orders = Order.objects.filter(created_at__date=today).count()
    active_riders = User.objects.filter(user_type='rider', is_available=True).count()
    
    delivered_orders_today = Order.objects.filter(delivered_at__date=today)
    total_revenue = delivered_orders_today.aggregate(Sum('total_price'))['total_price__sum'] or 0
    today_deliveries = delivered_orders_today.count()
    
    # Yesterday's Stats (for comparison)
    y_orders = Order.objects.filter(created_at__date=yesterday).count()
    y_revenue = Order.objects.filter(delivered_at__date=yesterday).aggregate(Sum('total_price'))['total_price__sum'] or 0
    
    # Lifetime Stats
    delivered_orders_all = Order.objects.filter(status='delivered')
    lifetime_revenue = delivered_orders_all.aggregate(Sum('total_price'))['total_price__sum'] or 0
    lifetime_deliveries = delivered_orders_all.count()

    # Calculate Trends
    def get_trend(current, previous):
        if previous == 0:
            return "+ 100%" if current > 0 else "0% change"
        diff = ((current - previous) / previous) * 100
        prefix = "+" if diff >= 0 else "-"
        return f"{prefix} {abs(int(diff))}% vs yesterday"

    order_trend = get_trend(total_orders, y_orders)
    revenue_trend = get_trend(float(total_revenue), float(y_revenue))
    
    return JsonResponse({
        "total_orders": total_orders,
        "active_riders": active_riders,
        "total_revenue": str(total_revenue),
        "lifetime_revenue": str(lifetime_revenue),
        "lifetime_deliveries": lifetime_deliveries,
        "today_deliveries": today_deliveries,
        "order_trend": order_trend,
        "revenue_trend": revenue_trend,
        "rider_trend": f"+ {active_riders} currently active"
    })

@admin_token_required
def get_all_orders(request):
    status = request.GET.get('status')
    orders = Order.objects.all().order_by('-created_at')
    
    if status and status != 'All':
        orders = orders.filter(status=status.lower())
        
    data = [
        {
            "id": f"QB-{o.id}",
            "customer": o.customer.get_full_name() or o.customer.username,
            "items": ", ".join([f"{item.food.name} × {item.quantity}" for item in o.items.all()]),
            "total": str(o.total_price),
            "status": o.status.replace('_', ' ').title(),
            "date": o.created_at.strftime('%Y-%m-%d'),
            "time": o.created_at.strftime('%H:%M:%S'),
        }
        for o in orders[:50]
    ]
    return JsonResponse({"orders": data})

@admin_token_required
def get_all_riders(request):
    riders = User.objects.filter(user_type='rider')
    data = [
        {
            "id": r.id,
            "username": r.username,
            "status": "Online" if r.is_available else "Offline",
            "area": r.current_area,
            "initials": r.username[:2].upper()
        }
        for r in riders
    ]
    return JsonResponse({"riders": data})

@admin_token_required
def get_all_customers(request):
    customers = User.objects.filter(user_type='customer').annotate(
        order_count=Count('orders')
    ).order_by('-date_joined')
    
    data = [
        {
            "id": c.id,
            "username": c.username,
            "email": c.email,
            "order_count": c.order_count,
            "date_joined": c.date_joined.strftime('%Y-%m-%d'),
            "initials": c.username[:2].upper()
        }
        for c in customers
    ]
    return JsonResponse({"customers": data})

@csrf_exempt
@admin_token_required
def manage_menu(request, item_id=None):
    from orders.views import broadcast_admin_update
    
    if request.method == "POST":
        data = request.POST
        image = request.FILES.get('image')
        
        item = FoodItem.objects.create(
            name=data.get('name'),
            category=data.get('category', 'General'),
            description=data.get('description', ''),
            price=data.get('price'),
            image=image,
            is_available=True
        )
        broadcast_admin_update("MENU_UPDATED", {"action": "ADD", "item_name": item.name})
        return JsonResponse({"message": "Item added successfully", "id": item.id})
    
    if request.method == "DELETE":
        try:
            # We can get id from URL path if we update urls.py, 
            # or from query params. Let's assume URL path for cleaner REST.
            if item_id:
                item = FoodItem.objects.get(id=item_id)
                name = item.name
                item.delete()
                broadcast_admin_update("MENU_UPDATED", {"action": "DELETE", "item_name": name})
                return JsonResponse({"message": "Item deleted"})
            return JsonResponse({"error": "No ID provided"}, status=400)
        except FoodItem.DoesNotExist:
            return JsonResponse({"error": "Item not found"}, status=404)

    items = FoodItem.objects.all().order_by('category', 'name')
    data = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "description": item.description,
            "price": str(item.price),
            "image": item.image.url if item.image else None,
            "is_available": item.is_available
        }
        for item in items
    ]
    return JsonResponse({"items": data})

@csrf_exempt
@admin_token_required
def mark_order_ready(request, order_id):
    from orders.views import broadcast_admin_update, broadcast_rider_event
    if request.method == "POST":
        try:
            order = Order.objects.get(id=order_id)
            if order.status not in ('pending', 'assigned'):
                return JsonResponse({"error": f"Order status '{order.status}' cannot be marked as ready."}, status=400)
            
            order.status = 'ready'
            order.save()
            
            # TRIGGER SMART BATCHING ENGINE
            from orders import services
            assigned_rider = services.find_smart_assignment(order)
            
            if not assigned_rider:
                # If no smart assignment found, fall back to static area batching
                from orders.views import create_batch
                create_batch(order)

            broadcast_admin_update("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": "Ready"})
            return JsonResponse({"message": "Order marked as ready and processed for assignment!"})
        except Order.DoesNotExist:
            return JsonResponse({"error": "Order not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
@admin_token_required
def confirm_pickup(request, order_id):
    """Admin confirms the rider has picked up the food. Status moves to 'on_the_way'."""
    from orders.views import broadcast_admin_update
    if request.method == "POST":
        try:
            order = Order.objects.get(id=order_id)
            if order.status != 'assigned':
                return JsonResponse({"error": f"Order status '{order.status}' cannot be picked up. It must be assigned to a rider first."}, status=400)

            order.status = 'on_the_way'
            order.picked_up_at = timezone.now()
            order.save()

            broadcast_admin_update("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": "On The Way"})
            from orders.views import broadcast_rider_event
            broadcast_rider_event("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": "on_the_way"})
            return JsonResponse({"message": "Pickup confirmed! Rider is now on the way."})
        except Order.DoesNotExist:
            return JsonResponse({"error": "Order not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
@admin_token_required
def confirm_order(request, order_id):
    """Admin confirms a 'new' order — moves it to 'pending'. No alert sent to riders yet."""
    from orders.views import broadcast_admin_update
    if request.method == "POST":
        try:
            order = Order.objects.get(id=order_id)
            if order.status != 'new':
                return JsonResponse({"error": "Only new orders can be confirmed."}, status=400)

            order.status = 'pending'
            order.save()

            # Only broadcast to admin — riders are NOT notified until order is 'ready'
            broadcast_admin_update("ORDER_STATUS_UPDATED", {"order_id": order.id, "status": "Pending"})
            return JsonResponse({"message": "Order confirmed! It will be sent to riders once marked as ready."})
        except Order.DoesNotExist:
            return JsonResponse({"error": "Order not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=405)
