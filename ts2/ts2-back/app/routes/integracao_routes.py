import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.core.deps import get_current_user
from app.db.models import Usuario
from app.services.integracao_ts1_service import listar_satelites_cadastrados

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integracao", tags=["Integração TS1"])


@router.get(
    "/satelites",
    summary="Listar satélites cadastrados no TS1",
)
def listar_satelites_ts1(_user: Usuario = Depends(get_current_user)):
    try:
        return listar_satelites_cadastrados()
    except SQLAlchemyError as exc:
        logger.warning("Banco TS1 indisponível: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "Não foi possível ler satélites do TS1. "
                "Verifique se o PostgreSQL do TS1 está na porta 5432."
            ),
        ) from exc
