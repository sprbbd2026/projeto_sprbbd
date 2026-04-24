from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db.models import Usuario
from app.db.models import Dispositivo
from app.schemas.user_schema import UserCreate


class EmailJaCadastradoError(Exception):
    """Violação de unicidade do e-mail ao inserir usuário."""

class DispositivoJaCadastradoError(Exception):
    """Violação de unicidade do dispositivo ao inserir usuário."""


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

        db.flush() 

        db_dispositivo = Dispositivo(
            metadados=user.metadados,
            uuid="UUID",
            usuario_id=db_user.id 
        )
        db.add(db_dispositivo)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise EmailJaCadastradoError from None
        raise DispositivoJaCadastradoError from None
    except Exception as e:
        db.rollback()
        raise e

def get_users(db: Session):
    return db.query(Usuario).all()