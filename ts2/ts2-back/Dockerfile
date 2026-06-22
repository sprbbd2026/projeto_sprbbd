# ts2-back - FastAPI (dev, hot-reload)
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy

# uv (gerenciador de pacotes) - venv fica em /opt/venv, fora do codigo montado
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Dependencias primeiro (melhor cache de build)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Codigo (em runtime e sobreposto pelo volume do compose -> hot reload)
COPY . .

EXPOSE 8001
CMD ["/opt/venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
