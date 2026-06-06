import os
import requests
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

# Cache for token to avoid fetching on every request
_TOKEN_CACHE = {}

def get_sendpulse_token():
    client_id = os.getenv('SENDPULSE_CLIENT_ID')
    client_secret = os.getenv('SENDPULSE_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return None
        
    # Check if existing token is valid (could keep simple cache)
    if 'access_token' in _TOKEN_CACHE:
        return _TOKEN_CACHE['access_token']
        
    try:
        url = "https://api.sendpulse.com/oauth/access_token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            _TOKEN_CACHE['access_token'] = data.get('access_token')
            return _TOKEN_CACHE['access_token']
        else:
            logger.error(f"SendPulse oauth token request failed: {res.text}")
    except Exception as e:
        logger.error(f"SendPulse oauth exception: {str(e)}")
        
    return None

def send_sendpulse_email(subject, html_content, text_content, to_email, to_name="User"):
    """
    Sends an email using SendPulse REST API.
    Falls back to standard Django send_mail if SendPulse is not configured.
    """
    client_id = os.getenv('SENDPULSE_CLIENT_ID')
    client_secret = os.getenv('SENDPULSE_CLIENT_SECRET')
    from_email = os.getenv('SENDPULSE_FROM_EMAIL') or getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    from_name = os.getenv('SENDPULSE_FROM_NAME', 'Impact Tutors')
    
    if client_id and client_secret and from_email:
        token = get_sendpulse_token()
        if token:
            try:
                url = "https://api.sendpulse.com/smtp/emails"
                headers = {"Authorization": f"Bearer {token}"}
                payload = {
                    "email": {
                        "html": html_content,
                        "text": text_content,
                        "subject": subject,
                        "from": {
                            "name": from_name,
                            "email": from_email
                        },
                        "to": [
                            {
                                "name": to_name,
                                "email": to_email
                            }
                        ]
                    }
                }
                res = requests.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code == 200 or res.status_code == 201:
                    logger.info(f"Email successfully sent via SendPulse to {to_email}")
                    return True
                else:
                    logger.error(f"SendPulse SMTP API failed: {res.text}. Falling back to standard send_mail.")
            except Exception as e:
                logger.error(f"SendPulse API send error: {str(e)}. Falling back to standard send_mail.")
    
    # Fallback to standard Django send_mail
    try:
        send_mail(
            subject=subject,
            message=text_content,
            html_message=html_content,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False
        )
        logger.info(f"Email sent via default Django send_mail to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Fallback send_mail failed: {str(e)}")
        return False
