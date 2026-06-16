from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.services.cobertura_service import cobertura_satelite, cobertura_constelacao

router = APIRouter(prefix="/cobertura", tags=["Cobertura"])


@router.get("/satelite/{sat_id}")
def get_cobertura_satelite(
    sat_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return cobertura_satelite(db, sat_id)


@router.get("/constelacao/{con_id}")
def get_cobertura_constelacao(
    con_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return cobertura_constelacao(db, con_id)
