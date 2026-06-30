from fastapi.testclient import TestClient

from app.main import app


def test_https_origin_is_allowed_on_preflight():
    origin = "https://frontend-publicado.example"
    client = TestClient(app)

    response = client.options(
        "/users",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"
