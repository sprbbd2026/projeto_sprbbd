import json
import math
import random
from datetime import datetime, timezone, timedelta

import numpy as np
from shapely.geometry import Point, mapping
from shapely.ops import unary_union

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Satelite, Efemeride

# Constantes orbitais
GM = 398600.4418  # km³/s²
R_TERRA = 6371.0  # km
ANGULO_ELEVACAO_MIN = math.radians(5)  # 5° mínimo de elevação

# Bounding box Brasil com +2° de margem
BRASIL_BBOX = {
    "lat_min": -36.0,
    "lat_max": 7.0,
    "lng_min": -76.0,
    "lng_max": -32.0,
}


def _resolver_kepler(M: float, e: float, tol: float = 1e-10) -> float:
    """Resolve equação de Kepler M = E - e*sin(E) para E (anomalia excêntrica)."""
    E = M
    for _ in range(100):
        dE = (M - E + e * math.sin(E)) / (1 - e * math.cos(E))
        E += dE
        if abs(dE) < tol:
            break
    return E


def _keplerian_para_latLngAlt(params: dict, delta_t_s: float) -> tuple[float, float, float]:
    """Propaga elementos Keplerianos por delta_t_s segundos e retorna (lat_deg, lng_deg, alt_km)."""
    a = params["a"]       # km
    e = params["e"]
    i = math.radians(params["i"])
    omega = math.radians(params["omega"])  # RAAN
    w = math.radians(params["w"])          # argumento do perigeu
    M0 = math.radians(params["M0"])

    # Movimento médio
    n = math.sqrt(GM / a**3)  # rad/s

    # Propaga anomalia média
    M = (M0 + n * delta_t_s) % (2 * math.pi)

    # Resolve Kepler
    E = _resolver_kepler(M, e)

    # Anomalia verdadeira
    nu = 2 * math.atan2(
        math.sqrt(1 + e) * math.sin(E / 2),
        math.sqrt(1 - e) * math.cos(E / 2)
    )

    # Raio orbital
    r = a * (1 - e * math.cos(E))

    # Posição no plano orbital
    x_orb = r * math.cos(nu)
    y_orb = r * math.sin(nu)

    # Rotação para ECI
    cos_w, sin_w = math.cos(w), math.sin(w)
    cos_i, sin_i = math.cos(i), math.sin(i)
    cos_o, sin_o = math.cos(omega), math.sin(omega)

    # Matriz de rotação orbital → ECI
    x_eci = (cos_o * cos_w - sin_o * sin_w * cos_i) * x_orb + (-cos_o * sin_w - sin_o * cos_w * cos_i) * y_orb
    y_eci = (sin_o * cos_w + cos_o * sin_w * cos_i) * x_orb + (-sin_o * sin_w + cos_o * cos_w * cos_i) * y_orb
    z_eci = (sin_i * sin_w) * x_orb + (sin_i * cos_w) * y_orb

    # ECI → ECEF (rotação pela Terra, simplificado: assumindo GMST ~ dt * 7.2921e-5)
    theta = delta_t_s * 7.2921150e-5  # rad/s rotação Terra
    x_ecef = x_eci * math.cos(theta) + y_eci * math.sin(theta)
    y_ecef = -x_eci * math.sin(theta) + y_eci * math.cos(theta)
    z_ecef = z_eci

    # ECEF → lat/lng/alt
    rxy = math.sqrt(x_ecef**2 + y_ecef**2)
    lat = math.degrees(math.atan2(z_ecef, rxy))
    lng = math.degrees(math.atan2(y_ecef, x_ecef))
    alt = math.sqrt(x_ecef**2 + y_ecef**2 + z_ecef**2) - R_TERRA

    return lat, lng, alt


def _calcular_footprint(lat: float, lng: float, alt: float, n_pontos: int = 72) -> list[list[float]]:
    """Calcula polígono do footprint (círculo geodésico) no solo."""
    # Raio de cobertura angular
    rho = math.acos(R_TERRA / (R_TERRA + alt)) - ANGULO_ELEVACAO_MIN
    rho_deg = math.degrees(rho)

    coords = []
    for k in range(n_pontos + 1):
        azimute = math.radians(k * 360 / n_pontos)
        lat_p = math.degrees(math.asin(
            math.sin(math.radians(lat)) * math.cos(rho) +
            math.cos(math.radians(lat)) * math.sin(rho) * math.cos(azimute)
        ))
        lng_p = lng + math.degrees(math.atan2(
            math.sin(azimute) * math.sin(rho) * math.cos(math.radians(lat)),
            math.cos(rho) - math.sin(math.radians(lat)) * math.sin(math.radians(lat_p))
        ))
        coords.append([lng_p, lat_p])
    return coords


def _clipar_brasil(polygon):
    """Clipa polígono no bounding box do Brasil."""
    from shapely.geometry import box
    brasil = box(
        BRASIL_BBOX["lng_min"], BRASIL_BBOX["lat_min"],
        BRASIL_BBOX["lng_max"], BRASIL_BBOX["lat_max"]
    )
    return polygon.intersection(brasil)


def _propagar_satelite(efe: "Efemeride") -> dict:
    """Propaga órbita do satélite e retorna posição + footprint."""
    params = json.loads(efe.efe_params_keplerian)

    if "fixed_lat" in params and "fixed_lng" in params:
        lat = params["fixed_lat"]
        lng = params["fixed_lng"]
        alt = params.get("fixed_alt", 1200.0)
    else:
        # Simula efeméride recebida há poucos minutos
        delta_t_s = random.uniform(2 * 60, 8 * 60)
        lat, lng, alt = _keplerian_para_latLngAlt(params, delta_t_s)

    footprint_coords = _calcular_footprint(lat, lng, alt)

    from shapely.geometry import Polygon
    poly = Polygon(footprint_coords)

    return {
        "sat_id": efe.sat_id,
        "posicao": {"lat": round(lat, 4), "lng": round(lng, 4), "alt_km": round(alt, 1)},
        "footprint": mapping(poly) if not poly.is_empty else None,
    }



def cobertura_satelite(db: Session, sat_id: int) -> dict:
    efe = (
        db.query(Efemeride)
        .filter(Efemeride.sat_id == sat_id)
        .order_by(Efemeride.efe_timestamp_ref.desc())
        .first()
    )
    if not efe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Efeméride não encontrada para este satélite.")

    resultado = _propagar_satelite(efe)
    return {"type": "FeatureCollection", "features": [
        {
            "type": "Feature",
            "properties": {"sat_id": resultado["sat_id"], "posicao": resultado["posicao"]},
            "geometry": resultado["footprint"],
        }
    ]}


def cobertura_constelacao(db: Session, con_id: int) -> dict:
    satelites = (
        db.query(Satelite)
        .filter(Satelite.con_id == con_id, Satelite.sat_status == "operacional")
        .all()
    )
    if not satelites:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhum satélite operacional nesta constelação.")

    features = []
    poligonos = []

    for sat in satelites:
        efe = (
            db.query(Efemeride)
            .filter(Efemeride.sat_id == sat.sat_id)
            .order_by(Efemeride.efe_timestamp_ref.desc())
            .first()
        )
        if not efe:
            continue

        resultado = _propagar_satelite(efe)
        features.append({
            "type": "Feature",
            "properties": {"sat_id": resultado["sat_id"], "posicao": resultado["posicao"]},
            "geometry": resultado["footprint"],
        })

        if resultado["footprint"]:
            from shapely.geometry import shape
            poligonos.append(shape(resultado["footprint"]))

    if not poligonos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma efeméride disponível para os satélites da constelação.")

    uniao = unary_union(poligonos)
    features.append({
        "type": "Feature",
        "properties": {"tipo": "cobertura_total", "con_id": con_id},
        "geometry": mapping(uniao) if not uniao.is_empty else None,
    })

    return {"type": "FeatureCollection", "features": features}
