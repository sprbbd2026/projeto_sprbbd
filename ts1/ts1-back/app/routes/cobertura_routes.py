from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.cobertura_schema import CoberturaRegiaoResponse, RegiaoInfo
from app.services.cobertura_service import (
    cobertura_constelacao,
    cobertura_por_regiao,
    cobertura_satelite,
    listar_regioes,
)

router = APIRouter(prefix="/cobertura", tags=["Cobertura"])


@router.get("/satelite/{sat_id}", summary="Cobertura de um satélite")
def get_cobertura_satelite(
    sat_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return cobertura_satelite(db, sat_id)


@router.get("/constelacao/{con_id}", summary="Cobertura de uma constelação")
def get_cobertura_constelacao(
    con_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return cobertura_constelacao(db, con_id)


@router.get("/regioes", response_model=list[RegiaoInfo])
def get_regioes(_=Depends(get_current_user)):
    """Lista as regiões do Brasil disponíveis para consulta de cobertura (US308)."""
    return listar_regioes()


@router.get("/regiao", response_model=CoberturaRegiaoResponse)
def get_cobertura_por_regiao(
    regiao: str | None = Query(
        None,
        description="ID da região (ex.: 'nordeste'). Alternativa a lat/lng.",
    ),
    lat: float | None = Query(None, description="Latitude da região monitorada."),
    lng: float | None = Query(None, description="Longitude da região monitorada."),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """US308 — identifica qual(is) satélite(s) atende(m) uma região monitorada.

    Informe ``regiao`` (nome) ou ``lat`` e ``lng``. Retorna o satélite
    associado à região (Cenário 3) e os dados de cobertura da consulta.
    """
    return cobertura_por_regiao(db, regiao=regiao, lat=lat, lng=lng)
