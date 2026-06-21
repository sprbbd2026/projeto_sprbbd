import types
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.telemetry_schema import TelemetryCreate, TelemetryResponse
from app.schemas.user_schema import UserCreate, UserResponse


def _user(senha):
    return UserCreate(
        nome="Ada",
        sobrenome="Lovelace",
        email="ada@example.com",
        senha=senha,
        data_nascimento="1815-12-10",
        documento="12345678900",
        latitude="-23.5",
        longitude="-46.6",
    )


class TestUserCreate:
    def test_aceita_dados_validos(self):
        user = UserCreate(
            nome="Ada",
            sobrenome="Lovelace",
            email="ada@example.com",
            senha="senhaForte123",
            data_nascimento="1815-12-10",
            documento="12345678900",
            latitude="-23.5",
            longitude="-46.6",
        )
        assert user.email == "ada@example.com"

    def test_senha_curta_e_rejeitada(self):
        with pytest.raises(ValidationError):
            _user("123")  # menos de 8 caracteres

    def test_senha_no_limite_min_length(self):
        # Fronteira exata: 8 chars é aceito, 7 é rejeitado.
        # Mata mutantes que alteram min_length=8.
        assert _user("12345678").senha == "12345678"
        with pytest.raises(ValidationError):
            _user("1234567")

    def test_email_invalido_e_rejeitado(self):
        with pytest.raises(ValidationError):
            UserCreate(
                nome="Ada",
                sobrenome="Lovelace",
                email="nao-e-email",
                senha="senhaForte123",
                data_nascimento="1815-12-10",
                documento="12345678900",
                latitude="-23.5",
                longitude="-46.6",
            )


class TestUserResponse:
    def test_validacao_a_partir_de_objeto_orm(self):
        # from_attributes=True permite construir a resposta a partir de um
        # objeto (não-dict) com atributos — mata o mutante que o desativa.
        obj = types.SimpleNamespace(
            id=1,
            uuid="550e8400-e29b-41d4-a716-446655440000",
            nome="Ada",
            sobrenome="Lovelace",
            email="ada@example.com",
            data_nascimento="1815-12-10",
            documento="12345678900",
            latitude="-23.5",
            longitude="-46.6",
        )
        resp = UserResponse.model_validate(obj)
        assert resp.id == 1
        assert resp.email == "ada@example.com"


class TestTelemetryCreate:
    def test_status_tem_default_operacional(self):
        t = TelemetryCreate(
            satelite_id="SAT-1",
            cpu_percentual=10.0,
            temperatura_celsius=15.0,
        )
        assert t.status == "operacional"

    def test_cpu_nao_numerico_e_rejeitado(self):
        with pytest.raises(ValidationError):
            TelemetryCreate(
                satelite_id="SAT-1",
                cpu_percentual="muito",
                temperatura_celsius=15.0,
            )


class TestTelemetryResponse:
    def test_validacao_a_partir_de_objeto_orm(self):
        # from_attributes=True permite construir a resposta a partir de um
        # objeto ORM (não-dict) — mata mutantes que o desativam.
        obj = types.SimpleNamespace(
            id=7,
            satelite_id="SAT-1",
            cpu_percentual=42.5,
            temperatura_celsius=20.0,
            status="operacional",
            data_hora=datetime(2026, 5, 27, 12, 0, 0),
        )
        resp = TelemetryResponse.model_validate(obj)
        assert resp.id == 7
        assert resp.satelite_id == "SAT-1"
