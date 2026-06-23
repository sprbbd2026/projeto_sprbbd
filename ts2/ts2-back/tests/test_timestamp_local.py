"""Tests for US301 - Timestamp registration in locations"""
import pytest
from datetime import datetime, timezone


def test_ca01_registrar_localizacao_com_timestamp_valido(client, test_ponto):
    """
    CA01 - Registro com timestamp
    
    Evento: POST de localização com coordenadas e horário ISO-8601.
    Resultado esperado: Registro salvo com timestamp exato informado.
    """
    timestamp_iso = datetime.now(timezone.utc).isoformat()
    
    payload = {
        "id_ponto": test_ponto,
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5,
        "timestamp": timestamp_iso
    }
    
    response = client.post("/locais", json=payload)
    
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


def test_ca02_rejeitar_localizacao_sem_timestamp(client, test_ponto):
    """
    CA02 - Registro sem timestamp
    
    Resultado esperado: API retorna erro de validação; nada persistido.
    """
    payload = {
        "id_ponto": test_ponto,
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5
        # timestamp is missing
    }
    
    response = client.post("/locais", json=payload)
    
    assert response.status_code == 422, f"Esperado erro de validação, recebido: {response.status_code}"
    
    error_data = response.json()
    assert "detail" in error_data


def test_ca02_rejeitar_localizacao_com_timestamp_invalido(client, test_ponto):
    """
    CA02 - Registro com timestamp inválido (sem timezone)
    
    Resultado esperado: API retorna erro de validação.
    """
    payload = {
        "id_ponto": test_ponto,
        "nome": "Escritório Principal",
        "lat": -23.550520,
        "lng": -46.633309,
        "categoria": "comercial",
        "rating": 5,
        "timestamp": "2026-06-16T10:00:00"  # Sem informação de timezone
    }
    
    response = client.post("/locais", json=payload)
    
    assert response.status_code == 422, f"Esperado erro de validação, recebido: {response.status_code}"


def test_ca03_consulta_ordenada_por_timestamp(client, test_ponto):
    """
    CA03 - Consulta ordenada
    
    Resultado esperado: SELECT por entidade retorna pontos em ordem cronológica crescente.
    """
    localizacoes = [
        {
            "id_ponto": test_ponto,
            "nome": "Ponto 1",
            "lat": -23.550520,
            "lng": -46.633309,
            "categoria": "comercial",
            "rating": 5,
            "timestamp": "2026-06-16T10:00:00+00:00"
        },
        {
            "id_ponto": test_ponto,
            "nome": "Ponto 2",
            "lat": -23.560000,
            "lng": -46.640000,
            "categoria": "residencial",
            "rating": 4,
            "timestamp": "2026-06-16T11:00:00+00:00"
        },
        {
            "id_ponto": test_ponto,
            "nome": "Ponto 3",
            "lat": -23.570000,
            "lng": -46.650000,
            "categoria": "publico",
            "rating": 3,
            "timestamp": "2026-06-16T09:00:00+00:00"  # Timestamp anterior
        }
    ]
    
    for localizacao in localizacoes:
        response = client.post("/locais", json=localizacao)
        assert response.status_code == 200, f"Erro ao registrar: {response.text}"
    
    response = client.get("/locais")
    assert response.status_code == 200
    
    data = response.json()
    
    assert len(data) >= 3, f"Esperado pelo menos 3 localizações, recebido {len(data)}"
    
    timestamps = [item["timestamp"] for item in data[-3:]]
    
    for i in range(len(timestamps) - 1):
        current = datetime.fromisoformat(timestamps[i])
        next_ts = datetime.fromisoformat(timestamps[i + 1])
        assert current <= next_ts, f"Timestamps não estão em ordem crescente: {timestamps}"




