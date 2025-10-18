from fastapi import APIRouter

router = APIRouter(prefix="/webhooks", tags=["webhooks"]) 


@router.post("/yookassa")
def yookassa_webhook() -> dict:
    return {"ok": True}

