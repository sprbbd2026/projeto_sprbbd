"""Modelos de cache para geocoding e rotas (OSRM/Nominatim)."""

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class CacheGeocode(Base):
    """Cache de resultados de geocoding (Nominatim)."""

    __tablename__ = "CACHE_GEOCODE"

    id = Column("cgeo_id", Integer, primary_key=True, index=True)
    query_hash = Column("cgeo_query_hash", String(64), unique=True, nullable=False, index=True)
    query_text = Column("cgeo_query_text", String(500), nullable=False)
    response_json = Column("cgeo_response_json", Text, nullable=False)
    created_at = Column(
        "cgeo_created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class CacheRota(Base):
    """Cache de resultados de cálculo de rota (OSRM)."""

    __tablename__ = "CACHE_ROTA"

    id = Column("crot_id", Integer, primary_key=True, index=True)
    route_hash = Column("crot_route_hash", String(64), unique=True, nullable=False, index=True)
    origin_lat = Column("crot_origin_lat", Float, nullable=False)
    origin_lng = Column("crot_origin_lng", Float, nullable=False)
    destination_lat = Column("crot_destination_lat", Float, nullable=False)
    destination_lng = Column("crot_destination_lng", Float, nullable=False)
    response_json = Column("crot_response_json", Text, nullable=False)
    created_at = Column(
        "crot_created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
