# 🛰️ SPRB-BD

API feita com **FastAPI**, **PostgreSQL**, **Alembic** e gerenciamento super rápido de pacotes pelo **UV**.

---

## 🛠️ Requisitos de Sistema

Para rodar o projeto você precisa ter na máquina:
- **[Docker](https://www.docker.com/)** e **Docker Compose**
- **[UV](https://github.com/astral-sh/uv)** (gerenciador Python)


---

## ⚙️ Passo a Passo Rápido

Siga os comandos abaixo na ordem para ter a aplicação rodando de primeira:

### 1. Clonando e Instalando as Dependências
Clone o repositório na sua máquina, entre na pasta do backend e mande o UV sincronizar. Ele vai criar a Virtual Environment e baixar o FastAPI sozinho:

```bash
git clone <url-do-repositorio>
cd ts2/ts2-back
uv sync
```

### 2. Configurando o Banco de Dados (PostgreSQL via Docker)

Temos um arquivo `docker-compose.yml` já pronto com as configurações. Para subir e deixar rodando em segundo plano:
```bash
docker compose up -d
```
*(Confira se a porta 5432 não está ocupada no seu computador).*

### 3. Ajustando as Variáveis de Ambiente (.env)
A aplicação lê os dados do banco a partir de um arquivo `.env`. 
Crie um arquivo chamado `.env` na pasta `ts2-back` contendo as exatas configurações abaixo:

```env
DATABASE_URL=<SUA_URL_DO_BANCO>
DATABASE_KEY=<SUA_SENHA_AQUI>
```

### 4. Só Rodar 🔥
O banco está montado e o ecossistema tá pronto. Agora é só iniciar o servidor do FastAPI. 

```bash
uv run uvicorn app.main:app --reload
```

--
Pronto! O servidor já está rodando e a documentação interativa da API está disponível nas seguintes rotas:

- 🟢 **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Interface gráfica para testar as rotas nativamente, sem precisar do Postman)
- 📝 **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) (Visualização alternativa da documentação, excelente para leitura)
- ⚙️ **OpenAPI JSON**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json) (Esquema numérico raw no formato JSON para integrações)
