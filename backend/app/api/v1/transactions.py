from fastapi import APIRouter

router = APIRouter(prefix="/transactions", tags=["transactions"]) 


@router.get("")
def list_transactions(page: int = 1, limit: int = 20) -> dict:
    return {"items": [], "total": 0}


@router.post("/checkout")
def checkout(amount_rub: float) -> dict:
    return {"checkout_url": "https://yookassa.example/checkout/stub"}

