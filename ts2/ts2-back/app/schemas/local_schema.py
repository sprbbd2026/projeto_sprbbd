from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime

class LocalBase(BaseModel):
    nome: str
    lat: float
    lng: float
    categoria: str
    rating: int = Field(default=5, ge=1, le=5)

class LocalCreate(LocalBase):
    id_ponto: int = Field(..., description="ID do ponto (FK)")
    timestamp: datetime = Field(..., description="ISO-8601 timestamp in UTC")
    
    @field_validator('timestamp')
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        """Validate that timestamp is provided and in valid format."""
        if v is None:
            raise ValueError('timestamp is required')
        if v.tzinfo is None:
            raise ValueError('timestamp must include timezone information (UTC)')
        return v

class LocalResponse(LocalBase):
    id: int = Field(alias="id")
    timestamp: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
