import requests
import threading
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def _send_telegram_message_sync(text):
    """
    Synchronous helper to send telegram message.
    """
    from .models import GlobalSetting
    
    settings_obj = GlobalSetting.objects.first()
    db_chat_id = settings_obj.telegram_chat_id if settings_obj else None
    
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = db_chat_id or getattr(settings, 'TELEGRAM_CHAT_ID', None)

    if not bot_token or not chat_id:
        logger.warning("Telegram Bot Token or Chat ID not configured. Skipping notification.")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")

def send_telegram_notification(text):
    """
    Sends a telegram notification in a separate thread to avoid blocking the request.
    """
    thread = threading.Thread(target=_send_telegram_message_sync, args=(text,))
    thread.daemon = True
    thread.start()
