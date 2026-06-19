from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.user_routes import router as user_router
from app.routes.telemetry_routes import router as telemetry_router
from app.routes.localizacao_routes import router as localizacao_router
from app.db.database import engine
from app.db import models

# Sincroniza e cria todas as tabelas automaticamente no banco
models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(telemetry_router)
app.include_router(localizacao_router)