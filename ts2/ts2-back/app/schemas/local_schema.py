from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class LocalBase(BaseModel):
    nome: str
    lat: float
    lng: float
    categoria: str
    rating: int = Field(default=5, ge=1, le=5)

class LocalCreate(LocalBase):
    id_ponto: Optional[int] = Field(None, description="ID do ponto (FK). Se não fornecido, cria um novo ponto automaticamente")

class LocalResponse(LocalBase):
    id: int = Field(alias="id")
    timestamp: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
