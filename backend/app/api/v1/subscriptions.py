from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import User

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"]) 


@router.post("/check-channel")
def check_channel(payload: dict, db: Session = Depends(get_db)) -> dict:
    user_id = payload.get("userId")
    telegram_id = payload.get("telegramId")
    channel_username = payload.get("channelUsername")
    if not user_id or not telegram_id or not channel_username:
        raise HTTPException(status_code=400, detail="userId, telegramId, channelUsername are required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Заглушка: интеграция с Telegram не реализована
    return {"isMember": False, "bonusGranted": False, "balanceTokens": float(user.balance_tokens or 0)}



