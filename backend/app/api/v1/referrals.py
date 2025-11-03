from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import func
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import User, Referral, Transaction

router = APIRouter(prefix="/referrals", tags=["Referrals"]) 


@router.get("/link")
def get_link(userId: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.id == userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.ref_code:
        from uuid import uuid4
        user.ref_code = uuid4().hex[:8]
        db.commit()
        db.refresh(user)
    # Базовую ссылку можно заменить на реальную
    ref_link = f"https://t.me/kreatum_bot?start=ref_{user.ref_code}"
    return {"refLink": ref_link}


@router.get("/stats")
def get_stats(userId: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.id == userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_invited = db.query(Referral).filter(Referral.inviter_id == user.id).count()
    invited_paid = db.query(Referral).filter(Referral.inviter_id == user.id, Referral.invitee_paid.is_(True)).count()

    ref_earned = (
        db.query(func.coalesce(func.sum(Transaction.tokens_delta), 0))
        .filter(Transaction.user_id == user.id, Transaction.type == "promo", Transaction.reference == "referral_bonus")
        .scalar()
    )
    return {
        "totalInvited": total_invited,
        "invitedPaidCount": invited_paid,
        "refEarned": float(ref_earned or 0),
    }


@router.get("/history")
def get_history(userId: str, db: Session = Depends(get_db)) -> list[dict]:
    items = (
        db.query(Referral)
        .filter(Referral.inviter_id == userId)
        .order_by(Referral.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "inviterId": str(r.inviter_id),
            "inviteeId": str(r.invitee_id),
            "inviteePaid": r.invitee_paid,
            "rewardGiven": r.reward_given,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in items
    ]


# Применить реф-код: связать пригласившего и приглашённого и начислить бонус (идемпотентно)
@router.post("/apply")
def apply_referral_code(payload: dict, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"), db: Session = Depends(get_db)) -> dict:
    ref_code = payload.get("refCode")
    telegram_id = payload.get("telegramId")
    if not ref_code:
        raise HTTPException(status_code=400, detail="refCode is required")
    if not telegram_id:
        raise HTTPException(status_code=400, detail="telegramId is required")

    invitee = db.query(User).filter(User.telegram_id == str(telegram_id)).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="Invitee (user by telegramId) not found")

    inviter = db.query(User).filter(User.ref_code == ref_code).first()
    if not inviter:
        raise HTTPException(status_code=404, detail="Inviter (by refCode) not found")

    if inviter.id == invitee.id:
        raise HTTPException(status_code=400, detail="Self-referral is not allowed")

    # Проверим, не привязан ли уже этот приглашённый к кому-то
    existing = db.query(Referral).filter(Referral.invitee_id == invitee.id).first()
    already_linked = existing is not None

    if not already_linked:
        # Установим реферера у пользователя, если ещё не стоял
        if not invitee.referrer_id:
            invitee.referrer_id = inviter.id
        # Создадим запись Referral
        existing = Referral(inviter_id=inviter.id, invitee_id=invitee.id)
        db.add(existing)
        db.commit()
        db.refresh(invitee)

    # Начислим бонус пригласившему, если ещё не начисляли
    bonus_granted = False
    bonus_tokens = Decimal(50)
    if existing.inviter_id == inviter.id and not existing.reward_given:
        inviter.balance_tokens = (inviter.balance_tokens or 0) + bonus_tokens
        txn = Transaction(
            user_id=inviter.id,
            type="promo",
            provider="telegram",
            status="success",
            tokens_delta=bonus_tokens,
            currency="RUB",
            reference="referral_bonus",
            meta={
                "reason": "referral",
                "refCode": ref_code,
                "inviteeTelegramId": str(telegram_id),
                **({"idempotencyKey": idempotency_key} if idempotency_key else {}),
            },
        )
        existing.reward_given = True
        db.add(txn)
        db.commit()
        bonus_granted = True

    # Сериализация пригласившего (минимально нужные поля)
    inviter_info = {
        "id": str(inviter.id),
        "telegramId": inviter.telegram_id,
        "username": inviter.username,
        "refCode": inviter.ref_code,
    }

    return {
        "bonusGranted": bonus_granted,
        "alreadyLinked": already_linked,
        "balanceTokens": float(invitee.balance_tokens or 0),
        "inviter": inviter_info,
    }


