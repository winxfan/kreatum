from __future__ import annotations

import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Transaction, User
from app.services.yookassa_service import create_payment as create_yookassa_payment
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"]) 


@router.post("/intents")
def create_payment_intent(payload: dict, db: Session = Depends(get_db), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")) -> dict:
    user_id = payload.get("userId")
    amount_rub = payload.get("amountRub")
    provider = payload.get("provider") or "yookassa"
    plan = payload.get("plan")
    description = payload.get("description")
    if not user_id or amount_rub is None:
        raise HTTPException(status_code=400, detail="userId and amountRub are required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reference = idempotency_key or uuid.uuid4().hex
    txn = Transaction(
        user_id=user.id,
        type="gateway_payment",
        provider=provider,
        status="pending",
        amount_rub=Decimal(str(amount_rub)),
        currency="RUB",
        plan=plan,
        reference=reference,
        meta={"intent": True},
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Реальная генерация ссылки YooKassa
    payment_url = None
    payment_id = None
    if provider == "yookassa":
        base = settings.frontend_return_url_base or ""
        return_url = f"{base}/balance.html" if base else ""
        desc = (description or plan or "Пополнение баланса").strip()
        try:
            yk = create_yookassa_payment(
                order_id=str(txn.id),
                amount_rub=float(amount_rub),
                description=desc,
                return_url=return_url,
                email=user.email,
                anon_user_id=user.anon_user_id,
                user_id=str(user.id),
            )
            if "error" in yk:
                raise HTTPException(status_code=502, detail=f"YooKassa error: {yk['error']}")
            payment_url = yk.get("payment_url")
            payment_id = yk.get("payment_id")
            # обогатим мета
            meta = txn.meta or {}
            meta.update({"yookassa": {"paymentId": payment_id, "raw": yk.get("raw")}})
            txn.meta = meta
            db.commit()
            db.refresh(txn)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"YooKassa create payment failed: {e}")
    else:
        # При необходимости поддержать другие провайдеры
        payment_url = f"https://pay.example/{provider}?ref={reference}"

    return {
        "id": str(txn.id),
        "provider": provider,
        "amountRub": float(txn.amount_rub or 0),
        "currency": txn.currency,
        "paymentUrl": payment_url,
        "reference": reference,
        "paymentId": payment_id,
    }




