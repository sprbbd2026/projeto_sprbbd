# 🛰️ SPRB-BD — Frontend (TS2)

Interface web em **React 19**, **TypeScript**, **Vite**, **React Router**, **Zustand** e **Axios**.

---

## 🔌 Portas (TS2)

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | **5174** | http://localhost:5174 |
| Backend (API) | **8001** | http://localhost:8001/docs |
| PostgreSQL (Docker) | **5433** | localhost:5433 |

> O TS1 usa portas diferentes (5173, 8000, 5432).

---

## 🛠️ Requisitos

- [Node.js](https://nodejs.org/) (LTS)
- Backend TS2 em execução (ver [README do ts2-back](../ts2-back/README.md))

---

## ⚙️ Instalação

```bash
cd ts2/ts2-front
npm install
```

Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
VITE_API_URL=http://localhost:8001
VITE_TS1_API_URL=http://localhost:8000
VITE_DEV_PORT=5174
```

> Em `src/services/api.ts`, se `VITE_API_URL` não estiver definido, o fallback é `'/api'` (proxy do Vite).

---

## 🚀 Execução

Com o **backend TS2** já rodando na porta **8001**:

```bash
npm run dev
```

Acesse: **http://localhost:5174**

Rotas principais:

- `/` — login
- `/dashboard` — telemetria

---

## ⌨️ Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm install` | Instala dependências |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |

---

## 📁 Estrutura

- `src/pages/` — telas
- `src/components/` — componentes reutilizáveis
- `src/services/` — cliente HTTP e chamadas à API
- `src/store/` — estado global (Zustand)
- `public/` — arquivos estáticos

---

## 📝 Documentação

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
