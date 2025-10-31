from fastapi import FastAPI, APIRouter, Depends
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.api.deps import require_api_key
from app.api.v1 import auth, models, runs, jobs, transactions, users, webhooks, data, payments, referrals, reviews, subscriptions, lotteries, tariffs
from app.api import fal_public

app = FastAPI(
    title="Neurolibrary API",
    version="0.1.0",
    default_response_class=ORJSONResponse,
)

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret_key)

# CORS
cors_origins = [
    "http://localhost:3000",
    "https://localhost:3000",
]
if settings.frontend_return_url_base:
    cors_origins.append(settings.frontend_return_url_base)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(auth.router)
api_v1.include_router(models.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(runs.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(jobs.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(transactions.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(users.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(users.legacy_router, dependencies=[Depends(require_api_key)])
api_v1.include_router(data.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(payments.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(referrals.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(reviews.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(subscriptions.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(lotteries.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(tariffs.router, dependencies=[Depends(require_api_key)])
api_v1.include_router(webhooks.router)  # вебхуки без API-ключа

app.include_router(api_v1)

# Публичные колбэки OAuth (без /api/v1), например /oauth/yandex/callback
app.include_router(auth.router_public)
app.include_router(fal_public.router)  # публичный вебхук от fal.ai


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok", "env": settings.environment}


# Фоновый поллинг очередь FAL (резервный контур на случай, если вебхук не пришёл)
import threading
from app.services.fal_poller import run_poller


@app.on_event("startup")
def start_fal_poller() -> None:
    t = threading.Thread(target=run_poller, name="fal-poller", args=(20,), daemon=True)
    t.start()
