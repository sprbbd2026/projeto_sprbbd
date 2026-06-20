import os

import pandas as pd

from app.db.database import engine

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data"

os.makedirs(OUTPUT_DIR, exist_ok=True)


def exportar_csv(nome_arquivo: str, query: str):

    dataframe = pd.read_sql(
        query,
        con=engine,
    )

    caminho = os.path.join(
        OUTPUT_DIR,
        nome_arquivo,
    )

    dataframe.to_csv(
        caminho,
        index=False,
    )

    print(f"CSV exportado: {caminho}")


def main():

    query_telemetria = """
    SELECT
        t.tlm_id,
        t.sat_id,
        t.tlm_timestamp,
        t.tlm_temperatura,
        t.tlm_orientacao,
        t.tlm_checksum,
        t.tlm_memoria,
        t.tlm_energia,
        t.tlm_cpu,
        s.con_id,
        s.sat_status
    FROM telemetria t
    LEFT JOIN satelite s
        ON t.sat_id = s.sat_id;
    """

    query_eventos = """
    SELECT
        e.evt_id,
        e.evt_satelite_id,
        e.evt_data_hora,
        e.evt_tipo,
        e.evt_payload,
        e.evt_status,
        e.opr_id,
        s.con_id,
        s.sat_status
    FROM comunicacao_eventos e
    LEFT JOIN satelite s
        ON e.evt_satelite_id::INTEGER = s.sat_id;
    """

    query_comandos = """
    SELECT
        c.cmd_id,
        c.sat_id,
        c.est_id,
        c.cmd_timestamp,
        c.cmd_tipo,
        s.con_id,
        s.sat_status
    FROM comando c
    LEFT JOIN satelite s
        ON c.sat_id = s.sat_id;
    """

    exportar_csv(
        "telemetria.csv",
        query_telemetria,
    )

    exportar_csv(
        "eventos.csv",
        query_eventos,
    )

    exportar_csv(
        "comandos.csv",
        query_comandos,
    )


if __name__ == "__main__":
    main()