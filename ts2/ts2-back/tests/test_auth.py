import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_fluxo_usuario_completo(client: AsyncClient):
    # 1. DADOS DE CADASTRO
    payload_cadastro = {
        "nome": "João",
        "sobrenome": "Teste",
        "email": "joao.teste@exemplo.com",
        "data_nascimento": "1995-05-20", # Formato YYYY-MM-DD
        "documento": "12345678900",
        "senha": "senha_segura_123"
    }

    # Executa o Cadastro
    res_cadastro = await client.post("/users", json=payload_cadastro)
    
    # Validamos o sucesso (200 ou 201)
    assert res_cadastro.status_code in [200, 201], f"Erro no cadastro: {res_cadastro.text}"
    print("\n✅ Usuário cadastrado com sucesso!")

    # 2. DADOS DE LOGIN
    payload_login = {
        "email": "joao.teste@exemplo.com",
        "password": "senha_segura_123" 
    }

    # Executa o Login
    res_login = await client.post("/auth/login", json=payload_login)
    
    # Validamos o Login
    assert res_login.status_code == 200, f"Erro no login: {res_login.text}"
    
    dados_token = res_login.json()
    assert "access_token" in dados_token
    print("✅ Login realizado e token gerado!")