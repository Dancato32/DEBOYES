import os
import django
import sys

# Setup django environment
sys.path.append('c:/Users/danie/OneDrive/Desktop/Sarapp/Mobile_BOYES/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from menu.models import FoodItem

items = FoodItem.objects.all()
print(f"Total items: {items.count()}")
for item in items:
    print(f"ID: {item.id}, Name: {item.name}, Image Path: {item.image}")
