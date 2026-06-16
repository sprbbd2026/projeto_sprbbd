from pydantic import BaseModel, field_validator
from typing import Optional

from app.schemas.satellite_schema import SatelliteResponse

MIN_SATELITES_CONSTELACAO = 4


class ConstellationCreateRequest(BaseModel):
    con_nome: str
    sat_ids: list[int]

    @field_validator("con_nome")
    @classmethod
    def validate_con_nome(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Nome da constelacao e obrigatorio.")
        if len(v) > 255:
            raise ValueError("Nome da constelacao nao pode ter mais de 255 caracteres.")
        return v

    @field_validator("sat_ids")
    @classmethod
    def validate_sat_ids(cls, v: list[int]) -> list[int]:
        if len(set(v)) < MIN_SATELITES_CONSTELACAO:
            raise ValueError(
                f"Uma constelacao precisa de pelo menos {MIN_SATELITES_CONSTELACAO} satelites."
            )
        return v


class ConstellationResponse(BaseModel):
    con_id: int
    con_nome: Optional[str]
    sat_quantidade: int

    class Config:
        from_attributes = True


class ConstellationDetailResponse(ConstellationResponse):
    satelites: list[SatelliteResponse]
