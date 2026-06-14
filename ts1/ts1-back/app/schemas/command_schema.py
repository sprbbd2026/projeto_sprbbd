import base64
from datetime import datetime

from pydantic import BaseModel, field_validator

ALLOWED_COMMAND_TYPES = {"RESET", "CONFIG", "PING", "CUSTOM"}


class CommandCreateRequest(BaseModel):
    est_id: int
    sat_id: int
    cmd_tipo: str
    cmd_payload_binario: str
    cmd_descricao: str | None = None

    @field_validator("cmd_tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        normalized = v.strip().upper()
        if not normalized:
            raise ValueError("Tipo do comando é obrigatório.")
        if len(normalized) > 255:
            raise ValueError("Tipo do comando não pode ter mais de 255 caracteres.")
        if normalized not in ALLOWED_COMMAND_TYPES:
            allowed = ", ".join(sorted(ALLOWED_COMMAND_TYPES))
            raise ValueError(f"Tipo de comando inválido. Valores permitidos: {allowed}.")
        return normalized

    @field_validator("cmd_descricao")
    @classmethod
    def validate_descricao(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 255:
            raise ValueError("Descrição não pode ter mais de 255 caracteres.")
        return v

    @field_validator("cmd_payload_binario")
    @classmethod
    def validate_payload(cls, v: str) -> str:
        try:
            base64.b64decode(v, validate=True)
        except Exception as exc:
            raise ValueError("Payload binário deve estar em base64 válido.") from exc
        return v

    def payload_bytes(self) -> bytes:
        return base64.b64decode(self.cmd_payload_binario, validate=True)


class CommandResponse(BaseModel):
    cmd_id: int
    est_id: int
    sat_id: int
    cmd_tipo: str
    cmd_status: str
    cmd_timestamp: datetime
    cmd_descricao: str | None = None

    class Config:
        from_attributes = True


class CommandDetailResponse(CommandResponse):
    opr_id: int | None = None
    cmd_payload_binario: str | None = None


class CommandListResponse(BaseModel):
    items: list[CommandResponse]
    total: int
    skip: int
    limit: int
