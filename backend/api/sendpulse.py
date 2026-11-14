import os
import time
import requests
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

# Cached SendPulse OAuth token with a fetch timestamp. The previous cache
# never expired, so a revoked/expired token silently killed ALL OTP emails
# until the process restarted.
_TOKEN_CACHE = {'token': None, 'fetched_at': 0.0}
_TOKEN_TTL_SECONDS = 30 * 60


def get_sendpulse_token(force_refresh=False):
    client_id = os.getenv('SENDPULSE_CLIENT_ID')
    client_secret = os.getenv('SENDPULSE_CLIENT_SECRET')

    if not client_id or not client_secret:
        return None

    cached = _TOKEN_CACHE.get('token')
    is_fresh = (time.time() - _TOKEN_CACHE['fetched_at']) < _TOKEN_TTL_SECONDS
    if cached and not force_refresh and is_fresh:
        return cached

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
            _TOKEN_CACHE['token'] = data.get('access_token')
            _TOKEN_CACHE['fetched_at'] = time.time()
            return _TOKEN_CACHE['token']
        else:
            logger.error("SendPulse oauth token request failed: %s", res.text)
    except Exception as e:
        logger.error("SendPulse oauth exception: %s", str(e))

    return None


def send_sendpulse_email(subject, html_content, text_content, to_email, to_name="User"):
    """
    Sends an email using the SendPulse REST API.
    Falls back to standard Django send_mail if SendPulse is not configured.
    """
    client_id = os.getenv('SENDPULSE_CLIENT_ID')
    client_secret = os.getenv('SENDPULSE_CLIENT_SECRET')
    from_email = os.getenv('SENDPULSE_FROM_EMAIL') or getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    from_name = os.getenv('SENDPULSE_FROM_NAME', 'Impact Tutors')

    if client_id and client_secret and from_email:
        token = get_sendpulse_token()
        if token:
            url = "https://api.sendpulse.com/smtp/emails"
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
            try:
                res = requests.post(
                    url, json=payload,
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )
                if res.status_code in (200, 201):
                    logger.info("Email successfully sent via SendPulse to %s", to_email)
                    return True

                # Token rejected (expired/revoked since it was cached) —
                # force one refresh and retry before giving up.
                if res.status_code in (401, 403):
                    refreshed_token = get_sendpulse_token(force_refresh=True)
                    if refreshed_token:
                        retry = requests.post(
                            url, json=payload,
                            headers={"Authorization": f"Bearer {refreshed_token}"},
                            timeout=10,
                        )
                        if retry.status_code in (200, 201):
                            logger.info("Email sent via SendPulse (after token refresh) to %s", to_email)
                            return True
                        logger.error("SendPulse SMTP API failed after token refresh: %s", retry.text)
                        # fall through to Django send_mail fallback
                    else:
                        logger.error("SendPulse token refresh failed; falling back to send_mail.")

                else:
                    logger.error("SendPulse SMTP API failed: %s. Falling back to standard send_mail.", res.text)
            except Exception as e:
                logger.error("SendPulse API send error: %s. Falling back to standard send_mail.", str(e))

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
        logger.info("Email sent via default Django send_mail to %s", to_email)
        return True
    except Exception as e:
        logger.error("Fallback send_mail failed: %s", str(e))
        return False
