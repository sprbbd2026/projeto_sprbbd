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
POSTGRES_HOST=seu_host
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=nome_do_banco

JWT_SECRET_KEY=sua_chave_secreta
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

> `POSTGRES_PASSWORD` é também usada pelo Docker Compose para criar o banco local.

> Para gerar uma `JWT_SECRET_KEY` segura:
> ```bash
> openssl rand -hex 32
> ```

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

---

## 🔎 US312 — Consultas analíticas de logs de rotas com Spark

Script disponível em `scripts/consultar_logs_rotas_spark.py`.

Exemplo de uso:

```bash
uv run python scripts/consultar_logs_rotas_spark.py \
  --dataset-path /caminho/logs_rotas.parquet \
  --dataset-format parquet \
  --satelite-id SAT-01 \
  --inicio 2026-05-01T00:00:00 \
  --fim 2026-05-31T23:59:59 \
  --duracao-minima-segundos 60
```

Filtros suportados:

- `--dispositivo-id`
- `--satelite-id`
- `--inicio` e `--fim` (período)
- `--duracao-minima-segundos` e `--duracao-maxima-segundos`

Saída inclui:

- `rotas`: lista de rotas filtradas
- `agregacoes.total_rotas`: total de rotas no recorte
- `agregacoes.extensao_media_km`: extensão média do recorte
