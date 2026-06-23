"""Reseed — 5 satélites IGSO regionais, trilha figura-8, dia corrente (30 min)."""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ts2" / "ts2-back"))

logging.disable(logging.CRITICAL)

from sqlalchemy import func

from app.db import models
from app.db.database import SessionLocal
from app.db.orbit_demo import DEMO_DAYS, DEMO_INTERVAL_MINUTES, DEMO_POINTS_PER_SAT, default_demo_window
from app.db.seed_demo import SATELLITE_IDS, reseed_historico

db = SessionLocal()
try:
    before = db.query(func.count(models.HistoricoLocalizacao.id)).scalar()
    reseed_historico(db)
    after = db.query(func.count(models.HistoricoLocalizacao.id)).scalar()
    inicio, fim = default_demo_window()
    print(
        f"Histórico: {before} -> {after} | {len(SATELLITE_IDS)} satélites | "
        f"{DEMO_DAYS} dia | {DEMO_POINTS_PER_SAT} pts/sat | intervalo {DEMO_INTERVAL_MINUTES:.0f} min"
    )
    print(f"  Janela: {inicio.isoformat()} -> {fim.isoformat()}")
    for sat in SATELLITE_IDS:
        n = (
            db.query(func.count(models.HistoricoLocalizacao.id))
            .filter(models.HistoricoLocalizacao.satelite_id == sat)
            .scalar()
        )
        print(f"  SAT-{sat}: {n} pontos")
finally:
    db.close()
