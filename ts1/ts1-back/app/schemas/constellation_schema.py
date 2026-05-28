from pydantic import BaseModel, field_validator

from app.schemas.satellite_schema import SatelliteResponse

MIN_SATELITES_CONSTELACAO = 4


class ConstellationCreateRequest(BaseModel):
    cnt_nome: str
    cnt_descricao: str | None = None
    cnt_status: str
    sat_ids: list[int]

    @field_validator("cnt_nome")
    @classmethod
    def validate_cnt_nome(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Nome da constelação é obrigatório.")
        if len(v) > 255:
            raise ValueError("Nome da constelação não pode ter mais de 255 caracteres.")
        return v

    @field_validator("cnt_status")
    @classmethod
    def validate_cnt_status(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError(
                "Status da constelação não pode ter mais de 50 caracteres."
            )
        return v

    @field_validator("sat_ids")
    @classmethod
    def validate_sat_ids(cls, v: list[int]) -> list[int]:
        if len(set(v)) < MIN_SATELITES_CONSTELACAO:
            raise ValueError(
                "Uma constelação precisa de pelo menos "
                f"{MIN_SATELITES_CONSTELACAO} satélites."
            )
        return v


class ConstellationResponse(BaseModel):
    cnt_id: int
    cnt_nome: str
    cnt_descricao: str | None = None
    cnt_status: str
    sat_quantidade: int

    class Config:
        from_attributes = True


class ConstellationDetailResponse(ConstellationResponse):
    satelites: list[SatelliteResponse]
