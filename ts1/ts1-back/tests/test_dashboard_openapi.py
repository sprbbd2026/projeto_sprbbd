import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_dashboard_summary_documented_in_openapi():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/openapi.json")

    assert response.status_code == 200
    spec = response.json()

    path = spec["paths"]["/dashboard/summary"]["get"]
    assert path["tags"] == ["Dashboard"]
    assert path["summary"] == "Resumo operacional do dashboard"
    assert "US304" in path["description"]

    schema_ref = path["responses"]["200"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    assert schema_ref.endswith("/DashboardSummary")

    dashboard_summary_schema = spec["components"]["schemas"]["DashboardSummary"]
    properties = dashboard_summary_schema["properties"]
    assert set(properties) == {"active_satellites", "alerts", "users"}
    assert "description" in properties["active_satellites"]
    assert "example" in dashboard_summary_schema
