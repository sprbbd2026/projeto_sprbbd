from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Constelacao
from app.schemas.constelacao_schema import ConstelacaoResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/constelacoes", tags=["Constelacoes"])

@router.get("/", response_model=list[ConstelacaoResponse])
def list_constelacoes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Constelacao).all()
