import logging
import os

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

TS1_DATABASE_URL = os.getenv(
    "TS1_DATABASE_URL",
    "postgresql+psycopg://admin:sprbbd-dev@localhost:5432/sprbbd-db",
)


def listar_satelites_cadastrados() -> list[dict]:
    """Lê satélites diretamente do PostgreSQL do TS1 (sem depender da API HTTP)."""
    engine = create_engine(TS1_DATABASE_URL, pool_pre_ping=True)
    sql = text(
        """
        SELECT
            s.sat_id,
            s.con_id,
            s.sat_relogio_offset,
            s.sat_codigo_prn,
            s.sat_numero_svn,
            s.sat_status,
            c.con_nome
        FROM satelite s
        LEFT JOIN constelacao c ON c.con_id = s.con_id
        ORDER BY s.sat_id ASC
        """
    )

    try:
        with engine.connect() as conn:
            rows = conn.execute(sql).mappings().all()
        return [
            {
                "sat_id": row["sat_id"],
                "con_id": row["con_id"],
                "sat_relogio_offset": row["sat_relogio_offset"],
                "sat_codigo_prn": row["sat_codigo_prn"],
                "sat_numero_svn": row["sat_numero_svn"],
                "sat_status": row["sat_status"] or "operacional",
                "con_nome": row["con_nome"],
            }
            for row in rows
        ]
    except SQLAlchemyError as exc:
        logger.error("Falha ao ler satélites do banco TS1: %s", exc)
        raise
