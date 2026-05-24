from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.satellite_schema import SatelliteCreateRequest, SatelliteResponse
from app.services.satellite_service import create_satellite

router = APIRouter(prefix="/satellite")


@router.post(
    "/register_satellite",
    response_model=SatelliteResponse,
    status_code=201
)
def register_satellite(
    data: SatelliteCreateRequest,
    db: Session = Depends(get_db)
):
    return create_satellite(db, data)