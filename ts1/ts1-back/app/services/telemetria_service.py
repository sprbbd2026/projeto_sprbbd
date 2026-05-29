from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Satelite, Telemetria
from app.schemas.telemetria_schema import TelemetryInputPayload


def ingest_satellite_telemetry(db: Session, data: TelemetryInputPayload):
    satelite = db.query(Satelite).filter(
        Satelite.id_satelite == data.header.sat_id).first()

    if not satelite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satélite '{data.header.sat_id}' não encontrado no banco de dados."
        )

    if satelite.status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A simulação para o satélite {satelite.id_satelite} não está ativa."
        )

    nova_telemetria = Telemetria(
        id_satelite=satelite.id_satelite,
        temperatura=data.subsystems.obc.temp_core,
        timestamp_registro=datetime.fromisoformat(
            data.header.timestamp.replace("Z", "+00:00")),
        orientacao=str(data.subsystems.adcs.attitude),
        checksum=str(data.header.packet_id),
        memoria=data.subsystems.obc.memory_usage,
        energia=data.subsystems.power.solar_panel_v,
        bateria=data.subsystems.power.battery_level,
        relogio=data.gps_payload.signal_integrity,
        cpu=data.subsystems.obc.cpu_usage
    )

    db.add(nova_telemetria)
    db.commit()
    db.refresh(nova_telemetria)

    return {"message": "Telemetria processada e salva com sucesso!", "id_telemetria": nova_telemetria.id_telemetria}
