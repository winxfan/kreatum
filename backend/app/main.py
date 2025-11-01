from fastapi import FastAPI, APIRouter, Depends
import logging
import sys
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.api.deps import require_api_key
from app.api.v1 import auth, models, runs, jobs, transactions, users, webhooks, data, payments, referrals, reviews, lotteries, tariffs
from app.api import fal_public

def _configure_logging() -> None:
    """Инициализация базовой конфигурации логирования, если не настроена извне.

    Делает видимыми наши application-логи (logger.info(...)) в выводе Uvicorn/Docker.
    """
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
        root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    # шумные логгеры — в WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


_configure_logging()


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
    import logging
    logging.getLogger("uvicorn.error").info(
        "startup: starting fal poller thread (interval=%ss)",
        settings.fal_poll_interval_seconds,
    )
    t = threading.Thread(
        target=run_poller,
        name="fal-poller",
        args=(int(settings.fal_poll_interval_seconds),),
        daemon=True,
    )
    t.start()
