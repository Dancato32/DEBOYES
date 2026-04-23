import os
from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(email, code):
    """
    Sends an OTP code via Email using Django's core email system.
    Configurable via standard EMAIL_* settings.
    """
    subject = "Your De Boye's Verification Code"
    message = f"Your verification code is {code}. It is valid for 10 minutes."
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@deboyes.com')
    
    # Check if SMTP is configured
    is_smtp_configured = all([
        getattr(settings, 'EMAIL_HOST', ''),
        getattr(settings, 'EMAIL_HOST_USER', ''),
        getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    ])

    if not is_smtp_configured:
        print(f"\n[EMAIL SIMULATION] To: {email} | Code: {code}\n")
        return True

    try:
        send_mail(subject, message, from_email, [email], fail_silently=False)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")
        return False
