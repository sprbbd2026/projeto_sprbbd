import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.limiter import limiter
from app.routes.register import router as register_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# CORS só lê os.getenv aqui: não exige `.env` completo no import (útil para CI e GET /health).
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]

app = FastAPI(
    title="TS1 BFF — SPRB-BD",
    description="Backend fino para cadastro de usuário no Supabase (service role).",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)

app.include_router(register_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
