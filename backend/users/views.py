import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import random
import datetime
from .auth import create_token, token_required
from .models import LoginCode
from .email_utils import send_otp_email
from .sms_utils import send_arkesel_sms
from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer


User = get_user_model()

@csrf_exempt
def signup_with_password(request):
    """Traditional Email/Username & Password Signup."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        user_type = data.get('user_type', 'customer')

        if not email or not username or not password:
            return JsonResponse({"error": "Email, username, and password are required"}, status=400)

        if User.objects.filter(username__iexact=username).exists():
            return JsonResponse({"error": "Username is already taken"}, status=400)
        
        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"error": "Email is already registered"}, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            user_type=user_type
        )
        
        token = create_token(user)
        return JsonResponse({
            "status": "success",
            "token": token,
            "user": {
                "username": user.username,
                "user_type": user.user_type
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)



@csrf_exempt
def login_with_password(request):
    """Standard Email/Username & Password login."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        identifier = data.get('username', '').strip() # can be email or username
        password = data.get('password', '')

        if not identifier or not password:
            return JsonResponse({"error": "Email/Username and password required"}, status=400)

        auth_username = None
        # Check if input looks like an email
        if '@' in identifier:
            db_user = User.objects.filter(email__iexact=identifier).first()
            if db_user:
                auth_username = db_user.username
        else:
            try:
                db_user = User.objects.get(username__iexact=identifier)
                auth_username = db_user.username
            except User.DoesNotExist:
                pass

        if not auth_username:
             return JsonResponse({"error": "Invalid credentials"}, status=401)

        user = authenticate(username=auth_username, password=password)

        if not user:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        token = create_token(user)
        return JsonResponse({
            "status": "success",
            "token": token,
            "user": {
                "username": user.username,
                "user_type": user.user_type
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# LOGOUT — stateless, client just discards the token
@csrf_exempt
def logout_view(request):
    return JsonResponse({"message": "Logged out"})


# CURRENT USER
@csrf_exempt
@token_required
def current_user(request):
    from django.utils import timezone
    from orders.models import Order

    active_days = (timezone.now().date() - request.user.date_joined.date()).days + 1
    order_count = Order.objects.filter(customer=request.user, status='delivered').count()

    membership_status = "Bronze"
    if order_count > 50:
        membership_status = "Diamond"
    elif order_count > 20:
        membership_status = "Gold"
    elif order_count > 5:
        membership_status = "Silver"

    return JsonResponse({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'user_type': request.user.user_type,
            'is_available': request.user.is_available,
            'current_area': request.user.current_area,
            'active_days': active_days,
            'membership_status': membership_status,
            'order_count': order_count
        }
    })


# TOGGLE RIDER AVAILABILITY
@csrf_exempt
@token_required
def toggle_availability(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    data = json.loads(request.body)
    is_available = data.get('is_available')

    request.user.is_available = is_available
    request.user.current_area = data.get('area', '')
    request.user.save()

    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "admin_updates",
            {
                "type": "admin_update",
                "data": {"event": "RIDER_STATUS_CHANGE", "payload": {"username": request.user.username, "status": "Online" if is_available else "Offline"}}
            }
        )
    except Exception:
        pass

    return JsonResponse({"message": "Availability updated", "is_available": is_available})


# RIDER STATS
@csrf_exempt
@token_required
def rider_stats(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)

    from django.db.models import Sum
    from orders.models import Order
    import datetime

    today = datetime.date.today()

    today_earnings = Order.objects.filter(
        rider=request.user,
        status='delivered',
        delivered_at__date=today
    ).aggregate(total=Sum('total_price'))['total'] or 0

    total_deliveries = Order.objects.filter(
        rider=request.user,
        status='delivered'
    ).count()

    return JsonResponse({
        "today_earnings": float(today_earnings),
        "total_deliveries": total_deliveries,
        "rating": float(request.user.rating),
        "is_available": request.user.is_available
    })

# --- DRF CLASSES FOR MOBILE PERSISTENCE ---
class DRFRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class DRFUserProfileView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

@csrf_exempt
@token_required
def delete_account(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    
    user = request.user
    user.delete()
    return JsonResponse({"status": "success", "message": "Account deleted successfully"})

@csrf_exempt
@token_required
def update_fcm_token(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        token = data.get('token')
        if token:
            request.user.fcm_token = token
            request.user.save()
            return JsonResponse({"status": "success"})
        return JsonResponse({"error": "Token required"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)