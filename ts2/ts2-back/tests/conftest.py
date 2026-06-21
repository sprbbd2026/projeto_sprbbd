import os

# Define uma URL de banco válida ANTES de qualquer import de `app.db`,
# pois app/db/database.py chama create_engine(DATABASE_URL) no import.
# SQLite em memória não abre conexão real aqui (engine é lazy) — os testes
# de unidade usam uma Session mockada, então nenhum I/O acontece.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.schemas.telemetry_schema import TelemetryCreate
from app.schemas.user_schema import UserCreate


@pytest.fixture
def db():
    """Sessão de banco totalmente mockada (testes de unidade, sem I/O real)."""
    return MagicMock(spec=Session)


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
