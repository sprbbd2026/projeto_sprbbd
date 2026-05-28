from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.constellation_schema import (
    ConstellationCreateRequest,
    ConstellationDetailResponse,
    ConstellationResponse,
)
from app.services.constellation_service import (
    create_constellation,
    delete_constellation as delete_constellation_service,
    get_all_constellations,
    get_constellation_by_id,
    update_constellation as update_constellation_service,
)

router = APIRouter(
    prefix="/constellations",
    tags=["Constellations"]
)


@router.post(
    "/register",
    response_model=ConstellationDetailResponse,
    status_code=201
)
def register_constellation(
    data: ConstellationCreateRequest, db: Session = Depends(get_db)
):
    return create_constellation(db, data)


@router.get(
    "/",
    response_model=list[ConstellationResponse]
)
def list_constellations(db: Session = Depends(get_db)):
    return get_all_constellations(db)


@router.get("/{cnt_id}", response_model=ConstellationDetailResponse)
def get_constellation_route(cnt_id: int, db: Session = Depends(get_db)):
    return get_constellation_by_id(db, cnt_id)


@router.put("/update/{cnt_id}", response_model=ConstellationDetailResponse)
def update_constellation_route(
    cnt_id: int,
    data: ConstellationCreateRequest,
    db: Session = Depends(get_db)
):
    return update_constellation_service(db, cnt_id, data)


@router.delete("/delete/{cnt_id}")
def delete_constellation_route(cnt_id: int, db: Session = Depends(get_db)):
    return delete_constellation_service(db, cnt_id)
