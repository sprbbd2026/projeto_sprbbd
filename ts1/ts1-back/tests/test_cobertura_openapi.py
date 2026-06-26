import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_cobertura_satelite_documented_in_openapi():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/openapi.json")

    assert response.status_code == 200
    spec = response.json()

    path = spec["paths"]["/cobertura/satelite/{sat_id}"]["get"]
    assert path["tags"] == ["Cobertura"]
    assert path["summary"] == "Cobertura orbital de um satélite"
    assert "US307" in path["description"]
    assert "404" in path["responses"]

    sat_id_param = path["parameters"][0]
    assert sat_id_param["name"] == "sat_id"
    assert sat_id_param["in"] == "path"

    schema_ref = path["responses"]["200"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    assert schema_ref.endswith("/CoberturaGeoJsonFeatureCollection")

    collection_schema = spec["components"]["schemas"]["CoberturaGeoJsonFeatureCollection"]
    assert collection_schema["properties"]["type"]["const"] == "FeatureCollection"
    assert "example" in collection_schema
