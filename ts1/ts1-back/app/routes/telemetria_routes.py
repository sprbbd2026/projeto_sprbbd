from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.telemetria_schema import TelemetryInputPayload
from app.services.telemetria_service import ingest_satellite_telemetry

router = APIRouter(prefix="/telemetria", tags=["Telemetria"])


@router.post("/ingest", status_code=201)
def receive_telemetry(data: TelemetryInputPayload, db: Session = Depends(get_db)):
    return ingest_satellite_telemetry(db, data)
