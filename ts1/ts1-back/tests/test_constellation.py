import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import Satelite, Constelacao
from app.dependencies import get_current_user

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


def _mock_current_user():
    return object()


@pytest.fixture(autouse=True)
def setup_db():
    Satelite.__table__.drop(bind=engine, checkfirst=True)
    Constelacao.__table__.drop(bind=engine, checkfirst=True)
    Constelacao.__table__.create(bind=engine)
    Satelite.__table__.create(bind=engine)

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.clear()


def _seed_satelites(quantidade: int) -> list[int]:
    db = TestingSessionLocal()
    ids = []
    try:
        for _ in range(quantidade):
            sat = Satelite(sat_status="operacional")
            db.add(sat)
            db.flush()
            ids.append(sat.sat_id)
        db.commit()
    finally:
        db.close()
    return ids


@pytest.mark.asyncio
async def test_register_constellation_rejects_fewer_than_4():
    sat_ids = _seed_satelites(3)
    payload = {"con_nome": "Pequena", "sat_ids": sat_ids}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/constellations/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_constellation_happy_path():
    sat_ids = _seed_satelites(4)
    payload = {"con_nome": "Constelacao Brasil", "sat_ids": sat_ids}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/constellations/register", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["con_nome"] == "Constelacao Brasil"
        assert data["sat_quantidade"] == 4
        assert len(data["satelites"]) == 4

        available = await client.get("/satellites/?unassigned=true")
        assert available.status_code == 200
        assert available.json() == []


@pytest.mark.asyncio
async def test_satellite_linked_to_another_constellation_is_rejected():
    sat_ids = _seed_satelites(5)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/constellations/register",
            json={"con_nome": "C1", "sat_ids": sat_ids[:4]},
        )
        response = await client.post(
            "/constellations/register",
            json={"con_nome": "C2", "sat_ids": sat_ids[:4]},
        )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_constellation_releases_satellites():
    sat_ids = _seed_satelites(4)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_resp = await client.post(
            "/constellations/register",
            json={"con_nome": "Temporaria", "sat_ids": sat_ids},
        )
        assert create_resp.status_code == 201
        con_id = create_resp.json()["con_id"]

        del_resp = await client.delete(f"/constellations/delete/{con_id}")
        assert del_resp.status_code == 200

        available = await client.get("/satellites/?unassigned=true")
        assert len(available.json()) == 4
