from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"]) 


@router.get("/oauth/{provider}/login")
def oauth_login(provider: str) -> dict:
    return {"provider": provider, "login_url": f"https://oauth.example/{provider}"}


@router.get("/oauth/{provider}/callback")
def oauth_callback(provider: str, code: str) -> dict:
    return {"access_token": "stub", "refresh_token": "stub", "user": {"id": "stub", "provider": provider, "code": code}}


@router.post("/logout")
def logout() -> dict:
    return {"ok": True}


@router.get("/user/me")
def user_me() -> dict:
    return {"id": "stub", "name": "Guest", "balance_tokens": 0}

