from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.config import DEVICE_ONLINE_THRESHOLD_SECONDS
from app.db.models import Dispositivo


def registrar_heartbeat(db: Session, device_uuid: str) -> Dispositivo:
    """Marca o dispositivo como ativo agora.

    Cria o registro caso o dispositivo ainda não exista, de modo que o simples
    uso do sistema já o faça aparecer como conectado (CA2 da US304).
    """
    dispositivo = db.query(Dispositivo).filter(Dispositivo.uuid == device_uuid).first()
    if dispositivo is None:
        dispositivo = Dispositivo(uuid=device_uuid)
        db.add(dispositivo)

    dispositivo.ultimo_sinal = func.now()
    db.commit()
    db.refresh(dispositivo)
    return dispositivo


def listar_conectados(db: Session) -> list[Dispositivo]:
    """Retorna os dispositivos cujo último sinal está dentro da janela online."""
    limite = datetime.now(timezone.utc) - timedelta(seconds=DEVICE_ONLINE_THRESHOLD_SECONDS)
    return (
        db.query(Dispositivo)
        .filter(Dispositivo.ultimo_sinal.isnot(None))
        .filter(Dispositivo.ultimo_sinal >= limite)
        .order_by(Dispositivo.ultimo_sinal.desc())
        .all()
    )
