import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Usuario
from app.schemas.user_schema import (
    UserCreate,
    UserDeleteById,
    UserDeleteSuccess,
    UserResponse,
    UserUpdate,
    UserUpdateBody,
)
from app.services.user_service import (
    CadastroConflitoError,
    create_user,
    delete_user,
    get_users,
    update_user,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Usuários"])

@router.post(
    "/users",
    response_model=UserResponse,
    summary="Cadastrar usuário",
    description="Cria um novo usuário. Retorna 409 se e-mail/dados já estiverem cadastrados.",
    responses={409: {"description": "Conflito de cadastro (dados já existentes)"}},
)
def create(user: UserCreate, db: Session = Depends(get_db)):
    if user.device_metadata:
        print(f"[device_metadata] register: {user.device_metadata}")
    try:
        return create_user(db, user)
    except CadastroConflitoError as e:
        raise HTTPException(status_code=409, detail=e.detail)

@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="Listar usuários",
    description="Lista todos os usuários. Requer JWT e o cabeçalho `X-Device-UID`.",
    responses={401: {"description": "Não autenticado ou dispositivo não autorizado"}},
)
def list_users(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return get_users(db)


@router.put(
    "/users",
    response_model=UserResponse,
    summary="Atualizar usuário",
    description="Atualiza um usuário pelo `id`. Requer JWT e o cabeçalho `X-Device-UID`.",
    responses={
        401: {"description": "Não autenticado ou dispositivo não autorizado"},
        404: {"description": "Usuário não encontrado"},
        409: {"description": "Conflito de cadastro (dados já existentes)"},
    },
)
def update(body: UserUpdateBody, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    patch = UserUpdate(
        **body.model_dump(exclude={"id"}, exclude_unset=True)
    )
    try:
        updated = update_user(db, body.id, patch)
    except CadastroConflitoError as e:
        raise HTTPException(status_code=409, detail=e.detail)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return updated


@router.delete(
    "/users",
    response_model=UserDeleteSuccess,
    summary="Remover usuário",
    description="Remove um usuário pelo `id`. Requer JWT e o cabeçalho `X-Device-UID`.",
    responses={
        401: {"description": "Não autenticado ou dispositivo não autorizado"},
        404: {"description": "Usuário não encontrado"},
    },
)
def delete(body: UserDeleteById, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    if not delete_user(db, body.id):
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return UserDeleteSuccess(message="Usuário deletado com sucesso.")