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
from .sms_utils import send_arkesel_sms

User = get_user_model()

# ──────────────────────────────────────────────
# BOLT/YANGO STYLE AUTH FLOW
# ──────────────────────────────────────────────

@csrf_exempt
def request_otp(request):
    """Step 1: Accept phone and send/log a 4-digit code."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()
        if not phone: return JsonResponse({"error": "Phone required"}, status=400)

        # Generate 4-digit code
        code = str(random.randint(1000, 9999))
        
        # Save to DB
        LoginCode.objects.create(phone=phone, code=code)
        
        # REAL SMS (Professional)
        send_arkesel_sms(phone, code)
        
        return JsonResponse({"message": "Code sent"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def verify_otp(request):
    """Step 2: Verify code and return JWT + user status."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()
        code = data.get('code', '').strip()
        
        if not phone or not code:
            return JsonResponse({"error": "Phone and code required"}, status=400)

        # Check most recent code for this phone
        verification = LoginCode.objects.filter(
            phone=phone, 
            code=code, 
            is_used=False,
            created_at__gte=timezone.now() - datetime.timedelta(minutes=10)
        ).last()

        if not verification:
            return JsonResponse({"error": "Invalid or expired code"}, status=400)

        verification.is_used = True
        verification.save()

        # Check if user exists
        user = User.objects.filter(phone=phone).first()
        
        if user:
            # Existing user - issue full token
            token = create_token(user)
            return JsonResponse({
                "status": "success",
                "token": token,
                "user": {
                    "username": user.username,
                    "user_type": user.user_type
                }
            })
        else:
            # New user - require profile completion
            return JsonResponse({
                "status": "partial",
                "message": "Verify success. Please complete your profile.",
                "phone": phone
            })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def complete_profile(request):
    """Step 3: For new users, set name and role."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone')
        username = data.get('username')
        user_type = data.get('user_type') # customer | rider

        if not phone or not username or not user_type:
            return JsonResponse({"error": "Missing fields"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username taken"}, status=400)
        
        if User.objects.filter(phone=phone).exists():
            return JsonResponse({"error": "User already exists with this phone"}, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            password=str(random.random()), # No password used in this flow
            phone=phone,
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
    """Standard Username/Password login."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        username_input = data.get('username', '').strip()
        password = data.get('password', '')

        if not username_input or not password:
            return JsonResponse({"error": "Username and password required"}, status=400)

        # Case-insensitive lookup
        try:
            db_user = User.objects.get(username__iexact=username_input)
            auth_username = db_user.username
        except User.DoesNotExist:
            auth_username = username_input

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