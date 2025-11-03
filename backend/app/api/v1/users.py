from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal

from app.database import get_db
from app.db.models import User, Referral, Transaction

router = APIRouter(prefix="/users", tags=["Users"]) 


def _serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "telegramId": user.telegram_id,
        "username": user.username,
        "anonUserId": user.anon_user_id,
        "email": user.email,
        "avatarUrl": user.avatar_url,
        "balanceTokens": float(user.balance_tokens or 0),
        "refCode": user.ref_code,
        "referrerId": str(user.referrer_id) if user.referrer_id else None,
        "hasLeftReview": user.has_left_review,
        "consentPd": user.consent_pd,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("/register-or-login")
def register_or_login(payload: dict, db: Session = Depends(get_db)) -> dict:
    telegram_id = payload.get("telegramId")
    if not telegram_id:
        raise HTTPException(status_code=400, detail="telegramId is required")

    username = payload.get("username")
    anon_user_id = payload.get("anonUserId")
    ref_code = payload.get("refCode")

    user = db.query(User).filter(User.telegram_id == str(telegram_id)).first()
    if not user:
        user = User(
            telegram_id=str(telegram_id),
            username=username,
            anon_user_id=anon_user_id,
        )
        # генерируем свой реф-код, если пустой
        user.ref_code = user.ref_code or uuid4().hex[:8]
        # применяем реферал, если передан и валиден
        if ref_code and ref_code != user.ref_code:
            inviter = db.query(User).filter(User.ref_code == ref_code).first()
            if inviter and inviter.id != user.id:
                user.referrer_id = inviter.id
        db.add(user)
        db.commit()
        db.refresh(user)

        # создаём запись Referral (без бонусов, они начисляются при оплате)
        if user.referrer_id:
            existing = (
                db.query(Referral)
                .filter(Referral.inviter_id == user.referrer_id, Referral.invitee_id == user.id)
                .first()
            )
            if existing is None:
                db.add(Referral(inviter_id=user.referrer_id, invitee_id=user.id))
                db.commit()

    else:
        # обновим дублирующиеся поля
        changed = False
        if username and user.username != username:
            user.username = username
            changed = True
        if anon_user_id and not user.anon_user_id:
            user.anon_user_id = anon_user_id
            changed = True
        if not user.ref_code:
            user.ref_code = uuid4().hex[:8]
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    return _serialize_user(user)


@router.get("/{user_id}")
def get_user_by_id(user_id: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(user)


@router.patch("/{user_id}/consent")
def update_consent(user_id: str, payload: dict, db: Session = Depends(get_db)) -> dict:
    consent_pd = payload.get("consentPd")
    if consent_pd is None:
        raise HTTPException(status_code=400, detail="consentPd is required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.consent_pd = bool(consent_pd)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.get("/{user_id}/balance")
def get_balance(user_id: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"balanceTokens": float(user.balance_tokens or 0)}


# Начисление бонуса за оставление отзыва (идемпотентно)
@router.post("/reviewed/{user_id}", tags=["Reviews"])
def grant_review_bonus(
    user_id: str,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bonus_tokens = Decimal(20)

    updated_rows = (
        db.query(User)
        .filter(
            User.id == user_id,
            or_(User.has_left_review.is_(False), User.has_left_review.is_(None)),
        )
        .update(
            {
                User.has_left_review: True,
                User.balance_tokens: func.coalesce(User.balance_tokens, 0) + bonus_tokens,
            },
            synchronize_session=False,
        )
    )

    bonus_granted = updated_rows == 1

    if bonus_granted:
        txn = Transaction(
            user_id=user.id,
            type="promo",
            provider="telegram",
            status="success",
            tokens_delta=bonus_tokens,
            currency="RUB",
            reference="review_bonus",
            meta={"reason": "review", "idempotencyKey": idempotency_key} if idempotency_key else {"reason": "review"},
        )
        db.add(txn)
        db.commit()
        db.refresh(user)
        return {
            "bonusGranted": True,
            "alreadyGranted": False,
            "balanceTokens": float(user.balance_tokens or 0),
            "message": "Bonus granted",
        }

    return {
        "bonusGranted": False,
        "alreadyGranted": True,
        "balanceTokens": float(user.balance_tokens or 0),
        "message": "Already granted",
    }

# Начисление бонуса за подписку на канал (идемпотентно)
@router.post("/subscribed/{user_id}", tags=["Subscriptions"])
def grant_subscription_bonus(
    user_id: str,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bonus_tokens = Decimal(15)

    # Атомарно помечаем флаг и прибавляем баланс только если ещё не начисляли
    updated_rows = (
        db.query(User)
        .filter(
            User.id == user_id,
            or_(User.is_joined_in_channel.is_(False), User.is_joined_in_channel.is_(None)),
        )
        .update(
            {
                User.is_joined_in_channel: True,
                User.balance_tokens: func.coalesce(User.balance_tokens, 0) + bonus_tokens,
            },
            synchronize_session=False,
        )
    )

    bonus_granted = updated_rows == 1

    if bonus_granted:
        txn = Transaction(
            user_id=user.id,
            type="promo",
            provider="telegram",
            status="success",
            tokens_delta=bonus_tokens,
            currency="RUB",
            reference="subscription_bonus",
            meta={"reason": "channel_subscription", "idempotencyKey": idempotency_key} if idempotency_key else {"reason": "channel_subscription"},
        )
        db.add(txn)
        db.commit()
        db.refresh(user)
        return {
            "bonusGranted": True,
            "alreadyGranted": False,
            "balanceTokens": float(user.balance_tokens or 0),
            "message": "Bonus granted",
        }

    # Ничего не меняли — уже начисляли ранее
    return {
        "bonusGranted": False,
        "alreadyGranted": True,
        "balanceTokens": float(user.balance_tokens or 0),
        "message": "Already granted",
    }

# Сохранённая назад совместимость со старым фронтом: /api/v1/user?user_id=..
legacy_router = APIRouter(prefix="/user", tags=["user"]) 


@legacy_router.get("")
def legacy_get_user(user_id: str | None = None, anon_user_id: str | None = None, email: str | None = None, db: Session = Depends(get_db)) -> dict:
    query = db.query(User)
    if user_id:
        query = query.filter(User.id == user_id)
    elif anon_user_id:
        query = query.filter(User.anon_user_id == anon_user_id)
    elif email:
        query = query.filter(User.email == email)
    else:
        return {"id": "stub", "balance_tokens": 0, "tariff": None}

    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _serialize_user(user)


