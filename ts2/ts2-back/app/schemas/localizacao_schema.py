from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LocalizacaoBase(BaseModel):
    satelite_id: str
    latitude: float
    longitude: float
    altitude_km: Optional[float] = None
    velocidade_kmh: Optional[float] = None


class LocalizacaoCreate(LocalizacaoBase):
    pass


class LocalizacaoResponse(LocalizacaoBase):
    id: int
    data_hora: datetime

    class Config:
        from_attributes = True


class RotaCoordenada(BaseModel):
    latitude: float
    longitude: float
    data_hora: datetime


class RotaResponse(BaseModel):
    satelite_id: str
    rota: list[RotaCoordenada]
    gerado_automaticamente: bool = False