"""Serviço de roteamento e geocoding usando OSRM e Nominatim."""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.orm import Session

from app.db.cache_models import CacheGeocode, CacheRota

logger = logging.getLogger(__name__)

OSRM_BASE_URL = "https://router.project-osrm.org"
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"

GEOCODE_CACHE_TTL_DAYS = 7
ROUTE_CACHE_TTL_HOURS = 24

HTTP_TIMEOUT = 10.0
USER_AGENT = "SPRB-BD-Academic-Project/1.0"


def _hash_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _round_coord(val: float, decimals: int = 4) -> float:
    return round(val, decimals)


def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula distância em km entre dois pontos usando Haversine."""
    import math
    
    to_rad = lambda deg: deg * math.pi / 180
    earth_radius_km = 6371
    
    d_lat = to_rad(lat2 - lat1)
    d_lng = to_rad(lng2 - lng1)
    lat1_rad = to_rad(lat1)
    lat2_rad = to_rad(lat2)
    
    a = (
        math.sin(d_lat / 2) ** 2 +
        math.sin(d_lng / 2) ** 2 * math.cos(lat1_rad) * math.cos(lat2_rad)
    )
    c = 2 * math.asin(math.sqrt(a))
    return earth_radius_km * c


# ----------- Geocoding (Nominatim) -----------


async def geocode_search(
    query: str,
    db: Session,
    no_cache: bool = False,
    lat: float | None = None,
    lng: float | None = None,
    max_distance_km: float = 500.0,
) -> list[dict]:
    """Busca endereço por texto com viewbox geográfico + filtro Haversine.
    
    Usa viewbox+bounded=1 do Nominatim para restringir resultados à região,
    e depois aplica filtro Haversine como safety net.
    """
    # Referência: usa coordenadas passadas ou fallback SJC
    reference_lat = lat if lat is not None else -23.1813
    reference_lng = lng if lng is not None else -45.8879

    # Calcula viewbox a partir do raio (graus aprox.)
    import math
    lat_delta = max_distance_km / 111.0
    lng_delta = max_distance_km / (111.0 * math.cos(math.radians(reference_lat)))
    viewbox = (
        f"{reference_lng - lng_delta},{reference_lat - lat_delta},"
        f"{reference_lng + lng_delta},{reference_lat + lat_delta}"
    )

    # Cache key inclui localização (resultados diferem por região)
    normalized = query.strip().lower()
    cache_key_str = f"{normalized}|{_round_coord(reference_lat, 1)}|{_round_coord(reference_lng, 1)}"
    query_hash = _hash_key(cache_key_str)

    if not no_cache:
        cached = (
            db.query(CacheGeocode)
            .filter(CacheGeocode.query_hash == query_hash)
            .first()
        )
        if cached:
            cutoff = datetime.now(timezone.utc) - timedelta(days=GEOCODE_CACHE_TTL_DAYS)
            if cached.created_at.replace(tzinfo=timezone.utc) > cutoff:
                return json.loads(cached.response_json)
            else:
                db.delete(cached)
                db.commit()

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(
                f"{NOMINATIM_BASE_URL}/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": 50,
                    "countrycodes": "br",
                    "addressdetails": 1,
                    "viewbox": viewbox,
                    "bounded": 1,
                },
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            raw_data = resp.json()
    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        logger.error(f"Nominatim error: {e}")
        return []
    except Exception as e:
        logger.error(f"Nominatim unexpected error: {e}")
        return []

    results = [
        {
            "display_name": item["display_name"],
            "lat": float(item["lat"]),
            "lng": float(item["lon"]),
            "type": item.get("type", ""),
            "address": item.get("address", {}),
        }
        for item in raw_data
    ]

    # Filtro Haversine como safety net (viewbox é retangular, queremos circular)
    results = [
        r for r in results
        if _haversine_distance(reference_lat, reference_lng, r["lat"], r["lng"]) <= max_distance_km
    ]

    _upsert_geocode_cache(db, query_hash, normalized[:500], results)

    return results


def _upsert_geocode_cache(
    db: Session,
    query_hash: str,
    query_text: str,
    results: list[dict],
) -> None:
    payload = json.dumps(results)
    existing = (
        db.query(CacheGeocode)
        .filter(CacheGeocode.query_hash == query_hash)
        .first()
    )
    if existing:
        existing.query_text = query_text
        existing.response_json = payload
        existing.created_at = datetime.now(timezone.utc)
    else:
        db.add(
            CacheGeocode(
                query_hash=query_hash,
                query_text=query_text,
                response_json=payload,
            )
        )
    db.commit()


def _upsert_route_cache(
    db: Session,
    route_hash: str,
    waypoints: list[tuple[float, float]],
    result: dict,
) -> None:
    payload = json.dumps(result)
    existing = (
        db.query(CacheRota)
        .filter(CacheRota.route_hash == route_hash)
        .first()
    )
    if existing:
        existing.origin_lat = waypoints[0][0]
        existing.origin_lng = waypoints[0][1]
        existing.destination_lat = waypoints[-1][0]
        existing.destination_lng = waypoints[-1][1]
        existing.response_json = payload
        existing.created_at = datetime.now(timezone.utc)
    else:
        db.add(
            CacheRota(
                route_hash=route_hash,
                origin_lat=waypoints[0][0],
                origin_lng=waypoints[0][1],
                destination_lat=waypoints[-1][0],
                destination_lng=waypoints[-1][1],
                response_json=payload,
            )
        )
    db.commit()


# ----------- Roteamento (OSRM) -----------


def _format_maneuver_pt(maneuver: dict, street: str) -> str:
    """Converte manobra OSRM para instrução em português."""
    mtype = maneuver.get("type", "")
    modifier = maneuver.get("modifier", "") or ""
    street_part = f" em {street}" if street else ""

    if mtype == "depart":
        return f"Siga em frente{street_part}" if not modifier else f"Inicie{street_part}"
    if mtype == "arrive":
        return "Você chegou ao destino"
    if mtype == "turn":
        mapping = {
            "left": f"Vire à esquerda{street_part}",
            "right": f"Vire à direita{street_part}",
            "slight left": f"Mantenha-se à esquerda{street_part}",
            "slight right": f"Mantenha-se à direita{street_part}",
            "sharp left": f"Vire acentuadamente à esquerda{street_part}",
            "sharp right": f"Vire acentuadamente à direita{street_part}",
            "uturn": f"Faça retorno{street_part}",
        }
        return mapping.get(modifier, f"Vire{street_part}")
    if mtype in ("continue", "new name"):
        return f"Continue{street_part}"
    if mtype == "merge":
        return f"Entre na via{street_part}"
    if mtype in ("on ramp", "off ramp"):
        return f"Pegue a rampa{street_part}"
    if mtype == "fork":
        if modifier == "left":
            return f"Mantenha-se à esquerda na bifurcação{street_part}"
        if modifier == "right":
            return f"Mantenha-se à direita na bifurcação{street_part}"
        return f"Siga na bifurcação{street_part}"
    if mtype == "roundabout":
        return f"Na rotatória, siga pela saída{street_part}"
    if mtype == "rotary":
        return f"Na rotatória, siga em frente{street_part}"
    if mtype == "end of road":
        if modifier == "left":
            return f"No fim da via, vire à esquerda{street_part}"
        if modifier == "right":
            return f"No fim da via, vire à direita{street_part}"
    return f"Siga em frente{street_part}"


def _extract_steps(route: dict) -> list[dict]:
    steps: list[dict] = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            maneuver = step.get("maneuver", {})
            loc = maneuver.get("location", [0.0, 0.0])
            street = step.get("name") or ""
            steps.append({
                "instruction": _format_maneuver_pt(maneuver, street),
                "maneuver_type": maneuver.get("type", ""),
                "maneuver_modifier": maneuver.get("modifier"),
                "distance_m": round(float(step.get("distance", 0))),
                "duration_s": round(float(step.get("duration", 0))),
                "lat": float(loc[1]),
                "lng": float(loc[0]),
                "street": street,
            })
    return steps


async def calcular_rota(
    waypoints: list[tuple[float, float]],
    db: Session,
    no_cache: bool = False,
    include_steps: bool = False,
) -> dict:
    """Calcula rota de carro entre waypoints usando OSRM.

    Args:
        waypoints: lista de (lat, lng) com pelo menos 2 pontos.
        db: sessão do banco.
        no_cache: bypass do cache (para benchmark real).

    Returns:
        dict com geometry (lista de [lat, lng]), distance_km, duration_min, legs.
    """
    rounded = [(_round_coord(lat), _round_coord(lng)) for lat, lng in waypoints]
    route_key = ";".join(f"{lat},{lng}" for lat, lng in rounded)
    if include_steps:
        route_key += "|steps"
    route_hash = _hash_key(route_key)

    if not no_cache:
        cached = (
            db.query(CacheRota)
            .filter(CacheRota.route_hash == route_hash)
            .first()
        )
        if cached:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=ROUTE_CACHE_TTL_HOURS)
            if cached.created_at.replace(tzinfo=timezone.utc) > cutoff:
                return json.loads(cached.response_json)
            else:
                db.delete(cached)
                db.commit()

    # OSRM usa formato lng,lat (invertido)
    coords_str = ";".join(f"{lng},{lat}" for lat, lng in waypoints)
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coords_str}"

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(
            url,
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "true" if include_steps else "false",
            },
            headers={"User-Agent": USER_AGENT},
        )
        resp.raise_for_status()

    data = resp.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        return {
            "geometry": [],
            "distance_km": 0,
            "duration_min": 0,
            "legs": [],
            "steps": [],
            "error": data.get("message", "Rota não encontrada"),
        }

    route = data["routes"][0]

    # GeoJSON coordinates são [lng, lat], convertemos para [lat, lng]
    geometry = [
        [coord[1], coord[0]]
        for coord in route["geometry"]["coordinates"]
    ]

    legs = []
    for leg in route["legs"]:
        legs.append({
            "distance_km": round(leg["distance"] / 1000, 2),
            "duration_min": round(leg["duration"] / 60, 1),
        })

    result = {
        "geometry": geometry,
        "distance_km": round(route["distance"] / 1000, 2),
        "duration_min": round(route["duration"] / 60, 1),
        "legs": legs,
        "steps": _extract_steps(route) if include_steps else [],
    }

    _upsert_route_cache(db, route_hash, waypoints, result)

    return result
