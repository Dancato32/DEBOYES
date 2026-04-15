from django.db import models
from django.conf import settings
from menu.models import FoodItem

User = settings.AUTH_USER_MODEL


class DeliveryBatch(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )
    rider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='batches')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    total_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_time = models.IntegerField(help_text="In minutes", default=30)
    
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    window_expires_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Batch #{self.id} ({self.status})"


class Order(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('ready', 'Ready'),
        ('on_the_way', 'On The Way'),
        ('delivered', 'Delivered'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    rider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    batch = models.ForeignKey(DeliveryBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')

    address = models.CharField(max_length=255)
    area = models.CharField(max_length=100)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    stop_number = models.PositiveIntegerField(default=0)

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Proximity & Priority
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    restaurant_lat = models.FloatField(null=True, blank=True)
    restaurant_lng = models.FloatField(null=True, blank=True)
    priority_score = models.FloatField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE)

    quantity = models.PositiveIntegerField(default=1)
    price_at_checkout = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.id and not self.price_at_checkout:
            self.price_at_checkout = self.food.price
        super().save(*args, **kwargs)

    def get_price(self):
        # Fallback to current food price safely if order is historic from before migration
        price = self.price_at_checkout if self.price_at_checkout else self.food.price
        return price * self.quantity


class OrderMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.username} on Order #{self.order.id}"