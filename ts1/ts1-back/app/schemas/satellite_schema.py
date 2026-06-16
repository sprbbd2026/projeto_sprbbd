from pydantic import BaseModel
from typing import Optional

class SatelliteCreateRequest(BaseModel):
    con_id: Optional[int] = None
    sat_relogio_offset: Optional[float] = None
    sat_codigo_prn: Optional[int] = None
    sat_numero_svn: Optional[int] = None
    sat_status: str = "operacional"

class SatelliteResponse(BaseModel):
    sat_id: int
    con_id: Optional[int]
    sat_relogio_offset: Optional[float]
    sat_codigo_prn: Optional[int]
    sat_numero_svn: Optional[int]
    sat_status: str

    class Config:
        from_attributes = True
