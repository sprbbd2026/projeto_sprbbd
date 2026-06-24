from sqlalchemy import create_engine, text

ts1 = create_engine("postgresql+psycopg://admin:sprb_ts1_local@localhost:5432/sprbbd-db")
ts2 = create_engine("postgresql+psycopg://admin:sprb_ts2_local@localhost:5433/sprbbd-db")

with ts1.connect() as c:
    rows = c.execute(
        text("SELECT opr_id, opr_nome, opr_email, opr_status FROM operador")
    ).mappings().all()
    print("TS1 operador:", [dict(r) for r in rows])

with ts2.connect() as c:
    rows = c.execute(
        text('SELECT usu_id, usu_nome, usu_sobrenome, usu_email, usu_documento FROM "USUARIO"')
    ).mappings().all()
    print("TS2 USUARIO:", [dict(r) for r in rows])
