"""
Simple JWT-based authentication utilities.
Replaces Django session auth for cross-domain (Railway + Render) compatibility.
"""
import jwt
import datetime
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from functools import wraps

User = get_user_model()

# ──────────────────────────────────────────────
# Token creation
# ──────────────────────────────────────────────

def create_token(user):
    """Create a signed JWT for the given user. Expires in 7 days."""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'user_type': user.user_type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


# ──────────────────────────────────────────────
# Token extraction
# ──────────────────────────────────────────────

def get_token_from_request(request):
    """Extract token from the Authorization header (Bearer <token>)."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None


def decode_token(token):
    """Decode and validate a JWT. Returns payload dict or None."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ──────────────────────────────────────────────
# Decorator to protect views (replaces @login_required)
# ──────────────────────────────────────────────

def token_required(view_func):
    """Decorator that validates a JWT and attaches the user to the request."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = get_token_from_request(request)
        if not token:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        payload = decode_token(token)
        if not payload:
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=401)

        request.user = user
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_token_required(view_func):
    """Decorator that checks JWT and that the user is an admin."""
    @token_required
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return JsonResponse({'error': 'Admin access required'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper
