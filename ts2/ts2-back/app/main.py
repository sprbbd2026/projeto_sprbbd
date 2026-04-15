from fastapi import FastAPI
from app.routes.user_routes import router as user_router
from app.db.database import engine
from app.db import models

# Sincroniza e cria todas as tabelas automaticamente no banco
models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.include_router(user_router)