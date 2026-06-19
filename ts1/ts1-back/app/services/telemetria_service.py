import logging
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Satelite, Telemetria
from app.schemas.telemetria_schema import TelemetryInputPayload
from app.services.cobertura_service import propagar_posicao_historica

logger = logging.getLogger(__name__)


def ingest_satellite_telemetry(db: Session, data: TelemetryInputPayload):
    satelite = db.query(Satelite).filter(
        Satelite.sat_id == data.header.sat_id).first()

    if not satelite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satélite '{data.header.sat_id}' não encontrado no banco de dados."
        )

    if satelite.sat_status != "operacional":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O satélite {satelite.sat_id} não está operacional."
        )

    nova_telemetria = Telemetria(
        id_satelite=satelite.sat_id,
        temperatura=data.subsystems.obc.temp_core,
        timestamp_registro=datetime.fromisoformat(
            data.header.timestamp.replace("Z", "+00:00")),
        orientacao=str(data.subsystems.adcs.attitude),
        checksum=str(data.header.packet_id),
        memoria=data.subsystems.obc.memory_usage,
        energia=data.subsystems.power.solar_panel_v,
        relogio=None,
        cpu=data.subsystems.obc.cpu_usage
    )

    db.add(nova_telemetria)
    db.commit()
    db.refresh(nova_telemetria)

    return {"message": "Telemetria processada e salva com sucesso!", "id_telemetria": nova_telemetria.id_telemetria}


def query_historico_localizacoes(
    db: Session,
    sat_id: int,
    dt_from: datetime | None = None,
    dt_to: datetime | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """Consulta paginada de historico de telemetria com posicao calculada.

    Args:
        db: sessao do banco de dados.
        sat_id: ID do satelite (obrigatorio).
        dt_from: inicio do intervalo (opcional, inclusive).
        dt_to: fim do intervalo (opcional, inclusive).
        limit: registros por pagina (default 20, max 100).
        offset: deslocamento para paginacao (default 0).

    Returns:
        dict com chaves ``data`` (list) e ``pagination`` (dict).
    """
    if dt_from is not None and dt_to is not None and dt_from > dt_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O parametro 'from' nao pode ser posterior a 'to'.",
        )

    satelite = db.query(Satelite).filter(Satelite.sat_id == sat_id).first()
    if not satelite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satelite '{sat_id}' nao encontrado.",
        )

    query = db.query(Telemetria).filter(Telemetria.id_satelite == sat_id)

    if dt_from is not None:
        query = query.filter(Telemetria.timestamp_registro >= dt_from)
    if dt_to is not None:
        query = query.filter(Telemetria.timestamp_registro <= dt_to)

    total = query.count()

    registros = (
        query
        .order_by(Telemetria.timestamp_registro.asc(), Telemetria.id_telemetria.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    data: list[dict] = []
    for tlm in registros:
        try:
            pos = propagar_posicao_historica(db, sat_id, tlm.timestamp_registro)
        except Exception as exc:
            logger.warning(
                "Falha ao propagar posicao historica para tlm_id=%s sat_id=%s: %s",
                tlm.id_telemetria, sat_id, exc,
            )
            pos = None

        data.append({
            "tlm_id": tlm.id_telemetria,
            "sat_id": tlm.id_satelite,
            "timestamp": tlm.timestamp_registro,
            "position": {
                "lat": pos["lat"],
                "lng": pos["lng"],
                "alt_km": pos["alt_km"],
            } if pos else None,
            "metadata": {
                "temperatura": tlm.temperatura,
                "energia": tlm.energia,
                "cpu": tlm.cpu,
            },
        })

    next_offset = offset + limit if (offset + limit) < total else None

    return {
        "data": data,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "next_offset": next_offset,
        },
    }
