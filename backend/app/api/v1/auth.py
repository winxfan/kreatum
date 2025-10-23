from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.services.oauth import oauth_service

router = APIRouter(prefix="/auth", tags=["auth"]) 


@router.get("/oauth/{provider}/login")
async def oauth_login(request: Request, provider: str):
    oauth = oauth_service.get_oauth()
    if provider not in ("google", "vk", "yandex"):
        raise HTTPException(status_code=404, detail="Unknown provider")

    callback_url = request.url_for("oauth_callback", provider=provider)
    client = getattr(oauth, provider)
    return await client.authorize_redirect(request, str(callback_url))


@router.get("/oauth/{provider}/callback")
async def oauth_callback(request: Request, provider: str):
    oauth = oauth_service.get_oauth()
    if provider not in ("google", "vk", "yandex"):
        raise HTTPException(status_code=404, detail="Unknown provider")

    client = getattr(oauth, provider)
    token = await client.authorize_access_token(request)

    userinfo: dict[str, Any] | None = None
    if provider == "google":
        userinfo = token.get("userinfo")
    elif provider == "yandex":
        # Yandex requires extra request to fetch user info
        resp = await client.get("https://login.yandex.ru/info", params={"format": "json"})
        userinfo = resp.json() if resp else None
    elif provider == "vk":
        # VK returns user id and optionally email in token
        userinfo = {
            "user_id": token.get("user_id"),
            "email": token.get("email"),
            "access_token": token.get("access_token"),
        }

    # TODO: связать с локальным пользователем/БД и выдать JWT/сессию
    # На данном этапе вернём редирект на фронт
    frontend_base = settings.frontend_return_url_base or "http://localhost:3000"
    redirect_url = f"{frontend_base}/profile"
    return RedirectResponse(url=redirect_url)


@router.post("/logout")
def logout() -> dict:
    return {"ok": True}


@router.get("/user/me")
def user_me() -> dict:
    return {"id": "stub", "name": "Guest", "balance_tokens": 0}

