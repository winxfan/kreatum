import base64
import requests
from typing import Any, Dict
import uuid
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

def _auth_header() -> str:
	if not settings.yookassa_shop_id or not settings.yookassa_api_key:
		raise RuntimeError("YooKassa credentials not configured")
	basic = f"{settings.yookassa_shop_id}:{settings.yookassa_api_key}".encode()
	return "Basic " + base64.b64encode(basic).decode()


def create_payment(order_id: str, amount_rub: float, description: str, return_url: str, email: str | None = None, anon_user_id: str | None = None, user_id: str | None = None, telegram_username: str | None = None, telegram_id: str | None = None) -> Dict[str, Any]:
	"""Создать платеж и получить confirmation_url.
	Документация YooKassa: POST /v3/payments
	"""
	url = f"{settings.yookassa_api_base}/v3/payments"
	payload_base: Dict[str, Any] = {
		"amount": {"value": f"{amount_rub:.2f}", "currency": "RUB"},
		"capture": True,
		"description": description,
		"metadata": {
			"order_id": order_id,
			"email": email,
			"anonUserId": anon_user_id,
			"user_id": user_id,
			"telegram_username": telegram_username,
			"telegram_id": telegram_id,
		},
		"confirmation": {"type": "redirect", "return_url": return_url},
	}
	include_receipt = bool(email)
	# Сформируем payload с чеком (если есть email)
	payload: Dict[str, Any] = dict(payload_base)
	if include_receipt:
		payload["receipt"] = {
			"customer": {"email": email},
			"tax_system_code": 1,
			"items": [
				{
					"description": description[:128] or "Оживление видео",
					"amount": {"value": f"{amount_rub:.2f}", "currency": "RUB"},
					"quantity": "1.00",
					"vat_code": 1,
					"payment_subject": "service",
					"payment_mode": "full_payment",
				}
			]
		}
	headers = {
		"Authorization": _auth_header(),
		# уникальный ключ на каждый запрос (а не order_id)
		"Idempotence-Key": str(uuid.uuid4()),
		"Content-Type": "application/json",
	}
	logger.info(
		"YooKassa create_payment: order_id=%s amount=%.2f include_receipt=%s return_url_present=%s",
		order_id, amount_rub, include_receipt, bool(return_url)
	)
	resp = requests.post(url, json=payload, headers=headers, timeout=20)
	if not resp.ok:
		err_text = None
		try:
			err_text = resp.text
		except Exception:
			err_text = None
		# Если ошибка из-за некорректного чека — пробуем повторить без чека
		text_lower = (err_text or "").lower()
		if include_receipt and resp.status_code == 400 and "receipt" in text_lower:
			logger.warning("YooKassa responded 400 due to receipt for order_id=%s, retrying without receipt", order_id)
			payload_no_receipt: Dict[str, Any] = dict(payload_base)
			headers_retry = dict(headers)
			headers_retry["Idempotence-Key"] = str(uuid.uuid4())
			resp_retry = requests.post(url, json=payload_no_receipt, headers=headers_retry, timeout=20)
			if not resp_retry.ok:
				try:
					return {"error": {"status": resp_retry.status_code, "text": resp_retry.text}}
				except Exception:
					resp_retry.raise_for_status()
			resp = resp_retry
		else:
			# вернём подробности ошибки вызывающей стороне
			try:
				return {"error": {"status": resp.status_code, "text": err_text or ""}}
			except Exception:
				resp.raise_for_status()
	data = resp.json()
	confirmation_url = data.get("confirmation", {}).get("confirmation_url")
	payment_id = data.get("id")
	if not confirmation_url or not payment_id:
		raise ValueError("YooKassa: confirmation_url or payment id missing")
	return {"payment_id": payment_id, "payment_url": confirmation_url, "raw": data}


