from app.services.satellite_log_spark_service import (
    create_spark_session,
    get_expected_schema,
)
from pyspark.sql.functions import (
    col,
    concat,
    current_timestamp,
    lit,
    to_date,
    to_timestamp,
)


class SatelliteLogGoldService:

    def __init__(self):

        self.spark = create_spark_session(
        app_name="US309_SPRBBD"
    )

    def read_sources(
        self,
        telemetria_path,
        eventos_path,
        comandos_path,
    ):

        telemetria = (
            self.spark.read
            .option("header", True)
            .csv(telemetria_path)
        )

        eventos = (
            self.spark.read
            .option("header", True)
            .csv(eventos_path)
        )

        comandos = (
            self.spark.read
            .option("header", True)
            .csv(comandos_path)
        )

        return telemetria, eventos, comandos

    def transform_telemetria(self, telemetria):

        return (

            telemetria

            .withColumn(
                "id",
                concat(lit("TLM-"), col("tlm_id"))
            )

            .withColumn(
                "sat_id",
                col("sat_id").cast("string")
            )

            .withColumn(
                "timestamp_evento",
                to_timestamp(col("tlm_timestamp"))
            )

            .withColumn(
                "tipo_evento",
                lit("TELEMETRIA")
            )

            .withColumn(
                "origem_log",
                lit("telemetria")
            )

            .withColumn(
                "payload_json",
                concat(
                    lit('{"temperatura":'),
                    col("tlm_temperatura"),
                    lit(',"orientacao":"'),
                    col("tlm_orientacao"),
                    lit('","checksum":"'),
                    col("tlm_checksum"),
                    lit('","memoria":'),
                    col("tlm_memoria"),
                    lit(',"energia":'),
                    col("tlm_energia"),
                    lit(',"cpu":'),
                    col("tlm_cpu"),
                    lit("}")
                )
            )

            .withColumn(
                "resumo",
                concat(
                    lit("Telemetria recebida do satélite "),
                    col("sat_id")
                )
            )

            .withColumn("status_evento", lit(None).cast("string"))
            .withColumn("operador_id", lit(None).cast("int"))
            .withColumn("cmd_id", lit(None).cast("int"))
            .withColumn("est_id", lit(None).cast("int"))
            .withColumn("con_id", lit(None).cast("int"))
            .withColumn("sat_status", lit(None).cast("string"))
        )

    def transform_eventos(self, eventos):

        return (

            eventos

            .withColumn(
                "id",
                concat(lit("EVT-"), col("evt_id"))
            )

            .withColumn(
                "sat_id",
                col("evt_satelite_id")
            )

            .withColumn(
                "timestamp_evento",
                to_timestamp(col("evt_data_hora"))
            )

            .withColumn(
                "tipo_evento",
                col("evt_tipo")
            )

            .withColumn(
                "origem_log",
                lit("comunicacao_eventos")
            )

            .withColumn(
                "payload_json",
                col("evt_payload")
            )

            .withColumn(
                "resumo",
                concat(
                    lit("Evento de comunicação: "),
                    col("evt_tipo"),
                    lit(" / status: "),
                    col("evt_status")
                )
            )

            .withColumn(
                "status_evento",
                col("evt_status")
            )

            .withColumn(
                "operador_id",
                col("opr_id").cast("int")
            )

            .withColumn("cmd_id", lit(None).cast("int"))
            .withColumn("est_id", lit(None).cast("int"))
            .withColumn("con_id", lit(None).cast("int"))
            .withColumn("sat_status", lit(None).cast("string"))
        )

    def transform_comandos(self, comandos):

        return (

            comandos

            .withColumn(
                "id",
                concat(lit("CMD-"), col("cmd_id"))
            )

            .withColumn(
                "sat_id",
                col("sat_id").cast("string")
            )

            .withColumn(
                "timestamp_evento",
                to_timestamp(col("cmd_timestamp"))
            )

            .withColumn(
                "tipo_evento",
                col("cmd_tipo")
            )

            .withColumn(
                "origem_log",
                lit("comando")
            )

            .withColumn(
                "payload_json",
                concat(
                    lit('{"cmd_id":'),
                    col("cmd_id"),
                    lit(',"est_id":'),
                    col("est_id"),
                    lit(',"sat_id":'),
                    col("sat_id"),
                    lit("}")
                )
            )

            .withColumn(
                "resumo",
                concat(
                    lit("Comando emitido para satélite "),
                    col("sat_id")
                )
            )

            .withColumn("status_evento", lit(None).cast("string"))
            .withColumn("operador_id", lit(None).cast("int"))

            .withColumn(
                "cmd_id",
                col("cmd_id").cast("int")
            )

            .withColumn(
                "est_id",
                col("est_id").cast("int")
            )

            .withColumn("con_id", lit(None).cast("int"))
            .withColumn("sat_status", lit(None).cast("string"))
        )

    def gerar_dataset(
        self,
        telemetria_path,
        eventos_path,
        comandos_path,
    ):

        telemetria, eventos, comandos = self.read_sources(
            telemetria_path,
            eventos_path,
            comandos_path,
        )

        telemetria_log = self.transform_telemetria(telemetria)

        eventos_log = self.transform_eventos(eventos)

        comandos_log = self.transform_comandos(comandos)
        
        final_df = (

            telemetria_log

            .unionByName(eventos_log)

            .unionByName(comandos_log)

            .withColumn(
                "ingestion_ts",
                current_timestamp()
            )

            .withColumn(
                "dt",
                to_date(col("timestamp_evento"))
            )

        )

        return final_df.select(
            *[field.name for field in get_expected_schema().fields]
        )

    def salvar_dataset(
        self,
        dataframe,
        output_path,
    ):

        (
            dataframe.write
            .mode("overwrite")
            .partitionBy("dt")
            .parquet(output_path)
        )