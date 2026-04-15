import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
# Current file is in backend/mysite/asgi.py, so we add the parent of the parent directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import orders.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.mysite.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            orders.routing.websocket_urlpatterns
        )
    ),
})