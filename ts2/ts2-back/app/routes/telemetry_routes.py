from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.telemetry_schema import TelemetryCreate, TelemetryResponse
from app.services.telemetry_service import create_telemetry, get_telemetries

router = APIRouter(tags=["Telemetry"])

@router.post("/telemetry", response_model=TelemetryResponse)
def add_telemetry(telemetry: TelemetryCreate, db: Session = Depends(get_db)):
    return create_telemetry(db, telemetry)

@router.get("/telemetry", response_model=list[TelemetryResponse])
def list_telemetry(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_telemetries(db, skip=skip, limit=limit)
