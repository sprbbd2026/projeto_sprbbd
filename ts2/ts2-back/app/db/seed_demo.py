"""Seed demo — 5 satélites IGSO regionais (figura-8), dia corrente."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db import models
from app.db.orbit_demo import (
    DEMO_POINTS_PER_SAT,
    default_demo_window,
    generate_orbit_points,
)

SATELLITE_IDS = ("1", "2", "3", "4", "5")


def _seed_all(db: Session) -> bool:
    now = datetime.now(timezone.utc)
    inicio, _fim = default_demo_window()

    for sat_num in SATELLITE_IDS:
        orbit = generate_orbit_points(sat_num, inicio, num_points=DEMO_POINTS_PER_SAT)
        for lat, lng, alt, vel, momento in orbit:
            db.add(
                models.HistoricoLocalizacao(
                    satelite_id=sat_num,
                    latitude=lat,
                    longitude=lng,
                    altitude_km=alt,
                    velocidade_kmh=vel,
                    data_hora=momento,
                )
            )

        for j in range(24):
            db.add(
                models.Telemetria(
                    satelite_id=sat_num,
                    cpu_percentual=35.0 + j * 1.5 + int(sat_num) * 3,
                    temperatura_celsius=21.5 + j * 0.25,
                    status="operacional",
                    data_hora=now - timedelta(hours=j * 7),
                )
            )

    db.commit()
    return True


def reseed_historico(db: Session) -> bool:
    db.query(models.HistoricoLocalizacao).delete()
    db.query(models.Telemetria).delete()
    db.commit()
    return _seed_all(db)


def seed_if_empty(db: Session) -> bool:
    has_loc = db.query(models.HistoricoLocalizacao.id).limit(1).first()
    if has_loc:
        return False
    return _seed_all(db)
