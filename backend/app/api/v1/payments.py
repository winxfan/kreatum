from __future__ import annotations

import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Transaction, User

router = APIRouter(prefix="/payments", tags=["Payments"]) 


@router.post("/intents")
def create_payment_intent(payload: dict, db: Session = Depends(get_db), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")) -> dict:
    user_id = payload.get("userId")
    amount_rub = payload.get("amountRub")
    provider = payload.get("provider") or "yookassa"
    plan = payload.get("plan")
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

    # В проде здесь создаётся платёж у провайдера и возвращается его URL/params
    payment_url = f"https://pay.example/{provider}?ref={reference}"
    return {
        "id": str(txn.id),
        "provider": provider,
        "amountRub": float(txn.amount_rub or 0),
        "currency": txn.currency,
        "paymentUrl": payment_url,
        "reference": reference,
    }



