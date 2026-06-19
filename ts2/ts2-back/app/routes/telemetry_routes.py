from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.telemetry_schema import TelemetryCreate, TelemetryResponse
from app.services.telemetry_service import (
    create_telemetry,
    get_telemetries,
    get_history_by_satellite,
)

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/", response_model=TelemetryResponse)
def add_telemetry(telemetry: TelemetryCreate, db: Session = Depends(get_db)):
    return create_telemetry(db, telemetry)


@router.get("/", response_model=list[TelemetryResponse])
def list_telemetries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_telemetries(db, skip, limit)


@router.get("/history/{satelite_id}", response_model=list[TelemetryResponse])
def get_history(satelite_id: str, db: Session = Depends(get_db)):
    history = get_history_by_satellite(db, satelite_id)
    if not history:
        # Instead of 404, we return empty list if no history found as per US requirement
        return []
    return history
