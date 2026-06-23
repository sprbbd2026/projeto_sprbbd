from sqlalchemy import create_engine, text

from app.db.database import SessionLocal
from app.db.seed_demo import seed_if_empty

db = SessionLocal()
try:
    seeded = seed_if_empty(db)
    print("seeded:", seeded)
finally:
    db.close()

engine = create_engine("postgresql+psycopg://admin:sprb_ts2_local@localhost:5433/sprbbd-db")
with engine.connect() as conn:
    count = conn.execute(text('SELECT count(*) FROM "HISTORICO_LOCALIZACAO"')).scalar()
    print("historico rows:", count)
