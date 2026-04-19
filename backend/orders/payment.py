import requests
import uuid
from django.conf import settings


def initialize_payment(order, email):
    """
    Initialize a Paystack payment transaction.
    Returns the authorization URL for the customer to pay.
    """
    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        raise ValueError("PAYSTACK_SECRET_KEY is not configured.")

    # Generate unique reference
    reference = f"BOYES-{order.id}-{uuid.uuid4().hex[:8]}"

    # Paystack expects amount in pesewas (kobo equivalent) — multiply by 100
    amount_in_pesewas = int(float(order.total_price) * 100)

    payload = {
        "email": email,
        "amount": amount_in_pesewas,
        "reference": reference,
        "currency": "GHS",
        "callback_url": settings.PAYSTACK_CALLBACK_URL,
        "metadata": {
            "order_id": order.id,
            "customer": order.customer.username,
        }
    }

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        "https://api.paystack.co/transaction/initialize",
        json=payload,
        headers=headers,
        timeout=15
    )
    
    data = response.json()

    if data.get("status"):
        # Save reference on the order
        order.payment_reference = reference
        order.save(update_fields=['payment_reference'])
        return {
            "authorization_url": data["data"]["authorization_url"],
            "reference": reference,
            "access_code": data["data"]["access_code"],
        }
    else:
        raise Exception(data.get("message", "Failed to initialize Paystack payment"))


def verify_payment(reference):
    """
    Verify a Paystack payment transaction by reference.
    Returns True if payment was successful.
    """
    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        raise ValueError("PAYSTACK_SECRET_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {secret_key}",
    }

    response = requests.get(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers=headers,
        timeout=15
    )

    data = response.json()

    if data.get("status") and data["data"]["status"] == "success":
        return {
            "success": True,
            "amount": data["data"]["amount"] / 100,  # Convert pesewas back to GHS
            "channel": data["data"]["channel"],
            "paid_at": data["data"]["paid_at"],
            "reference": reference,
        }
    
    return {
        "success": False,
        "message": data.get("message", "Payment verification failed"),
    }
