"""Rotas para cálculo de rotas terrestres e geocoding."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.routing_schema import (
    CalcularRotaRequest,
    CalcularRotaResponse,
    GeocodeResponse,
)
from app.services.routing_service import calcular_rota, geocode_search

router = APIRouter(prefix="/rotas", tags=["Rotas"])


@router.post("/calcular", response_model=CalcularRotaResponse)
async def calculate_route(
    body: CalcularRotaRequest,
    db: Session = Depends(get_db),
):
    """Calcula rota de carro entre waypoints via OSRM."""
    waypoints = [(wp.lat, wp.lng) for wp in body.waypoints]
    result = await calcular_rota(waypoints, db, no_cache=body.no_cache)
    return result


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode(
    q: str = Query(..., min_length=2, max_length=200, description="Texto de busca"),
    lat: float | None = Query(None, description="Latitude de referência (padrão SJC)"),
    lng: float | None = Query(None, description="Longitude de referência (padrão SJC)"),
    max_distance_km: float = Query(500.0, description="Distância máxima em km"),
    no_cache: bool = Query(False, description="Bypass cache para benchmark"),
    db: Session = Depends(get_db),
):
    """Busca endereços/POIs por texto via Nominatim com filtro de distância."""
    results = await geocode_search(
        q, db, no_cache=no_cache, lat=lat, lng=lng, max_distance_km=max_distance_km
    )
    return {"results": results}
