from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import EventoComunicacao


def registrar_evento_db(
    db: Session,
    tipo_evento: str,
    satelite_id: str,
    payload: dict,
    status: str,
    operador_id: int | None = None,
):
    """Registra evento na caixa preta de comunicação (auditoria)."""
    novo_evento = EventoComunicacao(
        evt_tipo=tipo_evento,
        evt_satelite_id=satelite_id,
        evt_payload=payload,
        evt_status=status,
        opr_id=operador_id,
    )

    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)

    return novo_evento


def registrar_evento_background(
    tipo_evento: str,
    satelite_id: str,
    payload: dict,
    status: str,
    operador_id: int | None = None,
):
    """Wrapper para BackgroundTasks: abre sessão própria fora do ciclo da request."""
    db = SessionLocal()
    try:
        return registrar_evento_db(
            db=db,
            tipo_evento=tipo_evento,
            satelite_id=satelite_id,
            payload=payload,
            status=status,
            operador_id=operador_id,
        )
    finally:
        db.close()
