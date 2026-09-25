"""CLI documentada da US312 para consultar logs de rotas com Spark."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="US312 - Consulta analítica de logs de rotas via Apache Spark."
    )
    parser.add_argument(
        "--dataset-path",
        required=True,
        help="Caminho do dataset de logs de rotas produzido pela US311.",
    )
    parser.add_argument(
        "--dataset-format",
        default="parquet",
        choices=["parquet", "csv", "json"],
    )
    parser.add_argument("--dispositivo-id")
    parser.add_argument("--satelite-id")
    parser.add_argument("--inicio", help="Início inclusivo em ISO 8601.")
    parser.add_argument("--fim", help="Fim inclusivo em ISO 8601.")
    parser.add_argument("--duracao-minima-segundos", type=int)
    parser.add_argument("--duracao-maxima-segundos", type=int)
    parser.add_argument("--limite", type=int, default=200)
    return parser


def main(argv: list[str] | None = None) -> int:
    from app.services.route_logs_spark_service import (
        consultar_logs_rotas,
        create_spark_session,
    )

    parser = build_parser()
    args = parser.parse_args(argv)

    spark = create_spark_session()
    try:
        result = consultar_logs_rotas(
            spark_session=spark,
            dataset_path=args.dataset_path,
            dataset_format=args.dataset_format,
            dispositivo_id=args.dispositivo_id,
            satelite_id=args.satelite_id,
            inicio=args.inicio,
            fim=args.fim,
            duracao_minima_segundos=args.duracao_minima_segundos,
            duracao_maxima_segundos=args.duracao_maxima_segundos,
            limite=args.limite,
        )
    except ValueError as exc:
        parser.error(str(exc))
    finally:
        spark.stop()

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
