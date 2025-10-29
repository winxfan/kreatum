from __future__ import annotations

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import User, Transaction

router = APIRouter(prefix="/reviews", tags=["Reviews"]) 


@router.post("/check")
def check_review(payload: dict, db: Session = Depends(get_db)) -> dict:
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Заглушка: считаем, что отзыв найден один раз, далее бонус не выдаём
    found = True
    bonus_granted = False
    if not user.has_left_review:
        bonus_tokens = 20
        user.has_left_review = True
        user.balance_tokens = (user.balance_tokens or 0) + Decimal(bonus_tokens)
        txn = Transaction(
            user_id=user.id,
            type="promo",
            status="success",
            tokens_delta=Decimal(bonus_tokens),
            currency="RUB",
            reference="review_bonus",
            meta={"reason": "review"},
        )
        db.add(txn)
        db.commit()
        bonus_granted = True

    return {
        "found": found,
        "bonusGranted": bonus_granted,
        "balanceTokens": float(user.balance_tokens or 0),
    }



