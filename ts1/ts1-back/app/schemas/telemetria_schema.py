from pydantic import BaseModel
from typing import List
from datetime import datetime


class HeaderPayload(BaseModel):
    sat_id: str
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