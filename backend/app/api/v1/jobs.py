from decimal import Decimal, ROUND_UP
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.services.fal import submit_generation
from app.db.models import Job, User, Model
from app.services.telegram_service import notify_job_event
 

router = APIRouter(prefix="/jobs", tags=["Jobs"]) 

logger = logging.getLogger(__name__)


def _estimate_tokens_by_model(model: Model) -> int:
    """Токены = рубли. Берём cost_per_unit_tokens (RUB) и округляем вверх."""
    try:
        price_rub = Decimal(model.cost_per_unit_tokens or 0)
    except Exception:
        price_rub = Decimal(0)
    tokens = int(price_rub.quantize(Decimal("1"), rounding=ROUND_UP)) if price_rub > 0 else 0
    return max(tokens, 1)

def _extract_prompt_from_input(input_objects: list | None) -> str | None:
    if not isinstance(input_objects, list):
        return None
    for it in input_objects:
        if not isinstance(it, dict):
            continue
        name = it.get("name")
        typ = it.get("type")
        if name == "prompt" and (typ in ("text", None)):
            val = it.get("value")
            if isinstance(val, str) and val.strip():
                return val.strip()
    # Фоллбек: любой text-элемент с value
    for it in input_objects:
        if not isinstance(it, dict):
            continue
        if (it.get("type") == "text") and isinstance(it.get("value"), str) and it.get("value").strip():
            return it.get("value").strip()
    return None


def _extract_extra_args(input_objects: list | None) -> dict:
    args: dict = {}
    if not isinstance(input_objects, list):
        return args
    for it in input_objects:
        if not isinstance(it, dict):
            continue
        name = it.get("name")
        typ = it.get("type")
        if not isinstance(name, str) or name in ("prompt", "image_url"):
            continue
        if typ == "upload_zone":
            # загрузки файлов собираем отдельно как image_url
            continue
        if "value" in it:
            val = it.get("value")
            if isinstance(val, (str, int, float, bool)) and val != "":
                args[name] = val
    return args


def _serialize_job(job: Job) -> dict:
    return {
        "id": str(job.id),
        "userId": str(job.user_id) if job.user_id else None,
        "modelId": str(job.model_id) if job.model_id else None,
        "orderId": job.order_id,
        "trafficType": str(job.traffic_type) if job.traffic_type is not None else None,
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
    model_id = payload.get("modelId")
    traffic_type = payload.get("trafficType")
    input_objects = payload.get("input")
    description = payload.get("description")
    # prompt теперь извлекаем из input (name=prompt, type=text, value)
    prompt = _extract_prompt_from_input(input_objects) or payload.get("prompt") or description
    logger.info(
        "create_job: received payload user_id=%s model_id=%s input_count=%s",
        user_id,
        model_id,
        len(input_objects) if isinstance(input_objects, list) else None,
    )
    if not user_id or not model_id or not isinstance(input_objects, list):
        logger.warning(
            "create_job: invalid payload user_id=%s model_id=%s has_input_list=%s",
            user_id,
            model_id,
            isinstance(input_objects, list),
        )
        raise HTTPException(status_code=400, detail="userId, modelId, input are required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning("create_job: user not found user_id=%s", user_id)
        raise HTTPException(status_code=404, detail="User not found")

    # Получаем модель и её форматы
    model: Model | None = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        logger.warning("create_job: model not found model_id=%s", model_id)
        raise HTTPException(status_code=404, detail="Model not found")
    fmt_from = (model.format_from or "").strip().lower()
    fmt_to = (model.format_to or "").strip().lower()

    # Предварительная валидация входа по форматам
    image_url: str | None = None
    if fmt_from == "image":
        for it in input_objects or []:
            if isinstance(it, dict) and it.get("type") in ("image", None):
                url_val = it.get("url")
                if isinstance(url_val, str) and url_val:
                    image_url = url_val
                    break
        if not image_url:
            logger.warning(
                "create_job: missing image url for format_from=image user_id=%s", user_id
            )
            raise HTTPException(status_code=400, detail="image url is required in input[0].url for format_from=image")
    if fmt_from == "text":
        if not isinstance(prompt, str) or not prompt.strip():
            logger.warning("create_job: missing prompt for format_from=text user_id=%s", user_id)
            raise HTTPException(status_code=400, detail="prompt is required in input[name=prompt].value for format_from=text")

    tokens_needed = _estimate_tokens_by_model(model)
    job = Job(
        user_id=user.id,
        model_id=model.id,
        input=input_objects,
        meta={"description": description, "prompt": prompt} if (description or prompt) else None,
        tokens_reserved=0,
        tokens_consumed=0,
        traffic_type=traffic_type,
        cost_unit=model.cost_unit,
        cost_per_unit_tokens=model.cost_per_unit_tokens,
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
    # image -> video
    if job.is_paid and fmt_from == "image" and fmt_to == "video":
        try:
            # image_url уже провалидирован выше
            local_prompt = prompt or "Animate this image"
            order_id = str(job.id)
            # Сохраним order_id в Job для связки с вебхуками
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            logger.info(
                "create_job: submitting to FAL (image->video) job_id=%s order_id=%s",
                job.id,
                order_id,
            )
            # Эндпоинт из модели: options.fal_endpoint | options.endpoint | model.name | дефолт
            options = model.options or {}
            endpoint = None
            if isinstance(options, dict):
                endpoint = options.get("fal_endpoint") or options.get("endpoint")
            if not endpoint:
                endpoint = model.name
            fal_resp = submit_generation(
                image_url=image_url,
                prompt=local_prompt,
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
                endpoint=endpoint,
                extra_args=_extract_extra_args(input_objects),
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
                    "create_job: FAL submission failed (image->video) job_id=%s, tokens_refunded=%s",
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
                    service_type=None,
                    message=str(e),
                )
            except Exception:
                logger.exception("notify telegram failed for job_id=%s", job.id)
            raise HTTPException(status_code=502, detail=f"FAL submission failed: {e}")

    # text -> image
    if job.is_paid and fmt_from == "text" and fmt_to == "image":
        try:
            order_id = str(job.id)
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            # Эндпоинт из модели: options.fal_endpoint | options.endpoint | model.name | дефолт
            options = model.options or {}
            endpoint = None
            if isinstance(options, dict):
                endpoint = options.get("fal_endpoint") or options.get("endpoint")
            if not endpoint:
                endpoint = model.name

            logger.info(
                "create_job: submitting TEXT->IMAGE to FAL job_id=%s order_id=%s endpoint=%s",
                job.id,
                order_id,
                endpoint,
            )
            fal_resp = submit_generation(
                image_url=None,
                prompt=prompt or "Generate image",
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
                endpoint=endpoint,
                extra_args=_extract_extra_args(input_objects),
            )
            meta = job.meta or {}
            meta.update({"fal": {"requestId": fal_resp.get("request_id"), "modelId": fal_resp.get("model_id")}})
            job.meta = meta
            if fal_resp.get("request_id"):
                job.request_id = str(fal_resp.get("request_id"))
            db.commit()
            db.refresh(job)
            logger.info(
                "create_job: FAL submitted TEXT->IMAGE job_id=%s request_id=%s model_id=%s",
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
                    "create_job: FAL submission (text->image) failed job_id=%s, tokens_refunded=%s",
                    job.id,
                    tokens_to_return if 'tokens_to_return' in locals() else 0,
                )
            try:
                notify_job_event(
                    event="job.failed",
                    job_id=str(job.id),
                    user_id=str(job.user_id) if job.user_id else None,
                    status="failed",
                    service_type=None,
                    message=str(e),
                )
            except Exception:
                logger.exception("notify telegram failed for job_id=%s", job.id)
            raise HTTPException(status_code=502, detail=f"FAL submission failed: {e}")

    # image -> image (например, Photo Restoration)
    if job.is_paid and fmt_from == "image" and fmt_to == "image":
        try:
            order_id = str(job.id)
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            options = model.options or {}
            endpoint = None
            if isinstance(options, dict):
                endpoint = options.get("fal_endpoint") or options.get("endpoint")
            if not endpoint:
                endpoint = model.name

            logger.info(
                "create_job: submitting IMAGE->IMAGE to FAL job_id=%s order_id=%s endpoint=%s",
                job.id,
                order_id,
                endpoint,
            )
            fal_resp = submit_generation(
                image_url=image_url,
                prompt=prompt or "",
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
                endpoint=endpoint,
                extra_args=_extract_extra_args(input_objects),
            )
            meta = job.meta or {}
            meta.update({"fal": {"requestId": fal_resp.get("request_id"), "modelId": fal_resp.get("model_id")}})
            job.meta = meta
            if fal_resp.get("request_id"):
                job.request_id = str(fal_resp.get("request_id"))
            db.commit()
            db.refresh(job)
            logger.info(
                "create_job: FAL submitted IMAGE->IMAGE job_id=%s request_id=%s model_id=%s",
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
                    "create_job: FAL submission (image->image) failed job_id=%s, tokens_refunded=%s",
                    job.id,
                    tokens_to_return if 'tokens_to_return' in locals() else 0,
                )
            try:
                notify_job_event(
                    event="job.failed",
                    job_id=str(job.id),
                    user_id=str(job.user_id) if job.user_id else None,
                    status="failed",
                    service_type=None,
                    message=str(e),
                )
            except Exception:
                logger.exception("notify telegram failed for job_id=%s", job.id)
            raise HTTPException(status_code=502, detail=f"FAL submission failed: {e}")

    # text -> video
    if job.is_paid and fmt_from == "text" and fmt_to == "video":
        try:
            order_id = str(job.id)
            job.order_id = order_id
            db.commit()
            db.refresh(job)

            # Эндпоинт из модели: options.fal_endpoint | options.endpoint | model.name | дефолт
            options = model.options or {}
            endpoint = None
            if isinstance(options, dict):
                endpoint = options.get("fal_endpoint") or options.get("endpoint")
            if not endpoint:
                endpoint = model.name

            logger.info(
                "create_job: submitting TEXT->VIDEO to FAL job_id=%s order_id=%s endpoint=%s",
                job.id,
                order_id,
                endpoint,
            )
            fal_resp = submit_generation(
                image_url=None,
                prompt=prompt or "Generate video",
                order_id=order_id,
                item_index=0,
                anon_user_id=None,
                endpoint=endpoint,
                extra_args=_extract_extra_args(input_objects),
            )
            meta = job.meta or {}
            meta.update({"fal": {"requestId": fal_resp.get("request_id"), "modelId": fal_resp.get("model_id")}})
            job.meta = meta
            if fal_resp.get("request_id"):
                job.request_id = str(fal_resp.get("request_id"))
            db.commit()
            db.refresh(job)
            logger.info(
                "create_job: FAL submitted TEXT->VIDEO job_id=%s request_id=%s model_id=%s",
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
                    "create_job: FAL submission (text->video) failed job_id=%s, tokens_refunded=%s",
                    job.id,
                    tokens_to_return if 'tokens_to_return' in locals() else 0,
                )
            try:
                notify_job_event(
                    event="job.failed",
                    job_id=str(job.id),
                    user_id=str(job.user_id) if job.user_id else None,
                    status="failed",
                    service_type=None,
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

