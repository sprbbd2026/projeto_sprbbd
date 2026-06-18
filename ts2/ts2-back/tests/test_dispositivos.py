"""Tests for US304 - Dispositivos conectados (logins ativos do usuário)."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.orm import Session

from app.main import app

CADASTRO = {
    "nome": "Maria",
    "sobrenome": "Teste",
    "email": "maria.teste@exemplo.com",
    "data_nascimento": "1995-05-20",
    "documento": "98765432100",
    "senha": "senha_segura_123",
}


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def _registrar_e_logar(client: AsyncClient) -> dict:
    """Cadastra e loga um usuário; o login cria um registro ativo em LOGIN."""
    await client.post("/users", json=CADASTRO)
    res = await client.post(
        "/auth/login",
        json={"email": CADASTRO["email"], "password": CADASTRO["senha"]},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    return {
        "device_uid": data["device_uid"],
        "headers": {
            "Authorization": f"Bearer {data['access_token']}",
            "X-Device-UID": data["device_uid"],
        },
    }


@pytest.mark.asyncio
async def test_conectados_lista_dispositivo_com_login_ativo(client: AsyncClient, db: Session):
    """CA2 - o dispositivo do login ativo do usuário aparece como conectado."""
    auth = await _registrar_e_logar(client)

    res = await client.get("/dispositivos/conectados", headers=auth["headers"])
    assert res.status_code == 200, res.text

    uuids = [d["uuid"] for d in res.json()]
    assert auth["device_uid"] in uuids


@pytest.mark.asyncio
async def test_conectados_exige_autenticacao(client: AsyncClient, db: Session):
    """Sem token/dispositivo válido, o acesso é negado."""
    res = await client.get("/dispositivos/conectados")
    assert res.status_code in (401, 403, 422)
