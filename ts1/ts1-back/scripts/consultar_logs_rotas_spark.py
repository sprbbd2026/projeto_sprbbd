import argparse
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def parse_args():
    parser = argparse.ArgumentParser(
        description="US312 - Consulta analítica de logs de rotas via Apache Spark",
    )
    parser.add_argument(
        "--dataset-path",
        required=True,
        help="Caminho para dataset de logs de rotas",
    )
    parser.add_argument(
        "--dataset-format",
        default="parquet",
        choices=["parquet", "csv", "json"],
    )
    parser.add_argument("--dispositivo-id")
    parser.add_argument("--satelite-id")
    parser.add_argument("--inicio", help="Data/hora inicial no formato ISO-8601")
    parser.add_argument("--fim", help="Data/hora final no formato ISO-8601")
    parser.add_argument("--duracao-minima-segundos", type=int)
    parser.add_argument("--duracao-maxima-segundos", type=int)
    parser.add_argument("--limite", type=int, default=200)
    return parser.parse_args()


def main():
    from app.services.route_logs_spark_service import (
        consultar_logs_rotas,
        criar_spark_session,
    )

    args = parse_args()
    spark = criar_spark_session()
    try:
        resultado = consultar_logs_rotas(
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
        print(json.dumps(resultado, ensure_ascii=False, default=str, indent=2))
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
