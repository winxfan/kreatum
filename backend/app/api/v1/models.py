from fastapi import APIRouter

router = APIRouter(prefix="/models", tags=["models"]) 


@router.get("")
def list_models(q: str | None = None, category: str | None = None, format_from: str | None = None, format_to: str | None = None, page: int = 1, limit: int = 20) -> dict:
    return {"items": [], "total": 0}


@router.get("/{model_id}")
def get_model(model_id: str) -> dict:
    return {"id": model_id, "title": "Veo 3.1", "name": "fal-ai/veo3.1/reference-to-video"}

