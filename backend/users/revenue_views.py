from django.http import JsonResponse
from orders.models import Order
from .auth import admin_token_required

@admin_token_required
def get_revenue_details(request):
    """
    Returns a detailed list of all revenue-generating orders (delivered).
    Includes customer, total price, and localized delivery timestamp.
    """
    orders = Order.objects.filter(status='delivered').select_related('customer').prefetch_related('items__food').order_by('-delivered_at')[:100]
    
    data = [
        {
            "id": f"QB-{o.id}",
            "customer": o.customer.get_full_name() or o.customer.username,
            "items": ", ".join([f"{item.food.name} × {item.quantity}" for item in o.items.all()]),
            "amount": str(o.total_price),
            "date": o.delivered_at.strftime('%Y-%m-%d'),
            "time": o.delivered_at.strftime('%H:%M:%S'),
            "timestamp": o.delivered_at.isoformat(),
        }
        for o in orders
    ]
    
    return JsonResponse({"revenue_items": data})
