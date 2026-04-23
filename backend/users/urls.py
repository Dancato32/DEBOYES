from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views, admin_views, revenue_views

urlpatterns = [
    # Mobile App Auth (JWT Persistence)
    path('register/', views.DRFRegisterView.as_view(), name='drf_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.DRFUserProfileView.as_view(), name='drf_profile'),

    # Existing Web Auth
    path('signup/password/', views.signup_with_password),
    path('login/password/', views.login_with_password),
    path('logout/', views.logout_view),
    path('me/', views.current_user),
    
    # Rider Endpoints
    path('availability/', views.toggle_availability),
    path('rider/stats/', views.rider_stats),
    
    # Admin API
    path('admin/stats/', admin_views.get_admin_stats),
    path('admin/orders/', admin_views.get_all_orders),
    path('admin/riders/', admin_views.get_all_riders),
    path('admin/customers/', admin_views.get_all_customers),
    path('admin/menu/', admin_views.manage_menu),
    path('admin/menu/<int:item_id>/', admin_views.manage_menu),
    path('admin/orders/<int:order_id>/ready/', admin_views.mark_order_ready),
    path('admin/orders/<int:order_id>/confirm/', admin_views.confirm_order),
    path('admin/orders/<int:order_id>/pickup/', admin_views.confirm_pickup),
    path('admin/revenue/', revenue_views.get_revenue_details),
    path('admin/settings/', admin_views.manage_settings),
    
    # Store Compliance & Notifications
    path('delete/', views.delete_account, name='delete_account'),
    path('fcm-token/', views.update_fcm_token, name='update_fcm_token'),
]