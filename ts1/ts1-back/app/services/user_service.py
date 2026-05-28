import hashlib
import base64
import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Operador
from app.schemas.user_schema import UserCreateRequest

FUNCOES_VALIDAS = ["analista", "supervisor", "admin"]


def _hash_password(password: str) -> str:
    # SHA-256 + base64 para contornar o limite de 72 bytes do bcrypt
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    prepared = base64.b64encode(digest)
    return bcrypt.hashpw(prepared, bcrypt.gensalt()).decode("utf-8")


def create_user(db: Session, data: UserCreateRequest) -> Operador:
    if data.funcao not in FUNCOES_VALIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Função '{data.funcao}' inválida. Opções: {', '.join(FUNCOES_VALIDAS)}",
        )

    if db.query(Operador).filter(Operador.opr_email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        )

    operador = Operador(
        opr_nome=data.name,
        opr_email=data.email,
        opr_senha_hash=_hash_password(data.password),
        opr_funcao=data.funcao,
        opr_status="ativo",
    )

    db.add(operador)
    db.commit()
    db.refresh(operador)
    return operador
