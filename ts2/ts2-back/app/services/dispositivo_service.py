from sqlalchemy.orm import Session

from app.db.models import Dispositivo, Login


def listar_conectados(db: Session, user_id: int) -> list[Dispositivo]:
    """Retorna os dispositivos com login ativo do usuário atual (US304 - CA2).

    Considera "conectado" o dispositivo que possui ao menos um registro em LOGIN
    marcado como ativo para o usuário informado.
    """
    return (
        db.query(Dispositivo)
        .join(Login, Login.id_dispositivo == Dispositivo.id)
        .filter(Login.id_usuario == user_id)
        .filter(Login.ativo.is_(True))
        .distinct()
        .all()
    )
