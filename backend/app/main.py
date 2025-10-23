from fastapi import FastAPI, APIRouter
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.core.config import settings
from app.api.v1 import auth, models, runs, jobs, transactions, users, webhooks

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
api_v1.include_router(models.router)
api_v1.include_router(runs.router)
api_v1.include_router(jobs.router)
api_v1.include_router(transactions.router)
api_v1.include_router(users.router)
api_v1.include_router(webhooks.router)

app.include_router(api_v1)

# Публичные колбэки OAuth (без /api/v1), например /oauth/yandex/callback
app.include_router(auth.router_public)


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok", "env": settings.environment}
