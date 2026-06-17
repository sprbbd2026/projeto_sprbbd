from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Dispositivo
from app.schemas.dispositivo_schema import DispositivoConectado
from app.services.dispositivo_service import listar_conectados, registrar_heartbeat

router = APIRouter(prefix="/dispositivos", tags=["Dispositivos"])


def _to_response(dispositivo: Dispositivo) -> DispositivoConectado:
    """Converte o modelo para o schema, trazendo lat/lng do ponto associado."""
    ponto = dispositivo.ponto
    return DispositivoConectado(
        uuid=dispositivo.uuid,
        ultimo_sinal=dispositivo.ultimo_sinal,
        lat=ponto.latitude if ponto else None,
        lng=ponto.longitude if ponto else None,
        metadados=dispositivo.metadados,
    )


@router.post("/heartbeat", response_model=DispositivoConectado)
def heartbeat(
    x_device_uid: str = Header(..., alias="X-Device-UID"),
    db: Session = Depends(get_db),
):
    """Registra que o dispositivo está ativo (envia um 'sinal de vida')."""
    dispositivo = registrar_heartbeat(db, x_device_uid)
    return _to_response(dispositivo)


@router.get("/conectados", response_model=list[DispositivoConectado])
def conectados(db: Session = Depends(get_db)):
    """Lista os dispositivos atualmente online (último sinal recente)."""
    return [_to_response(d) for d in listar_conectados(db)]
