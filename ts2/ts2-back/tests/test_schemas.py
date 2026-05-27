import pytest
from pydantic import ValidationError

from app.schemas.telemetry_schema import TelemetryCreate
from app.schemas.user_schema import UserCreate


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
            UserCreate(
                nome="Ada",
                sobrenome="Lovelace",
                email="ada@example.com",
                senha="123",  # menos de 8 caracteres
                data_nascimento="1815-12-10",
                documento="12345678900",
                latitude="-23.5",
                longitude="-46.6",
            )

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
