"""Schemas Pydantic para o módulo de rotas e geocoding."""

from pydantic import BaseModel, Field


class Coordenada(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class CalcularRotaRequest(BaseModel):
    waypoints: list[Coordenada] = Field(..., min_length=2, max_length=10)
    no_cache: bool = False
    include_steps: bool = False


class LegResponse(BaseModel):
    distance_km: float
    duration_min: float


class NavigationStepResponse(BaseModel):
    instruction: str
    maneuver_type: str
    maneuver_modifier: str | None = None
    distance_m: float
    duration_s: float
    lat: float
    lng: float
    street: str = ""


class CalcularRotaResponse(BaseModel):
    geometry: list[list[float]]
    distance_km: float
    duration_min: float
    legs: list[LegResponse]
    steps: list[NavigationStepResponse] = []
    error: str | None = None


class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lng: float
    type: str = ""
    address: dict = {}


class GeocodeResponse(BaseModel):
    results: list[GeocodeResult]
