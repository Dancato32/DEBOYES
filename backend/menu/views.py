import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import FoodItem

@login_required
def menu_items(request):
    items = FoodItem.objects.filter(is_available=True)
    data = [
        {
            'id': item.id,
            'name': item.name,
            'category': item.category,
            'description': item.description,
            'price': str(item.price),
            'image': item.image.url if item.image else None
        }
        for item in items
    ]
    return JsonResponse({'items': data})
