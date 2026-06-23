"""Schemas Pydantic para o módulo de rotas e geocoding."""

from pydantic import BaseModel, Field


class Coordenada(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class CalcularRotaRequest(BaseModel):
    waypoints: list[Coordenada] = Field(..., min_length=2, max_length=10)
    no_cache: bool = False


class LegResponse(BaseModel):
    distance_km: float
    duration_min: float


class CalcularRotaResponse(BaseModel):
    geometry: list[list[float]]
    distance_km: float
    duration_min: float
    legs: list[LegResponse]
    error: str | None = None


class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lng: float
    type: str = ""
    address: dict = {}


class GeocodeResponse(BaseModel):
    results: list[GeocodeResult]
