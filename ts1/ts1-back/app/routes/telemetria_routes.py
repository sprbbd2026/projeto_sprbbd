from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.telemetria_schema import TelemetryInputPayload, LocationPageResponse
from app.services.telemetria_service import ingest_satellite_telemetry, query_historico_localizacoes

router = APIRouter(prefix="/telemetria", tags=["Telemetria"])


@router.post("/ingest", status_code=201, summary="Ingerir telemetria de satélite")
def receive_telemetry(data: TelemetryInputPayload, db: Session = Depends(get_db)):
    return ingest_satellite_telemetry(db, data)


@router.get("/locations", response_model=LocationPageResponse, summary="Histórico de localizações")
def list_locations(
    sat_id: int = Query(..., description="ID do satelite"),
    dt_from: Optional[datetime] = Query(None, alias="from", description="Inicio do intervalo (ISO 8601)"),
    dt_to: Optional[datetime] = Query(None, alias="to", description="Fim do intervalo (ISO 8601)"),
    limit: int = Query(20, ge=1, le=100, description="Registros por pagina"),
    offset: int = Query(0, ge=0, description="Deslocamento para paginacao"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return query_historico_localizacoes(
        db,
        sat_id=sat_id,
        dt_from=dt_from,
        dt_to=dt_to,
        limit=limit,
        offset=offset,
    )
