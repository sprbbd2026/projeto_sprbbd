from typing import Optional

from pydantic import BaseModel


class RegiaoInfo(BaseModel):
    id: str
    nome: str
    lat: float
    lng: float


class PosicaoSatelite(BaseModel):
    lat: float
    lng: float
    alt_km: float


class SateliteCobertura(BaseModel):
    sat_id: int
    con_id: Optional[int] = None
    sat_status: str
    posicao: PosicaoSatelite


class PontoConsulta(BaseModel):
    lat: float
    lng: float


class CoberturaRegiaoResponse(BaseModel):
    regiao: Optional[RegiaoInfo] = None
    ponto: PontoConsulta
    coberta: bool
    total: int
    satelites: list[SateliteCobertura]
