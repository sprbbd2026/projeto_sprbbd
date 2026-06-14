from datetime import datetime
from unittest.mock import Mock

from app.services.route_log_spark_service import (
    build_log_rota_query,
    run_log_rota_query,
)


def test_build_log_rota_query_with_all_filters():
    query = build_log_rota_query(
        satelite_id="SAT-01",
        dispositivo_id="DEV-99",
        inicio_periodo=datetime(2026, 6, 1, 10, 0, 0),
        fim_periodo="2026-06-01 12:00:00",
        duracao_min_segundos=120,
        duracao_max_segundos=600,
    )

    assert "FROM log_rota" in query
    assert "satelite_id = 'SAT-01'" in query
    assert "dispositivo_id = 'DEV-99'" in query
    assert "inicio_rota >= TIMESTAMP '2026-06-01 10:00:00'" in query
    assert "fim_rota <= TIMESTAMP '2026-06-01 12:00:00'" in query
    assert "duracao_segundos >= 120" in query
    assert "duracao_segundos <= 600" in query


def test_build_log_rota_query_escapes_sql_literal():
    query = build_log_rota_query(satelite_id="SAT'X")

    assert "satelite_id = 'SAT''X'" in query


def test_run_log_rota_query_calls_spark_sql():
    spark = Mock()
    expected_df = Mock()
    spark.sql.return_value = expected_df

    result = run_log_rota_query(spark, satelite_id="SAT-1", duracao_min_segundos=10)

    assert result is expected_df
    spark.sql.assert_called_once_with(
        "SELECT * FROM log_rota WHERE satelite_id = 'SAT-1' AND duracao_segundos >= 10"
    )
