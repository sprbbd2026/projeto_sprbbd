from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db.models import Usuario
from app.schemas.user_schema import UserCreate


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
        latitude=user.latitude,
        longitude=user.longitude
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