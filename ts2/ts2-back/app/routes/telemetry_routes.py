from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.telemetry_schema import TelemetryCreate, TelemetryResponse
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
