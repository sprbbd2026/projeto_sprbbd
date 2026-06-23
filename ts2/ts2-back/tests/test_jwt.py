import pytest
from httpx import AsyncClient

def test_ciclo_vida_token(client):
    # 0. REGISTRAR USUÁRIO PRIMEIRO
    payload_cadastro = {
        "nome": "Maria",
        "sobrenome": "Silva",
        "email": "maria.silva@exemplo.com",
        "data_nascimento": "1990-03-15",
        "documento": "98765432100",
        "senha": "senha_muito_segura_456"
    }
    res_cadastro = client.post("/users", json=payload_cadastro)
    assert res_cadastro.status_code in [200, 201], f"Erro no cadastro: {res_cadastro.text}"
    device_uid_registration = res_cadastro.json().get("device_uid")

    # 1. LOGIN
    payload_login = {"email": "maria.silva@exemplo.com", "password": "senha_muito_segura_456"}
    res_login = client.post("/auth/login", json=payload_login)
    
    assert res_login.status_code == 200, f"Erro no login: {res_login.text}"
    tokens = res_login.json()
    token_acesso = tokens.get("access_token")
    device_uid = tokens.get("device_uid")
    # Se o login devolver um refresh_token, vamos guardá-lo
    token_refresh = tokens.get("refresh_token") 

    # 2. TESTAR ACESSO PROTEGIDO (GET /users)
    # Enviamos o token e o device_uid no header
    headers = {
        "Authorization": f"Bearer {token_acesso}",
        "X-Device-UID": device_uid
    }
    res_users = client.get("/users", headers=headers)
    
    assert res_users.status_code == 200, f"Erro ao acessar /users: {res_users.text}"
    assert isinstance(res_users.json(), list)
    print("\n✅ Token de acesso aceite na rota protegida!")

    # 3. TESTAR REFRESH
    payload_refresh = {"access_token": token_refresh if token_refresh else token_acesso}
    
    res_refresh = client.post("/auth/refresh", json=payload_refresh)
    
    assert res_refresh.status_code == 200
    novos_tokens = res_refresh.json()
    assert "access_token" in novos_tokens
    print("✅ Refresh realizado com sucesso!")

def test_acesso_negado_sem_token(client):
    # Tentar aceder sem o header de autorização
    res = client.get("/users")
    assert res.status_code in [401, 403, 422]  # 422 se X-Device-UID for obrigatório
    print("✅ Acesso negado sem token validado corretamente.")