from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Satelite, Constelacao
from app.schemas.satellite_schema import SatelliteCreateRequest
from app.services.efemeride_service import ensure_efemeride_for_satellite

def get_all_satellites(db: Session, unassigned: bool = False):
    query = db.query(Satelite)
    if unassigned:
        query = query.filter(Satelite.con_id.is_(None))
    
    # Fazer JOIN manual para trazer nome da constelação
    results = []
    for sat in query.all():
        sat_data = {
            'sat_id': sat.sat_id,
            'con_id': sat.con_id,
            'sat_relogio_offset': sat.sat_relogio_offset,
            'sat_codigo_prn': sat.sat_codigo_prn,
            'sat_numero_svn': sat.sat_numero_svn,
            'sat_status': sat.sat_status,
            'con_nome': None
        }
        
        # Se tem con_id, busca o nome
        if sat.con_id:
            constelacao = db.query(Constelacao).filter(Constelacao.con_id == sat.con_id).first()
            if constelacao:
                sat_data['con_nome'] = constelacao.con_nome
        
        results.append(sat_data)
    
    return results

def create_satellite(db: Session, data: SatelliteCreateRequest) -> Satelite:
    satellite = Satelite(
        con_id=data.con_id,
        sat_relogio_offset=data.sat_relogio_offset,
        sat_codigo_prn=data.sat_codigo_prn,
        sat_numero_svn=data.sat_numero_svn,
        sat_status=data.sat_status,
    )
    db.add(satellite)
    db.flush()
    ensure_efemeride_for_satellite(db, satellite)
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

    satellite.con_id = data.con_id
    satellite.sat_relogio_offset = data.sat_relogio_offset
    satellite.sat_codigo_prn = data.sat_codigo_prn
    satellite.sat_numero_svn = data.sat_numero_svn
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
