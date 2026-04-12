from django.db import models

class FoodItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, default='General')
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='menu_items/', null=True, blank=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name