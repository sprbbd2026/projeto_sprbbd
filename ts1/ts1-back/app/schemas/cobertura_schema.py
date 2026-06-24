from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class RegiaoInfo(BaseModel):
    id: str
    nome: str
    lat: float
    lng: float


class PosicaoSatelite(BaseModel):
    lat: float = Field(..., description="Latitude em graus decimais (WGS84).")
    lng: float = Field(..., description="Longitude em graus decimais (WGS84).")
    alt_km: float = Field(..., ge=0, description="Altitude orbital em quilômetros.")


class SateliteCobertura(BaseModel):
    sat_id: int
    con_id: Optional[int] = None
    sat_status: str
    posicao: PosicaoSatelite


class PontoConsulta(BaseModel):
    lat: float
    lng: float


class CoberturaRegiaoResponse(BaseModel):
    regiao: Optional[RegiaoInfo] = None
    ponto: PontoConsulta
    coberta: bool
    total: int
    satelites: list[SateliteCobertura]


class CoberturaSateliteProperties(BaseModel):
    sat_id: int = Field(..., description="Identificador do satélite consultado.")
    posicao: PosicaoSatelite = Field(
        ...,
        description="Posição orbital propagada a partir da efeméride mais recente.",
    )


class CoberturaGeoJsonFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    properties: CoberturaSateliteProperties
    geometry: dict[str, Any] | None = Field(
        None,
        description=(
            "Polígono GeoJSON do footprint no solo (elevação mínima 5°), "
            "recortado ao Brasil. `null` quando a área está fora do recorte."
        ),
    )


class CoberturaGeoJsonFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection com footprint orbital de um satélite (US307)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "sat_id": 1,
                            "posicao": {
                                "lat": -15.78,
                                "lng": -47.93,
                                "alt_km": 512.4,
                            },
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-48.5, -16.2],
                                    [-47.3, -16.2],
                                    [-47.3, -15.3],
                                    [-48.5, -15.3],
                                    [-48.5, -16.2],
                                ]
                            ],
                        },
                    }
                ],
            }
        }
    )

    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[CoberturaGeoJsonFeature] = Field(
        ...,
        description="Features de cobertura; para um satélite, contém um único footprint.",
    )
