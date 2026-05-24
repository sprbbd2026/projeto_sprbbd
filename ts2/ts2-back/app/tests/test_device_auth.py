from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import Usuario, Dispositivo, Usuario_Dispositivo, Login

# Create a test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create all tables in the SQLite test database
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_device_auth_flow():
    # 1. Register a user
    user_payload = {
        "nome": "João",
        "sobrenome": "Silva",
        "email": "joao.silva@example.com",
        "data_nascimento": "1990-01-01",
        "documento": "12345678909",
        "metadados": "iPhone 15, iOS 17.2",
        "senha": "SuperSecurePassword123"
    }
    
    response = client.post("/users", json=user_payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "id" in data
    assert "device_uid" in data
    device_uid = data["device_uid"]
    assert device_uid is not None
    
    # Check DB directly
    db = TestingSessionLocal()
    user_db = db.query(Usuario).filter(Usuario.email == "joao.silva@example.com").first()
    assert user_db is not None
    assert user_db.nome == "João"
    
    # Check that Dispositivo was created and associated
    device_db = db.query(Dispositivo).filter(Dispositivo.uuid == device_uid).first()
    assert device_db is not None
    assert device_db.metadados == {"info": "iPhone 15, iOS 17.2"}
    
    assoc_db = db.query(Usuario_Dispositivo).filter(
        Usuario_Dispositivo.id_usuario == user_db.id,
        Usuario_Dispositivo.id_dispositivo == device_db.id
    ).first()
    assert assoc_db is not None
    assert assoc_db.ativo is True
    
    # 2. Login WITHOUT sending device_uid (should generate a new one)
    login_payload_new = {
        "email": "joao.silva@example.com",
        "password": "SuperSecurePassword123"
    }
    response = client.post("/auth/login", json=login_payload_new)
    assert response.status_code == 200, response.text
    login_data = response.json()
    assert "access_token" in login_data
    assert "device_uid" in login_data
    token = login_data["access_token"]
    new_device_uid = login_data["device_uid"]
    assert new_device_uid != device_uid  # Different because no UID was passed, so a new one is generated
    
    # Verify login log in DB
    login_log = db.query(Login).filter(
        Login.id_usuario == user_db.id,
        Login.ip == "testclient"
    ).first()
    assert login_log is not None
    assert login_log.ativo is True
    
    # 3. Login WITH the original device_uid (should reuse it)
    login_payload_existing = {
        "email": "joao.silva@example.com",
        "password": "SuperSecurePassword123",
        "device_uid": device_uid,
        "metadata": "iPhone 15 updated"
    }
    response = client.post("/auth/login", json=login_payload_existing)
    assert response.status_code == 200, response.text
    login_data_existing = response.json()
    assert login_data_existing["device_uid"] == device_uid # Reused!
    
    # Check that metadata was updated in DB
    db.refresh(device_db)
    assert device_db.metadados == {"info": "iPhone 15 updated"}
    
    # 4. Try accessing protected resource (GET /users)
    # A. Access with valid token and valid device_uid
    headers_valid = {
        "Authorization": f"Bearer {token}",
        "X-Device-UID": new_device_uid
    }
    response = client.get("/users", headers=headers_valid)
    assert response.status_code == 200, response.text
    
    # B. Access without X-Device-UID header
    headers_no_uid = {
        "Authorization": f"Bearer {token}"
    }
    response = client.get("/users", headers=headers_no_uid)
    # FastAPI returns 422 for missing required header
    assert response.status_code == 422
    
    # C. Access with invalid X-Device-UID header (non-existent device)
    headers_invalid_uid = {
        "Authorization": f"Bearer {token}",
        "X-Device-UID": "non-existent-device-uid-123"
    }
    response = client.get("/users", headers=headers_invalid_uid)
    assert response.status_code == 401
    assert response.json()["detail"] == "Acesso não autorizado para este dispositivo."
    
    # D. Access with a device belonging to another user (or not associated with this user)
    # Let's register user 2
    user_payload_2 = {
        "nome": "Maria",
        "sobrenome": "Santos",
        "email": "maria.santos@example.com",
        "data_nascimento": "1992-02-02",
        "documento": "98765432109",
        "metadados": "Android",
        "senha": "AnotherSecurePassword123"
    }
    response = client.post("/users", json=user_payload_2)
    assert response.status_code == 200
    maria_device_uid = response.json()["device_uid"]
    
    # Joãos token requesting with Marias device UID
    headers_mismatched = {
        "Authorization": f"Bearer {token}",
        "X-Device-UID": maria_device_uid
    }
    response = client.get("/users", headers=headers_mismatched)
    assert response.status_code == 401
    assert response.json()["detail"] == "Acesso não autorizado para este dispositivo."

    db.close()
    print("All tests passed successfully!")

if __name__ == "__main__":
    test_device_auth_flow()
