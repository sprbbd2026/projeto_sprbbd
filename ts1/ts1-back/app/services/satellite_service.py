from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Satelite
from app.schemas.satellite_schema import SatelliteCreateRequest

def get_all_satellites(db: Session):
    return db.query(Satelite).all()

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

