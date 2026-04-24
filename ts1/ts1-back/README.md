# 🛰️ SPRB-BD — ts1-back

API feita com **FastAPI**, **PostgreSQL**, **Alembic** e gerenciamento de pacotes pelo **UV**.

---

## 🛠️ Requisitos de Sistema

- **[Docker](https://www.docker.com/)** e **Docker Compose**
- **[UV](https://github.com/astral-sh/uv)** (gerenciador Python)

---

## ⚙️ Passo a Passo Rápido

### 1. Instalando as Dependências

```bash
cd ts1/ts1-back
uv sync
```

### 2. Configurando o Banco de Dados (PostgreSQL via Docker)

```bash
docker compose up -d
```

*(Confira se a porta 5432 não está ocupada no seu computador).*

### 3. Ajustando as Variáveis de Ambiente (.env)

Crie um arquivo `.env` na pasta `ts1-back` com base no `.env.example`:

```env
POSTGRES_PASSWORD=sua_senha_aqui
DATABASE_URL=postgresql+psycopg://admin:sua_senha_aqui@localhost:5432/sprbbd-db
```

> `POSTGRES_PASSWORD` é a senha do PostgreSQL (usada pelo Docker).  
> `DATABASE_URL` é a string de conexão completa usada pelo SQLAlchemy/Alembic — substitua `sua_senha_aqui` pelo mesmo valor de `POSTGRES_PASSWORD`.

### 4. Rodando as Migrações

```bash
uv run alembic upgrade head
```

### 5. Iniciando o Servidor 🔥

```bash
uv run uvicorn app.main:app --reload
```

---

Servidor rodando! Documentação disponível em:

- 🟢 **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- 📝 **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- ⚙️ **OpenAPI JSON**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)
