from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.local_routes import router as local_router
from app.routes.user_routes import router as user_router
from app.routes.telemetry_routes import router as telemetry_router
from app.routes.cobertura_routes import router as cobertura_router
from app.db.database import engine
from app.db import models

# Sincroniza e cria todas as tabelas automaticamente no banco
models.Base.metadata.create_all(bind=engine)
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    print("VALIDATION ERROR:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(local_router)
app.include_router(telemetry_router)
app.include_router(cobertura_router)

