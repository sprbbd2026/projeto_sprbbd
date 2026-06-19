import requests
import json
import time

BASE_URL = "http://localhost:8000"
SAT_ID = "SAT-VALE-01"


def inject_sample_data():
    print(f"Injecting sample telemetry for satellite: {SAT_ID}")

    # Points across Vale do Paraíba
    points = [
        {"lat": -23.1896, "lng": -45.8841},  # SJC Centro
        {"lat": -23.2045, "lng": -45.8722},  # SJC Sul
        {"lat": -23.2198, "lng": -45.8590},  # SJC Dutra
        {"lat": -23.2350, "lng": -45.8450},  # SJC Industrial
    ]

    for i, p in enumerate(points):
        data = {
            "satelite_id": SAT_ID,
            "latitude": p["lat"],
            "longitude": p["lng"],
            "cpu_percentual": 10 + (i * 5),
            "temperatura_celsius": 25 + i,
            "status": "operacional",
        }

        try:
            response = requests.post(f"{BASE_URL}/telemetry/", json=data)
            if response.status_code == 200:
                print(f"  [OK] Point {i + 1} injected.")
            else:
                print(f"  [ERROR] Point {i + 1} failed: {response.status_code}")
        except Exception as e:
            print(f"  [ERROR] Connection failed: {e}")
            break


if __name__ == "__main__":
    inject_sample_data()
