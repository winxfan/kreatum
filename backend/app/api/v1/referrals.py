from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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



