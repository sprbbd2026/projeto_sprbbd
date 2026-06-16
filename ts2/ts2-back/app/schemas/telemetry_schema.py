from pydantic import BaseModel
from datetime import datetime

class TelemetryBase(BaseModel):
    satelite_id: str
    cpu_percentual: float
    temperatura_celsius: float
    status: str = "operacional"

class TelemetryCreate(TelemetryBase):
    pass

class TelemetryResponse(TelemetryBase):
    id: int
    data_hora: datetime

    class Config:
        from_attributes = True
