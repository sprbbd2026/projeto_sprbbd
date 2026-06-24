"""Geração e manutenção de efemérides mockadas para satélites operacionais."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from shapely.geometry import Point, Polygon

from app.db.models import Efemeride, Satelite
from app.services.cobertura_service import (
    REGIOES_BRASIL,
    _calcular_footprint,
    _keplerian_para_latLngAlt,
)

_DELTA_T_S = 300.0
_BASE_PARAMS = {"a": 7000.0, "e": 0.001, "i": 20.0, "omega": 40.0, "w": 0.0, "M0": 0.0}
_REGION_ORDER = ("norte", "nordeste", "centro_oeste", "sudeste", "sul")


def _footprint_covers_point(params: dict, lat: float, lng: float) -> bool:
    lat_s, lng_s, alt = _keplerian_para_latLngAlt(params, _DELTA_T_S)
    footprint = Polygon(_calcular_footprint(lat_s, lng_s, alt))
    return not footprint.is_empty and footprint.intersects(Point(lng, lat))


def _params_for_region(lat: float, lng: float, sat_id: int) -> dict:
    """Busca parâmetros keplerianos cujo footprint cubra o ponto alvo."""
    for m0 in range(0, 360, 12):
        for omega in range(-80, -20, 8):
            params = {
                **_BASE_PARAMS,
                "M0": float(m0),
                "omega": float(omega),
            }
            if _footprint_covers_point(params, lat, lng):
                return params

    fallback = {**_BASE_PARAMS, "M0": float(((sat_id - 1) * 72) % 360)}
    return fallback


def keplerian_params_for_satellite(sat_id: int) -> dict:
    region_key = _REGION_ORDER[(sat_id - 1) % len(_REGION_ORDER)]
    region = REGIOES_BRASIL[region_key]
    return _params_for_region(region["lat"], region["lng"], sat_id)


def ensure_efemeride_for_satellite(db: Session, sat: Satelite) -> tuple[Efemeride | None, bool]:
    """Garante efeméride recente para satélite operacional.

    Returns:
        (efemeride, created) — created é True quando uma nova efeméride foi adicionada.
    """
    if sat.sat_status != "operacional":
        return None, False

    efe = (
        db.query(Efemeride)
        .filter(Efemeride.sat_id == sat.sat_id)
        .order_by(Efemeride.efe_timestamp_ref.desc())
        .first()
    )
    if efe and efe.efe_params_keplerian:
        return efe, False

    params = keplerian_params_for_satellite(sat.sat_id)
    efe = Efemeride(
        sat_id=sat.sat_id,
        efe_timestamp_ref=datetime.now(timezone.utc),
        efe_params_keplerian=json.dumps(params),
    )
    db.add(efe)
    return efe, True


def ensure_efemerides_for_operational_satellites(db: Session) -> int:
    """Cria efemérides faltantes para todos os satélites operacionais."""
    satelites = (
        db.query(Satelite)
        .filter(Satelite.sat_status == "operacional")
        .order_by(Satelite.sat_id)
        .all()
    )
    created = 0
    for sat in satelites:
        _, was_created = ensure_efemeride_for_satellite(db, sat)
        if was_created:
            created += 1
    if created:
        db.commit()
    return created
