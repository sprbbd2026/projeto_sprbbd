from __future__ import annotations

from datetime import datetime
from typing import Any

COLUNAS_PADRAO = {
    "dispositivo_id": ["dispositivo_id", "device_id"],
    "satelite_id": ["satelite_id", "satellite_id", "sat_id"],
    "inicio_rota": ["inicio_rota", "route_start", "start_time"],
    "fim_rota": ["fim_rota", "route_end", "end_time"],
    "duracao_segundos": [
        "duracao_segundos",
        "route_duration_seconds",
        "duration_seconds",
    ],
    "extensao_km": ["extensao_km", "route_distance_km", "distance_km"],
}


def criar_spark_session(app_name: str = "us312-consulta-logs-rotas"):
    try:
        from pyspark.sql import SparkSession
    except ImportError as exc:
        raise RuntimeError(
            "PySpark não está instalado. Execute `uv sync` para instalar.",
        ) from exc
    return SparkSession.builder.appName(app_name).getOrCreate()


def _normalizar_colunas(df):
    for coluna_padrao, aliases in COLUNAS_PADRAO.items():
        if coluna_padrao in df.columns:
            continue
        alias_encontrado = next(
            (alias for alias in aliases if alias in df.columns),
            None,
        )
        if alias_encontrado:
            df = df.withColumnRenamed(alias_encontrado, coluna_padrao)
    return df


def _coagir_datetime(valor: datetime | str | None) -> datetime | None:
    if valor is None or isinstance(valor, datetime):
        return valor
    return datetime.fromisoformat(valor)


def consultar_logs_rotas(
    spark_session,
    dataset_path: str,
    dataset_format: str = "parquet",
    dispositivo_id: str | None = None,
    satelite_id: str | None = None,
    inicio: datetime | str | None = None,
    fim: datetime | str | None = None,
    duracao_minima_segundos: int | None = None,
    duracao_maxima_segundos: int | None = None,
    limite: int = 200,
) -> dict[str, Any]:
    from pyspark.sql import functions as F

    reader = spark_session.read.format(dataset_format)
    if dataset_format == "csv":
        reader = reader.option("header", True).option("inferSchema", True)
    df = reader.load(dataset_path)
    df = _normalizar_colunas(df)

    colunas_obrigatorias = {
        "dispositivo_id",
        "satelite_id",
        "inicio_rota",
        "fim_rota",
        "duracao_segundos",
        "extensao_km",
    }
    faltantes = colunas_obrigatorias - set(df.columns)
    if faltantes:
        colunas = ", ".join(sorted(faltantes))
        raise ValueError(f"Dataset de rotas inválido. Colunas ausentes: {colunas}")

    df = (
        df.withColumn("inicio_rota", F.to_timestamp(F.col("inicio_rota")))
        .withColumn("fim_rota", F.to_timestamp(F.col("fim_rota")))
        .withColumn("duracao_segundos", F.col("duracao_segundos").cast("long"))
        .withColumn("extensao_km", F.col("extensao_km").cast("double"))
    )

    inicio_dt = _coagir_datetime(inicio)
    fim_dt = _coagir_datetime(fim)

    if dispositivo_id:
        df = df.filter(F.col("dispositivo_id") == dispositivo_id)
    if satelite_id:
        df = df.filter(F.col("satelite_id") == satelite_id)
    if inicio_dt:
        df = df.filter(F.col("inicio_rota") >= F.lit(inicio_dt))
    if fim_dt:
        df = df.filter(F.col("fim_rota") <= F.lit(fim_dt))
    if duracao_minima_segundos is not None:
        df = df.filter(F.col("duracao_segundos") >= duracao_minima_segundos)
    if duracao_maxima_segundos is not None:
        df = df.filter(F.col("duracao_segundos") <= duracao_maxima_segundos)

    agregado = df.agg(
        F.count("*").alias("total_rotas"),
        F.avg("extensao_km").alias("extensao_media_km"),
    ).collect()[0]

    rotas = [
        row.asDict(recursive=True)
        for row in df.orderBy(F.col("inicio_rota").asc()).limit(limite).collect()
    ]

    return {
        "rotas": rotas,
        "agregacoes": {
            "total_rotas": int(agregado["total_rotas"] or 0),
            "extensao_media_km": float(agregado["extensao_media_km"] or 0.0),
        },
    }
