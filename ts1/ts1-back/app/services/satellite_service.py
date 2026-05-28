from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Satelite
from app.schemas.satellite_schema import SatelliteCreateRequest

def get_all_satellites(db: Session, unassigned: bool = False):
    query = db.query(Satelite)
    if unassigned:
        query = query.filter(Satelite.cnt_id.is_(None))
    return query.all()

def create_satellite(db: Session, data: SatelliteCreateRequest) -> Satelite:

    satellite = Satelite(
        sat_nome=data.sat_nome,
        sat_modelo_hardware=data.sat_modelo_hardware,
        sat_versao_firmware=data.sat_versao_firmware,
        sat_tipo_orbita=data.sat_tipo_orbita,
        sat_status=data.sat_status,
    )

    db.add(satellite)
    db.commit()
    db.refresh(satellite)
    return satellite


def update_satellite(db: Session, sat_id: int, data: SatelliteCreateRequest):
    satellite = db.query(Satelite).filter(Satelite.sat_id == sat_id).first()

    if not satellite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Satélite não encontrado"
        )

    satellite.sat_nome = data.sat_nome
    satellite.sat_modelo_hardware = data.sat_modelo_hardware
    satellite.sat_versao_firmware = data.sat_versao_firmware
    satellite.sat_tipo_orbita = data.sat_tipo_orbita
    satellite.sat_status = data.sat_status

    db.commit()
    db.refresh(satellite)

    return satellite

def get_satellite_by_id(db: Session, sat_id: int):
    satellite = db.query(Satelite).filter(Satelite.sat_id == sat_id).first()

    if not satellite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Satélite não encontrado"
        )

    return satellite

def delete_satellite(db: Session, sat_id: int):
    satellite = db.query(Satelite).filter(Satelite.sat_id == sat_id).first()

    if not satellite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Satélite não encontrado"
        )

    db.delete(satellite)
    db.commit()

    return {"message": "Satélite deletado com sucesso"}