from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user_schema import UserCreate, UserResponse
from app.services.user_service import (
    EmailJaCadastradoError,
    create_user,
    get_users,
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