import json
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app.db.models import Satelite, Efemeride

def seed():
    db = SessionLocal()
    try:
        print("Limpando dados anteriores de satélites e efemérides...")
        db.query(Efemeride).delete()
        db.query(Satelite).delete()
        db.commit()

        print("Semeando 4 satélites com cobertura total do território brasileiro...")
        
        # 4 satélites estrategicamente posicionados para cobrir o Brasil em 1200km de altitude
        keplerian_configs = [
            {"fixed_lat": -3.0, "fixed_lng": -60.0, "fixed_alt": 1200.0},  # Norte (Manaus/Amazonas)
            {"fixed_lat": -8.0, "fixed_lng": -41.0, "fixed_alt": 1200.0},  # Nordeste (Piauí/Ceará/Bahia)
            {"fixed_lat": -18.0, "fixed_lng": -48.0, "fixed_alt": 1200.0}, # Centro-Oeste/Sudeste (DF/Goiás/Minas/SP)
            {"fixed_lat": -28.0, "fixed_lng": -52.0, "fixed_alt": 1200.0}, # Sul (RS/SC/PR)
        ]

        for idx, params in enumerate(keplerian_configs, start=1):
            sat = Satelite(
                sat_id=idx,
                con_id=1,  # Constelação padrão 1
                sat_relogio_offset=0.0015 * idx,
                sat_codigo_prn=20 + idx,
                sat_numero_svn=100 + idx,
                sat_status="operacional"
            )
            db.add(sat)
            db.flush()

            efe = Efemeride(
                sat_id=sat.sat_id,
                efe_timestamp_ref=datetime.now(timezone.utc),
                efe_params_keplerian=json.dumps(params)
            )
            db.add(efe)

        db.commit()
        print("Semeado com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"Erro ao semear banco de dados: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
