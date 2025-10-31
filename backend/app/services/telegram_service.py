from __future__ import annotations

import logging
from typing import Any, Optional
import requests

from app.core.config import settings


logger = logging.getLogger(__name__)


def notify_job_event(
    *,
    event: str,
    job_id: str,
    user_id: Optional[str],
    status: str,
    service_type: Optional[str] = None,
    result_url: Optional[str] = None,
    message: Optional[str] = None,
    extra: Optional[dict[str, Any]] = None,
) -> None:
    """Отправляет простой POST на сервер Telegram-бота без авторизации.

    Использует TG_BOT_SERVER_URL и фиксированный путь /bot/webhook/job-event.
    Фоллбэк: если TG_BOT_SERVER_URL не задан, пробуем TELEGRAM_WEBHOOK_URL как полный URL.
    """
    base_url = getattr(settings, "tg_bot_server_url", None)
    if base_url:
        webhook_url = base_url.rstrip("/") + "/bot/webhook/job-event"
    else:
        webhook_url = getattr(settings, "telegram_webhook_url", None)
    if not webhook_url:
        logger.info("telegram webhook url not configured; skip notify event=%s job_id=%s", event, job_id)
        return

    payload: dict[str, Any] = {
        "event": event,
        "jobId": job_id,
        "userId": user_id,
        "status": status,
        "serviceType": service_type,
        "resultUrl": result_url,
        "message": message,
    }
    if extra:
        payload["extra"] = extra

    headers = {"Content-Type": "application/json"}

    try:
        logger.info("telegram.webhook POST %s headers=%s body_keys=%s", webhook_url, headers, list(payload.keys()))
        resp = requests.post(webhook_url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info("telegram.webhook <- %s", resp.status_code)
    except Exception:
        logger.exception("failed to notify telegram webhook job_id=%s", job_id)


