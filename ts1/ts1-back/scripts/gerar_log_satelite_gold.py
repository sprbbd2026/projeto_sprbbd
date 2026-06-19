from app.services.satellite_log_gold_service import (
    SatelliteLogGoldService,
)

service = SatelliteLogGoldService()

dataset = service.gerar_dataset(
    telemetria_path="samples/telemetria_export.csv",
    eventos_path="samples/comunicacao_eventos_export.csv",
    comandos_path="samples/comando_export.csv",
)

service.salvar_dataset(
    dataset,
    "data/gold/log_satelite",
)

print("Dataset analytics.log_satelite gerado com sucesso.")