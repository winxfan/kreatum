from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import User

router = APIRouter(prefix="/user", tags=["user"]) 


@router.get("")
def get_user(user_id: str | None = None, anon_user_id: str | None = None, email: str | None = None, db: Session = Depends(get_db)) -> dict:
    query = db.query(User)
    if user_id:
        query = query.filter(User.id == user_id)
    elif anon_user_id:
        query = query.filter(User.anon_user_id == anon_user_id)
    elif email:
        query = query.filter(User.email == email)
    else:
        # Чтобы не ломать фронт, возвращаем прежний формат, если идентификатор не передан
        return {"id": "stub", "balance_tokens": 0, "tariff": None}

    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "telegram_id": user.telegram_id,
        "username": user.username,
        "anon_user_id": user.anon_user_id,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "balance_tokens": float(user.balance_tokens or 0),
        "ref_code": user.ref_code,
        "referrer_id": str(user.referrer_id) if user.referrer_id else None,
        "has_left_review": user.has_left_review,
        "consent_pd": user.consent_pd,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("/tariff/change")
def change_tariff(tariff_id: str) -> dict:
    # Тарифов в модели нет — оставляем заглушку
    return {"ok": True, "tariff_id": tariff_id}

