from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Constelacao
from app.schemas.constelacao_schema import ConstelacaoResponse

router = APIRouter(prefix="/constelacoes", tags=["Constelacoes"])

@router.get("/", response_model=list[ConstelacaoResponse])
def list_constelacoes(db: Session = Depends(get_db)):
    return db.query(Constelacao).all()
