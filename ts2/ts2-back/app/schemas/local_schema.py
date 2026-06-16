from pydantic import BaseModel, Field
from typing import Optional

class LocalBase(BaseModel):
    nome: str
    lat: float
    lng: float
    categoria: str
    rating: int = Field(default=5, ge=1, le=5)

class LocalCreate(LocalBase):
    pass

class LocalResponse(LocalBase):
    id: int = Field(alias="id")

    class Config:
        from_attributes = True
        populate_by_name = True
