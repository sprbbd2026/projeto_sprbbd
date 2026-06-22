"""Validação da US312 com Spark local e fixture reprodutível."""

from __future__ import annotations

from pathlib import Path

import pytest

pyspark_sql = pytest.importorskip("pyspark.sql")
SparkSession = pyspark_sql.SparkSession

from app.services.route_logs_spark_service import (  # noqa: E402
    consultar_logs_rotas,
    normalize_and_validate_route_logs,
    query_route_logs,
)

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "logs_rotas_us312.csv"


@pytest.fixture(scope="module")
def spark():
    session = (
        SparkSession.builder.master("local[1]")
        .appName("US312_Testes")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "2")
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
    session.sparkContext.setLogLevel("ERROR")
    yield session
    session.stop()


@pytest.fixture
def route_logs_df(spark):
    return spark.createDataFrame(
        [
            (
                "ROTA-001",
                "DEV-01",
                "SAT-01",
                "2026-06-01T08:00:00",
                "2026-06-01T08:10:00",
                600,
                12.0,
            ),
            (
                "ROTA-002",
                "DEV-01",
                "SAT-02",
                "2026-06-02T09:00:00",
                "2026-06-02T09:05:00",
                300,
                4.0,
            ),
            (
                "ROTA-003",
                "DEV-02",
                "SAT-01",
                "2026-06-03T10:00:00",
                "2026-06-03T10:20:00",
                1200,
                30.0,
            ),
        ],
        [
            "rota_id",
            "dispositivo_id",
            "satelite_id",
            "inicio_rota",
            "fim_rota",
            "duracao_segundos",
            "extensao_km",
        ],
    )


def test_ca01_filters_by_device_satellite_period_and_duration(route_logs_df):
    result = query_route_logs(
        route_logs_df,
        dispositivo_id="DEV-01",
        satelite_id="SAT-01",
        inicio="2026-06-01T00:00:00",
        fim="2026-06-01T23:59:59",
        duracao_minima_segundos=300,
        duracao_maxima_segundos=900,
    )

    assert [route["rota_id"] for route in result["rotas"]] == ["ROTA-001"]
    assert result["rotas"][0]["inicio_rota"] == "2026-06-01T08:00:00Z"
    assert result["rotas"][0]["fim_rota"] == "2026-06-01T08:10:00Z"
    assert result["agregacoes"] == {
        "total_rotas": 1,
        "extensao_media_km": pytest.approx(12.0),
    }


def test_aggregations_use_full_filter_result_before_display_limit(route_logs_df):
    result = query_route_logs(route_logs_df, limite=1)

    assert len(result["rotas"]) == 1
    assert result["agregacoes"]["total_rotas"] == 3
    assert result["agregacoes"]["extensao_media_km"] == pytest.approx(46 / 3)


def test_ca02_no_matching_routes_returns_empty_result(route_logs_df):
    result = query_route_logs(route_logs_df, dispositivo_id="DEV-INEXISTENTE")

    assert result["rotas"] == []
    assert result["agregacoes"] == {
        "total_rotas": 0,
        "extensao_media_km": 0.0,
    }
    assert result["metadados"]["rotas_retornadas"] == 0


def test_ca02_physically_empty_dataframe_returns_without_error(spark, route_logs_df):
    empty_df = spark.createDataFrame([], route_logs_df.schema)

    result = query_route_logs(empty_df)

    assert result["rotas"] == []
    assert result["agregacoes"]["total_rotas"] == 0


def test_reads_documented_csv_fixture_and_normalizes_us311_aliases(spark):
    result = consultar_logs_rotas(
        spark,
        str(FIXTURE_PATH),
        dataset_format="csv",
        satelite_id="SAT-01",
    )

    assert [route["rota_id"] for route in result["rotas"]] == [
        "ROTA-001",
        "ROTA-003",
    ]
    assert result["agregacoes"]["total_rotas"] == 2
    assert result["agregacoes"]["extensao_media_km"] == pytest.approx(21.0)


def test_rejects_dataset_without_required_columns(spark):
    invalid_df = spark.createDataFrame([("ROTA-001",)], ["rota_id"])

    with pytest.raises(ValueError, match="Colunas obrigatórias ausentes"):
        normalize_and_validate_route_logs(invalid_df)


@pytest.mark.parametrize(
    ("parameters", "message"),
    [
        (
            {"inicio": "2026-06-02", "fim": "2026-06-01"},
            "inicio não pode ser posterior",
        ),
        (
            {
                "duracao_minima_segundos": 500,
                "duracao_maxima_segundos": 100,
            },
            "não pode superar",
        ),
        ({"limite": 0}, "limite deve ser"),
    ],
)
def test_rejects_inconsistent_query_parameters(route_logs_df, parameters, message):
    with pytest.raises(ValueError, match=message):
        query_route_logs(route_logs_df, **parameters)
