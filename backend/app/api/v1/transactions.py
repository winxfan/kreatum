from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Transaction

router = APIRouter(prefix="/transactions", tags=["transactions"]) 


@router.get("")
def list_transactions(page: int = 1, limit: int = 20, user_id: str | None = None, db: Session = Depends(get_db)) -> dict:
    query = db.query(Transaction)
    if user_id:
        query = query.filter(Transaction.user_id == user_id)

    total = query.count()
    items = (
        query.order_by(Transaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    def serialize(t: Transaction) -> dict[str, Any]:
        return {
            "id": str(t.id),
            "user_id": str(t.user_id) if t.user_id else None,
            "job_id": str(t.job_id) if t.job_id else None,
            "type": str(t.type) if t.type is not None else None,
            "provider": str(t.provider) if t.provider is not None else None,
            "status": str(t.status) if t.status is not None else None,
            "amount_rub": float(t.amount_rub or 0),
            "tokens_delta": float(t.tokens_delta or 0),
            "currency": t.currency,
            "plan": t.plan,
            "reference": t.reference,
            "meta": t.meta,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }

    return {"items": [serialize(t) for t in items], "total": total}


@router.post("/checkout")
def checkout(amount_rub: float) -> dict:
    # Интеграция с платёжкой не реализуется в этом шаге
    return {"checkout_url": "https://yookassa.example/checkout/stub"}

