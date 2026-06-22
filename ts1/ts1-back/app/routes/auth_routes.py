from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import login_user

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Autenticar operador",
    description="Valida credenciais e retorna um token JWT de acesso.",
    responses={401: {"description": "Credenciais inválidas"}},
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    return login_user(db, data)
