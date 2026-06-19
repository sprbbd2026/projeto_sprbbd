# 🛰️ SPRB-BD — Frontend (TS1)

Interface web do **SPRB-BD** em **React**, **TypeScript**, **Tailwind CSS**, **Vite** e **React Router**.

---

## 🔌 Portas (TS1)

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | **5173** | http://localhost:5173 |
| Backend (API) | **8000** | http://localhost:8000/docs |
| PostgreSQL (Docker) | **5432** | localhost:5432 |

> O TS2 usa portas diferentes (5174, 8001, 5433) para permitir execução simultânea.

---

## 🛠️ Requisitos

- [Node.js](https://nodejs.org/) (LTS)
- Backend TS1 em execução (ver [README do ts1-back](../ts1-back/README.md))

---

## ⚙️ Instalação

```bash
cd ts1/ts1-front
npm install
```

Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_DEV_PORT=5173
```

---

## 🚀 Execução

Com o **backend TS1** já rodando na porta **8000**:

```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## ⌨️ Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm install` | Instala dependências |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |

---

## 📁 Estrutura

```bash
src/
├── assets/
├── components/
├── pages/
├── services/     # comunicação com API
├── features/
│   └── auth/
├── App.tsx
├── main.tsx
└── index.css
```

---

## 📝 Documentação

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
