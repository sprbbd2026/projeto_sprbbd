import os

from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "altere-em-producao-use-uma-chave-longa-e-aleatoria")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Janela (em segundos) em que um dispositivo é considerado "online" após o
# último heartbeat. Usado pela US304 para listar os dispositivos conectados.
DEVICE_ONLINE_THRESHOLD_SECONDS = int(os.getenv("DEVICE_ONLINE_THRESHOLD_SECONDS", "60"))
