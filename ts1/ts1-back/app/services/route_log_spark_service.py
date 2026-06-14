from __future__ import annotations

import argparse
from datetime import datetime


def _escape_sql_literal(value: str) -> str:
    return value.replace("'", "''")


def _to_timestamp_literal(value: str | datetime) -> str:
    if isinstance(value, datetime):
        value = value.isoformat(sep=" ", timespec="seconds")
    return _escape_sql_literal(value)


def build_log_rota_query(
    table_name: str = "log_rota",
    satelite_id: str | None = None,
    dispositivo_id: str | None = None,
    inicio_periodo: str | datetime | None = None,
    fim_periodo: str | datetime | None = None,
    duracao_min_segundos: int | None = None,
    duracao_max_segundos: int | None = None,
) -> str:
    conditions: list[str] = []

    if satelite_id:
        conditions.append(f"satelite_id = '{_escape_sql_literal(satelite_id)}'")
    if dispositivo_id:
        conditions.append(f"dispositivo_id = '{_escape_sql_literal(dispositivo_id)}'")
    if inicio_periodo:
        ts = _to_timestamp_literal(inicio_periodo)
        conditions.append(f"inicio_rota >= TIMESTAMP '{ts}'")
    if fim_periodo:
        ts = _to_timestamp_literal(fim_periodo)
        conditions.append(f"fim_rota <= TIMESTAMP '{ts}'")
    if duracao_min_segundos is not None:
        conditions.append(f"duracao_segundos >= {duracao_min_segundos}")
    if duracao_max_segundos is not None:
        conditions.append(f"duracao_segundos <= {duracao_max_segundos}")

    where_clause = ""
    if conditions:
        where_clause = f" WHERE {' AND '.join(conditions)}"

    return f"SELECT * FROM {table_name}{where_clause}"


def run_log_rota_query(spark, **kwargs):
    query = build_log_rota_query(**kwargs)
    return spark.sql(query)


def main() -> None:
    parser = argparse.ArgumentParser(description="Consulta Spark para logs de rotas.")
    parser.add_argument(
        "--input-path", required=True, help="Caminho do dataset de log_rota."
    )
    parser.add_argument(
        "--format", default="parquet", choices=["parquet", "csv", "json"]
    )
    parser.add_argument("--table-name", default="log_rota")
    parser.add_argument("--satelite-id")
    parser.add_argument("--dispositivo-id")
    parser.add_argument("--inicio-periodo")
    parser.add_argument("--fim-periodo")
    parser.add_argument("--duracao-min-segundos", type=int)
    parser.add_argument("--duracao-max-segundos", type=int)
    args = parser.parse_args()

    from pyspark.sql import SparkSession

    spark = SparkSession.builder.appName("consulta-log-rota").getOrCreate()
    try:
        reader = spark.read.format(args.format)
        if args.format == "csv":
            reader = reader.option("header", True).option("inferSchema", True)
        reader.load(args.input_path).createOrReplaceTempView(args.table_name)

        result = run_log_rota_query(
            spark,
            table_name=args.table_name,
            satelite_id=args.satelite_id,
            dispositivo_id=args.dispositivo_id,
            inicio_periodo=args.inicio_periodo,
            fim_periodo=args.fim_periodo,
            duracao_min_segundos=args.duracao_min_segundos,
            duracao_max_segundos=args.duracao_max_segundos,
        )
        result.show(truncate=False)
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
