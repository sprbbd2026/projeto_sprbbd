from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class DispositivoConectado(BaseModel):
    """Dispositivo com login ativo do usuário atual (US304 - conectados)."""

    uuid: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    metadados: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
