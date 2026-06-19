import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_telemetry_history_flow(client: AsyncClient):
    # 1. Create multiple telemetry points for a satellite
    sat_id = "SAT-TEST-99"
    points = [
        {
            "satelite_id": sat_id,
            "latitude": -23.1,
            "longitude": -45.1,
            "cpu_percentual": 10,
            "temperatura_celsius": 25,
        },
        {
            "satelite_id": sat_id,
            "latitude": -23.2,
            "longitude": -45.2,
            "cpu_percentual": 15,
            "temperatura_celsius": 26,
        },
        {
            "satelite_id": sat_id,
            "latitude": -23.3,
            "longitude": -45.3,
            "cpu_percentual": 20,
            "temperatura_celsius": 27,
        },
    ]

    for p in points:
        res = await client.post("/telemetry/", json=p)
        assert res.status_code == 200

    # 2. Fetch history
    res_history = await client.get(f"/telemetry/history/{sat_id}")
    assert res_history.status_code == 200

    history_data = res_history.json()
    assert len(history_data) == 3
    assert history_data[0]["latitude"] == -23.1
    assert history_data[2]["latitude"] == -23.3

    # 3. Fetch history for non-existent satellite
    res_empty = await client.get("/telemetry/history/NON-EXISTENT")
    assert res_empty.status_code == 200
    assert res_empty.json() == []


def test_placeholder():
    # To avoid "no tests found" if async client fixture is not set up correctly for sync tests
    pass
