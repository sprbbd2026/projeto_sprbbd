import base64

from pydantic import BaseModel, field_validator


class CommandCreateRequest(BaseModel):
    est_id: int
    sat_id: int
    cmd_tipo: str
    cmd_payload_binario: str  # conteúdo binário enviado como string base64

    @field_validator("cmd_tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Tipo do comando não pode ter mais de 255 caracteres.")
        return v

    @field_validator("cmd_payload_binario")
    @classmethod
    def validate_payload(cls, v: str) -> str:
        try:
            base64.b64decode(v, validate=True)
        except Exception:
            raise ValueError("Payload binário deve estar em base64 válido.")
        return v

    def payload_bytes(self) -> bytes:
        return base64.b64decode(self.cmd_payload_binario, validate=True)


class CommandResponse(BaseModel):
    cmd_id: int
    est_id: int
    sat_id: int
    cmd_tipo: str

    class Config:
        from_attributes = True
