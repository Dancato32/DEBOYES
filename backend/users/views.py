import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from .auth import create_token, token_required

User = get_user_model()

# SIGNUP
@csrf_exempt
def signup(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            
            username = data.get('username', '').strip().lower()
            password = data.get('password')
            user_type = data.get('user_type')
            
            if not username or not password or not user_type:
                return JsonResponse({"error": "Username, password and user type are required"}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "A user with that username already exists"}, status=400)

            email = data.get('email', '').strip()
            if email and User.objects.filter(email=email).exists():
                return JsonResponse({"error": "A user with that email already exists"}, status=400)

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            user.phone = data.get('phone', '')
            user.user_type = user_type
            user.save()

            token = create_token(user)
            return JsonResponse({"message": "User created successfully", "token": token}, status=201)
        except Exception as e:
            return JsonResponse({"error": f"Signup failed: {str(e)}"}, status=400)


# LOGIN
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        username_input = data.get('username', '').strip()
        
        # Find user case-insensitively to support legacy mixed-case accounts (e.g. DEBOYES)
        try:
            db_user = User.objects.get(username__iexact=username_input)
            auth_username = db_user.username
        except User.DoesNotExist:
            auth_username = username_input

        user = authenticate(
            username=auth_username,
            password=data.get('password', '')
        )

        if user:
            token = create_token(user)
            return JsonResponse({"message": "Login successful", "token": token})

        return JsonResponse({"error": "Invalid credentials"}, status=400)


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