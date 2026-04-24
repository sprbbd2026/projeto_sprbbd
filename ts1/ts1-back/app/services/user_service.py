import hashlib
import base64
import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Usuario, Perfil
from app.schemas.user_schema import UserCreateRequest


def _hash_password(password: str) -> str:
    # SHA-256 + base64 para contornar o limite de 72 bytes do bcrypt
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    prepared = base64.b64encode(digest)
    return bcrypt.hashpw(prepared, bcrypt.gensalt()).decode("utf-8")


def create_user(db: Session, data: UserCreateRequest) -> Usuario:
    perfil = db.query(Perfil).filter(Perfil.prf_nome == data.accessLevel).first()
    if not perfil:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Perfil '{data.accessLevel}' não encontrado.",
        )

    if db.query(Usuario).filter(Usuario.usr_email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        )

    if db.query(Usuario).filter(Usuario.usr_login == data.document).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Documento já cadastrado.",
        )

    usuario = Usuario(
        prf_id=perfil.prf_id,
        usr_nome=data.name,
        usr_email=data.email,
        usr_login=data.document,
        usr_senha_hash=_hash_password(data.password),
        usr_status="ativo",
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario
