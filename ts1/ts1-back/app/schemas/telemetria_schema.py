from pydantic import BaseModel
from typing import List
from datetime import datetime


class HeaderPayload(BaseModel):
    sat_id: int
    timestamp: str
    packet_id: int

class PowerPayload(BaseModel):
    battery_level: float
    solar_panel_v: float

class ADCSPayload(BaseModel):
    attitude: List[float]
    pointing_error: float

class OBCPayload(BaseModel):
    cpu_usage: float
    temp_core: float
    memory_usage: float

class SubsystemsPayload(BaseModel):
    power: PowerPayload
    adcs: ADCSPayload
    obc: OBCPayload

class GPSPayload(BaseModel):
    position_xyz: List[float]
    signal_integrity: str
    active_channels: int

class TelemetryInputPayload(BaseModel):
    header: HeaderPayload
    subsystems: SubsystemsPayload
    gps_payload: GPSPayload


# -----------------------------------------------------------
# Schemas para US302 — Historico de localizacao
# -----------------------------------------------------------

class LocationPosition(BaseModel):
    lat: float
    lng: float
    alt_km: float
    velocidade_kmh: float | None = None


class LocationMetadata(BaseModel):
    temperatura: float | None = None
    energia: float | None = None
    cpu: float | None = None


class LocationResponse(BaseModel):
    tlm_id: int
    sat_id: int
    timestamp: datetime
    position: LocationPosition | None = None
    metadata: LocationMetadata

    class Config:
        from_attributes = True


class LocationPagination(BaseModel):
    total: int
    limit: int
    offset: int
    next_offset: int | None = None


class LocationPageResponse(BaseModel):
    data: list[LocationResponse]
    pagination: LocationPagination