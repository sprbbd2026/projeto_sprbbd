from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

from pyspark import SparkConf
from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.types import (
    DateType,
    IntegerType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

DEFAULT_VIEW_NAME = "log_satelite"
_SQL_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def get_expected_schema() -> StructType:
    """Retorna o contrato do dataset Gold ``log_satelite`` da US309."""
    return StructType(
        [
            StructField("id", StringType(), True),
            StructField("sat_id", StringType(), True),
            StructField("timestamp_evento", TimestampType(), True),
            StructField("tipo_evento", StringType(), True),
            StructField("origem_log", StringType(), True),
            StructField("payload_json", StringType(), True),
            StructField("resumo", StringType(), True),
            StructField("status_evento", StringType(), True),
            StructField("operador_id", IntegerType(), True),
            StructField("cmd_id", IntegerType(), True),
            StructField("est_id", IntegerType(), True),
            StructField("con_id", IntegerType(), True),
            StructField("sat_status", StringType(), True),
            StructField("ingestion_ts", TimestampType(), True),
            StructField("dt", DateType(), True),
        ]
    )


def create_spark_session(
    app_name: str = "US310_ConsultarLogsSatelites",
) -> SparkSession:
    """Cria uma sessão Spark adequada para execução local ou via spark-submit."""
    builder = (
        SparkSession.builder.appName(app_name)
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.ui.enabled", "false")
    )
    if not SparkConf().contains("spark.master"):
        builder = builder.master("local[*]")

    spark = builder.getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark


def _path_exists(spark: SparkSession, input_path: str) -> bool:
    hadoop_path = spark._jvm.org.apache.hadoop.fs.Path(input_path)
    file_system = hadoop_path.getFileSystem(
        spark.sparkContext._jsc.hadoopConfiguration()
    )
    return bool(file_system.exists(hadoop_path))


def read_satellite_logs(spark: SparkSession, input_path: str) -> DataFrame:
    """Lê e valida o dataset Parquet de logs de satélites."""
    if not _path_exists(spark, input_path):
        raise FileNotFoundError(
            f"Dataset de logs de satélites não encontrado em: {input_path}"
        )

    df = spark.read.parquet(input_path)
    validate_log_schema(df)
    return df


def empty_logs_dataframe(spark: SparkSession) -> DataFrame:
    """Cria um DataFrame sem registros que preserva o contrato da US309."""
    return spark.createDataFrame([], get_expected_schema())


def validate_log_schema(df: DataFrame) -> None:
    """Valida a presença de todas as colunas definidas pelo contrato."""
    expected_columns = {field.name for field in get_expected_schema().fields}
    missing_columns = sorted(expected_columns - set(df.columns))
    if missing_columns:
        raise ValueError(
            "Dataset log_satelite inválido. Colunas obrigatórias ausentes: "
            + ", ".join(missing_columns)
        )


def _validate_view_name(view_name: str) -> str:
    if not _SQL_IDENTIFIER_PATTERN.fullmatch(view_name):
        raise ValueError(
            "Nome de temp view inválido. Use apenas letras, números e underscore."
        )
    return view_name


def register_logs_temp_view(df: DataFrame, view_name: str = DEFAULT_VIEW_NAME) -> None:
    """Registra os logs como temp view para consultas Spark SQL."""
    df.createOrReplaceTempView(_validate_view_name(view_name))


def escape_sql_literal(value: str) -> str:
    """Escapa aspas simples em um literal textual SQL."""
    return value.replace("'", "''")


def _normalize_datetime(value: datetime | str, argument_name: str) -> datetime:
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(
            f"{argument_name} deve ser uma data/hora ISO válida: {value}"
        ) from exc


def _build_filter_conditions(
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> list[str]:
    conditions = ["1 = 1"]
    if sat_id is not None:
        conditions.append(f"sat_id = '{escape_sql_literal(sat_id)}'")
    if inicio is not None:
        normalized = _normalize_datetime(inicio, "inicio")
        timestamp = escape_sql_literal(normalized.isoformat(sep=" "))
        conditions.extend(
            [
                f"timestamp_evento >= TIMESTAMP '{timestamp}'",
                f"dt >= DATE '{normalized.date().isoformat()}'",
            ]
        )
    if fim is not None:
        normalized = _normalize_datetime(fim, "fim")
        timestamp = escape_sql_literal(normalized.isoformat(sep=" "))
        conditions.extend(
            [
                f"timestamp_evento <= TIMESTAMP '{timestamp}'",
                f"dt <= DATE '{normalized.date().isoformat()}'",
            ]
        )
    if tipo_evento is not None:
        conditions.append(f"tipo_evento = '{escape_sql_literal(tipo_evento)}'")
    return conditions


def _build_where_clause(
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> str:
    conditions = _build_filter_conditions(sat_id, inicio, fim, tipo_evento)
    return "WHERE " + "\n    AND ".join(conditions)


def build_consulta_logs_sql(
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
    limit: int = 100,
) -> str:
    """Monta a consulta principal auditável da US310."""
    view_name = _validate_view_name(view_name)
    if not isinstance(limit, int) or isinstance(limit, bool) or limit <= 0:
        raise ValueError("O limite de resultados deve ser um inteiro positivo.")

    where_clause = _build_where_clause(sat_id, inicio, fim, tipo_evento)
    return f"""SELECT
    id,
    sat_id,
    timestamp_evento,
    tipo_evento,
    origem_log,
    resumo,
    status_evento
FROM {view_name}
{where_clause}
ORDER BY timestamp_evento DESC
LIMIT {limit}"""


def query_logs_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
    limit: int = 100,
) -> DataFrame:
    """Executa a consulta principal por meio de Spark SQL."""
    sql = build_consulta_logs_sql(
        view_name=view_name,
        sat_id=sat_id,
        inicio=inicio,
        fim=fim,
        tipo_evento=tipo_evento,
        limit=limit,
    )
    return spark.sql(sql)


def count_events_by_satellite_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> DataFrame:
    view_name = _validate_view_name(view_name)
    where_clause = _build_where_clause(sat_id, inicio, fim, tipo_evento)
    return spark.sql(
        f"""SELECT sat_id, COUNT(*) AS total_eventos
FROM {view_name}
{where_clause}
GROUP BY sat_id
ORDER BY total_eventos DESC"""
    )


def count_events_by_type_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> DataFrame:
    view_name = _validate_view_name(view_name)
    where_clause = _build_where_clause(sat_id, inicio, fim, tipo_evento)
    return spark.sql(
        f"""SELECT tipo_evento, COUNT(*) AS total_eventos
FROM {view_name}
{where_clause}
GROUP BY tipo_evento
ORDER BY total_eventos DESC"""
    )


def count_events_by_origin_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> DataFrame:
    view_name = _validate_view_name(view_name)
    where_clause = _build_where_clause(sat_id, inicio, fim, tipo_evento)
    return spark.sql(
        f"""SELECT origem_log, COUNT(*) AS total_eventos
FROM {view_name}
{where_clause}
GROUP BY origem_log
ORDER BY total_eventos DESC"""
    )


def latest_event_by_satellite_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> DataFrame:
    view_name = _validate_view_name(view_name)
    where_clause = _build_where_clause(sat_id, inicio, fim, tipo_evento)
    return spark.sql(
        f"""SELECT sat_id, MAX(timestamp_evento) AS ultimo_evento
FROM {view_name}
{where_clause}
GROUP BY sat_id"""
    )


def _rows_as_dicts(df: DataFrame) -> list[dict[str, Any]]:
    return [row.asDict(recursive=True) for row in df.collect()]


def build_summary_sql(
    spark: SparkSession,
    view_name: str = DEFAULT_VIEW_NAME,
    sat_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    tipo_evento: str | None = None,
) -> dict[str, Any]:
    """Gera o resumo usando exclusivamente as consultas Spark SQL da US310."""
    filters = {
        "sat_id": sat_id,
        "inicio": inicio,
        "fim": fim,
        "tipo_evento": tipo_evento,
    }
    events_by_satellite = _rows_as_dicts(
        count_events_by_satellite_sql(spark, view_name, **filters)
    )
    events_by_type = _rows_as_dicts(
        count_events_by_type_sql(spark, view_name, **filters)
    )
    events_by_origin = _rows_as_dicts(
        count_events_by_origin_sql(spark, view_name, **filters)
    )
    latest_by_satellite = _rows_as_dicts(
        latest_event_by_satellite_sql(spark, view_name, **filters)
    )

    total_events = sum(row["total_eventos"] for row in events_by_satellite)
    latest_events = [
        row["ultimo_evento"]
        for row in latest_by_satellite
        if row["ultimo_evento"] is not None
    ]

    return {
        "total_eventos": int(total_events),
        "ultimo_evento": max(latest_events, default=None),
        "eventos_por_satelite": events_by_satellite,
        "eventos_por_tipo": events_by_type,
        "eventos_por_origem": events_by_origin,
    }


def _to_iso_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def collect_logs_sql(df: DataFrame) -> list[dict[str, Any]]:
    """Coleta o resultado já ordenado e limitado por ``query_logs_sql``."""
    return [
        {key: _to_iso_value(value) for key, value in row.asDict(recursive=True).items()}
        for row in df.collect()
    ]
