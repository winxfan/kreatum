from decimal import Decimal
from fastapi import APIRouter
from app.core.pricing import usd_to_rub, rubles_to_tokens
from app.services.queue import get_queue
from app.workers.worker import process_run_job

router = APIRouter(prefix="/models", tags=["runs"]) 


@router.post("/{model_id}/run")
def run_model(model_id: str, prompt: str | None = None, audio: bool = False, duration_seconds: int = 5, count: int = 1) -> dict:
    cost_per_second_usd = Decimal("0.20")
    multiplier = Decimal("2.0") if audio else Decimal("1.0")
    cost_usd = cost_per_second_usd * Decimal(duration_seconds) * multiplier
    cost_rub = usd_to_rub(cost_usd)
    tokens_needed = rubles_to_tokens(cost_rub)

    payload = {
        "model_id": model_id,
        "prompt": prompt,
        "audio": audio,
        "duration_seconds": duration_seconds,
        "count": count,
        "tokens_reserved": tokens_needed,
    }
    q = get_queue()
    job = q.enqueue(process_run_job, payload)

    return {
        "job_id": job.get_id(),
        "status": "queued",
        "tokens_reserved": tokens_needed,
        "estimated_rub_cost": float(cost_rub),
    }
