import math
from django.utils import timezone
from .models import Order, DeliveryBatch
from django.contrib.auth import get_user_model

User = get_user_model()

def calculate_distance(lat1, lng1, lat2, lng2):
    """Simple Euclidean distance for proximity (2D approximation for small distances)."""
    if lat1 is None or lng1 is None or lat2 is None or lng2 is None:
        return 999  # Infinity
    # Approx 111km per degree latitude. Longitude varies but close enough for local 3km radius.
    return math.sqrt((lat1 - lat2)**2 + (lng1 - lng2)**2) * 111

def find_smart_assignment(order):
    """
    Attempts to assign a 'Ready' order to an active rider with an open batch.
    If success, returns the Rider.
    """
    if order.status != 'ready':
        return None

    # Constants
    MAX_RADIUS = 3.0  # 3km
    
    # 1. Find riders with an open batch
    riders = User.objects.filter(
        user_type='rider',
        batch_open=True,
        is_available=True
    ).prefetch_related('batches')

    best_rider = None
    min_dist = MAX_RADIUS

    for rider in riders:
        # Find their active batch
        active_batch = rider.batches.filter(status__in=['accepted', 'in_progress']).first()
        if not active_batch:
            continue

        # Check constraints
        if active_batch.orders.count() >= rider.max_batch_size:
            # Auto-close batch if full
            rider.batch_open = False
            rider.save()
            continue
        
        if active_batch.window_expires_at and active_batch.window_expires_at < timezone.now():
            # Window expired
            rider.batch_open = False
            rider.save()
            continue

        # Proximity Check: Distance to the rider's first order (usually the center of their current cluster)
        first_order = active_batch.orders.first()
        dist = calculate_distance(order.lat, order.lng, first_order.lat, first_order.lng)

        if dist < min_dist:
            min_dist = dist
            best_rider = rider

    if best_rider:
        active_batch = best_rider.batches.filter(status__in=['accepted', 'in_progress']).first()
        order.rider = best_rider
        order.batch = active_batch
        order.status = 'assigned'
        order.assigned_at = timezone.now()
        order.save()
        
        # Re-optimize the route sequence for the rider
        optimize_delivery_route(active_batch)
        return best_rider

    return None

def optimize_delivery_route(batch):
    """
    Updates stop_number for all orders in a batch based on 'Distance and Time'.
    We start from the restaurant and greedily pick the best next stop.
    Formula: score = (wait_time_mins * 2) - (distance_km * 5)
    """
    from django.db import transaction
    from .utils import RESTAURANT_LAT, RESTAURANT_LNG
    
    with transaction.atomic():
        orders = list(batch.orders.all())
        if not orders:
            return
            
        now = timezone.now()
        
        # Sequence stops
        # Stop 1: Best balance of distance from restaurant and wait time
        for order in orders:
            wait_time = (now - order.created_at).total_seconds() / 60
            dist_from_origin = calculate_distance(order.lat, order.lng, RESTAURANT_LAT, RESTAURANT_LNG)
            
            # Higher score is better. 
            # We want high wait_time and low distance.
            order.priority_score = (wait_time * 2.0) - (dist_from_origin * 5.0)
            
            # Hard override for very old orders
            if wait_time > 40:
                order.priority_score += 1000

        # Initial Sort
        orders.sort(key=lambda x: x.priority_score, reverse=True)
        
        # Apply stop numbers
        for i, order in enumerate(orders):
            order.stop_number = i + 1
        
        # Bulk update sequence numbers and scores
        Order.objects.bulk_update(orders, ['stop_number', 'priority_score'])
