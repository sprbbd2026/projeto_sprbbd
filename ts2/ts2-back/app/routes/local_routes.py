from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.local_schema import LocalCreate, LocalResponse
from app.services.local_service import get_locais, create_local

router = APIRouter(tags=["Locais"])

@router.get("/locais", response_model=list[LocalResponse])
def list_locais(db: Session = Depends(get_db)):
    locais = get_locais(db)
    # Map model instances to match Pydantic schema with id alias
    return [
        LocalResponse(
            id=l.id,
            nome=l.nome,
            lat=l.lat,
            lng=l.lng,
            categoria=l.categoria,
            rating=l.rating
        ) for l in locais
    ]

@router.post("/locais", response_model=LocalResponse)
def add_local(local: LocalCreate, db: Session = Depends(get_db)):
    db_local = create_local(db, local)
    return LocalResponse(
        id=db_local.id,
        nome=db_local.nome,
        lat=db_local.lat,
        lng=db_local.lng,
        categoria=db_local.categoria,
        rating=db_local.rating
    )
