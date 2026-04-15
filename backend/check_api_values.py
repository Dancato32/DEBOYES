import os
import django
import sys
import json

# Setup django environment
sys.path.append('c:/Users/danie/OneDrive/Desktop/Sarapp\Mobile_BOYES/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from menu.models import FoodItem

items = FoodItem.objects.all()
data = [
    {
        'id': item.id,
        'name': item.name,
        'image_val': str(item.image),
        'image_url': item.image.url if item.image else None,
        'bool_val': bool(item.image)
    }
    for item in items
]
print(json.dumps(data, indent=2))
