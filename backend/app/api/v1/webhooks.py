from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import WebhookLog

router = APIRouter(prefix="/webhooks", tags=["webhooks"]) 


@router.post("/yookassa")
async def yookassa_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.json()

    log = WebhookLog(event_type="yookassa", payload=payload)
    db.add(log)
    db.commit()

    return {"ok": True}

