"""Tests for US304 - Dispositivos conectados (online via heartbeat)."""
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.orm import Session

from app.db.models import Dispositivo
from app.main import app

DEVICE_UID = "device-uuid-de-teste-0001"
HEADERS = {"X-Device-UID": DEVICE_UID}


@pytest_asyncio.fixture
async def client():
    """HTTP client que despacha requisições direto para o app FastAPI."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_heartbeat_marca_dispositivo_como_online(client: AsyncClient, db: Session):
    """CA2 - ao enviar heartbeat, o dispositivo passa a aparecer como conectado."""
    resp = await client.post("/dispositivos/heartbeat", headers=HEADERS)
    assert resp.status_code == 200, resp.text
    assert resp.json()["uuid"] == DEVICE_UID

    conectados = await client.get("/dispositivos/conectados")
    assert conectados.status_code == 200
    uuids = [d["uuid"] for d in conectados.json()]
    assert DEVICE_UID in uuids


@pytest.mark.asyncio
async def test_heartbeat_sem_header_retorna_erro(client: AsyncClient, db: Session):
    """O heartbeat exige o header X-Device-UID."""
    resp = await client.post("/dispositivos/heartbeat")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_dispositivo_com_sinal_antigo_nao_aparece(client: AsyncClient, db: Session):
    """Um dispositivo cujo último sinal está fora da janela não é considerado online."""
    antigo = Dispositivo(
        uuid="device-offline-0002",
        ultimo_sinal=datetime(2000, 1, 1, tzinfo=timezone.utc),
    )
    db.add(antigo)
    db.commit()

    conectados = await client.get("/dispositivos/conectados")
    assert conectados.status_code == 200
    uuids = [d["uuid"] for d in conectados.json()]
    assert "device-offline-0002" not in uuids


@pytest.mark.asyncio
async def test_conectados_vazio_sem_dispositivos(client: AsyncClient, db: Session):
    """Sem nenhum sinal recente, a lista de conectados vem vazia."""
    resp = await client.get("/dispositivos/conectados")
    assert resp.status_code == 200
    assert resp.json() == []
