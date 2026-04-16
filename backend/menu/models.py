from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver

class FoodItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, default='General')
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='menu_items/', null=True, blank=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name

# Automatically delete the image from Cloudinary when the FoodItem is deleted
@receiver(post_delete, sender=FoodItem)
def delete_item_image(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)