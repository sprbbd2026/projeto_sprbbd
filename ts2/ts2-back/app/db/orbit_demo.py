"""
Trilha IGSO regional — órbita inclinada geossíncrona (figura-8).

Referências:
- QZSS (Japão): IGSO, i≈43°, e≈0,075, período sidéreo (~23h56m), trilha em figura-8
  assimétrica com permanência prolongada sobre a região alvo.
- CelesTrak / geossíncrona inclinada: inclinação + excentricidade → analema (figura-8)
  no ponto subsatélite; amplitude latitudinal ≈ inclinação.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

TZ_BR = ZoneInfo("America/Sao_Paulo")

# Constantes físicas (Terra WGS84 simplificada)
MU_EARTH_KM3_S2 = 398_600.4418
R_EARTH_KM = 6_378.137
OMEGA_EARTH_RAD_S = 7.292_115_0e-5
SIDEREAL_DAY_SEC = 86_164.0905

DEMO_DAYS = 1
DEMO_INTERVAL_MINUTES = 30
DEMO_POINTS_PER_SAT = 24 * 2  # 48 pontos (00:00 … 23:30)

# IGSO tipo QZSS — ajustado para permanência sobre o hemisfério sul (Brasil)
A_SEMI_KM = (MU_EARTH_KM3_S2 * (SIDEREAL_DAY_SEC / (2 * math.pi)) ** 2) ** (1 / 3)
ECCENTRICITY = 0.078
INCLINATION_DEG = 33.0
ARG_PERIGEE_DEG = 90.0  # apogeu no hemisfério sul → maior permanência sobre o Brasil


@dataclass(frozen=True)
class SatelliteOrbit:
    sat_id: str
    lon_center_deg: float
    raan_deg: float
    M0_deg: float
    region: str


def _phase_offset_deg(sat_id: str) -> float:
    """Fase inicial pseudo-aleatória (reprodutível) — ponto de partida na figura-8."""
    h = hashlib.md5(f"igso-br-{sat_id}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF * 360.0


# Cinco slots longitudinais sobre o Brasil (RAAN calibrado para trilha figura-8 local)
SATELLITE_ORBITS: dict[str, SatelliteOrbit] = {
    "1": SatelliteOrbit("1", -65.0, 100.0, _phase_offset_deg("1"), "Amazônia"),
    "2": SatelliteOrbit("2", -40.0, 248.0, _phase_offset_deg("2"), "Nordeste"),
    "3": SatelliteOrbit("3", -55.0, 22.0, _phase_offset_deg("3"), "Centro-Oeste"),
    "4": SatelliteOrbit("4", -47.0, 244.0, _phase_offset_deg("4"), "Sudeste"),
    "5": SatelliteOrbit("5", -52.0, 340.0, _phase_offset_deg("5"), "Sul"),
}


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


def _eci_state(a: float, e: float, inc: float, raan: float, argp: float, M: float) -> tuple[tuple[float, float, float], tuple[float, float, float]]:
    """Posição e velocidade ECI (km, km/s) via elementos keplerianos."""
    E = _solve_kepler(M, e)
    nu = 2.0 * math.atan2(math.sqrt(1.0 + e) * math.sin(E / 2.0), math.sqrt(1.0 - e) * math.cos(E / 2.0))
    r_norm = a * (1.0 - e * math.cos(E))

    x_p = r_norm * math.cos(nu)
    y_p = r_norm * math.sin(nu)
    z_p = 0.0

    h = math.sqrt(MU_EARTH_KM3_S2 * a * (1.0 - e * e))
    vx_p = -(MU_EARTH_KM3_S2 / h) * math.sin(nu)
    vy_p = (MU_EARTH_KM3_S2 / h) * (e + math.cos(nu))
    vz_p = 0.0

    q = _mat3_mul(_rot_z(-raan), _mat3_mul(_rot_x(-inc), _rot_z(-argp)))
    r = _mat3_vec(q, (x_p, y_p, z_p))
    v = _mat3_vec(q, (vx_p, vy_p, vz_p))
    return r, v


def _eci_to_ecef(r_eci: tuple[float, float, float], t_sec: float) -> tuple[float, float, float]:
    theta = OMEGA_EARTH_RAD_S * t_sec
    return _mat3_vec(_rot_z(theta), r_eci)


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


def _subsatellite_at(
    cfg: SatelliteOrbit,
    t_sec: float,
) -> tuple[float, float, float, float]:
    """Retorna lat, lng, alt_km, vel_kmh no instante t (segundos desde epoch)."""
    n = 2.0 * math.pi / SIDEREAL_DAY_SEC
    inc = math.radians(INCLINATION_DEG)
    raan = math.radians(cfg.raan_deg)
    argp = math.radians(ARG_PERIGEE_DEG)
    M = math.radians(cfg.M0_deg) + n * t_sec

    r_eci, v_eci = _eci_state(A_SEMI_KM, ECCENTRICITY, inc, raan, argp, M)
    r_ecef = _eci_to_ecef(r_eci, t_sec)
    lat, lon, alt = _ecef_to_geodetic(r_ecef)

    # Velocidade aparente do ponto subsatélite (km/h)
    dt = 30.0
    r2_eci, _ = _eci_state(A_SEMI_KM, ECCENTRICITY, inc, raan, argp, M + n * dt)
    lat2, lon2, _ = _ecef_to_geodetic(_eci_to_ecef(r2_eci, t_sec + dt))
    dist_km = _haversine_km(lat, lon, lat2, lon2)
    vel_kmh = dist_km / (dt / 3600.0)

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

    out: list[tuple[float, float, float, float, datetime]] = []
    for i in range(num_points):
        momento = start + interval * i
        t_sec = (momento - epoch).total_seconds()
        lat, lon, alt, vel = _subsatellite_at(cfg, t_sec)
        out.append((round(lat, 6), round(lon, 6), round(alt, 1), round(vel, 1), momento))

    return out


def default_demo_window(now: datetime | None = None) -> tuple[datetime, datetime]:
    """Início e fim do dia corrente (horário de Brasília), em UTC."""
    ref = now or datetime.now(TZ_BR)
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=TZ_BR)
    else:
        ref = ref.astimezone(TZ_BR)

    inicio = ref.replace(hour=0, minute=0, second=0, microsecond=0)
    fim = inicio + timedelta(hours=23, minutes=30)
    return inicio.astimezone(timezone.utc), fim.astimezone(timezone.utc)
