from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.localizacao_schema import RotaResponse
from app.schemas.telemetry_schema import TelemetryCreate, TelemetryResponse
from app.services import localizacao_service
from app.services.telemetry_service import create_telemetry, get_telemetries

router = APIRouter(tags=["Telemetria"])


@router.post(
    "/telemetry",
    response_model=TelemetryResponse,
    summary="Registrar telemetria",
    description="Registra um novo dado de telemetria.",
)
def create(telemetry: TelemetryCreate, db: Session = Depends(get_db)):
    return create_telemetry(db, telemetry)


@router.get(
    "/telemetry",
    response_model=list[TelemetryResponse],
    summary="Listar telemetrias",
    description="Retorna todos os registros de telemetria.",
)
def list_telemetry(db: Session = Depends(get_db)):
    return get_telemetries(db)


@router.get(
    "/telemetry/{satelite_id}/route",
    response_model=RotaResponse,
    tags=["Telemetria"],
    summary="Consultar rota do satélite",
)
def obter_rota_satelite(
    satelite_id: str,
    start_time: datetime = Query(..., description="Início do período (ISO 8601)"),
    end_time: datetime = Query(..., description="Fim do período (ISO 8601)"),
    db: Session = Depends(get_db),
):
    """Delega para historico_localizacao. Filtro por dispositivo fora de escopo."""
    pontos, gerado = localizacao_service.get_rota(
        db, satelite_id, data_inicio=start_time, data_fim=end_time
    )
    rota = [
        {"latitude": p.latitude, "longitude": p.longitude, "data_hora": p.data_hora}
        for p in pontos
    ]
    return {
        "satelite_id": satelite_id,
        "rota": rota,
        "gerado_automaticamente": gerado,
    }
