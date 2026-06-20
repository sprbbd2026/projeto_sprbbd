from app.services.satellite_log_gold_service import (
    SatelliteLogGoldService,
)

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

service = SatelliteLogGoldService()

dataset = service.gerar_dataset(
    telemetria_path= BASE_DIR / "samples/telemetria_export.csv",
    eventos_path= BASE_DIR / "samples/comunicacao_eventos_export.csv",
    comandos_path= BASE_DIR / "samples/comando_export.csv",
)

service.salvar_dataset(
    dataset,
    BASE_DIR / "data/gold/log_satelite",
)

print("Dataset analytics.log_satelite gerado com sucesso.")