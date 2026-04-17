from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db.models import Usuario
from app.schemas.user_schema import UserCreate, UserUpdate


class EmailJaCadastradoError(Exception):
    """Violação de unicidade do e-mail ao inserir usuário."""


def create_user(db: Session, user: UserCreate):
    db_user = Usuario(
        nome=user.nome,
        sobrenome=user.sobrenome,
        email=user.email,
        senha=user.senha,
        data_nascimento=user.data_nascimento,
        documento=user.documento,
    )
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise EmailJaCadastradoError from None
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
    for field, value in payload.items():
        setattr(db_user, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise EmailJaCadastradoError from None
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True