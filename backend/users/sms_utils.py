import requests
import os
from django.conf import settings

def send_arkesel_sms(phone, code):
    """
    Sends an OTP code via Arkesel's REST API.
    Expects ARKESEL_API_KEY in environment or settings.
    """
    api_key = getattr(settings, 'ARKESEL_API_KEY', os.environ.get('ARKESEL_API_KEY'))
    sender_id = getattr(settings, 'ARKESEL_SENDER_ID', os.environ.get('ARKESEL_SENDER_ID', 'DeBoyes'))
    
    if not api_key:
        print(f"[SMS SIMULATION] API Key missing. OTP for {phone}: {code}")
        return True

    # Normalize phone: Arkesel expects 233... format for Ghana
    # if it starts with 0, replace with 233
    if phone.startswith('0'):
        phone = '233' + phone[1:]
    elif not phone.startswith('233'):
        phone = '233' + phone

    url = "https://sms.arkesel.com/sms/api?action=send-sms"
    params = {
        'api_key': api_key,
        'to': phone,
        'sms': f"Your De Boye's verification code is {code}. Valid for 10 mins.",
        'from': sender_id
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data.get('code') == 'ok' or data.get('status') == 'success':
            print(f"[SMS SUCCESS] OTP sent to {phone}")
            return True
        else:
            print(f"[SMS ERROR] Arkesel returned: {data}")
            return False
    except Exception as e:
        print(f"[SMS EXCEPTION] Failed to send SMS: {e}")
        return False
