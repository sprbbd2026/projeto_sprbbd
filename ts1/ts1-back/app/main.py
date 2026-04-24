from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.routes.health import router as health_router
from app.routes.user_routes import router as user_router
from app.routes.auth_routes import router as auth_router

app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://projeto-sprbbd-ts1-front.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0]
    message = first_error.get("msg", "Dados inválidos.").replace("Value error, ", "")
    return JSONResponse(status_code=400, content={"detail": message})

app.include_router(health_router)
app.include_router(user_router)
app.include_router(auth_router)
