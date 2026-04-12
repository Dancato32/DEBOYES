import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()

# SIGNUP
@csrf_exempt
def signup(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            
            # Basic validation
            if User.objects.filter(username=data['username']).exists():
                return JsonResponse({"error": "A user with that username already exists"}, status=400)
            
            if User.objects.filter(email=data['email']).exists():
                return JsonResponse({"error": "A user with that email already exists"}, status=400)

            user = User.objects.create(
                username=data['username'],
                email=data['email'],
                password=make_password(data['password']),
                user_type=data['user_type']
            )

            return JsonResponse({"message": "User created successfully"}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

# LOGIN
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)

        user = authenticate(
            username=data['username'],
            password=data['password']
        )

        if user:
            login(request, user)
            return JsonResponse({"message": "Login successful"})

        return JsonResponse({"error": "Invalid credentials"}, status=400)

# LOGOUT
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out"})

# CURRENT USER
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
        
    return JsonResponse({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'user_type': request.user.user_type,
            'is_available': request.user.is_available,
            'current_area': request.user.current_area
        }
    })

# TOGGLE RIDER AVAILABILITY
@csrf_exempt
@login_required
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
    except:
        pass

    return JsonResponse({"message": "Availability updated", "is_available": is_available})

# RIDER STATS
@login_required
def rider_stats(request):
    if not request.user.is_rider():
        return JsonResponse({"error": "Only riders allowed"}, status=403)
    
    from django.db.models import Sum
    from orders.models import Order
    import datetime

    today = datetime.date.today()
    
    # Calculate today's earnings
    today_earnings = Order.objects.filter(
        rider=request.user, 
        status='delivered', 
        delivered_at__date=today
    ).aggregate(total=Sum('total_price'))['total'] or 0

    # Calculate total deliveries
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