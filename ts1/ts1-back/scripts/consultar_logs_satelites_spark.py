#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.services.satellite_log_spark_service import (  # noqa: E402
    build_consulta_logs_sql,
    build_summary_sql,
    collect_logs_sql,
    create_spark_session,
    query_logs_sql,
    read_satellite_logs,
    register_logs_temp_view,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="US310 - Consulta de logs de satélites via Apache Spark SQL"
    )
    parser.add_argument(
        "--input-path",
        default="data/gold/log_satelite",
        help="Dataset Parquet gerado pela US309",
    )
    parser.add_argument("--view-name", default="log_satelite")
    parser.add_argument("--sat-id", help="Identificador do satélite")
    parser.add_argument(
        "--inicio", help='Início inclusivo, por exemplo "2026-06-01 00:00:00"'
    )
    parser.add_argument("--fim", help="Fim inclusivo, em data/hora ISO")
    parser.add_argument("--tipo-evento", help="Tipo de evento")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--json", action="store_true", help="Exibe saída JSON")
    parser.add_argument(
        "--show-sql", action="store_true", help="Exibe a consulta SQL principal"
    )
    return parser.parse_args()


def _json_default(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def _print_result(result: dict[str, Any], as_json: bool) -> None:
    if as_json:
        print(
            json.dumps(
                result,
                ensure_ascii=False,
                indent=2,
                default=_json_default,
            )
        )
        return

    summary = result["resumo"]
    print(f"Total de eventos: {summary['total_eventos']}")
    print(f"Último evento: {summary['ultimo_evento'] or '-'}")
    if not result["logs"]:
        print("Nenhum log encontrado para os filtros informados.")
        return

    for log in result["logs"]:
        print(json.dumps(log, ensure_ascii=False, default=_json_default))


def _handle_sql_output(
    result: dict[str, Any], sql: str, show_sql: bool, as_json: bool
) -> None:
    if not show_sql:
        return
    if as_json:
        result["sql"] = sql
        return
    print(sql)


def main() -> int:
    args = parse_args()
    spark = create_spark_session()
    try:
        logs = read_satellite_logs(spark, args.input_path)
        register_logs_temp_view(logs, args.view_name)

        query_parameters = {
            "view_name": args.view_name,
            "sat_id": args.sat_id,
            "inicio": args.inicio,
            "fim": args.fim,
            "tipo_evento": args.tipo_evento,
            "limit": args.limit,
        }
        sql = build_consulta_logs_sql(**query_parameters)

        queried_logs = query_logs_sql(spark, **query_parameters)
        result = {
            "resumo": build_summary_sql(
                spark,
                args.view_name,
                sat_id=args.sat_id,
                inicio=args.inicio,
                fim=args.fim,
                tipo_evento=args.tipo_evento,
            ),
            "logs": collect_logs_sql(queried_logs),
        }
        _handle_sql_output(result, sql, args.show_sql, args.json)
        _print_result(result, args.json)
        return 0
    except FileNotFoundError:
        print(
            "Dataset de logs de satélites não encontrado em "
            f"'{args.input_path}'. A US309 ainda precisa gerar o dataset "
            "Parquet data/gold/log_satelite.",
            file=sys.stderr,
        )
        return 1
    except ValueError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 2
    finally:
        spark.stop()


if __name__ == "__main__":
    raise SystemExit(main())
