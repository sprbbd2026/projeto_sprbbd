import random
import time
import requests
from datetime import datetime

URL = "http://localhost:8000/telemetria/ingest"

SATELLITES = [1, 2, 3]

while True:

    sat_id = random.choice(SATELLITES)

    payload = {
        "header": {
            "sat_id": sat_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "packet_id": random.randint(1000, 9999)
        },
        "subsystems": {
            "power": {
                "battery_level": random.uniform(70, 100),
                "solar_panel_v": random.uniform(20, 30)
            },
            "adcs": {
                "attitude": [
                    random.uniform(-1, 1),
                    random.uniform(-1, 1),
                    random.uniform(-1, 1)
                ],
                "pointing_error": random.uniform(0, 0.1)
            },
            "obc": {
                "cpu_usage": random.uniform(10, 80),
                "temp_core": random.uniform(20, 60),
                "memory_usage": random.uniform(20, 90)
            }
        },
        "gps_payload": {
            "position_xyz": [
                random.uniform(1000, 8000),
                random.uniform(1000, 8000),
                random.uniform(1000, 8000)
            ],
            "signal_integrity": "HEALTHY",
            "active_channels": random.randint(8, 16)
        }
    }

    response = requests.post(URL, json=payload)

    print(response.status_code, response.json())

    time.sleep(30)