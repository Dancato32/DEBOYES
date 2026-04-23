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
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

User = get_user_model()

# ──────────────────────────────────────────────
# BOLT/YANGO STYLE AUTH FLOW
# ──────────────────────────────────────────────

@csrf_exempt
def request_otp(request):
    """Step 1: Accept phone OR email and send/log a 4-digit code."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        
        if not phone and not email:
            return JsonResponse({"error": "Phone or Email required"}, status=400)

        # Generate 4-digit code
        code = str(random.randint(1000, 9999))
        
        # Save to DB
        LoginCode.objects.create(phone=phone, email=email, code=code)
        
        if email:
            send_otp_email(email, code)
        elif phone:
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
        email = data.get('email', '').strip()
        code = data.get('code', '').strip()
        
        if (not phone and not email) or not code:
            return JsonResponse({"error": "Identifier and code required"}, status=400)

        # Check most recent code
        filter_kwargs = {"code": code, "is_used": False, "created_at__gte": timezone.now() - datetime.timedelta(minutes=10)}
        if email: filter_kwargs["email"] = email
        else: filter_kwargs["phone"] = phone
        
        verification = LoginCode.objects.filter(**filter_kwargs).last()

        if not verification:
            return JsonResponse({"error": "Invalid or expired code"}, status=400)

        verification.is_used = True
        verification.save()

        # Check if user exists
        if email:
            user = User.objects.filter(email=email).first()
        else:
            user = User.objects.filter(phone=phone).first()
        
        if user:
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
                "phone": phone,
                "email": email
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
        email = data.get('email')
        username = data.get('username')
        user_type = data.get('user_type') # customer | rider

        if not username or not user_type:
            return JsonResponse({"error": "Missing fields"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username taken"}, status=400)
        
        if phone and User.objects.filter(phone=phone).exists():
            return JsonResponse({"error": "User already exists with this phone"}, status=400)
        
        if email and User.objects.filter(email=email).exists():
            return JsonResponse({"error": "User already exists with this email"}, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email or "",
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
def google_login(request):
    """Verify Google ID Token and login/signup."""
    if request.method != "POST": return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        data = json.loads(request.body)
        id_token_str = data.get('id_token')
        
        # Get Client ID from settings
        # Use a placeholder if not set yet for production
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', os.environ.get('GOOGLE_CLIENT_ID', 'DUMMY_CLIENT_ID'))
        
        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), google_client_id)
            
            # ID token is valid. Get user's Google ID from the 'sub' claim.
            email = idinfo.get('email')
            name = idinfo.get('name', '')
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if user:
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
                # Partial success - need to choose role and set username
                return JsonResponse({
                    "status": "partial",
                    "message": "Google verified. Please complete your profile.",
                    "email": email,
                    "suggested_username": email.split('@')[0]
                })

        except ValueError:
            return JsonResponse({"error": "Invalid token"}, status=400)
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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