"""Consultas analíticas Spark para o dataset de logs de rotas da US311."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from pyspark.sql import DataFrame, SparkSession


SUPPORTED_FORMATS = {"csv", "json", "parquet"}

COLUMN_ALIASES = {
    "rota_id": ("rota_id", "route_id"),
    "dispositivo_id": ("dispositivo_id", "device_id", "dis_id"),
    "satelite_id": ("satelite_id", "satellite_id", "sat_id"),
    "inicio_rota": (
        "inicio_rota",
        "route_start",
        "start_time",
        "timestamp_inicio",
    ),
    "fim_rota": ("fim_rota", "route_end", "end_time", "timestamp_fim"),
    "duracao_segundos": (
        "duracao_segundos",
        "route_duration_seconds",
        "duration_seconds",
        "duracao_s",
    ),
    "extensao_km": (
        "extensao_km",
        "route_distance_km",
        "distance_km",
        "distancia_km",
    ),
}

REQUIRED_COLUMNS = {
    "dispositivo_id",
    "satelite_id",
    "inicio_rota",
    "fim_rota",
    "duracao_segundos",
    "extensao_km",
}


def create_spark_session(
    app_name: str = "US312_ConsultarLogsRotas",
) -> SparkSession:
    """Cria uma sessão Spark local quando nenhum master foi configurado."""
    try:
        from pyspark import SparkConf
        from pyspark.sql import SparkSession
    except ImportError as exc:
        raise RuntimeError(
            "PySpark não está instalado. Execute `uv sync` em ts1/ts1-back."
        ) from exc

    builder = (
        SparkSession.builder.appName(app_name)
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.ui.enabled", "false")
    )
    if not SparkConf().contains("spark.master"):
        builder = builder.master("local[*]")

    spark = builder.getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    return spark


def _normalize_columns(df: DataFrame) -> DataFrame:
    """Converte aliases conhecidos do contrato US311 para nomes canônicos."""
    for canonical_name, aliases in COLUMN_ALIASES.items():
        if canonical_name in df.columns:
            continue
        source_name = next((name for name in aliases if name in df.columns), None)
        if source_name is not None:
            df = df.withColumnRenamed(source_name, canonical_name)
    return df


def normalize_and_validate_route_logs(df: DataFrame) -> DataFrame:
    """Normaliza tipos e valida as colunas necessárias às consultas."""
    from pyspark.sql import functions as F

    df = _normalize_columns(df)
    missing_columns = sorted(REQUIRED_COLUMNS - set(df.columns))
    if missing_columns:
        raise ValueError(
            "Dataset de logs de rotas inválido. Colunas obrigatórias ausentes: "
            + ", ".join(missing_columns)
        )

    return (
        df.withColumn("inicio_rota", F.to_timestamp(F.col("inicio_rota")))
        .withColumn("fim_rota", F.to_timestamp(F.col("fim_rota")))
        .withColumn("duracao_segundos", F.col("duracao_segundos").cast("long"))
        .withColumn("extensao_km", F.col("extensao_km").cast("double"))
    )


def read_route_logs(
    spark: SparkSession,
    dataset_path: str,
    dataset_format: str = "parquet",
) -> DataFrame:
    """Lê Parquet, CSV ou JSON e aplica o contrato analítico da US312."""
    normalized_format = dataset_format.lower()
    if normalized_format not in SUPPORTED_FORMATS:
        supported = ", ".join(sorted(SUPPORTED_FORMATS))
        raise ValueError(
            f"Formato de dataset inválido: {dataset_format}. Use: {supported}."
        )

    reader = spark.read.format(normalized_format)
    if normalized_format == "csv":
        reader = (
            reader.option("header", True)
            .option("inferSchema", True)
            .option("timestampFormat", "yyyy-MM-dd'T'HH:mm:ss")
        )

    return normalize_and_validate_route_logs(reader.load(dataset_path))


def _parse_datetime(
    value: datetime | str | None,
    argument_name: str,
) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError(
                f"{argument_name} deve ser uma data/hora ISO 8601 válida: {value}"
            ) from exc

    if parsed.tzinfo is not None:
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _validate_query_parameters(
    inicio: datetime | str | None,
    fim: datetime | str | None,
    duracao_minima_segundos: int | None,
    duracao_maxima_segundos: int | None,
    limite: int,
) -> tuple[datetime | None, datetime | None]:
    inicio_normalizado = _parse_datetime(inicio, "inicio")
    fim_normalizado = _parse_datetime(fim, "fim")

    if (
        inicio_normalizado is not None
        and fim_normalizado is not None
        and inicio_normalizado > fim_normalizado
    ):
        raise ValueError("inicio não pode ser posterior a fim.")

    for name, value in (
        ("duracao_minima_segundos", duracao_minima_segundos),
        ("duracao_maxima_segundos", duracao_maxima_segundos),
    ):
        if value is not None and (
            not isinstance(value, int) or isinstance(value, bool) or value < 0
        ):
            raise ValueError(f"{name} deve ser um inteiro maior ou igual a zero.")

    if (
        duracao_minima_segundos is not None
        and duracao_maxima_segundos is not None
        and duracao_minima_segundos > duracao_maxima_segundos
    ):
        raise ValueError(
            "duracao_minima_segundos não pode superar duracao_maxima_segundos."
        )

    if not isinstance(limite, int) or isinstance(limite, bool) or limite <= 0:
        raise ValueError("limite deve ser um inteiro positivo.")

    return inicio_normalizado, fim_normalizado


def filter_route_logs(
    df: DataFrame,
    *,
    dispositivo_id: str | None = None,
    satelite_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    duracao_minima_segundos: int | None = None,
    duracao_maxima_segundos: int | None = None,
) -> DataFrame:
    """Aplica filtros combináveis sobre um DataFrame já normalizado."""
    from pyspark.sql import functions as F

    inicio_normalizado, fim_normalizado = _validate_query_parameters(
        inicio,
        fim,
        duracao_minima_segundos,
        duracao_maxima_segundos,
        limite=1,
    )

    if dispositivo_id is not None:
        df = df.filter(F.col("dispositivo_id") == dispositivo_id)
    if satelite_id is not None:
        df = df.filter(F.col("satelite_id") == satelite_id)
    if inicio_normalizado is not None:
        inicio_literal = F.to_timestamp(
            F.lit(inicio_normalizado.isoformat(sep=" "))
        )
        df = df.filter(F.col("inicio_rota") >= inicio_literal)
    if fim_normalizado is not None:
        fim_literal = F.to_timestamp(F.lit(fim_normalizado.isoformat(sep=" ")))
        df = df.filter(F.col("fim_rota") <= fim_literal)
    if duracao_minima_segundos is not None:
        df = df.filter(F.col("duracao_segundos") >= duracao_minima_segundos)
    if duracao_maxima_segundos is not None:
        df = df.filter(F.col("duracao_segundos") <= duracao_maxima_segundos)

    return df


def aggregate_route_logs(df: DataFrame) -> dict[str, int | float]:
    """Calcula os indicadores sobre todo o recorte, antes de qualquer limite."""
    from pyspark.sql import functions as F

    row = df.agg(
        F.count("*").alias("total_rotas"),
        F.avg("extensao_km").alias("extensao_media_km"),
    ).first()

    return {
        "total_rotas": int(row["total_rotas"] or 0),
        "extensao_media_km": float(row["extensao_media_km"] or 0.0),
    }


def _to_json_value(value: Any) -> Any:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def collect_route_logs(df: DataFrame, limite: int = 200) -> list[dict[str, Any]]:
    """Ordena, limita e converte o resultado Spark para uma saída JSON."""
    from pyspark.sql import functions as F

    _validate_query_parameters(None, None, None, None, limite)
    rows = df.orderBy("inicio_rota", "dispositivo_id", "satelite_id").limit(limite)
    timestamp_pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'"
    rows = rows.withColumn(
        "inicio_rota",
        F.date_format(F.col("inicio_rota"), timestamp_pattern),
    ).withColumn(
        "fim_rota",
        F.date_format(F.col("fim_rota"), timestamp_pattern),
    )
    return [
        {
            key: _to_json_value(value)
            for key, value in row.asDict(recursive=True).items()
        }
        for row in rows.collect()
    ]


def query_route_logs(
    df: DataFrame,
    *,
    dispositivo_id: str | None = None,
    satelite_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    duracao_minima_segundos: int | None = None,
    duracao_maxima_segundos: int | None = None,
    limite: int = 200,
) -> dict[str, Any]:
    """Executa filtros, agregações e coleta limitada sobre o DataFrame."""
    _validate_query_parameters(
        inicio,
        fim,
        duracao_minima_segundos,
        duracao_maxima_segundos,
        limite,
    )
    filtered_df = filter_route_logs(
        normalize_and_validate_route_logs(df),
        dispositivo_id=dispositivo_id,
        satelite_id=satelite_id,
        inicio=inicio,
        fim=fim,
        duracao_minima_segundos=duracao_minima_segundos,
        duracao_maxima_segundos=duracao_maxima_segundos,
    )
    aggregations = aggregate_route_logs(filtered_df)
    routes = collect_route_logs(filtered_df, limite)

    return {
        "rotas": routes,
        "agregacoes": aggregations,
        "metadados": {
            "rotas_retornadas": len(routes),
            "limite": limite,
            "ordenacao": ["inicio_rota ASC", "dispositivo_id ASC", "satelite_id ASC"],
        },
    }


def consultar_logs_rotas(
    spark_session: SparkSession,
    dataset_path: str,
    dataset_format: str = "parquet",
    **query_parameters: Any,
) -> dict[str, Any]:
    """Atalho usado pelo script: lê o dataset e executa a consulta analítica."""
    df = read_route_logs(spark_session, dataset_path, dataset_format)
    return query_route_logs(df, **query_parameters)
