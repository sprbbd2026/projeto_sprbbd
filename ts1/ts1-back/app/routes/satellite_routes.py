from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.satellite_schema import (
    SatelliteCreateRequest,
    SatelliteResponse
)
from app.services.satellite_service import (
    create_satellite,
    delete_satellite as delete_satellite_service,
    get_all_satellites,
    update_satellite as update_satellite_service,
     get_satellite_by_id
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
def register_satellite(data: SatelliteCreateRequest, db: Session = Depends(get_db)):
    return create_satellite(db, data)


@router.get(
    "/",
    response_model=list[SatelliteResponse]
)
def list_satellites(db: Session = Depends(get_db)):
    return get_all_satellites(db)

@router.get("/{sat_id}", response_model=SatelliteResponse)
def get_satellite_route(sat_id: int, db: Session = Depends(get_db)):
    return get_satellite_by_id(db, sat_id)

@router.put("/update/{sat_id}")
def update_satellite_route(
    sat_id: int,
    data: SatelliteCreateRequest,
    db: Session = Depends(get_db)
):
    return update_satellite_service(db, sat_id, data)




@router.delete("/delete/{sat_id}")
def delete_satellite_route(
    sat_id: int,
    db: Session = Depends(get_db)
):
    return delete_satellite_service(db, sat_id)