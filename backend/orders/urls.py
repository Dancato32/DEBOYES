from django.urls import path
from .views import (
    place_order,
    get_delivery_fee,
    get_available_riders,
    accept_order,
    update_status,
    track_order,
    assigned_orders,
    pending_orders,
    get_history,
    get_available_batches,
    get_batch_details,
    accept_batch,
    confirm_batch_stop,
    start_batch_trip,
    get_order_messages,
    send_order_message,
    mark_messages_as_read
)

urlpatterns = [
    path('place/', place_order),
    path('estimate-fee/', get_delivery_fee),
    path('riders/', get_available_riders),
    path('accept/<int:order_id>/', accept_order),
    path('update/<int:order_id>/', update_status),
    path('track/<int:order_id>/', track_order),
    path('<int:order_id>/messages/', get_order_messages),
    path('<int:order_id>/messages/send/', send_order_message),
    path('<int:order_id>/messages/read/', mark_messages_as_read),
    path('assigned/', assigned_orders),
    path('pending/', pending_orders),
    path('history/', get_history),
    
    # Super Orders / Batching
    path('batches/available/', get_available_batches),
    path('batches/<int:batch_id>/', get_batch_details),
    path('batches/<int:batch_id>/accept/', accept_batch),
    path('batches/<int:batch_id>/start/', start_batch_trip),
    path('batches/<int:batch_id>/stop/<int:order_id>/confirm/', confirm_batch_stop),
]