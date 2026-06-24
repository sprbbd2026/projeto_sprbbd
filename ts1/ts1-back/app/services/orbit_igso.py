"""Propagação orbital IGSO regional — mesmo modelo usado nas rotas do TS2."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone

MU_EARTH_KM3_S2 = 398_600.4418
R_EARTH_KM = 6_378.137
OMEGA_EARTH_RAD_S = 7.292_115_0e-5
SIDEREAL_DAY_SEC = 86_164.0905
A_SEMI_KM = 42_176.0


@dataclass(frozen=True)
class SatelliteOrbit:
    sat_id: str
    eccentricity: float
    inclination_deg: float
    raan_deg: float
    arg_perigee_deg: float
    M0_deg: float
    phase_offset_sec: float


FIGURE8_PHASE: dict[str, float] = {
    "1": 0.125,
    "2": 0.625,
    "3": 0.375,
    "4": 0.875,
    "5": 0.500,
}

RAAN_JITTER: dict[str, float] = {
    "1": -3.0,
    "2": -1.5,
    "3": 0.0,
    "4": 1.5,
    "5": 3.0,
}


def _phase_offset_sec(sat_id: str) -> float:
    frac = FIGURE8_PHASE.get(sat_id, 0.0)
    return frac * SIDEREAL_DAY_SEC


def _build_orbits() -> dict[str, SatelliteOrbit]:
    orbits: dict[str, SatelliteOrbit] = {}
    for sid in ("1", "2", "3", "4", "5"):
        orbits[sid] = SatelliteOrbit(
            sat_id=sid,
            eccentricity=0.078,
            inclination_deg=43.0,
            raan_deg=225.0 + RAAN_JITTER.get(sid, 0.0),
            arg_perigee_deg=90.0,
            M0_deg=0.0,
            phase_offset_sec=_phase_offset_sec(sid),
        )
    return orbits


SATELLITE_ORBITS: dict[str, SatelliteOrbit] = _build_orbits()


def _orbit_config(satelite_id: int | str) -> SatelliteOrbit:
    key = str(satelite_id)
    if key in SATELLITE_ORBITS:
        return SATELLITE_ORBITS[key]
    idx = (int(satelite_id) if str(satelite_id).isdigit() else 1) % 5 or 1
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


def _eci_state(a: float, e: float, inc: float, raan: float, argp: float, M: float):
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
    return r


def _eci_to_ecef(r_eci: tuple[float, float, float], t_sec: float):
    return _mat3_vec(_rot_z(OMEGA_EARTH_RAD_S * t_sec), r_eci)


def _ecef_to_geodetic(r: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = r
    lon = math.degrees(math.atan2(y, x))
    lat = math.degrees(math.atan2(z, math.hypot(x, y)))
    alt = math.sqrt(x * x + y * y + z * z) - R_EARTH_KM
    return lat, lon, max(alt, 0.0)


def posicao_em(satelite_id: int | str, instante: datetime) -> tuple[float, float, float]:
    """Retorna (lat, lng, alt_km) do subsatélite no instante informado (UTC)."""
    cfg = _orbit_config(satelite_id)
    if instante.tzinfo is None:
        instante = instante.replace(tzinfo=timezone.utc)
    else:
        instante = instante.astimezone(timezone.utc)

    epoch = instante.replace(hour=0, minute=0, second=0, microsecond=0)
    t_sec = cfg.phase_offset_sec + (instante - epoch).total_seconds()

    n = 2.0 * math.pi / SIDEREAL_DAY_SEC
    inc = math.radians(cfg.inclination_deg)
    raan = math.radians(cfg.raan_deg)
    argp = math.radians(cfg.arg_perigee_deg)
    M = math.radians(cfg.M0_deg) + n * t_sec

    r_eci = _eci_state(A_SEMI_KM, cfg.eccentricity, inc, raan, argp, M)
    return _ecef_to_geodetic(_eci_to_ecef(r_eci, t_sec))
