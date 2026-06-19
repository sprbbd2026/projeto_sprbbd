import requests
import time

BASE_URL = "http://localhost:8000"
SAT_ID = "1"


def inject_long_trajectory():
    print(f"Injecting 20-point trajectory for satellite: {SAT_ID}")

    # 1. Clear existing telemetry for this satellite (if the API supports it,
    # but here I'll just keep adding or we assume we want a clean slate)
    # Since there's no DELETE /telemetry/{id} in the routes we saw,
    # I'll just use a different ID or just let it append.
    # Actually, let's just append to see the full list, but the user asked for 20 distinct.

    # Path from São José dos Campos towards Taubaté
    # Start: -23.1896, -45.8841
    # End: -23.0264, -45.5552

    start_lat, start_lng = -23.1896, -45.8841
    end_lat, end_lng = -23.0250, -45.5500

    for i in range(20):
        # Linear interpolation for the path
        t = i / 19.0
        lat = start_lat + (end_lat - start_lat) * t
        lng = start_lng + (end_lng - start_lng) * t

        data = {
            "satelite_id": SAT_ID,
            "latitude": lat,
            "longitude": lng,
            "cpu_percentual": 10 + (i * 2),
            "temperatura_celsius": 20 + (i % 10),
            "status": "operacional",
        }

        try:
            response = requests.post(f"{BASE_URL}/telemetry/", json=data)
            if response.status_code == 200:
                print(f"  [OK] Point {i + 1} injected at {lat:.4f}, {lng:.4f}")
            else:
                print(f"  [ERROR] Point {i + 1} failed: {response.status_code}")
        except Exception as e:
            print(f"  [ERROR] Connection failed: {e}")
            break
        # Small sleep to ensure timestamps are slightly different if needed
        time.sleep(0.1)


if __name__ == "__main__":
    inject_long_trajectory()
