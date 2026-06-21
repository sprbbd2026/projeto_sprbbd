from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class TelemetryBase(BaseModel):
    satelite_id: str
    cpu_percentual: float
    temperatura_celsius: float
    status: str = "operacional"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TelemetryCreate(TelemetryBase):
    pass

class TelemetryResponse(TelemetryBase):
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
    rota: List[RotaCoordenada]
