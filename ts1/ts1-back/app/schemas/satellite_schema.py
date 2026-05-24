from pydantic import BaseModel, field_validator

class SatelliteCreateRequest(BaseModel):
    sat_nome: str
    sat_modelo_hardware: str
    sat_versao_firmware: str
    sat_tipo_orbita: str
    sat_status: str
  
    @field_validator("sat_nome")
    @classmethod
    def validate_sat_nome(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Nome do Satélite não pode ter mais de 255 caracteres.")
        return v

    @field_validator("sat_modelo_hardware")
    @classmethod
    def validate_sat_modelo_hardware(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Modelo/plataforma de hardware não pode ter mais de 255 caracteres.")
        return v

    @field_validator("sat_versao_firmware")
    @classmethod
    def validate_sat_versao_firmware(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Versão do firmware embarcado não pode ter mais de 255 caracteres.")
        return v

    @field_validator("sat_tipo_orbita")
    @classmethod
    def validate_sat_tipo_orbita(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Tipo de órbita não pode ter mais de 50 caracteres.")
        return v

    @field_validator("sat_status")
    @classmethod
    def validate_sat_status(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Estado operacional do satélite não pode ter mais de 50 caracteres.")
        return v


class SatelliteResponse(BaseModel):
    sat_id: int
    sat_nome: str
    sat_modelo_hardware: str
    sat_versao_firmware: str
    sat_tipo_orbita: str
    sat_status: str

    class Config:
        from_attributes = True
