from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class DispositivoConectado(BaseModel):
    """Dispositivo que enviou sinal recentemente e é considerado online (US304)."""

    uuid: str
    ultimo_sinal: datetime
    lat: Optional[float] = None
    lng: Optional[float] = None
    metadados: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
