from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('rider', 'Rider'),
        ('admin', 'Admin'),
    )

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)

    is_available = models.BooleanField(default=False)
    current_area = models.CharField(max_length=100, blank=True)
    last_assigned_at = models.DateTimeField(null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)

    # Dynamic Batching
    batch_open = models.BooleanField(default=False)
    max_batch_size = models.PositiveIntegerField(default=3)

    def is_customer(self):
        return self.user_type == 'customer'

    def is_rider(self):
        return self.user_type == 'rider'

class AdminSetting(models.Model):
    key = models.CharField(max_length=50, unique=True)
    value = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value[:30]}"