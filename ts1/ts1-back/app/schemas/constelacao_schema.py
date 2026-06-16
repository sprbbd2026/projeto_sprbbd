from pydantic import BaseModel
from typing import Optional

class ConstelacaoResponse(BaseModel):
    con_id: int
    con_nome: Optional[str]

    class Config:
        from_attributes = True
