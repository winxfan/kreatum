from fastapi import APIRouter

router = APIRouter(prefix="/user", tags=["user"]) 


@router.get("")
def get_user() -> dict:
    return {"id": "stub", "balance_tokens": 0, "tariff": None}


@router.post("/tariff/change")
def change_tariff(tariff_id: str) -> dict:
    return {"ok": True, "tariff_id": tariff_id}

