import hashlib
import base64
import bcrypt
import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Operador
from app.schemas.auth_schema import LoginRequest, LoginResponse

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def _prepare_password(password: str) -> bytes:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def _create_token(opr_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(opr_id), "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def login_user(db: Session, data: LoginRequest) -> LoginResponse:
    operador = db.query(Operador).filter(Operador.opr_email == data.email).first()

    if not operador or not bcrypt.checkpw(_prepare_password(data.password), operador.opr_senha_hash.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )

    if operador.opr_status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operador inativo. Entre em contato com o administrador.",
        )

    token = _create_token(operador.opr_id, operador.opr_email)

    return LoginResponse(
        token=token,
        user={"email": operador.opr_email, "nome": operador.opr_nome},
    )
