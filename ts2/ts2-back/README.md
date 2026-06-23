# 🛰️ SPRB-BD (TS2)
API feita com **FastAPI**, **PostgreSQL**, **Alembic** e gerenciamento de pacotes pelo **UV**.

---

## 🔌 Portas (TS2)

| Serviço | Porta | Observação |
|---------|-------|------------|
| API (Uvicorn) | **8001** | http://localhost:8001/docs |
| PostgreSQL (Docker) | **5433** | Container `ts2-db` (host); 5432 dentro do container |

> O TS1 usa **8000** e **5432**. A porta **5433** no host evita conflito entre os dois bancos Docker.

---

## 🛠️ Requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- [UV](https://github.com/astral-sh/uv)

---

## ⚙️ Instalação

```bash
cd ts2/ts2-back
uv sync
```

Configure o `.env`:

```bash
cp .env.example .env
```

Exemplo para desenvolvimento local:

```env
DATABASE_URL=postgresql+psycopg://admin:sua_senha@localhost:5433/sprbbd-db
DATABASE_KEY=sua_senha
JWT_SECRET_KEY=uma-chave-longa-qualquer-para-dev
```

> `DATABASE_KEY` deve ser igual à senha usada no `docker-compose.yml`.

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

**3. Iniciar a API na porta 8001:**

```bash
uv run uvicorn app.main:app --reload --port 8001
```

Documentação interativa:

- Swagger: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
- Telemetria: http://localhost:8001/telemetry

---

## 🛑 Parar

```bash
docker compose down
```

Para encerrar a API: `Ctrl+C` no terminal do Uvicorn.
