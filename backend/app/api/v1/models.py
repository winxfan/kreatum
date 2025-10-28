from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import Model

router = APIRouter(prefix="/models", tags=["models"]) 


@router.get("")
def list_models(q: str | None = None, category: str | None = None, format_from: str | None = None, format_to: str | None = None, page: int = 1, limit: int = 20, db: Session = Depends(get_db)) -> dict:
    query = db.query(Model)

    if q:
        ilike = f"%{q}%"
        query = query.filter(or_(Model.title.ilike(ilike), Model.name.ilike(ilike)))

    if category:
        query = query.filter(Model.category_id == category)

    # Простейшая фильтрация по JSONB (contains по строке)
    if format_from:
        query = query.filter(text("format_from::text ILIKE :ff")).params(ff=f"%{format_from}%")
    if format_to:
        query = query.filter(text("format_to::text ILIKE :ft")).params(ft=f"%{format_to}%")

    total = query.count()
    items = query.order_by(Model.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    def serialize(m: Model) -> dict[str, Any]:
        return {
            "id": str(m.id),
            "title": m.title,
            "name": m.name,
            "description": m.description,
            "category_id": str(m.category_id) if m.category_id else None,
            "cost_unit": m.cost_unit,
            "cost_per_unit_tokens": float(m.cost_per_unit_tokens or 0),
            "currency": m.currency,
            "format_from": m.format_from,
            "format_to": m.format_to,
            "banner_image_url": m.banner_image_url,
            "hint": m.hint,
            "max_file_count": m.max_file_count,
            "options": m.options,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }

    return {"items": [serialize(m) for m in items], "total": total}


@router.get("/{model_id}")
def get_model(model_id: str, db: Session = Depends(get_db)) -> dict:
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
        "id": str(model.id),
        "title": model.title,
        "name": model.name,
        "description": model.description,
        "category_id": str(model.category_id) if model.category_id else None,
        "cost_unit": model.cost_unit,
        "cost_per_unit_tokens": float(model.cost_per_unit_tokens or 0),
        "currency": model.currency,
        "format_from": model.format_from,
        "format_to": model.format_to,
        "banner_image_url": model.banner_image_url,
        "hint": model.hint,
        "max_file_count": model.max_file_count,
        "options": model.options,
        "created_at": model.created_at.isoformat() if model.created_at else None,
    }

