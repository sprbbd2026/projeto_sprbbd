from datetime import datetime

from pydantic import BaseModel, ConfigDict

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

    model_config = ConfigDict(from_attributes=True)
