from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"]) 


@router.get("/{job_id}")
def job_status(job_id: str) -> dict:
    return {"job_id": job_id, "status": "queued", "progress": 0}

