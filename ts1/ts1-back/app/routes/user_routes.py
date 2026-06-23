from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_schema import UserCreateRequest, UserResponse
from app.services.user_service import create_user

router = APIRouter(tags=["Usuários"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    summary="Cadastrar operador/usuário",
    description="Cria um novo operador. Retorna 201 em caso de sucesso.",
)
def register(
    data: UserCreateRequest,
    db: Session = Depends(get_db)
):
    return create_user(db, data)
