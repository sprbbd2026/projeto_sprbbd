import uuid as uuid_lib

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import Usuario
from app.schemas.user_schema import UserCreate, UserUpdate


class CadastroConflitoError(Exception):
    """Violação de unicidade (e-mail ou documento)."""

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def _detail_integrity_error(exc: IntegrityError) -> str:
    """PostgreSQL indica qual coluna/índice no texto do erro."""
    raw = str(exc.orig if exc.orig is not None else exc).lower()
    if "email" in raw or "usuarios_email" in raw or "ix_usuarios_email" in raw:
        return "Já existe um usuário cadastrado com este e-mail."
    if "documento" in raw or "usuarios_documento" in raw or "ix_usuarios_documento" in raw:
        return "Já existe um usuário cadastrado com este documento."
    return (
        "Não foi possível concluir o cadastro: valor duplicado "
        "(verifique e-mail e documento)."
    )


def create_user(db: Session, user: UserCreate):
    db_user = Usuario(
        uuid=str(uuid_lib.uuid4()),
        nome=user.nome,
        sobrenome=user.sobrenome,
        email=user.email.lower().strip(),
        senha=hash_password(user.senha),
        data_nascimento=user.data_nascimento,
        documento=user.documento.strip(),
    )
    db.add(db_user)
    try:
        db.commit()
        db.flush() 

        db_dispositivo = Dispositivo(
            metadados=user.metadados,
            uuid=str(uuid_lib.uuid4()),
            usuario_id=db_user.id 
        )
        db.add(db_dispositivo)
        
        db.commit()

    except IntegrityError as e:
        db.rollback()
        raise CadastroConflitoError(_detail_integrity_error(e)) from None
    db.refresh(db_user)
    return db_user

def get_users(db: Session):
    return db.query(Usuario).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def update_user(db: Session, user_id: int, data: UserUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    payload = data.model_dump(exclude_unset=True, exclude_none=True)
    if not payload:
        return db_user
    if "senha" in payload:
        payload["senha"] = hash_password(payload["senha"])
    if "email" in payload:
        payload["email"] = payload["email"].lower().strip()
    if "documento" in payload:
        payload["documento"] = payload["documento"].strip()
    for field, value in payload.items():
        setattr(db_user, field, value)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise CadastroConflitoError(_detail_integrity_error(e)) from None
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True