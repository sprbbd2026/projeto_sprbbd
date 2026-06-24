import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.localizacao_schema import LocalizacaoCreate, LocalizacaoResponse, RotaResponse
from app.services import localizacao_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/historico", tags=["Histórico de Localização"])


@router.post(
    "/localizacao",
    response_model=LocalizacaoResponse,
    status_code=201,
    summary="Registrar ponto de localização",
)
def registrar_localizacao(localizacao: LocalizacaoCreate, db: Session = Depends(get_db)):
    """Registra um novo ponto de localização para um satélite."""
    return localizacao_service.create_localizacao(db, localizacao)


@router.get(
    "/localizacao",
    response_model=list[LocalizacaoResponse],
    summary="Consultar histórico de localização (US302)",
)
def consultar_historico(
    satelite_id: str = Query(..., description="ID do satélite"),
    data_inicio: Optional[datetime] = Query(None, description="Data/hora inicial (ISO 8601)"),
    data_fim: Optional[datetime] = Query(None, description="Data/hora final (ISO 8601)"),
    limit: int = Query(1000, ge=1, le=1000, description="Número máximo de pontos"),
    db: Session = Depends(get_db),
):
    """
    Consulta o histórico de localização de um satélite.
    Corresponde à US302 — Consultar Histórico de Localização.
    """
    pontos = localizacao_service.get_historico_localizacao(
        db, satelite_id, data_inicio, data_fim, limit
    )
    return pontos


@router.get(
    "/rota",
    response_model=RotaResponse,
    tags=["Histórico de Localização"],
    summary="Consultar rota do satélite",
)
def consultar_rota(
    satelite_id: str = Query(..., description="ID do satélite"),
    data_inicio: Optional[datetime] = Query(None, description="Data/hora inicial (ISO 8601)"),
    data_fim: Optional[datetime] = Query(None, description="Data/hora final (ISO 8601)"),
    limit: int = Query(1000, ge=1, le=1000, description="Número máximo de pontos de rota"),
    db: Session = Depends(get_db),
):
    """
    Retorna a rota de um satélite (pontos ordenados por data_hora).
    Corresponde à US300 — Visualizar Rota.
    """
    pontos, gerado = localizacao_service.get_rota(db, satelite_id, data_inicio, data_fim, limit)
    rota = [
        {"latitude": p.latitude, "longitude": p.longitude, "data_hora": p.data_hora}
        for p in pontos
    ]
    return {"satelite_id": satelite_id, "rota": rota, "gerado_automaticamente": gerado}


@router.get(
    "/satelites",
    response_model=list[str],
    summary="Listar satélites com histórico",
)
def listar_satelites(db: Session = Depends(get_db)):
    """Lista os IDs únicos de satélites com histórico de localização registrado."""
    return localizacao_service.list_satelites(db)
