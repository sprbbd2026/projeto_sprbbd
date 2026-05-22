import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db import models
from app.schemas.telemetry_schema import TelemetryCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_telemetry(db: Session, telemetry: TelemetryCreate):
    try:
        db_telemetry = models.Telemetria(
            satelite_id=telemetry.satelite_id,
            cpu_percentual=telemetry.cpu_percentual,
            temperatura_celsius=telemetry.temperatura_celsius,
            status=telemetry.status
        )
        db.add(db_telemetry)
        db.commit()
        db.refresh(db_telemetry)
        logger.info(f"Telemetria recebida e salva com sucesso. Satélite: {telemetry.satelite_id}")
        return db_telemetry
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Erro de persistência ao salvar telemetria no banco de dados: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar dados de telemetria.")
    except Exception as e:
        logger.error(f"Erro inesperado no recebimento de telemetria: {str(e)}")
        raise HTTPException(status_code=500, detail="Falha na comunicação ou processamento da telemetria.")

def get_telemetries(db: Session, skip: int = 0, limit: int = 100):
    try:
        return db.query(models.Telemetria).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de telemetrias: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao consultar telemetria.")

