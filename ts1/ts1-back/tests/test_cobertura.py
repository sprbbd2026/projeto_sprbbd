import json
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import get_db
from app.db.models import Efemeride, Satelite
from app.dependencies import get_current_user
from app.main import app
from app.services import cobertura_service

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# delta_t fixo torna a propagação orbital determinística nos testes.
DELTA_FIXO = 300.0
# Órbita baixa, baixa inclinação -> footprint pequeno e sem distorção polar.
PARAMS_ORBITA = {"a": 7000.0, "e": 0.001, "i": 10.0, "omega": 40.0, "w": 0.0, "M0": 0.0}


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _mock_current_user():
    return object()


@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    Efemeride.__table__.drop(bind=engine, checkfirst=True)
    Satelite.__table__.drop(bind=engine, checkfirst=True)
    Satelite.__table__.create(bind=engine)
    Efemeride.__table__.create(bind=engine)

    # Propagação determinística: fixa o delta_t aleatório do serviço.
    monkeypatch.setattr(cobertura_service.random, "uniform", lambda a, b: DELTA_FIXO)

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.clear()


def _seed_sat_com_efemeride(params: dict, sat_status: str = "operacional") -> int:
    db = TestingSessionLocal()
    try:
        sat = Satelite(sat_status=sat_status)
        db.add(sat)
        db.flush()
        efe = Efemeride(
            sat_id=sat.sat_id,
            efe_timestamp_ref=datetime.now(timezone.utc),
            efe_params_keplerian=json.dumps(params),
        )
        db.add(efe)
        db.commit()
        return sat.sat_id
    finally:
        db.close()


def _ponto_sob_satelite() -> tuple[float, float]:
    """Ponto sub-satélite (centro do footprint) para o delta_t fixo dos testes."""
    lat, lng, _alt = cobertura_service._keplerian_para_latLngAlt(
        PARAMS_ORBITA, DELTA_FIXO
    )
    return lat, lng


@pytest.mark.asyncio
async def test_listar_regioes_retorna_as_cinco_regioes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regioes")
    assert resp.status_code == 200
    ids = {r["id"] for r in resp.json()}
    assert {"norte", "nordeste", "centro_oeste", "sudeste", "sul"} <= ids


@pytest.mark.asyncio
async def test_regiao_inexistente_retorna_404():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao", params={"regiao": "atlantida"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sem_parametros_retorna_400():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_coordenadas_invalidas_retorna_400():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao", params={"lat": 120, "lng": 0})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_regiao_coberta_apresenta_satelite_associado():
    # Cenário 3: dada a região monitorada (ponto sob o satélite),
    # o sistema apresenta o satélite associado.
    sat_id = _seed_sat_com_efemeride(PARAMS_ORBITA)
    lat, lng = _ponto_sob_satelite()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao", params={"lat": lat, "lng": lng})

    assert resp.status_code == 200
    data = resp.json()
    assert data["coberta"] is True
    assert data["total"] >= 1
    assert sat_id in [s["sat_id"] for s in data["satelites"]]
    sat = next(s for s in data["satelites"] if s["sat_id"] == sat_id)
    assert {"lat", "lng", "alt_km"} <= set(sat["posicao"].keys())


@pytest.mark.asyncio
async def test_regiao_sem_cobertura_retorna_vazio():
    _seed_sat_com_efemeride(PARAMS_ORBITA)
    lat, lng = _ponto_sob_satelite()

    anti_lat = -lat
    anti_lng = lng + 180.0
    if anti_lng > 180.0:
        anti_lng -= 360.0

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/cobertura/regiao", params={"lat": anti_lat, "lng": anti_lng}
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["coberta"] is False
    assert data["satelites"] == []


@pytest.mark.asyncio
async def test_consulta_com_instante_usa_mesmo_raio_visual_do_ts2(monkeypatch):
    _seed_sat_com_efemeride(PARAMS_ORBITA)
    monkeypatch.setattr(
        cobertura_service,
        "posicao_igso_em",
        lambda sat_id, instante: (0.0, 0.0, 35786.0),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        centro = await client.get(
            "/cobertura/regiao",
            params={"lat": 0.0, "lng": 0.0, "instante": "2026-01-01T00:00:00Z"},
        )
        fora_do_raio_desenhado = await client.get(
            "/cobertura/regiao",
            params={"lat": 0.0, "lng": 20.0, "instante": "2026-01-01T00:00:00Z"},
        )

    assert centro.status_code == 200
    assert centro.json()["coberta"] is True
    assert fora_do_raio_desenhado.status_code == 200
    assert fora_do_raio_desenhado.json()["coberta"] is False


@pytest.mark.asyncio
async def test_satelite_nao_operacional_e_ignorado():
    _seed_sat_com_efemeride(PARAMS_ORBITA, sat_status="manutencao")
    lat, lng = _ponto_sob_satelite()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao", params={"lat": lat, "lng": lng})

    assert resp.status_code == 200
    assert resp.json()["coberta"] is False


@pytest.mark.asyncio
async def test_consulta_por_nome_de_regiao_responde_bem_formada():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/cobertura/regiao", params={"regiao": "nordeste"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["regiao"]["id"] == "nordeste"
    assert data["ponto"]["lat"] == pytest.approx(-9.0)
    assert isinstance(data["coberta"], bool)
    assert isinstance(data["satelites"], list)
