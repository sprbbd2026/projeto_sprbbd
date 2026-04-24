# TS1 BFF — cadastro no Supabase

Backend fino (**FastAPI**) para o time TS#01: recebe o cadastro do portal (`ts1-front`),
valida o payload e chama a RPC `register_usuario` no Supabase usando a **service role**
(nunca exposta no browser).

## Requisitos

- Python **3.12+**
- [uv](https://github.com/astral-sh/uv) instalado

## Configuração

```bash
cd ts1/ts1-back
cp .env.example .env
```

Edite `.env`:

| Variável | Onde obter |
|----------|------------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → **service_role** (secreto; não commitar) |
| `CORS_ORIGINS` | Lista CSV das origens do Vite, ex.: `http://localhost:5173,http://127.0.0.1:5173` |

## Instalar e rodar

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Use **`0.0.0.0`** em dev (especialmente **WSL2 + navegador no Windows**): com `--host 127.0.0.1`
o processo só aceita conexões de dentro do Linux; o Chrome/Edge no Windows costuma falhar com **Failed to fetch**.

- Documentação interativa: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (ou `http://localhost:8000/docs` no Windows)
- Health check: `GET /health`

### Se o front mostrar **Failed to fetch**

1. Confirme que o BFF está rodando (`curl -s http://127.0.0.1:8000/health` deve retornar `{"status":"ok"}`).
2. Use `--host 0.0.0.0` como acima.
3. No `ts1-front/.env.local`, `VITE_API_BASE_URL` deve ser a mesma “família” de host que o navegador usa (`http://localhost:8000` ou `http://127.0.0.1:8000`); depois de mudar, **reinicie** o `npm run dev` (o Vite só lê `.env*` na subida).

## Contrato da API

`POST /api/v1/register`

Body JSON (mesmo formato do formulário):

```json
{
  "name": "Nome",
  "email": "a@b.com",
  "password": "senha123",
  "document": "12345678900",
  "accessLevel": "admin"
}
```

Resposta **201**: objeto com `usr_id`, `prf_id`, `usr_nome`, `usr_email`, `usr_login`,
`usr_status` e `perfil` aninhado (sem hash de senha).

Erros comuns:

| HTTP | Significado |
|------|----------------|
| 409 | E-mail ou documento duplicado |
| 422 | Validação (e-mail, senha curta, nível inválido) |
| 429 | Rate limit (30 req/min por IP) |
| 502 | Erro no Supabase ou função ausente |

## Ordem com o Supabase

1. Aplicar [../docs/sql/rls_rpc_register_usuario.sql](../docs/sql/rls_rpc_register_usuario.sql) (RLS + função + grants iniciais).
2. Subir este BFF e testar `POST /api/v1/register` (ex.: via Swagger).
3. Configurar `VITE_API_BASE_URL` no `ts1-front/.env.local` apontando para `http://127.0.0.1:8000`.
4. Opcional, **recomendado em produção:** aplicar
   [../docs/sql/revoke_anon_execute_register_usuario.sql](../docs/sql/revoke_anon_execute_register_usuario.sql)
   para que o papel `anon` **não** possa mais chamar a RPC diretamente (só o BFF com service role).

## Segurança

- A **service_role** bypassa RLS e tem poder total no projeto: trate `.env` como segredo
  de produção, use variáveis no deploy (GitHub Actions secrets, etc.) e **nunca** envie
  essa chave ao front-end.
