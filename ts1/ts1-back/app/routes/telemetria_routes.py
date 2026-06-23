from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Telemetria, Satelite
from app.dependencies import get_current_user
from app.schemas.telemetria_schema import TelemetryInputPayload, LocationPageResponse
from app.services.telemetria_service import ingest_satellite_telemetry, query_historico_localizacoes

router = APIRouter(prefix="/telemetria", tags=["Telemetria"])


# --- Schema para o dashboard de telemetria ---
class TelemetryDashboardItem(BaseModel):
    id: int
    satelite_id: str
    cpu_percentual: float
    temperatura_celsius: float
    status: str
    data_hora: str

    class Config:
        from_attributes = True


@router.post("/ingest", status_code=201, summary="Ingerir telemetria de satélite")
def receive_telemetry(data: TelemetryInputPayload, db: Session = Depends(get_db)):
    return ingest_satellite_telemetry(db, data)


@router.get(
    "/dashboard",
    response_model=List[TelemetryDashboardItem],
    summary="Últimas 10 telemetrias de um satélite para o dashboard",
)
def telemetry_dashboard(
    sat_id: int = Query(..., description="ID do satélite (obrigatório)"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna as 10 telemetrias mais recentes do satélite com status via JOIN."""
    rows = (
        db.query(
            Telemetria.id_telemetria,
            Telemetria.id_satelite,
            Telemetria.cpu,
            Telemetria.temperatura,
            Telemetria.timestamp_registro,
            Satelite.sat_status,
        )
        .join(Satelite, Satelite.sat_id == Telemetria.id_satelite, isouter=True)
        .filter(Telemetria.id_satelite == sat_id)
        .order_by(Telemetria.timestamp_registro.desc())
        .limit(10)
        .all()
    )

    return [
        TelemetryDashboardItem(
            id=row.id_telemetria,
            satelite_id=str(row.id_satelite),
            cpu_percentual=row.cpu or 0.0,
            temperatura_celsius=row.temperatura or 0.0,
            status=row.sat_status or "desconhecido",
            data_hora=row.timestamp_registro.isoformat() if row.timestamp_registro else "",
        )
        for row in rows
    ]


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
