from sqlalchemy.orm import Session
from app.db.models import Local
from app.schemas.local_schema import LocalCreate

def get_locais(db: Session):
    return db.query(Local).all()

def create_local(db: Session, local: LocalCreate):
    db_local = Local(
        nome=local.nome,
        lat=local.lat,
        lng=local.lng,
        categoria=local.categoria,
        rating=local.rating
    )
    db.add(db_local)
    db.commit()
    db.refresh(db_local)
    return db_local
