"""Tests for US301 - Timestamp registration in locations"""
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from app.main import app


@pytest_asyncio.fixture
async def client():
    """Fixture that creates an HTTP client to dispatch requests"""
    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_ca01_registrar_localizacao_com_timestamp_valido(client: AsyncClient):
    """
    CA01 - Registro com timestamp
    
    Evento: POST de localização com coordenadas e horário ISO-8601.
    Resultado esperado: Registro salvo com timestamp exato informado.
    """

    timestamp_iso = datetime.now(timezone.utc).isoformat()
    
    payload = {
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5,
        "timestamp": timestamp_iso
    }
    
    response = await client.post("/locais", json=payload)
    
    assert response.status_code == 200, f"Erro ao registrar localização: {response.text}"
    
    data = response.json()
    assert "id" in data
    assert data["nome"] == payload["nome"]
    assert data["lat"] == payload["lat"]
    assert data["lng"] == payload["lng"]
    assert data["categoria"] == payload["categoria"]
    assert data["rating"] == payload["rating"]
    assert "timestamp" in data
    assert data["timestamp"] is not None


@pytest.mark.asyncio
async def test_ca02_rejeitar_localizacao_sem_timestamp(client: AsyncClient):
    """
    CA02 - Registro sem timestamp
    
    Resultado esperado: API retorna erro de validação; nada persistido.
    """
    payload = {
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5
        # timestamp is missing
    }
    
    response = await client.post("/locais", json=payload)
    
    assert response.status_code == 422, f"Esperado erro de validação, recebido: {response.status_code}"
    
    error_data = response.json()
    assert "detail" in error_data


@pytest.mark.asyncio
async def test_ca02_rejeitar_localizacao_com_timestamp_invalido(client: AsyncClient):
    """
    CA02 - Registro com timestamp inválido (sem timezone)
    
    Resultado esperado: API retorna erro de validação.
    """
    payload = {
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5,
        "timestamp": "2026-06-16T10:00:00"  # Sem informação de timezone
    }
    
    response = await client.post("/locais", json=payload)
    
    assert response.status_code == 422, f"Esperado erro de validação, recebido: {response.status_code}"


@pytest.mark.asyncio
async def test_ca03_consulta_ordenada_por_timestamp(client: AsyncClient):
    """
    CA03 - Consulta ordenada
    
    Resultado esperado: SELECT por entidade retorna pontos em ordem cronológica crescente.
    """

    localizacoes = [
        {
            "nome": "Ponto 1",
            "lat": -23.550520,
            "lng": -46.633309,
            "categoria": "comercial",
            "rating": 5,
            "timestamp": "2026-06-16T10:00:00+00:00"
        },
        {
            "nome": "Ponto 2",
            "lat": -23.560000,
            "lng": -46.640000,
            "categoria": "residencial",
            "rating": 4,
            "timestamp": "2026-06-16T11:00:00+00:00"
        },
        {
            "nome": "Ponto 3",
            "lat": -23.570000,
            "lng": -46.650000,
            "categoria": "publico",
            "rating": 3,
            "timestamp": "2026-06-16T09:00:00+00:00"  # Timestamp anterior
        }
    ]
    

    for localizacao in localizacoes:
        response = await client.post("/locais", json=localizacao)
        assert response.status_code == 200, f"Erro ao registrar: {response.text}"
    
    response = await client.get("/locais")
    assert response.status_code == 200
    
    data = response.json()
    
    assert len(data) >= 3, f"Esperado pelo menos 3 localizações, recebido {len(data)}"
    
    timestamps = [item["timestamp"] for item in data[-3:]]
    
    for i in range(len(timestamps) - 1):
        current = datetime.fromisoformat(timestamps[i])
        next_ts = datetime.fromisoformat(timestamps[i + 1])
        assert current <= next_ts, f"Timestamps não estão em ordem crescente: {timestamps}"
