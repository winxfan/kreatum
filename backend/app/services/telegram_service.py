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
        # Короткий сводный лог полезных полей
        try:
            logger.info(
                "telegram.webhook payload: event=%s jobId=%s userId=%s status=%s serviceType=%s resultUrl=%s",
                payload.get("event"),
                payload.get("jobId"),
                payload.get("userId"),
                payload.get("status"),
                payload.get("serviceType"),
                payload.get("resultUrl"),
            )
        except Exception:
            # не мешаем основному запросу
            pass
        resp = requests.post(webhook_url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info("telegram.webhook <- %s", resp.status_code)
    except Exception:
        logger.exception("failed to notify telegram webhook job_id=%s", job_id)



def notify_payment_receipt(
	*,
	user_id: Optional[str],
	telegram_id: Optional[str],
	telegram_username: Optional[str],
	payment_url: str,
	payment_id: Optional[str],
	amount_rub: float,
	order_id: str,
	provider: str = "yookassa",
) -> None:
	"""Отправляет POST на сервер Telegram-бота с данными о ссылке на оплату/чек.

	Путь: /bot/webhook/payment-receipt.
	Если TG_BOT_SERVER_URL не задан, пробуем TELEGRAM_WEBHOOK_URL как полный URL.
	"""
	base_url = getattr(settings, "tg_bot_server_url", None)
	if base_url:
		webhook_url = base_url.rstrip("/") + "/bot/webhook/payment-receipt"
	else:
		webhook_url = getattr(settings, "telegram_webhook_url", None)
	if not webhook_url:
		logger.info("telegram webhook url not configured; skip notify payment order_id=%s", order_id)
		return

	payload: dict[str, Any] = {
		"provider": provider,
		"userId": user_id,
		"telegramId": telegram_id,
		"telegramUsername": telegram_username,
		"paymentUrl": payment_url,
		"paymentId": payment_id,
		"amountRub": amount_rub,
		"orderId": order_id,
	}
	headers = {"Content-Type": "application/json"}

	try:
		logger.info(
			"telegram.payment_receipt POST %s amount=%.2f order_id=%s user_id=%s tg_username=%s",
			webhook_url, amount_rub, order_id, user_id, telegram_username
		)
		resp = requests.post(webhook_url, json=payload, headers=headers, timeout=15)
		resp.raise_for_status()
		logger.info("telegram.payment_receipt <- %s", resp.status_code)
	except Exception:
		logger.exception("failed to notify telegram payment receipt order_id=%s", order_id)
