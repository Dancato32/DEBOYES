from django.urls import path
from .views import request_otp, verify_otp, complete_profile, login_with_password, google_login, logout_view, toggle_availability, current_user, rider_stats
from .admin_views import get_admin_stats, get_all_orders, get_all_riders, manage_menu, get_all_customers, mark_order_ready, confirm_order, confirm_pickup, manage_settings
from .revenue_views import get_revenue_details

urlpatterns = [
    path('setup/otp/', request_otp),
    path('verify/otp/', verify_otp),
    path('google/login/', google_login),
    path('complete/profile/', complete_profile),
    path('login/password/', login_with_password),
    path('logout/', logout_view),
    path('me/', current_user),
    path('availability/', toggle_availability),
    path('rider/stats/', rider_stats),
    # Admin API
    path('admin/stats/', get_admin_stats),
    path('admin/orders/', get_all_orders),
    path('admin/riders/', get_all_riders),
    path('admin/customers/', get_all_customers),
    path('admin/menu/', manage_menu),
    path('admin/menu/<int:item_id>/', manage_menu),
    path('admin/orders/<int:order_id>/ready/', mark_order_ready),
    path('admin/orders/<int:order_id>/confirm/', confirm_order),
    path('admin/orders/<int:order_id>/pickup/', confirm_pickup),
    path('admin/revenue/', get_revenue_details),
    path('admin/settings/', manage_settings),
]