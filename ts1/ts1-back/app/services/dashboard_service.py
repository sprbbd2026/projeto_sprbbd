from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Satelite, Operador, EventoComunicacao

ALERT_EVENT_STATUSES = ("FALHA", "ERRO", "ALERTA", "FALHOU", "CRITICO")


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

    # Eventos de auditoria (ex.: COMANDO_ENVIADO/SUCESSO) não são alertas operacionais.
    alert_events = (
        db.query(func.count(EventoComunicacao.evt_id))
        .filter(EventoComunicacao.evt_status.in_(ALERT_EVENT_STATUSES))
        .scalar()
        or 0
    )
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
