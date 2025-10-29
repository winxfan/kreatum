from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Job, User

router = APIRouter(prefix="/jobs", tags=["Jobs"]) 


def _estimate_tokens(service_type: str) -> int:
    if service_type == "animate":
        return 100
    if service_type == "restore":
        return 50
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
    if not user_id or not service_type or not isinstance(input_objects, list):
        raise HTTPException(status_code=400, detail="userId, serviceType, input are required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    else:
        job.is_paid = False
        job.status = "waiting_payment"

    db.add(job)
    db.commit()
    db.refresh(job)
    return _serialize_job(job)


@router.get("")
def list_jobs(userId: str, db: Session = Depends(get_db)) -> list[dict]:
    items = (
        db.query(Job)
        .filter(Job.user_id == userId)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_serialize_job(j) for j in items]


@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)) -> dict:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize_job(job)


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db)) -> dict:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.is_paid and job.tokens_reserved and job.user_id:
        user = db.query(User).filter(User.id == job.user_id).first()
        if user:
            user.balance_tokens = (user.balance_tokens or 0) + (job.tokens_reserved or 0)
    job.tokens_reserved = 0
    job.is_paid = False
    # в нашей БД нет статуса canceled — установим failed
    job.status = "failed"
    db.commit()
    db.refresh(job)
    return _serialize_job(job)

