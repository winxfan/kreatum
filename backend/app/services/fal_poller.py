from __future__ import annotations

import logging
import time
from typing import Optional

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.db.models import Job
from app.services.fal import get_request_status, get_request_response, extract_media_url, fetch_queue_json, fetch_bytes
from app.services.s3_utils import s3_key_for_video, upload_bytes, get_file_url_with_expiry
from app.core.config import settings
from app.services.telegram_service import notify_job_event


logger = logging.getLogger(__name__)


def _pick_media_url(request_status: dict, request_response: dict) -> Optional[str]:
    u = extract_media_url(request_response)
    if u:
        return u
    resp_url = request_status.get("response_url")
    if isinstance(resp_url, str) and resp_url.startswith("https://queue.fal.run/"):
        try:
            qjson = fetch_queue_json(resp_url)
            return extract_media_url(qjson or {})
        except Exception:
            logger.exception("fal.poll: failed fetch_queue_json")
    return None


def run_poller(interval_seconds: int = 20) -> None:
    """Бесконечный цикл поллинга очереди FAL для задач в статусах queued/processing."""
    logger.info("fal.poll: started interval=%ss", interval_seconds)
    while True:
        time.sleep(interval_seconds)
        try:
            db: Session = SessionLocal()
            try:
                # Выбираем оплаченные задачи, ожидающие исполнения
                jobs = (
                    db.query(Job)
                    .filter(Job.is_paid.is_(True))
                    .filter(Job.status.in_(["queued", "processing"]))
                    .all()
                )
                for job in jobs:
                    fal_meta = (job.meta or {}).get("fal") if isinstance(job.meta, dict) else None
                    request_id = fal_meta.get("requestId") if isinstance(fal_meta, dict) else None
                    model_id = fal_meta.get("modelId") if isinstance(fal_meta, dict) else None
                    if not request_id:
                        continue

                    try:
                        st = get_request_status(request_id, logs=False, model_id=model_id)
                        st_status = (st.get("status") or "").upper()
                        if st_status == "IN_PROGRESS":
                            if job.status != "processing":
                                job.status = "processing"
                                db.commit()
                                db.refresh(job)
                            continue
                        if st_status == "COMPLETED":
                            resp = get_request_response(request_id, model_id=model_id)
                            media_url = _pick_media_url(st, resp)
                            if not media_url:
                                # Нет URL — считаем ошибкой
                                job.status = "failed"
                                db.commit()
                                db.refresh(job)
                                notify_job_event(
                                    event="job.failed",
                                    job_id=str(job.id),
                                    user_id=str(job.user_id) if job.user_id else None,
                                    status="failed",
                                    service_type=job.service_type,
                                    message="media url not found",
                                )
                                continue

                            # Скачиваем и кладем в S3
                            video_bytes = fetch_bytes(media_url, timeout=180)
                            key = s3_key_for_video(job.anon_user_id or "user", job.order_id or str(job.id), 0, ".mp4")
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
                            continue
                        if st_status in ("FAILED", "CANCELLED", "ERROR"):
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
                            continue
                    except Exception:
                        logger.exception("fal.poll: error processing job_id=%s", job.id)
                        # не меняем статус на ошибку сразу, пробуем в следующий цикл
                        continue
            finally:
                db.close()
        except Exception:
            logger.exception("fal.poll: unexpected loop error")
            # защита от tight loop — продолжим через интервал
            continue


