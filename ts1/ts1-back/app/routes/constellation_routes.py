from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.constellation_schema import ConstellationCreateRequest, ConstellationDetailResponse, ConstellationResponse
from app.services.constellation_service import (
    create_constellation,
    delete_constellation as delete_constellation_service,
    get_all_constellations,
    get_constellation_by_id,
    update_constellation as update_constellation_service,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/constellations", tags=["Constellations"])


@router.post("/register", response_model=ConstellationDetailResponse, status_code=201, summary="Registrar constelação")
def register_constellation(data: ConstellationCreateRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return create_constellation(db, data)


@router.get("/", response_model=list[ConstellationResponse], summary="Listar constelações")
def list_constellations(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_all_constellations(db)


@router.get("/{con_id}", response_model=ConstellationDetailResponse, summary="Obter constelação por ID")
def get_constellation_route(con_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_constellation_by_id(db, con_id)


@router.put("/update/{con_id}", response_model=ConstellationDetailResponse, summary="Atualizar constelação")
def update_constellation_route(con_id: int, data: ConstellationCreateRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return update_constellation_service(db, con_id, data)


@router.delete("/delete/{con_id}", summary="Remover constelação")
def delete_constellation_route(con_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return delete_constellation_service(db, con_id)
