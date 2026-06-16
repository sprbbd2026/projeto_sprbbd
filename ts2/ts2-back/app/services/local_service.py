from sqlalchemy.orm import Session
from app.db.models import Local
from app.schemas.local_schema import LocalCreate

def get_locais(db: Session):
    """Retrieve all locations ordered chronologically by timestamp."""
    return db.query(Local).order_by(Local.timestamp.asc()).all()

def create_local(db: Session, local: LocalCreate):
    """Create a new location with validated timestamp."""
    db_local = Local(
        nome=local.nome,
        lat=local.lat,
        lng=local.lng,
        categoria=local.categoria,
        rating=local.rating,
        timestamp=local.timestamp
    )
    db.add(db_local)
    db.commit()
    db.refresh(db_local)
    return db_local
