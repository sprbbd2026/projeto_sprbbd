import logging
import math
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Satelite, Telemetria, Efemeride
from app.schemas.telemetria_schema import TelemetryInputPayload
from app.services.cobertura_service import propagar_posicao_historica

logger = logging.getLogger(__name__)


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia em km entre dois pontos (graus) na superficie terrestre."""
    R = 6371.0
    rlat1, rlng1, rlat2, rlng2 = map(math.radians, (lat1, lng1, lat2, lng2))
    dlat = rlat2 - rlat1
    dlng = rlng2 - rlng1
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


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

    filtros = [
        Telemetria.id_satelite == sat_id,
        Telemetria.timestamp_registro.isnot(None),
    ]

    if dt_from is not None:
        filtros.append(Telemetria.timestamp_registro >= dt_from)
    if dt_to is not None:
        filtros.append(Telemetria.timestamp_registro <= dt_to)

    total = db.query(func.count(Telemetria.id_telemetria)).filter(*filtros).scalar() or 0
    effective_limit = max(limit, 5)

    registros = (
        db.query(
            Telemetria.id_telemetria,
            Telemetria.id_satelite,
            Telemetria.timestamp_registro,
            Telemetria.temperatura,
            Telemetria.energia,
            Telemetria.cpu,
        )
        .filter(*filtros)
        .order_by(Telemetria.timestamp_registro.asc(), Telemetria.id_telemetria.asc())
        .offset(offset)
        .limit(effective_limit)
        .all()
    )

    # Para projeto academico com efemerides mockadas, usa "agora" apenas
    # como fase dentro de uma janela curta ancorada na efemeride mais recente.
    # Assim, a trilha permanece dinamica sem afastar o satelite do contexto local.
    latest_efe = (
        db.query(Efemeride.efe_timestamp_ref)
        .filter(Efemeride.sat_id == sat_id)
        .order_by(Efemeride.efe_timestamp_ref.desc())
        .first()
    )

    phase_window_seconds = 8 * 60
    now = datetime.utcnow()
    has_latest_efe = latest_efe is not None and latest_efe[0] is not None
    phase_seconds = 0
    if has_latest_efe:
        efe_ref = latest_efe[0]
        phase_seconds = int((now - efe_ref).total_seconds()) % phase_window_seconds
        base_target_ts = efe_ref + timedelta(seconds=phase_seconds)
    else:
        base_target_ts = now

    step_seconds = 30
    total_registros = len(registros)
    start_phase_seconds = (
        phase_window_seconds - ((total_registros - 1) * step_seconds) % phase_window_seconds
    ) % phase_window_seconds

    data: list[dict] = []
    prev_pos = None
    for idx, (tlm_id, sat_tlm_id, timestamp_registro, temperatura, energia, cpu) in enumerate(registros):
        try:
            point_phase_seconds = (start_phase_seconds + idx * step_seconds) % phase_window_seconds
            phase_offset = (point_phase_seconds - phase_seconds) if has_latest_efe else (idx * step_seconds)
            target_ts = base_target_ts + timedelta(seconds=phase_offset)
            pos = propagar_posicao_historica(db, sat_id, target_ts)
        except Exception as exc:
            logger.warning(
                "Falha ao propagar posicao historica para tlm_id=%s sat_id=%s: %s",
                tlm_id, sat_id, exc,
            )
            pos = None

        # Calcula velocidade entre pontos consecutivos (km/h)
        velocidade_kmh = None
        if pos and prev_pos and step_seconds > 0:
            dist_km = _haversine_km(prev_pos["lat"], prev_pos["lng"], pos["lat"], pos["lng"])
            velocidade_kmh = round(dist_km / (step_seconds / 3600), 1)

        if pos:
            prev_pos = pos

        data.append({
            "tlm_id": tlm_id,
            "sat_id": sat_tlm_id,
            "timestamp": timestamp_registro,
            "position": {
                "lat": pos["lat"],
                "lng": pos["lng"],
                "alt_km": pos["alt_km"],
                "velocidade_kmh": velocidade_kmh,
            } if pos else None,
            "metadata": {
                "temperatura": temperatura,
                "energia": energia,
                "cpu": cpu,
            },
        })

    # Preenche velocidade do primeiro ponto com a do segundo (mesma órbita)
    if len(data) >= 2 and data[0].get("position") and data[1].get("position"):
        data[0]["position"]["velocidade_kmh"] = data[1]["position"]["velocidade_kmh"]

    next_offset = offset + effective_limit if (offset + effective_limit) < total else None

    return {
        "data": data,
        "pagination": {
            "total": total,
            "limit": effective_limit,
            "offset": offset,
            "next_offset": next_offset,
        },
    }
