import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import models
from app.db.orbit_demo import generate_orbit_points
from app.schemas.localizacao_schema import LocalizacaoCreate

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
            "Localização registrada para satélite %s: lat=%s, lon=%s",
            localizacao.satelite_id,
            localizacao.latitude,
            localizacao.longitude,
        )
        return db_loc
    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Erro de persistência ao salvar localização: %s", e)
        raise HTTPException(status_code=500, detail="Erro interno ao salvar localização.")
    except Exception as e:
        logger.error("Erro inesperado ao registrar localização: %s", e)
        raise HTTPException(status_code=500, detail="Falha no processamento da localização.")


def _default_period(
    data_inicio: Optional[datetime],
    data_fim: Optional[datetime],
) -> tuple[datetime, datetime]:
    fim = data_fim or datetime.now(timezone.utc)
    inicio = data_inicio or (fim - timedelta(days=10))
    if inicio.tzinfo is None:
        inicio = inicio.replace(tzinfo=timezone.utc)
    if fim.tzinfo is None:
        fim = fim.replace(tzinfo=timezone.utc)
    return inicio, fim


def seed_demo_rota(
    db: Session,
    satelite_id: str,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    num_points: int = 84,
) -> int:
    """Gera pontos de rota simulada no banco para demonstração."""
    inicio, fim = _default_period(data_inicio, data_fim)
    if inicio >= fim:
        return 0

    criados = 0

    try:
        orbit = generate_orbit_points(satelite_id, inicio, fim, num_points)
        for lat, lng, alt, vel, momento in orbit:
            db.add(
                models.HistoricoLocalizacao(
                    satelite_id=satelite_id,
                    latitude=lat,
                    longitude=lng,
                    altitude_km=alt,
                    velocidade_kmh=vel,
                    data_hora=momento,
                )
            )
            criados += 1

        db.commit()
        logger.info(
            "Rota demonstração: %s pontos gerados para satélite %s",
            criados,
            satelite_id,
        )
        return criados
    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Erro ao gerar rota demonstração: %s", e)
        raise HTTPException(status_code=500, detail="Erro ao gerar rota demonstração.")


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
        rows = (
            query.order_by(models.HistoricoLocalizacao.data_hora.asc())
            .limit(max(limit * 3, 5000))
            .all()
        )
        return _subsample_pontos(_dedupe_pontos(rows), limit)
    except Exception as e:
        logger.error("Erro ao buscar histórico de localização: %s", e)
        raise HTTPException(
            status_code=500, detail="Erro interno ao consultar histórico de localização."
        )


def _dedupe_pontos(pontos: list) -> list:
    """Remove registros duplicados (mesmo instante) mantendo ordem cronológica."""
    seen: set[str] = set()
    unique = []
    for p in sorted(pontos, key=lambda x: x.data_hora):
        key = p.data_hora.replace(microsecond=0).isoformat()
        if key in seen:
            continue
        seen.add(key)
        unique.append(p)
    return unique


def _subsample_pontos(pontos: list, max_points: int) -> list:
    if len(pontos) <= max_points:
        return pontos
    if max_points <= 1:
        return [pontos[0]]
    step = (len(pontos) - 1) / (max_points - 1)
    return [pontos[int(round(i * step))] for i in range(max_points)]


def get_rota(
    db: Session,
    satelite_id: str,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    limit: int = 1000,
) -> tuple[list, bool]:
    if data_inicio and data_fim and data_inicio >= data_fim:
        raise HTTPException(
            status_code=400,
            detail="O timestamp inicial deve ser anterior ao timestamp final.",
        )

    pontos = get_historico_localizacao(db, satelite_id, data_inicio, data_fim, limit=5000)
    pontos = _subsample_pontos(pontos, limit)

    if not pontos:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma localização registrada para este alvo no período informado.",
        )

    return pontos, False


def list_satelites(db: Session):
    try:
        rows = (
            db.query(models.HistoricoLocalizacao.satelite_id)
            .distinct()
            .order_by(models.HistoricoLocalizacao.satelite_id.asc())
            .all()
        )
        return [r[0] for r in rows]
    except Exception as e:
        logger.error("Erro ao listar satélites: %s", e)
        raise HTTPException(status_code=500, detail="Erro ao listar satélites.")
