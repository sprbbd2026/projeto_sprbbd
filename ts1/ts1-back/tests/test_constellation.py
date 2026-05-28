import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import Satelite, Constelacao


# Banco SQLite em memória, compartilhado por toda a sessão de teste.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest_asyncio.fixture
async def client():
    # Recria apenas as tabelas necessárias para a US202 (evita JSONB do Postgres).
    Satelite.__table__.drop(bind=engine, checkfirst=True)
    Constelacao.__table__.drop(bind=engine, checkfirst=True)
    Constelacao.__table__.create(bind=engine)
    Satelite.__table__.create(bind=engine)

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def _seed_satelites(quantidade: int) -> list[int]:
    db = TestingSessionLocal()
    ids = []
    try:
        for i in range(quantidade):
            sat = Satelite(
                sat_nome=f"SAT_{i}",
                sat_modelo_hardware="HW",
                sat_versao_firmware="v1",
                sat_tipo_orbita="MEO",
                sat_status="operacional",
            )
            db.add(sat)
            db.flush()
            ids.append(sat.sat_id)
        db.commit()
    finally:
        db.close()
    return ids


@pytest.mark.asyncio
async def test_register_constellation_rejects_fewer_than_4(client):
    sat_ids = _seed_satelites(3)
    payload = {
        "cnt_nome": "Constelacao Pequena",
        "cnt_descricao": "menos de 4",
        "cnt_status": "ativa",
        "sat_ids": sat_ids,
    }
    response = await client.post("/constellations/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_constellation_happy_path(client):
    sat_ids = _seed_satelites(4)
    payload = {
        "cnt_nome": "Constelacao Brasil",
        "cnt_descricao": "4 satelites",
        "cnt_status": "ativa",
        "sat_ids": sat_ids,
    }
    response = await client.post("/constellations/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["cnt_nome"] == "Constelacao Brasil"
    assert data["sat_quantidade"] == 4
    assert len(data["satelites"]) == 4

    # os satélites agora ficam indisponíveis para outra constelação
    available = await client.get("/satellites/?unassigned=true")
    assert available.status_code == 200
    assert available.json() == []
