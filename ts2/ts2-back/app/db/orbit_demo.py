"""
Trilha IGSO regional — padrão QZSS (figura-8 assimétrica sobre o Brasil).

Modelo: órbita inclinada geossíncrona (IGSO), como o QZSS japonês:
  - a ≈ 42.176 km, e ≈ 0,07–0,10, i ≈ 43°, ω ≈ 90° (permanência no hemisfério sul)
  - Trilha em figura-8 assimétrica (laço sul maior que o laço norte)
  - Cada satélite com elementos ligeiramente distintos (planos deslocados ~1°–2°)
  - Propagação kepleriana → ponto subsatélite (lat/lng/alt/vel)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

TZ_BR = ZoneInfo("America/Sao_Paulo")

MU_EARTH_KM3_S2 = 398_600.4418
R_EARTH_KM = 6_378.137
OMEGA_EARTH_RAD_S = 7.292_115_0e-5
SIDEREAL_DAY_SEC = 86_164.0905

DEMO_DAYS = 10
DEMO_INTERVAL_MINUTES = 30
DEMO_POINTS_PER_SAT = DEMO_DAYS * 24 * 2  # 480 pontos (10 dias × 48/dia)

A_SEMI_KM = 42_176.0  # semi-eixo maior geossíncrono (QZSS)


@dataclass(frozen=True)
class SatelliteOrbit:
    sat_id: str
    region: str
    eccentricity: float
    inclination_deg: float
    raan_deg: float
    arg_perigee_deg: float
    M0_deg: float
    phase_offset_sec: float  # fase inicial pseudo-aleatória na figura-8


# Posição inicial na figura-8 (fração do período sidéreo) — espalhados pelo laço
# 1=topo, 2=base, 3=meio-esquerda, 4=meio-direita, 5=cruzamento
FIGURE8_PHASE: dict[str, float] = {
    "1": 0.125,
    "2": 0.625,
    "3": 0.375,
    "4": 0.875,
    "5": 0.500,
}

# Pequeno deslocamento de plano orbital (entrelaçamento estilo QZSS)
RAAN_JITTER: dict[str, float] = {
    "1": -3.0,
    "2": -1.5,
    "3": 0.0,
    "4": 1.5,
    "5": 3.0,
}

BASE_ECCENTRICITY = 0.078
BASE_INCLINATION = 43.0
BASE_RAAN = 225.0
BASE_ARG_PERIGEE = 90.0


def _phase_offset_sec(sat_id: str) -> float:
    frac = FIGURE8_PHASE.get(sat_id, 0.0)
    return frac * SIDEREAL_DAY_SEC


def _build_orbits() -> dict[str, SatelliteOrbit]:
    regions = {
        "1": "Amazônia",
        "2": "Nordeste",
        "3": "Centro-Oeste",
        "4": "Sudeste",
        "5": "Sul",
    }
    orbits: dict[str, SatelliteOrbit] = {}
    for sid, region in regions.items():
        orbits[sid] = SatelliteOrbit(
            sat_id=sid,
            region=region,
            eccentricity=BASE_ECCENTRICITY,
            inclination_deg=BASE_INCLINATION,
            raan_deg=BASE_RAAN + RAAN_JITTER.get(sid, 0.0),
            arg_perigee_deg=BASE_ARG_PERIGEE,
            M0_deg=0.0,
            phase_offset_sec=_phase_offset_sec(sid),
        )
    return orbits


SATELLITE_ORBITS: dict[str, SatelliteOrbit] = _build_orbits()


def _orbit_config(satelite_id: str) -> SatelliteOrbit:
    if satelite_id in SATELLITE_ORBITS:
        return SATELLITE_ORBITS[satelite_id]
    idx = (int(satelite_id) if satelite_id.isdigit() else 1) % 5 or 1
    return SATELLITE_ORBITS[str(idx)]


def _mat3_mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def _mat3_vec(m: list[list[float]], v: tuple[float, float, float]) -> tuple[float, float, float]:
    return tuple(sum(m[i][j] * v[j] for j in range(3)) for i in range(3))


def _rot_z(angle: float) -> list[list[float]]:
    c, s = math.cos(angle), math.sin(angle)
    return [[c, s, 0.0], [-s, c, 0.0], [0.0, 0.0, 1.0]]


def _rot_x(angle: float) -> list[list[float]]:
    c, s = math.cos(angle), math.sin(angle)
    return [[1.0, 0.0, 0.0], [0.0, c, s], [0.0, -s, c]]


def _solve_kepler(M: float, e: float, tol: float = 1e-10) -> float:
    E = M
    for _ in range(50):
        dE = (E - e * math.sin(E) - M) / (1.0 - e * math.cos(E))
        E -= dE
        if abs(dE) < tol:
            break
    return E


def _eci_state(
    a: float,
    e: float,
    inc: float,
    raan: float,
    argp: float,
    M: float,
) -> tuple[tuple[float, float, float], tuple[float, float, float]]:
    E = _solve_kepler(M, e)
    nu = 2.0 * math.atan2(
        math.sqrt(1.0 + e) * math.sin(E / 2.0),
        math.sqrt(1.0 - e) * math.cos(E / 2.0),
    )
    r_norm = a * (1.0 - e * math.cos(E))

    x_p = r_norm * math.cos(nu)
    y_p = r_norm * math.sin(nu)

    h = math.sqrt(MU_EARTH_KM3_S2 * a * (1.0 - e * e))
    vx_p = -(MU_EARTH_KM3_S2 / h) * math.sin(nu)
    vy_p = (MU_EARTH_KM3_S2 / h) * (e + math.cos(nu))

    q = _mat3_mul(_rot_z(-raan), _mat3_mul(_rot_x(-inc), _rot_z(-argp)))
    r = _mat3_vec(q, (x_p, y_p, 0.0))
    v = _mat3_vec(q, (vx_p, vy_p, 0.0))
    return r, v


def _eci_to_ecef(r_eci: tuple[float, float, float], t_sec: float) -> tuple[float, float, float]:
    return _mat3_vec(_rot_z(OMEGA_EARTH_RAD_S * t_sec), r_eci)


def _ecef_to_geodetic(r: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = r
    lon = math.degrees(math.atan2(y, x))
    lat = math.degrees(math.atan2(z, math.hypot(x, y)))
    alt = math.sqrt(x * x + y * y + z * z) - R_EARTH_KM
    return lat, lon, alt


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R_EARTH_KM * math.asin(min(1.0, math.sqrt(a)))


def _subsatellite_at(cfg: SatelliteOrbit, t_sec: float) -> tuple[float, float, float, float]:
    n = 2.0 * math.pi / SIDEREAL_DAY_SEC
    inc = math.radians(cfg.inclination_deg)
    raan = math.radians(cfg.raan_deg)
    argp = math.radians(cfg.arg_perigee_deg)
    M = math.radians(cfg.M0_deg) + n * t_sec

    r_eci, _ = _eci_state(A_SEMI_KM, cfg.eccentricity, inc, raan, argp, M)
    lat, lon, alt = _ecef_to_geodetic(_eci_to_ecef(r_eci, t_sec))

    dt = 30.0
    M2 = M + n * dt
    r2_eci, _ = _eci_state(A_SEMI_KM, cfg.eccentricity, inc, raan, argp, M2)
    lat2, lon2, _ = _ecef_to_geodetic(_eci_to_ecef(r2_eci, t_sec + dt))
    vel_kmh = _haversine_km(lat, lon, lat2, lon2) / (dt / 3600.0)

    return lat, lon, alt, vel_kmh


def generate_orbit_points(
    satelite_id: str,
    start: datetime,
    end: datetime | None = None,
    num_points: int = DEMO_POINTS_PER_SAT,
) -> list[tuple[float, float, float, float, datetime]]:
    cfg = _orbit_config(satelite_id)

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    else:
        start = start.astimezone(timezone.utc)

    epoch = start
    interval = timedelta(minutes=DEMO_INTERVAL_MINUTES)
    t0 = cfg.phase_offset_sec

    out: list[tuple[float, float, float, float, datetime]] = []
    for i in range(num_points):
        momento = start + interval * i
        t_sec = t0 + (momento - epoch).total_seconds()
        lat, lon, alt, vel = _subsatellite_at(cfg, t_sec)
        out.append((round(lat, 6), round(lon, 6), round(alt, 1), round(vel, 1), momento))

    return out


def default_demo_window(now: datetime | None = None) -> tuple[datetime, datetime]:
    """10 dias incluindo hoje (00:00 → 23:30, horário de Brasília), em UTC."""
    ref = now or datetime.now(TZ_BR)
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=TZ_BR)
    else:
        ref = ref.astimezone(TZ_BR)

    fim = ref.replace(hour=23, minute=30, second=0, microsecond=0)
    inicio = ref.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=DEMO_DAYS - 1)
    return inicio.astimezone(timezone.utc), fim.astimezone(timezone.utc)
