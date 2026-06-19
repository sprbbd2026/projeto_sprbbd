import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base, get_db
from app.db.models import Cidade, Ponto, Rua
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db() -> Session:
    """Create isolated tables and provide a fresh DB session per test."""
    Base.metadata.create_all(bind=test_engine)
    db_session = TestingSessionLocal()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_ponto(db: Session) -> int:
    """Create a valid Cidade-Rua-Ponto chain and return the FK id for LOCAL."""
    cidade = Cidade(id=1, nome="Sao Paulo", estado="SP")
    db.add(cidade)
    db.flush()

    rua = Rua(id=1, id_cidade=1, nome="Avenida Paulista", cep="01311-100")
    db.add(rua)
    db.flush()

    ponto = Ponto(id=1, id_rua=1, latitude=-23.550520, longitude=-46.633309)
    db.add(ponto)
    db.commit()

    return ponto.id


@pytest_asyncio.fixture(scope="function")
async def client():
    """Create an HTTP client to dispatch requests against the FastAPI app."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac