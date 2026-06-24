from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.cobertura_schema import (
    CoberturaGeoJsonFeatureCollection,
    CoberturaRegiaoResponse,
    RegiaoInfo,
)
from app.services.cobertura_service import (
    cobertura_constelacao,
    cobertura_por_regiao,
    cobertura_satelite,
    listar_regioes,
)

router = APIRouter(prefix="/cobertura", tags=["Cobertura"])


@router.get(
    "/satelite/{sat_id}",
    response_model=CoberturaGeoJsonFeatureCollection,
    summary="Cobertura orbital de um satélite",
    description=(
        "Retorna a geometria de cobertura (footprint) de um satélite em GeoJSON (US307).\n\n"
        "A posição é propagada a partir da efeméride mais recente e o polígono "
        "representa a área visível no solo com elevação mínima de 5°, recortada "
        "ao bounding box do Brasil.\n\n"
        "Requer autenticação JWT (`Authorization: Bearer <token>`)."
    ),
    responses={
        401: {"description": "Token ausente, inválido ou expirado."},
        404: {
            "description": "Efeméride não encontrada para o satélite informado."
        },
    },
)
def get_cobertura_satelite(
    sat_id: int = Path(..., ge=1, description="ID do satélite."),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """US307 — geometria de cobertura por satélite para camada de mapa."""
    return cobertura_satelite(db, sat_id)


@router.get(
    "/constelacao/{con_id}",
    summary="Cobertura agregada de uma constelação",
    description=(
        "Retorna footprints individuais dos satélites operacionais e a união "
        "da cobertura total da constelação (GeoJSON FeatureCollection)."
    ),
    responses={
        401: {"description": "Token ausente, inválido ou expirado."},
        404: {
            "description": (
                "Constelação sem satélites operacionais ou sem efemérides disponíveis."
            )
        },
    },
)
def get_cobertura_constelacao(
    con_id: int = Path(..., ge=1, description="ID da constelação."),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return cobertura_constelacao(db, con_id)


@router.get(
    "/regioes",
    response_model=list[RegiaoInfo],
    summary="Listar regiões monitoradas",
    description="Lista as regiões do Brasil disponíveis para consulta de cobertura (US308).",
    responses={
        401: {"description": "Token ausente, inválido ou expirado."},
    },
)
def get_regioes(_=Depends(get_current_user)):
    return listar_regioes()


@router.get(
    "/regiao",
    response_model=CoberturaRegiaoResponse,
    summary="Consultar cobertura por região ou coordenada",
    description=(
        "US308 — identifica qual(is) satélite(s) atende(m) uma região monitorada.\n\n"
        "Informe `regiao` (nome) **ou** `lat` e `lng`. Retorna o satélite "
        "associado à região e os dados de cobertura da consulta."
    ),
    responses={
        400: {"description": "Parâmetros ausentes ou coordenadas inválidas."},
        401: {"description": "Token ausente, inválido ou expirado."},
        404: {"description": "Região informada não encontrada."},
    },
)
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
    return cobertura_por_regiao(db, regiao=regiao, lat=lat, lng=lng)
