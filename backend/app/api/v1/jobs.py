from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.services.fal import submit_generation
from app.db.models import Job, User
from app.services.telegram_service import notify_job_event

router = APIRouter(prefix="/jobs", tags=["Jobs"]) 

logger = logging.getLogger(__name__)


def _estimate_tokens(service_type: str) -> int:
    if service_type == "animate":
        return 89
    if service_type == "restore":
        return 10
    return 100


def _serialize_job(job: Job) -> dict:
    return {
        "id": str(job.id),
        "userId": str(job.user_id) if job.user_id else None,
        "modelId": str(job.model_id) if job.model_id else None,
        "orderId": job.order_id,
        "serviceType": job.service_type,
        "status": str(job.status) if job.status is not None else None,
        "priceRub": float(job.price_rub or 0),
        "tokensReserved": float(job.tokens_reserved or 0),
        "tokensConsumed": float(job.tokens_consumed or 0),
        "input": job.input,
        "output": job.output,
        "resultUrl": job.result_url,
        "meta": job.meta,
        "createdAt": job.created_at.isoformat() if job.created_at else None,
        "updatedAt": job.updated_at.isoformat() if job.updated_at else None,
    }


@router.post("")
def create_job(payload: dict, db: Session = Depends(get_db)) -> dict:
    user_id = payload.get("userId")
    service_type = payload.get("serviceType")
    input_objects = payload.get("input")
    description = payload.get("description")
    logger.info(
        "create_job: received payload user_id=%s service_type=%s input_count=%s",
        user_id,
        service_type,
        len(input_objects) if isinstance(input_objects, list) else None,
    )
    if not user_id or not service_type or not isinstance(input_objects, list):
        logger.warning(
            "create_job: invalid payload user_id=%s service_type=%s has_input_list=%s",
            user_id,
            service_type,
            isinstance(input_objects, list),
        )
        raise HTTPException(status_code=400, detail="userId, serviceType, input are required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning("create_job: user not found user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="User not found")

    # Предварительная валидация входа: требуется image_url для animate и restore
    image_url: str | None = None
    if service_type in ("animate", "restore"):
        for it in input_objects or []:
            if isinstance(it, dict) and it.get("type") in ("image", None):
                url_val = it.get("url")
                if isinstance(url_val, str) and url_val:
                    image_url = url_val
                    break
        if not image_url:
            logger.warning(
                "create_job: missing image url for %s user_id=%s", service_type, user_id
            )
            raise HTTPException(status_code=400, detail=f"image url is required in input[0].url for {service_type}")

    tokens_needed = _estimate_tokens(service_type)
    job = Job(
        user_id=user.id,
        service_type=service_type,
        input=input_objects,
        meta={"description": description} if description else None,
        tokens_reserved=0,
        tokens_consumed=0,
    )

    if (user.balance_tokens or 0) >= tokens_needed:
        # резервируем токены и помечаем как оплачено
        user.balance_tokens = (user.balance_tokens or 0) - Decimal(tokens_needed)
        job.tokens_reserved = Decimal(tokens_needed)
        job.is_paid = True
        job.status = "queued"
        logger.info(
            "create_job: tokens reserved (%s) for user_id=%s, job will be queued",
            tokens_needed,
            user.id,
        )
    else:
        job.is_paid = False
        job.status = "waiting_payment"
        logger.info(
            "create_job: insufficient tokens for user_id=%s, needed=%s, status=waiting_payment",
            user.id,
            tokens_needed,
        )

    db.add(job)
    db.commit()
    db.refresh(job)

    # Если задача оплачена — ставим генерацию в очередь FAL
    if job.is_paid and service_type == "animate":
        try:
            # image_url уже провалидирован выше

            prompt = description or "Animate this image"
            order_id = str(job.id)
            # Сохраним order_id в Job для связки с вебхуками
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            logger.info(
                "create_job: submitting to FAL job_id=%s order_id=%s",
                job.id,
                order_id,
            )
            fal_resp = submit_generation(
                image_url=image_url,
                prompt=prompt,
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
            )
            meta = job.meta or {}
            meta.update({"fal": {"requestId": fal_resp.get("request_id"), "modelId": fal_resp.get("model_id")}})
            job.meta = meta
            # Сохраняем request_id FAL в отдельное поле для быстрого доступа поллером
            if fal_resp.get("request_id"):
                job.request_id = str(fal_resp.get("request_id"))
            # Оставляем статус queued; дальнейший прогресс обновится обработчиком вебхуков
            db.commit()
            db.refresh(job)
            logger.info(
                "create_job: FAL submitted job_id=%s request_id=%s model_id=%s",
                job.id,
                (fal_resp or {}).get("request_id"),
                (fal_resp or {}).get("model_id"),
            )
        except Exception as e:
            # В случае ошибки: откатываем резерв, помечаем failed и возвращаем 502
            try:
                tokens_to_return = int(job.tokens_reserved or 0)
                if tokens_to_return and job.user_id:
                    user_refund = db.query(User).filter(User.id == job.user_id).first()
                    if user_refund:
                        user_refund.balance_tokens = (user_refund.balance_tokens or 0) + tokens_to_return
                job.tokens_reserved = 0
                job.is_paid = False
                job.status = "failed"
                meta = job.meta or {}
                meta.update({"falError": str(e)})
                job.meta = meta
                db.commit()
                db.refresh(job)
            finally:
                logger.exception(
                    "create_job: FAL submission failed job_id=%s, tokens_refunded=%s",
                    job.id,
                    tokens_to_return if 'tokens_to_return' in locals() else 0,
                )
            # уведомим Telegram о неуспехе
            try:
                notify_job_event(
                    event="job.failed",
                    job_id=str(job.id),
                    user_id=str(job.user_id) if job.user_id else None,
                    status="failed",
                    service_type=job.service_type,
                    message=str(e),
                )
            except Exception:
                logger.exception("notify telegram failed for job_id=%s", job.id)
            raise HTTPException(status_code=502, detail=f"FAL submission failed: {e}")

    # Поддержка реставрации фото (serviceType=restore)
    if job.is_paid and service_type == "restore":
        try:
            # image_url уже провалидирован выше
            prompt = description or "Restore this photo"
            order_id = str(job.id)
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            # Опции модели: берём из payload.options при наличии, иначе — дефолты из модели
            options = payload.get("options") if isinstance(payload.get("options"), dict) else {}
            # Переносим плоские поля с корня тела в options, если их там ещё нет
            for key in ("enhance_resolution", "fix_colors", "remove_scratches", "aspect_ratio"):
                if key in payload and key not in options:
                    options[key] = payload.get(key)

            def _to_bool(val, default: bool) -> bool:
                if isinstance(val, bool):
                    return val
                if isinstance(val, str):
                    v = val.strip().lower()
                    if v in ("true", "1", "yes", "on"):
                        return True
                    if v in ("false", "0", "no", "off"):
                        return False
                return default

            extra_args = {
                "enhance_resolution": _to_bool(options.get("enhance_resolution"), True),
                "fix_colors": _to_bool(options.get("fix_colors"), True),
                "remove_scratches": _to_bool(options.get("remove_scratches"), True),
            }

            endpoint = "fal-ai/image-apps-v2/photo-restoration"

            logger.info(
                "create_job: submitting RESTORE to FAL job_id=%s order_id=%s endpoint=%s",
                job.id,
                order_id,
                endpoint,
            )
            fal_resp = submit_generation(
                image_url=image_url,
                prompt=prompt,
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
                endpoint=endpoint,
                extra_args=extra_args,
            )
            meta = job.meta or {}
            meta.update({"fal": {"requestId": fal_resp.get("request_id"), "modelId": fal_resp.get("model_id")}})
            job.meta = meta
            if fal_resp.get("request_id"):
                job.request_id = str(fal_resp.get("request_id"))
            db.commit()
            db.refresh(job)
            logger.info(
                "create_job: FAL submitted RESTORE job_id=%s request_id=%s model_id=%s",
                job.id,
                (fal_resp or {}).get("request_id"),
                (fal_resp or {}).get("model_id"),
            )
        except Exception as e:
            try:
                tokens_to_return = int(job.tokens_reserved or 0)
                if tokens_to_return and job.user_id:
                    user_refund = db.query(User).filter(User.id == job.user_id).first()
                    if user_refund:
                        user_refund.balance_tokens = (user_refund.balance_tokens or 0) + tokens_to_return
                job.tokens_reserved = 0
                job.is_paid = False
                job.status = "failed"
                meta = job.meta or {}
                meta.update({"falError": str(e)})
                job.meta = meta
                db.commit()
                db.refresh(job)
            finally:
                logger.exception(
                    "create_job: FAL submission (restore) failed job_id=%s, tokens_refunded=%s",
                    job.id,
                    tokens_to_return if 'tokens_to_return' in locals() else 0,
                )
            try:
                notify_job_event(
                    event="job.failed",
                    job_id=str(job.id),
                    user_id=str(job.user_id) if job.user_id else None,
                    status="failed",
                    service_type=job.service_type,
                    message=str(e),
                )
            except Exception:
                logger.exception("notify telegram failed for job_id=%s", job.id)
            raise HTTPException(status_code=502, detail=f"FAL submission failed: {e}")

    return _serialize_job(job)


@router.get("")
def list_jobs(userId: str, db: Session = Depends(get_db)) -> list[dict]:
    logger.debug("list_jobs: user_id=%s", userId)
    items = (
        db.query(Job)
        .filter(Job.user_id == userId)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_serialize_job(j) for j in items]


@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)) -> dict:
    logger.debug("get_job: job_id=%s", job_id)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize_job(job)

