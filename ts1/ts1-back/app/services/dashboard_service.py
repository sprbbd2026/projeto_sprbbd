from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Satelite, Operador, EventoComunicacao


def get_dashboard_summary(db: Session) -> dict:
    active_satellites = (
        db.query(func.count(Satelite.sat_id))
        .filter(Satelite.sat_status == "operacional")
        .scalar()
        or 0
    )

    alert_satellites = (
        db.query(func.count(Satelite.sat_id))
        .filter(Satelite.sat_status.in_(["falha", "manutencao"]))
        .scalar()
        or 0
    )

    alert_events = db.query(func.count(EventoComunicacao.evt_id)).scalar() or 0
    alerts = alert_satellites + alert_events

    users = (
        db.query(func.count(Operador.opr_id))
        .filter(Operador.opr_status == "ativo")
        .scalar()
        or 0
    )

    return {
        "active_satellites": active_satellites,
        "alerts": alerts,
        "users": users,
    }
