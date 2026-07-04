import json
from datetime import date, datetime

import pytest
from pyspark.sql import SparkSession

from app.services.satellite_log_spark_service import (
    build_consulta_logs_sql,
    build_summary_sql,
    collect_logs_sql,
    count_events_by_origin_sql,
    count_events_by_satellite_sql,
    count_events_by_type_sql,
    empty_logs_dataframe,
    escape_sql_literal,
    get_expected_schema,
    latest_event_by_satellite_sql,
    query_logs_sql,
    read_satellite_logs,
    register_logs_temp_view,
    validate_log_schema,
)
from scripts.consultar_logs_satelites_spark import (
    _handle_sql_output,
    _print_result,
)


@pytest.fixture(scope="module")
def spark() -> SparkSession:
    session = (
        SparkSession.builder.master("local[1]")
        .appName("US310_Testes_SQL")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "2")
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
    session.sparkContext.setLogLevel("ERROR")
    yield session
    session.stop()


@pytest.fixture
def logs_df(spark: SparkSession):
    rows = [
        (
            "LOG-001",
            "SAT-01",
            datetime(2026, 6, 1, 10, 0),
            "TELEMETRIA",
            "TELEMETRIA",
            '{"temperatura": 21.5}',
            "Telemetria recebida",
            "SUCESSO",
            10,
            None,
            1,
            100,
            "OPERACIONAL",
            datetime(2026, 6, 1, 10, 0, 5),
            date(2026, 6, 1),
        ),
        (
            "LOG-002",
            "SAT-02",
            datetime(2026, 6, 1, 12, 0),
            "COMUNICACAO",
            "CANAL_COMUNICACAO",
            '{"sinal": "estavel"}',
            "Contato estabelecido",
            "SUCESSO",
            11,
            None,
            2,
            100,
            "OPERACIONAL",
            datetime(2026, 6, 1, 12, 0, 5),
            date(2026, 6, 1),
        ),
        (
            "LOG-003",
            "SAT-01",
            datetime(2026, 6, 2, 9, 30),
            "COMANDO",
            "COMANDO",
            '{"acao": "AJUSTAR_ATITUDE"}',
            "Comando enviado",
            "ENVIADO",
            10,
            501,
            1,
            100,
            "OPERACIONAL",
            datetime(2026, 6, 2, 9, 30, 5),
            date(2026, 6, 2),
        ),
        (
            "LOG-004",
            "SAT-01",
            datetime(2026, 6, 3, 18, 0),
            "TELEMETRIA",
            "TELEMETRIA",
            '{"bateria": 87}',
            "Telemetria recebida",
            "SUCESSO",
            10,
            None,
            1,
            100,
            "OPERACIONAL",
            datetime(2026, 6, 3, 18, 0, 5),
            date(2026, 6, 3),
        ),
    ]
    return spark.createDataFrame(rows, get_expected_schema())


@pytest.fixture
def registered_logs(spark: SparkSession, logs_df) -> str:
    view_name = "log_satelite"
    register_logs_temp_view(logs_df, view_name)
    return view_name


def test_get_expected_schema_has_expected_contract():
    fields = {
        field.name: field.dataType.simpleString() for field in get_expected_schema()
    }

    assert fields == {
        "id": "string",
        "sat_id": "string",
        "timestamp_evento": "timestamp",
        "tipo_evento": "string",
        "origem_log": "string",
        "payload_json": "string",
        "resumo": "string",
        "status_evento": "string",
        "operador_id": "int",
        "cmd_id": "int",
        "est_id": "int",
        "con_id": "int",
        "sat_status": "string",
        "ingestion_ts": "timestamp",
        "dt": "date",
    }


def test_register_logs_temp_view(spark: SparkSession, logs_df):
    register_logs_temp_view(logs_df)

    assert spark.catalog.tableExists("log_satelite")
    assert spark.sql("SELECT COUNT(*) FROM log_satelite").first()[0] == 4


def test_escape_sql_literal_escapes_single_quotes():
    assert escape_sql_literal("abc'def") == "abc''def"


def test_build_query_contains_auditable_sql_and_partition_filters():
    sql = build_consulta_logs_sql(
        sat_id="SAT-01",
        inicio="2026-06-01 00:00:00",
        fim="2026-06-30T23:59:59",
        tipo_evento="TELEMETRIA",
        limit=50,
    )

    assert "SELECT" in sql
    assert "FROM log_satelite" in sql
    assert "sat_id = 'SAT-01'" in sql
    assert "timestamp_evento >= TIMESTAMP '2026-06-01 00:00:00'" in sql
    assert "timestamp_evento <= TIMESTAMP '2026-06-30 23:59:59'" in sql
    assert "dt >= DATE '2026-06-01'" in sql
    assert "dt <= DATE '2026-06-30'" in sql
    assert "tipo_evento = 'TELEMETRIA'" in sql
    assert "ORDER BY timestamp_evento DESC" in sql
    assert "LIMIT 50" in sql


@pytest.mark.parametrize("limit", [0, -1])
def test_build_query_rejects_non_positive_limit(limit):
    with pytest.raises(ValueError, match="inteiro positivo"):
        build_consulta_logs_sql(limit=limit)


def test_query_sql_by_satellite(spark: SparkSession, registered_logs):
    result = query_logs_sql(spark, registered_logs, sat_id="SAT-02")

    assert [row["id"] for row in result.collect()] == ["LOG-002"]


def test_query_sql_by_inclusive_period(spark: SparkSession, registered_logs):
    result = query_logs_sql(
        spark,
        registered_logs,
        inicio="2026-06-01 12:00:00",
        fim="2026-06-02T09:30:00",
    )

    assert [row["id"] for row in result.collect()] == ["LOG-003", "LOG-002"]


def test_query_sql_by_event_type(spark: SparkSession, registered_logs):
    result = query_logs_sql(spark, registered_logs, tipo_evento="TELEMETRIA")

    assert [row["id"] for row in result.collect()] == ["LOG-004", "LOG-001"]


def test_query_sql_combines_all_filters(spark: SparkSession, registered_logs):
    result = query_logs_sql(
        spark,
        registered_logs,
        sat_id="SAT-01",
        inicio=datetime(2026, 6, 2, 0, 0),
        fim=datetime(2026, 6, 3, 23, 59, 59),
        tipo_evento="TELEMETRIA",
    )

    assert [row["id"] for row in result.collect()] == ["LOG-004"]


def test_query_sql_returns_empty_when_no_records_match(
    spark: SparkSession, registered_logs
):
    result = query_logs_sql(spark, registered_logs, sat_id="SAT-INEXISTENTE")

    assert result.collect() == []


def test_count_events_by_satellite_sql(spark: SparkSession, registered_logs):
    rows = count_events_by_satellite_sql(spark, registered_logs).collect()

    assert {row["sat_id"]: row["total_eventos"] for row in rows} == {
        "SAT-01": 3,
        "SAT-02": 1,
    }


def test_count_events_by_type_sql(spark: SparkSession, registered_logs):
    rows = count_events_by_type_sql(spark, registered_logs).collect()

    assert {row["tipo_evento"]: row["total_eventos"] for row in rows} == {
        "TELEMETRIA": 2,
        "COMUNICACAO": 1,
        "COMANDO": 1,
    }


def test_count_events_by_origin_sql(spark: SparkSession, registered_logs):
    rows = count_events_by_origin_sql(spark, registered_logs).collect()

    assert {row["origem_log"]: row["total_eventos"] for row in rows} == {
        "TELEMETRIA": 2,
        "CANAL_COMUNICACAO": 1,
        "COMANDO": 1,
    }


def test_latest_event_by_satellite_sql(spark: SparkSession, registered_logs):
    rows = latest_event_by_satellite_sql(spark, registered_logs).collect()

    assert {row["sat_id"]: row["ultimo_evento"] for row in rows} == {
        "SAT-01": datetime(2026, 6, 3, 18, 0),
        "SAT-02": datetime(2026, 6, 1, 12, 0),
    }


def test_build_summary_sql_with_data(spark: SparkSession, registered_logs):
    summary = build_summary_sql(spark, registered_logs)

    assert summary["total_eventos"] == 4
    assert summary["ultimo_evento"] == datetime(2026, 6, 3, 18, 0)
    assert len(summary["eventos_por_satelite"]) == 2
    assert len(summary["eventos_por_tipo"]) == 3
    assert len(summary["eventos_por_origem"]) == 3


def test_build_summary_sql_filters_by_satellite(spark: SparkSession, registered_logs):
    summary = build_summary_sql(spark, registered_logs, sat_id="SAT-01")

    assert summary["total_eventos"] == 3
    assert summary["eventos_por_satelite"] == [{"sat_id": "SAT-01", "total_eventos": 3}]


def test_build_summary_sql_filters_by_event_type(spark: SparkSession, registered_logs):
    summary = build_summary_sql(spark, registered_logs, tipo_evento="TELEMETRIA")

    assert summary["total_eventos"] == 2
    assert summary["eventos_por_tipo"] == [
        {"tipo_evento": "TELEMETRIA", "total_eventos": 2}
    ]


def test_build_summary_sql_filters_by_period(spark: SparkSession, registered_logs):
    summary = build_summary_sql(
        spark,
        registered_logs,
        inicio="2026-06-01 12:00:00",
        fim="2026-06-02 09:30:00",
    )

    assert summary["total_eventos"] == 2
    assert summary["ultimo_evento"] == datetime(2026, 6, 2, 9, 30)


def test_build_summary_sql_with_filters_and_no_results(
    spark: SparkSession, registered_logs
):
    summary = build_summary_sql(spark, registered_logs, sat_id="SAT-INEXISTENTE")

    assert summary == {
        "total_eventos": 0,
        "ultimo_evento": None,
        "eventos_por_satelite": [],
        "eventos_por_tipo": [],
        "eventos_por_origem": [],
    }


def test_build_summary_sql_with_empty_dataset(spark: SparkSession):
    view_name = "log_satelite_empty"
    register_logs_temp_view(empty_logs_dataframe(spark), view_name)

    assert build_summary_sql(spark, view_name) == {
        "total_eventos": 0,
        "ultimo_evento": None,
        "eventos_por_satelite": [],
        "eventos_por_tipo": [],
        "eventos_por_origem": [],
    }


def test_collect_logs_sql_serializes_timestamp(registered_logs, spark: SparkSession):
    result = query_logs_sql(spark, registered_logs, limit=2)

    logs = collect_logs_sql(result)

    assert [log["id"] for log in logs] == ["LOG-004", "LOG-003"]
    assert logs[0]["timestamp_evento"] == "2026-06-03T18:00:00"


def test_json_with_show_sql_produces_single_valid_json_document(capsys):
    sql = "SELECT * FROM log_satelite LIMIT 100"
    result = {
        "resumo": {"total_eventos": 0, "ultimo_evento": None},
        "logs": [],
    }

    _handle_sql_output(result, sql, show_sql=True, as_json=True)
    assert capsys.readouterr().out == ""

    _print_result(result, as_json=True)
    output = capsys.readouterr().out

    assert json.loads(output)["sql"] == sql


def test_write_and_read_partitioned_parquet(tmp_path, spark: SparkSession, logs_df):
    dataset_path = tmp_path / "log_satelite"
    logs_df.write.mode("overwrite").partitionBy("dt").parquet(str(dataset_path))

    result = read_satellite_logs(spark, str(dataset_path))

    assert result.count() == 4
    assert "dt" in result.columns


def test_read_raises_file_not_found_for_missing_path(tmp_path, spark: SparkSession):
    missing_path = tmp_path / "nao_existe"

    with pytest.raises(FileNotFoundError, match="não encontrado"):
        read_satellite_logs(spark, str(missing_path))


def test_validate_schema_raises_for_missing_required_columns(
    spark: SparkSession,
):
    invalid_df = spark.createDataFrame([("LOG-001", "SAT-01")], ["id", "sat_id"])

    with pytest.raises(ValueError, match="Colunas obrigatórias ausentes"):
        validate_log_schema(invalid_df)
