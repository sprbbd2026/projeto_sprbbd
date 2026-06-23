from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.db.models import Telemetria
from app.services import telemetry_service


class TestCreateTelemetry:
    def test_persiste_telemetria_com_dados_do_schema(self, db, telemetry_create):
        result = telemetry_service.create_telemetry(db, telemetry_create)

        db.add.assert_called_once()
        added = db.add.call_args.args[0]
        assert isinstance(added, Telemetria)
        assert added.satelite_id == telemetry_create.satelite_id
        assert added.cpu_percentual == telemetry_create.cpu_percentual
        assert added.temperatura_celsius == telemetry_create.temperatura_celsius
        assert added.status == telemetry_create.status

        db.commit.assert_called_once()
        db.refresh.assert_called_once_with(added)
        db.rollback.assert_not_called()
        assert result is added

    def test_erro_de_persistencia_faz_rollback_e_500(self, db, telemetry_create):
        db.commit.side_effect = SQLAlchemyError("db down")

        with pytest.raises(HTTPException) as exc:
            telemetry_service.create_telemetry(db, telemetry_create)

        assert exc.value.status_code == 500
        assert exc.value.detail == "Erro interno ao salvar dados de telemetria."
        db.rollback.assert_called_once()

    def test_erro_inesperado_vira_500(self, db, telemetry_create):
        db.add.side_effect = ValueError("boom")

        with pytest.raises(HTTPException) as exc:
            telemetry_service.create_telemetry(db, telemetry_create)

        assert exc.value.status_code == 500
        assert exc.value.detail == "Falha na comunicação ou processamento da telemetria."


class TestGetTelemetries:
    def test_aplica_paginacao_e_retorna_resultado(self, db):
        registros = [Telemetria(id=1), Telemetria(id=2)]
        query = MagicMock()
        query.offset.return_value = query
        query.limit.return_value = query
        query.all.return_value = registros
        db.query.return_value = query

        result = telemetry_service.get_telemetries(db, skip=5, limit=10)

        db.query.assert_called_once_with(Telemetria)
        query.offset.assert_called_once_with(5)
        query.limit.assert_called_once_with(10)
        assert result == registros

    def test_usa_paginacao_padrao_quando_nao_informada(self, db):
        query = MagicMock()
        query.offset.return_value = query
        query.limit.return_value = query
        query.all.return_value = []
        db.query.return_value = query

        telemetry_service.get_telemetries(db)

        # Defaults do serviço: skip=0, limit=100.
        query.offset.assert_called_once_with(0)
        query.limit.assert_called_once_with(100)

    def test_erro_na_consulta_vira_500(self, db):
        db.query.side_effect = SQLAlchemyError("query failed")

        with pytest.raises(HTTPException) as exc:
            telemetry_service.get_telemetries(db)

        assert exc.value.status_code == 500
        assert exc.value.detail == "Erro interno ao consultar telemetria."
