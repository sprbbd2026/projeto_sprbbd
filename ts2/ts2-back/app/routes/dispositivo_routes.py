from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Dispositivo, Usuario
from app.schemas.dispositivo_schema import DispositivoConectado
from app.services.dispositivo_service import listar_conectados

router = APIRouter(prefix="/dispositivos", tags=["Dispositivos"])


def _to_response(dispositivo: Dispositivo) -> DispositivoConectado:
    """Converte o modelo para o schema, trazendo lat/lng do ponto associado."""
    ponto = dispositivo.ponto
    return DispositivoConectado(
        uuid=dispositivo.uuid,
        lat=ponto.latitude if ponto else None,
        lng=ponto.longitude if ponto else None,
        metadados=dispositivo.metadados,
    )


@router.get("/conectados", response_model=list[DispositivoConectado])
def conectados(
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista os dispositivos com login ativo do usuário autenticado."""
    return [_to_response(d) for d in listar_conectados(db, user.id)]
