from sqlalchemy.orm import Session
from app.db.models import Local, Ponto
from app.schemas.local_schema import LocalCreate
from datetime import datetime, timezone

def get_locais(db: Session):
    """Retrieve all locations ordered chronologically by timestamp."""
    return db.query(Local).order_by(Local.timestamp.asc()).all()

def create_local(db: Session, local: LocalCreate):
    """Create a new location with auto-creation of point if needed."""
    
    # Se não foi fornecido id_ponto, cria ou encontra um ponto existente
    if local.id_ponto is None:
        # Procura um ponto com as mesmas coordenadas
        existing_point = db.query(Ponto).filter(
            Ponto.latitude == local.lat,
            Ponto.longitude == local.lng
        ).first()
        
        if existing_point:
            id_ponto = existing_point.id
        else:
            # Cria um novo ponto com as coordenadas do local
            new_point = Ponto(
                latitude=local.lat,
                longitude=local.lng,
                altitude=None
            )
            db.add(new_point)
            db.flush()  # Flush para obter o ID do novo ponto
            id_ponto = new_point.id
    else:
        id_ponto = local.id_ponto
    
    # Sempre usa o timestamp atual em UTC (gerado pelo backend)
    timestamp = datetime.now(timezone.utc)
    
    db_local = Local(
        id_ponto=id_ponto,
        nome=local.nome,
        lat=local.lat,
        lng=local.lng,
        categoria=local.categoria,
        rating=local.rating,
        timestamp=timestamp
    )
    db.add(db_local)
    db.commit()
    db.refresh(db_local)
    return db_local
