from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.satellite_schema import (
    SatelliteCreateRequest,
    SatelliteResponse
)
from app.services.satellite_service import (
    create_satellite,
    get_all_satellites
)

router = APIRouter(
    prefix="/satellites",
    tags=["Satellites"]
)


@router.post(
    "/register",
    response_model=SatelliteResponse,
    status_code=201
)
def register_satellite(
    data: SatelliteCreateRequest,
    db: Session = Depends(get_db)
):
    return create_satellite(db, data)


@router.get(
    "/",
    response_model=list[SatelliteResponse]
)
def list_satellites(
    db: Session = Depends(get_db)
):
    return get_all_satellites(db)


@router.put("/update/{sat_id}")
def update_satellite(
    sat_id: int,
    data: SatelliteCreateRequest,
    db: Session = Depends(get_db)
):
    return update_satellite(db, sat_id, data)

@router.delete("/delete/{sat_id}")
def delete_satellite(
    sat_id: int,
    db: Session = Depends(get_db)
):
    return delete_satellite(db, sat_id)