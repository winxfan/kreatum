from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Lottery, LotteryEntry

router = APIRouter(prefix="/lotteries", tags=["Lotteries"]) 


def _serialize_lottery(l: Lottery) -> dict:
    return {
        "id": str(l.id),
        "title": l.title,
        "description": l.description,
        "startDate": l.start_date.isoformat() if l.start_date else None,
        "endDate": l.end_date.isoformat() if l.end_date else None,
        "prizes": l.prizes,
        "createdAt": l.created_at.isoformat() if l.created_at else None,
    }


def _serialize_entry(e: LotteryEntry) -> dict:
    return {
        "id": str(e.id),
        "lotteryId": str(e.lottery_id),
        "userId": str(e.user_id),
        "referralCount": e.referral_count,
        "socialLinks": e.social_links or [],
        "rewardGiven": e.reward_given,
        "createdAt": e.created_at.isoformat() if e.created_at else None,
    }


@router.get("/current")
def current(db: Session = Depends(get_db)) -> dict:
    now = datetime.now(timezone.utc)
    lot = (
        db.query(Lottery)
        .filter(Lottery.start_date <= now, Lottery.end_date >= now)
        .order_by(Lottery.start_date.desc())
        .first()
    )
    if not lot:
        # если нет активной — вернём последнюю по дате старта
        lot = db.query(Lottery).order_by(Lottery.start_date.desc()).first()
        if not lot:
            raise HTTPException(status_code=404, detail="Lottery not found")
    return _serialize_lottery(lot)


@router.get("/history")
def history(db: Session = Depends(get_db)) -> list[dict]:
    items = db.query(Lottery).order_by(Lottery.start_date.desc()).all()
    return [_serialize_lottery(l) for l in items]


@router.get("/entries/me")
def entry_me(userId: str, db: Session = Depends(get_db)) -> dict:
    # берём текущую/последнюю лотерею
    lot = db.query(Lottery).order_by(Lottery.start_date.desc()).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")
    entry = (
        db.query(LotteryEntry)
        .filter(LotteryEntry.lottery_id == lot.id, LotteryEntry.user_id == userId)
        .first()
    )
    if not entry:
        entry = LotteryEntry(lottery_id=lot.id, user_id=userId, referral_count=0, social_links=[])
        db.add(entry)
        db.commit()
        db.refresh(entry)
    return _serialize_entry(entry)


@router.post("/entries/submit-social")
def submit_social(payload: dict, db: Session = Depends(get_db)) -> dict:
    user_id = payload.get("userId")
    social_links = payload.get("socialLinks") or []
    if not user_id or not isinstance(social_links, list):
        raise HTTPException(status_code=400, detail="userId and socialLinks are required")
    lot = db.query(Lottery).order_by(Lottery.start_date.desc()).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")
    entry = (
        db.query(LotteryEntry)
        .filter(LotteryEntry.lottery_id == lot.id, LotteryEntry.user_id == user_id)
        .first()
    )
    if not entry:
        from uuid import uuid4
        entry = LotteryEntry(lottery_id=lot.id, user_id=user_id)
        db.add(entry)
    entry.social_links = social_links
    db.commit()
    db.refresh(entry)
    return _serialize_entry(entry)




