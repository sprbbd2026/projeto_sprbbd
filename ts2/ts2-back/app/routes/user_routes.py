from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user_schema import (
    UserCreate,
    UserDeleteById,
    UserDeleteSuccess,
    UserResponse,
    UserUpdate,
    UserUpdateBody,
)
from app.services.user_service import (
    EmailJaCadastradoError,
    create_user,
    delete_user,
    get_users,
    update_user,
)

router = APIRouter()

@router.post("/users", response_model=UserResponse)
def create(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, user)
    except EmailJaCadastradoError:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )

@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return get_users(db)


@router.put("/users", response_model=UserResponse)
def update(body: UserUpdateBody, db: Session = Depends(get_db)):
    patch = UserUpdate(
        **body.model_dump(exclude={"id"}, exclude_unset=True)
    )
    try:
        updated = update_user(db, body.id, patch)
    except EmailJaCadastradoError:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return updated


@router.delete("/users", response_model=UserDeleteSuccess)
def delete(body: UserDeleteById, db: Session = Depends(get_db)):
    if not delete_user(db, body.id):
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return UserDeleteSuccess(message="Usuário deletado com sucesso.")