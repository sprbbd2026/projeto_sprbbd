import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ciclo_vida_token(client: AsyncClient):
    # 1. LOGIN
    payload_login = {"email": "joao.teste@exemplo.com", "password": "senha_segura_123"}
    res_login = await client.post("/auth/login", json=payload_login)
    
    assert res_login.status_code == 200
    tokens = res_login.json()
    token_acesso = tokens.get("access_token")
    # Se o login devolver um refresh_token, vamos guardá-lo
    token_refresh = tokens.get("refresh_token") 

    # 2. TESTAR ACESSO PROTEGIDO (GET /users)
    # Enviamos o token no formato Bearer
    headers = {"Authorization": f"Bearer {token_acesso}"}
    res_users = await client.get("/users", headers=headers)
    
    assert res_users.status_code == 200
    assert isinstance(res_users.json(), list) # Swagger mostra que retorna uma lista []
    print("\n✅ Token de acesso aceite na rota protegida!")

    # 3. TESTAR REFRESH
    payload_refresh = {"access_token": token_refresh if token_refresh else token_acesso}
    
    res_refresh = await client.post("/auth/refresh", json=payload_refresh)
    
    assert res_refresh.status_code == 200
    novos_tokens = res_refresh.json()
    assert "access_token" in novos_tokens
    print("✅ Refresh realizado com sucesso!")

@pytest.mark.asyncio
async def test_acesso_negado_sem_token(client: AsyncClient):
    # Tentar aceder sem o header de autorização
    res = await client.get("/users")
    assert res.status_code in [401, 403]
    print("✅ Acesso negado sem token validado corretamente.")