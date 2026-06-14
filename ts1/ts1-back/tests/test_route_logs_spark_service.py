from datetime import datetime

import pytest

from app.services.route_logs_spark_service import consultar_logs_rotas

SparkSession = pytest.importorskip("pyspark.sql").SparkSession


@pytest.fixture(scope="module")
def spark():
    session = (
        SparkSession.builder.master("local[1]")
        .appName("test-us312")
        .getOrCreate()
    )
    session.sparkContext.setLogLevel("ERROR")
    yield session
    session.stop()


@pytest.fixture
def dataset_path(tmp_path, spark):
    dados = [
        {
            "device_id": "DEV-01",
            "satellite_id": "SAT-01",
            "route_start": datetime(2026, 5, 1, 8, 0, 0),
            "route_end": datetime(2026, 5, 1, 8, 5, 0),
            "route_duration_seconds": 300,
            "route_distance_km": 12.5,
        },
        {
            "device_id": "DEV-01",
            "satellite_id": "SAT-02",
            "route_start": datetime(2026, 5, 2, 8, 0, 0),
            "route_end": datetime(2026, 5, 2, 8, 1, 0),
            "route_duration_seconds": 60,
            "route_distance_km": 1.8,
        },
        {
            "device_id": "DEV-02",
            "satellite_id": "SAT-01",
            "route_start": datetime(2026, 5, 3, 8, 0, 0),
            "route_end": datetime(2026, 5, 3, 8, 2, 0),
            "route_duration_seconds": 120,
            "route_distance_km": 3.2,
        },
    ]
    caminho = str(tmp_path / "logs_rotas.parquet")
    spark.createDataFrame(dados).write.mode("overwrite").parquet(caminho)
    return caminho


def test_consulta_logs_rotas_com_filtros_e_agregacao(spark, dataset_path):
    resultado = consultar_logs_rotas(
        spark_session=spark,
        dataset_path=dataset_path,
        satelite_id="SAT-01",
        inicio=datetime(2026, 5, 1, 0, 0, 0),
        fim=datetime(2026, 5, 2, 0, 0, 0),
        duracao_minima_segundos=120,
        duracao_maxima_segundos=400,
    )

    assert resultado["agregacoes"]["total_rotas"] == 1
    assert resultado["agregacoes"]["extensao_media_km"] == pytest.approx(12.5)
    assert len(resultado["rotas"]) == 1
    assert resultado["rotas"][0]["satelite_id"] == "SAT-01"


def test_consulta_logs_rotas_com_dataset_vazio_retorna_sem_erro(spark, dataset_path):
    resultado = consultar_logs_rotas(
        spark_session=spark,
        dataset_path=dataset_path,
        dispositivo_id="DEV-INEXISTENTE",
    )

    assert resultado["rotas"] == []
    assert resultado["agregacoes"] == {
        "total_rotas": 0,
        "extensao_media_km": 0.0,
    }
