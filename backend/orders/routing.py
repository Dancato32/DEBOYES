from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tracking/(?P<order_id>\d+)/$', consumers.OrderTrackingConsumer.as_asgi()),
    re_path(r'ws/admin/updates/$', consumers.AdminUpdatesConsumer.as_asgi()),
    re_path(r'ws/riders/orders/(?P<area>[^/]+)/$', consumers.RiderOrdersConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.OrderTrackingConsumer.as_asgi()),
]