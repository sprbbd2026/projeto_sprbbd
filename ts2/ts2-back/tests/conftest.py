import os
import tempfile
from pathlib import Path

# Criar um arquivo temporário para o banco de testes
test_db_file = Path(tempfile.gettempdir()) / "test_db.sqlite"
test_db_url = f"sqlite:///{test_db_file}"

# Define a URL do banco ANTES de qualquer import de `app.db`
os.environ.setdefault("DATABASE_URL", test_db_url)

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.database import Base, engine, SessionLocal
from app.main import app
from app.schemas.telemetry_schema import TelemetryCreate
from app.schemas.user_schema import UserCreate
from app.db.database import get_db


def override_get_db():
    """Override get_db para commit automático em testes."""
    db = SessionLocal()
    try:
        yield db
        db.commit()  # Força commit após cada requisição em testes
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_and_cleanup():
    """Cria e limpa o banco de testes."""
    # Override get_db para fazer commit automático
    app.dependency_overrides[get_db] = override_get_db
    
    # Cria as tabelas
    Base.metadata.create_all(bind=engine)
    yield
    # Limpa após os testes: fecha todas as conexões primeiro
    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    try:
        if test_db_file.exists():
            test_db_file.unlink()
    except Exception:
        # Ignora erros ao tentar deletar se estiver em uso
        pass


@pytest.fixture
def db():
    """Sessão de banco totalmente mockada (testes de unidade, sem I/O real)."""
    return MagicMock(spec=Session)


@pytest.fixture
def client():
    """Client HTTP síncrono para testes de integração."""
    return TestClient(app)


@pytest.fixture
def test_ponto(client):
    """Cria um ponto no banco e retorna o ID."""
    # Cria um ponto (Ponto)
    payload_ponto = {
        "altitude": 100.0,
        "latitude": -23.550520,
        "longitude": -46.633309,
    }
    response = client.post("/pontos", json=payload_ponto)
    if response.status_code == 200:
        return response.json().get("id", 1)
    return 1


@pytest.fixture
def user_create():
    return UserCreate(
        nome="Ada",
        sobrenome="Lovelace",
        email="ada@example.com",
        senha="senhaForte123",
        data_nascimento="1815-12-10",
        documento="12345678900",
        latitude="-23.5",
        longitude="-46.6",
    )


@pytest.fixture
def telemetry_create():
    return TelemetryCreate(
        satelite_id="SAT-1",
        cpu_percentual=42.5,
        temperatura_celsius=20.0,
        status="operacional",
    )
