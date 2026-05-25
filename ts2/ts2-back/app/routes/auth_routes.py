import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schema import LoginRequest, RefreshRequest, TokenResponse
from app.services.auth_service import login_user, refresh_with_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    if body.device_metadata:
        print(f"[device_metadata] login: {body.device_metadata}")
    result = login_user(db, body)
    if result is None:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha incorretos.",
        )
    return result


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    result = refresh_with_token(db, body.access_token)
    if result is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido, alterado ou usuário inexistente.",
        )
    return result
