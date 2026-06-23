from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.local_routes import router as local_router
from app.routes.user_routes import router as user_router
from app.routes.telemetry_routes import router as telemetry_router
from app.routes.localizacao_routes import router as localizacao_router
from app.routes.dispositivo_routes import router as dispositivo_router
from app.routes.routing_routes import router as routing_router
from app.db.database import engine
from app.db import models
from app.db import cache_models  # noqa: F401 — registra tabelas de cache

models.Base.metadata.create_all(bind=engine)
cache_models.Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "auth", "description": "Autenticação de usuários e emissão/renovação de tokens JWT."},
    {"name": "Usuários", "description": "Cadastro, consulta, atualização e remoção de usuários."},
    {"name": "Locais", "description": "Cadastro e listagem de locais de interesse."},
    {"name": "Telemetria", "description": "Registro e consulta de telemetria."},
    {"name": "Histórico de Localização", "description": "Histórico, rota e satélites monitorados (US300/US302)."},
    {"name": "Dispositivos", "description": "Dispositivos conectados do usuário autenticado."},
    {"name": "Rotas", "description": "Cálculo de rotas terrestres e geocoding (OSRM/Nominatim)."},
]

app = FastAPI(
    title="SPRB-BD · API TS2",
    description=(
        "API do backend TS2 do projeto SPRB-BD.\n\n"
        "Endpoints protegidos exigem token JWT no cabeçalho `Authorization: Bearer <token>` "
        "(use o botão **Authorize**) e, quando indicado, o cabeçalho `X-Device-UID`."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configurar CORS (mesma origem de ts1-back)
ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://projeto-sprbbd-ts2-front.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(local_router)
app.include_router(telemetry_router)
app.include_router(localizacao_router)
app.include_router(dispositivo_router)
app.include_router(routing_router)
