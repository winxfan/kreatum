from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import WebhookLog, Transaction, User

router = APIRouter(prefix="/webhooks", tags=["Webhooks"]) 


@router.post("/payments/{provider}")
async def payments_webhook(provider: str, request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.json()

    # логируем событие
    log = WebhookLog(event_type=f"payments:{provider}", payload=payload)
    db.add(log)
    db.commit()

    # Простейшая универсальная обработка: если в payload есть userId и amountRub — зачисляем
    user_id = payload.get("userId") or payload.get("user_id")
    amount_rub = payload.get("amountRub") or payload.get("amount_rub")
    plan = payload.get("plan")
    reference = payload.get("reference")
    if user_id and amount_rub:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            txn = Transaction(
                user_id=user.id,
                type="gateway_payment",
                provider=provider,
                status="success",
                amount_rub=Decimal(str(amount_rub)),
                currency="RUB",
                plan=plan,
                reference=reference,
                tokens_delta=None,
                meta=payload,
            )
            db.add(txn)
            # Конвертация RUB -> токены по текущим правилам
            # 1 рубль ~= 1.2 токена (см. rubles_to_tokens)
            from app.core.pricing import rubles_to_tokens

            tokens = rubles_to_tokens(Decimal(str(amount_rub)))
            user.balance_tokens = (user.balance_tokens or 0) + Decimal(tokens)
            txn.tokens_delta = Decimal(tokens)
            db.commit()

    return {"ok": True}

