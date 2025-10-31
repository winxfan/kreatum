from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.db.models import Job
from app.services.fal import extract_media_url
from app.services.s3_utils import upload_bytes, s3_key_for_video, get_file_url_with_expiry
from app.core.config import settings
import requests
from app.services.telegram_service import notify_job_event


router = APIRouter(prefix="/fal", tags=["FAL"])
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def fal_webhook(request: Request, db: Session = Depends(get_db)) -> Any:
    params = dict(request.query_params)
    order_id = params.get("order_id")
    item_index = params.get("item_index")
    token = params.get("token")

    if settings.fal_webhook_token and token != settings.fal_webhook_token:
        return Response(status_code=401)

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    logger.info("fal.webhook: order_id=%s item_index=%s status=%s", order_id, item_index, payload.get("status"))

    if not order_id:
        return {"ok": True}

    job = db.query(Job).filter(Job.order_id == order_id).first()
    if not job:
        return {"ok": True}

    status = (payload.get("status") or payload.get("state") or "").lower()
    media_url = extract_media_url(payload) or payload.get("response_url") or payload.get("url") or payload.get("video_url")

    if status in ("succeeded", "completed", "completed_successfully") and isinstance(media_url, str) and media_url:
        try:
            resp = requests.get(media_url, timeout=180)
            resp.raise_for_status()
            video_bytes = resp.content
            key = s3_key_for_video(job.anon_user_id or "user", order_id, int(item_index or 0), ".mp4")
            upload_bytes(settings.s3_bucket_name or "", key, video_bytes, content_type="video/mp4")
            public_url, _ = get_file_url_with_expiry(settings.s3_bucket_name or "", key)
            job.result_url = public_url
            job.status = "done"
            db.commit()
            db.refresh(job)
            notify_job_event(
                event="job.completed",
                job_id=str(job.id),
                user_id=str(job.user_id) if job.user_id else None,
                status="done",
                service_type=job.service_type,
                result_url=public_url,
            )
        except Exception:
            logger.exception("fal.webhook: failed to store media for order_id=%s", order_id)
            job.status = "failed"
            db.commit()
            db.refresh(job)
            notify_job_event(
                event="job.failed",
                job_id=str(job.id),
                user_id=str(job.user_id) if job.user_id else None,
                status="failed",
                service_type=job.service_type,
                message="store media failed",
            )
    elif status in ("failed", "error"):
        job.status = "failed"
        db.commit()
        db.refresh(job)
        notify_job_event(
            event="job.failed",
            job_id=str(job.id),
            user_id=str(job.user_id) if job.user_id else None,
            status="failed",
            service_type=job.service_type,
        )

    return {"ok": True}


