import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schema import LoginRequest, RefreshRequest, TokenResponse
from app.services.auth_service import login_user, refresh_with_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Autenticar usuário",
    description="Valida e-mail e senha e retorna um token JWT de acesso.",
    responses={401: {"description": "E-mail ou senha incorretos"}},
)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    if body.device_metadata:
        print(f"[device_metadata] login: {body.device_metadata}")
    
    client_ip = request.client.host if request.client else "127.0.0.1"
    result = login_user(db, body, client_ip)
    if result is None:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha incorretos.",
        )
    return result


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar token de acesso",
    description="Gera um novo token JWT a partir de um token de acesso ainda válido.",
    responses={401: {"description": "Token inválido, alterado ou usuário inexistente"}},
)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    result = refresh_with_token(db, body.access_token)
    if result is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido, alterado ou usuário inexistente.",
        )
    return result
