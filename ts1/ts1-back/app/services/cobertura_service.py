import json
import logging
import math
import random
from datetime import datetime, timezone, timedelta

import numpy as np
from shapely.geometry import Point, Polygon, mapping
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

logger = logging.getLogger(__name__)


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

    # Simula efeméride recebida há poucos minutos
    delta_t_s = random.uniform(2 * 60, 8 * 60)

    lat, lng, alt = _keplerian_para_latLngAlt(params, delta_t_s)
    footprint_coords = _calcular_footprint(lat, lng, alt)

    from shapely.geometry import Polygon
    poly = Polygon(footprint_coords)
    clipped = _clipar_brasil(poly)

    return {
        "sat_id": efe.sat_id,
        "posicao": {"lat": round(lat, 4), "lng": round(lng, 4), "alt_km": round(alt, 1)},
        "footprint": mapping(clipped) if not clipped.is_empty else None,
    }


def propagar_posicao_historica(db: Session, sat_id: int, target_ts: datetime) -> dict | None:
    """Propaga efemeride mais proxima ate target_ts e retorna posicao calculada.

    Args:
        db: sessao do banco de dados.
        sat_id: ID do satelite.
        target_ts: instante alvo para o calculo da posicao (datetime aware).

    Returns:
        dict {"lat": float, "lng": float, "alt_km": float, "fonte_efe_id": int}
        ou None se nao existir efemeride para o satelite.
    """
    efe = (
        db.query(Efemeride)
        .filter(
            Efemeride.sat_id == sat_id,
            Efemeride.efe_timestamp_ref <= target_ts,
        )
        .order_by(Efemeride.efe_timestamp_ref.desc())
        .first()
    )

    if efe is None:
        efe = (
            db.query(Efemeride)
            .filter(
                Efemeride.sat_id == sat_id,
                Efemeride.efe_timestamp_ref > target_ts,
            )
            .order_by(Efemeride.efe_timestamp_ref.asc())
            .first()
        )

    if efe is None:
        return None

    if efe.efe_params_keplerian is None:
        logger.warning(
            "efe_params_keplerian nulo para efe_id=%s sat_id=%s",
            efe.efe_id, efe.sat_id,
        )
        return None

    try:
        params = json.loads(efe.efe_params_keplerian)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning(
            "JSON invalido em efe_params_keplerian para efe_id=%s sat_id=%s: %s",
            efe.efe_id, efe.sat_id, exc,
        )
        return None
    delta_t_s = (target_ts - efe.efe_timestamp_ref).total_seconds()

    lat, lng, alt = _keplerian_para_latLngAlt(params, delta_t_s)

    return {
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "alt_km": round(alt, 2),
        "fonte_efe_id": efe.efe_id,
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

    uniao = _clipar_brasil(unary_union(poligonos))
    features.append({
        "type": "Feature",
        "properties": {"tipo": "cobertura_total", "con_id": con_id},
        "geometry": mapping(uniao) if not uniao.is_empty else None,
    })

    return {"type": "FeatureCollection", "features": features}


# ---------------------------------------------------------------------------
# US308 — Identificar qual satélite atende uma determinada região
# ---------------------------------------------------------------------------


def _propagar_posicao(efe: "Efemeride") -> tuple[float, float, float, Polygon]:
    """Propaga a órbita e devolve (lat, lng, alt, footprint_geodesico_completo).

    O footprint retornado NÃO é recortado no Brasil: representa a área real
    coberta pelo satélite no solo. É usado pela descoberta de qual satélite
    atende uma região (US308 - Cenário 3).
    """
    params = json.loads(efe.efe_params_keplerian)

    # Simula efeméride recebida há poucos minutos
    delta_t_s = random.uniform(2 * 60, 8 * 60)

    lat, lng, alt = _keplerian_para_latLngAlt(params, delta_t_s)
    footprint_coords = _calcular_footprint(lat, lng, alt)
    return lat, lng, alt, Polygon(footprint_coords)


# Regiões do Brasil com um ponto representativo (centroide aproximado) cada.
# Permite que o PO consulte a cobertura por nome de região, sem precisar saber
# as coordenadas exatas.
REGIOES_BRASIL = {
    "norte": {"nome": "Norte", "lat": -3.4, "lng": -62.2},
    "nordeste": {"nome": "Nordeste", "lat": -9.0, "lng": -40.0},
    "centro_oeste": {"nome": "Centro-Oeste", "lat": -15.6, "lng": -56.1},
    "sudeste": {"nome": "Sudeste", "lat": -20.5, "lng": -45.0},
    "sul": {"nome": "Sul", "lat": -27.5, "lng": -51.0},
}


def listar_regioes() -> list[dict]:
    """Lista as regiões do Brasil disponíveis para consulta de cobertura."""
    return [{"id": chave, **dados} for chave, dados in REGIOES_BRASIL.items()]


def satelites_que_atendem_regiao(db: Session, lat: float, lng: float) -> list[dict]:
    """Retorna os satélites operacionais cujo footprint cobre o ponto (lat, lng).

    Propaga cada satélite operacional com efeméride e testa se o ponto
    consultado está dentro da área de cobertura no solo.
    """
    ponto = Point(lng, lat)

    satelites = (
        db.query(Satelite)
        .filter(Satelite.sat_status == "operacional")
        .order_by(Satelite.sat_id)
        .all()
    )

    cobrindo: list[dict] = []
    for sat in satelites:
        efe = (
            db.query(Efemeride)
            .filter(Efemeride.sat_id == sat.sat_id)
            .order_by(Efemeride.efe_timestamp_ref.desc())
            .first()
        )
        if not efe:
            continue

        s_lat, s_lng, s_alt, footprint = _propagar_posicao(efe)
        if footprint.is_empty or not footprint.intersects(ponto):
            continue

        cobrindo.append({
            "sat_id": sat.sat_id,
            "con_id": sat.con_id,
            "sat_status": sat.sat_status,
            "posicao": {
                "lat": round(s_lat, 4),
                "lng": round(s_lng, 4),
                "alt_km": round(s_alt, 1),
            },
        })

    return cobrindo


def cobertura_por_regiao(
    db: Session,
    regiao: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> dict:
    """US308 — identifica o(s) satélite(s) que atende(m) uma região monitorada.

    Aceita o nome de uma região do Brasil (`regiao`) OU um par de coordenadas
    (`lat`, `lng`). Devolve as informações de cobertura, incluindo o satélite
    associado (Cenário 3) e a posição de cada satélite no momento da consulta.
    """
    regiao_info: dict | None = None

    if regiao:
        chave = regiao.strip().lower()
        if chave not in REGIOES_BRASIL:
            disponiveis = ", ".join(REGIOES_BRASIL.keys())
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Região '{regiao}' não encontrada. Regiões disponíveis: {disponiveis}.",
            )
        dados = REGIOES_BRASIL[chave]
        lat, lng = dados["lat"], dados["lng"]
        regiao_info = {"id": chave, **dados}
    elif lat is not None and lng is not None:
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordenadas fora dos limites válidos (lat -90..90, lng -180..180).",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe 'regiao' (nome) ou 'lat' e 'lng'.",
        )

    satelites = satelites_que_atendem_regiao(db, lat, lng)

    return {
        "regiao": regiao_info,
        "ponto": {"lat": lat, "lng": lng},
        "coberta": len(satelites) > 0,
        "total": len(satelites),
        "satelites": satelites,
    }
