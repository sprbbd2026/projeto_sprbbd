# app/routes/telemetry_routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.db.models import Telemetria
from app.schemas.telemetry_schema import RotaResponse

router = APIRouter()

@router.get("/telemetry/{satelite_id}/route", response_model=RotaResponse)
def obter_rota_satelite(
    satelite_id: str,
    start_time: datetime = Query(..., description="Início do período (ISO 8601)"),
    end_time: datetime = Query(..., description="Fim do período (ISO 8601)"),
    db: Session = Depends(get_db)
):
    # CA03 - Parâmetros inválidos
    if start_time >= end_time:
        raise HTTPException(
            status_code=400, 
            detail="O timestamp inicial deve ser anterior ao timestamp final."
        )

    # Consulta ordenada por timestamp (crescente)
    pontos = db.query(Telemetria).filter(
        Telemetria.satelite_id == satelite_id,
        Telemetria.data_hora >= start_time,
        Telemetria.data_hora <= end_time,
        Telemetria.latitude.isnot(None),  # Garante que só pega registros com coordenadas
        Telemetria.longitude.isnot(None)
    ).order_by(Telemetria.data_hora.asc()).all()

    # CA02 - Período sem dados (Retorno 404 controlado)
    if not pontos:
        raise HTTPException(
            status_code=404, 
            detail="Nenhuma localização registrada para este alvo no período informado."
        )

    # CA01 - Retorna a lista ordenada
    rota_formatada = [
        {"latitude": p.latitude, "longitude": p.longitude, "data_hora": p.data_hora}
        for p in pontos
    ]

    return {"satelite_id": satelite_id, "rota": rota_formatada}