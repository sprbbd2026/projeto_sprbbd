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


# ----------- Geocoding (Nominatim) -----------


async def geocode_search(query: str, db: Session, no_cache: bool = False) -> list[dict]:
    """Busca endereço por texto. Retorna lista de resultados com lat/lng/display_name."""
    normalized = query.strip().lower()
    query_hash = _hash_key(normalized)

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

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(
            f"{NOMINATIM_BASE_URL}/search",
            params={
                "q": query,
                "format": "json",
                "limit": 5,
                "countrycodes": "br",
                "addressdetails": 1,
            },
            headers={"User-Agent": USER_AGENT},
        )
        resp.raise_for_status()

    results = [
        {
            "display_name": item["display_name"],
            "lat": float(item["lat"]),
            "lng": float(item["lon"]),
            "type": item.get("type", ""),
            "address": item.get("address", {}),
        }
        for item in resp.json()
    ]

    new_cache = CacheGeocode(
        query_hash=query_hash,
        query_text=normalized[:500],
        response_json=json.dumps(results),
    )
    db.merge(new_cache)
    db.commit()

    return results


# ----------- Roteamento (OSRM) -----------


async def calcular_rota(
    waypoints: list[tuple[float, float]],
    db: Session,
    no_cache: bool = False,
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
                "steps": "false",
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
    }

    # Salva no cache
    new_cache = CacheRota(
        route_hash=route_hash,
        origin_lat=waypoints[0][0],
        origin_lng=waypoints[0][1],
        destination_lat=waypoints[-1][0],
        destination_lng=waypoints[-1][1],
        response_json=json.dumps(result),
    )
    db.merge(new_cache)
    db.commit()

    return result
