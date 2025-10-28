from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Job

router = APIRouter(prefix="/jobs", tags=["jobs"]) 


@router.get("/{job_id}")
def job_status(job_id: str, db: Session = Depends(get_db)) -> dict:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Прогресса нет в модели — возвращаем минимум доступных полей
    return {
        "job_id": str(job.id),
        "status": str(job.status) if job.status is not None else None,
        "is_paid": job.is_paid,
        "tokens_reserved": float(job.tokens_reserved or 0),
        "tokens_consumed": float(job.tokens_consumed or 0),
        "result_url": job.result_url,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }

