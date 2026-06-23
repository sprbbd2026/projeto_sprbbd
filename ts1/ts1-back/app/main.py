from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
from app.routes.health import router as health_router
from app.routes.user_routes import router as user_router
from app.routes.auth_routes import router as auth_router
from app.routes.telemetria_routes import router as telemetria_router
from app.routes.command_routes import router as command_router
from app.routes.satellite_routes import router as satellite_router
from app.routes.constelacao_routes import router as constelacao_router
from app.routes.constellation_routes import router as constellation_router
from app.routes.cobertura_routes import router as cobertura_router
from app.routes.dashboard_routes import router as dashboard_router
from simulation.telemetry_simulation import run as run_simulation


async def simulation_loop():
    await run_simulation()


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(simulation_loop())
    yield


tags_metadata = [
    {"name": "Health", "description": "Verificação de disponibilidade do serviço."},
    {"name": "Autenticação", "description": "Login e emissão de token JWT."},
    {"name": "Usuários", "description": "Cadastro de operadores/usuários."},
    {"name": "Telemetria", "description": "Ingestão e consulta de telemetria e localizações."},
    {"name": "Comandos", "description": "Envio e histórico de comandos remotos (US305)."},
    {"name": "Satellites", "description": "CRUD de satélites."},
    {"name": "Constellations", "description": "CRUD de constelações."},
    {"name": "Constelacoes", "description": "Listagem de constelações (endpoint legado em PT)."},
    {"name": "Cobertura", "description": "Cobertura por satélite, constelação e região (US308)."},
    {"name": "Dashboard", "description": "Indicadores consolidados do painel."},
]

app = FastAPI(
    title="SPRB-BD · API TS1",
    description=(
        "API do backend TS1 do projeto SPRB-BD.\n\n"
        "Endpoints protegidos exigem token JWT no cabeçalho "
        "`Authorization: Bearer <token>` (use o botão **Authorize**)."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "https://projeto-sprbbd-ts1-front.onrender.com",
    "https://projeto-sprbbd-ts2-front.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0]
    field = first_error.get("loc", [""])[-1]
    msg = first_error.get("msg", "Dados inválidos.")

    # Traduz mensagens técnicas do Pydantic/email-validator
    if "email" in msg.lower() or "email" in str(field).lower():
        message = "E-mail inválido ou excede o tamanho máximo permitido."
    else:
        message = msg.replace("Value error, ", "")

    response = JSONResponse(status_code=400, content={"detail": message})
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

app.include_router(health_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(telemetria_router)
app.include_router(command_router)
app.include_router(satellite_router)
app.include_router(constelacao_router)
app.include_router(constellation_router)
app.include_router(cobertura_router)
app.include_router(dashboard_router)
