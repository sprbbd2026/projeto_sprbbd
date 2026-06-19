# 🛰️ SPRB-BD — ts1-back

API feita com **FastAPI**, **PostgreSQL**, **Alembic** e gerenciamento de pacotes pelo **UV**.

---

## 🔌 Portas (TS1)

| Serviço | Porta | Observação |
|---------|-------|------------|
| API (Uvicorn) | **8000** | http://localhost:8000/docs |
| PostgreSQL (Docker) | **5432** | Container `ts1-db` |

> O TS2 usa **8001** e **5433** para não conflitar com o TS1.

---

## 🛠️ Requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- [UV](https://github.com/astral-sh/uv)

---

## ⚙️ Instalação

```bash
cd ts1/ts1-back
uv sync
```

Configure o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Exemplo de `.env` para desenvolvimento local:

```env
APP_NAME=ts1-back
DEBUG=true
HOST=0.0.0.0
PORT=8000

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=sprbbd-db

JWT_SECRET_KEY=sua_chave_secreta
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

> `POSTGRES_PASSWORD` é usada também pelo Docker Compose.

Gere uma chave JWT:

```bash
openssl rand -hex 32
```

---

## 🚀 Execução

**1. Subir o banco (Docker):**

```bash
docker compose up -d
```

**2. Aplicar migrações:**

```bash
uv run alembic upgrade head
```

**3. Iniciar a API:**

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Documentação interativa:

- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🛑 Parar

```bash
docker compose down
```

Para encerrar a API: `Ctrl+C` no terminal do Uvicorn.
