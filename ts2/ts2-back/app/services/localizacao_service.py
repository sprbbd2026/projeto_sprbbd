import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db import models
from app.schemas.localizacao_schema import LocalizacaoCreate
from datetime import datetime
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_localizacao(db: Session, localizacao: LocalizacaoCreate):
    try:
        db_loc = models.HistoricoLocalizacao(
            satelite_id=localizacao.satelite_id,
            latitude=localizacao.latitude,
            longitude=localizacao.longitude,
            altitude_km=localizacao.altitude_km,
            velocidade_kmh=localizacao.velocidade_kmh,
        )
        db.add(db_loc)
        db.commit()
        db.refresh(db_loc)
        logger.info(
            f"Localização registrada para satélite {localizacao.satelite_id}: "
            f"lat={localizacao.latitude}, lon={localizacao.longitude}"
        )
        return db_loc
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Erro de persistência ao salvar localização: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar localização.")
    except Exception as e:
        logger.error(f"Erro inesperado ao registrar localização: {str(e)}")
        raise HTTPException(status_code=500, detail="Falha no processamento da localização.")


def get_historico_localizacao(
    db: Session,
    satelite_id: str,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    limit: int = 200,
):
    try:
        query = db.query(models.HistoricoLocalizacao).filter(
            models.HistoricoLocalizacao.satelite_id == satelite_id
        )
        if data_inicio:
            query = query.filter(models.HistoricoLocalizacao.data_hora >= data_inicio)
        if data_fim:
            query = query.filter(models.HistoricoLocalizacao.data_hora <= data_fim)
        return (
            query.order_by(models.HistoricoLocalizacao.data_hora.asc())
            .limit(limit)
            .all()
        )
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de localização: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Erro interno ao consultar histórico de localização."
        )


def get_rota(db: Session, satelite_id: str, limit: int = 200):
    """Retorna a sequência de pontos de rota de um satélite (alias simplificado)."""
    return get_historico_localizacao(db, satelite_id, limit=limit)


def list_satelites(db: Session):
    """Retorna IDs únicos de satélites com localização registrada."""
    try:
        rows = (
            db.query(models.HistoricoLocalizacao.satelite_id)
            .distinct()
            .all()
        )
        return [r[0] for r in rows]
    except Exception as e:
        logger.error(f"Erro ao listar satélites: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao listar satélites.")
