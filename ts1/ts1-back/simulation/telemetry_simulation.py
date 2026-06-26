import random
import asyncio
from datetime import datetime, timezone

from app.db.database import SessionLocal
from app.db.models import Satelite, Telemetria
from app.services.efemeride_service import ensure_efemerides_for_operational_satellites

INTERVAL_SECONDS = 30


def gerar_telemetria(sat: Satelite) -> Telemetria:
    agora = datetime.now(timezone.utc)
    return Telemetria(
        id_satelite=sat.sat_id,
        temperatura=random.uniform(20, 60),
        timestamp_registro=agora,
        orientacao=str([round(random.uniform(-1, 1), 4) for _ in range(3)]),
        checksum=str(random.randint(1000, 9999)),
        memoria=random.uniform(20, 90),
        energia=random.uniform(20, 30),
        relogio=agora,
        cpu=random.uniform(10, 80),
    )


async def run():
    print("Simulação de telemetria iniciada.")
    while True:
        db = SessionLocal()
        try:
            ensure_efemerides_for_operational_satellites(db)

            satelites = db.query(Satelite).filter(Satelite.sat_status == "operacional").all()

            if not satelites:
                print(f"[{datetime.now()}] Nenhum satélite operacional encontrado.")
            else:
                for sat in satelites:
                    tlm = gerar_telemetria(sat)
                    db.add(tlm)
                db.commit()
                print(f"[{datetime.now()}] Telemetria gerada para {len(satelites)} satélite(s): {[s.sat_id for s in satelites]}")
        except Exception as e:
            db.rollback()
            print(f"[{datetime.now()}] Erro na simulação: {e}")
        finally:
            db.close()

        await asyncio.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run())
