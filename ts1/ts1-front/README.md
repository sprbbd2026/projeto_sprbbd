# 🛰️ SPRB-BD — Frontend

Interface web do **SPRB-BD** em **React**, **TypeScript**, **Tailwind CSS**, **Vite** e **React Router**.

---

## 🚀 Passo a passo

### 1. Clonar o repositório e entrar na pasta do frontend

```bash
git clone https://github.com/sprbbd2026/projeto_sprbbd
cd ts1/ts1-front
```

### 2. Instalar dependências

```bash
npm install
```

Isso instala React, Vite, TypeScript, ESLint e as demais dependências listadas no `package.json`.

### 3. Configurar variáveis do Supabase

Copiar `.env.example` para `.env.local` e preencher com os valores do painel do Supabase
(Project Settings → API):

```env
VITE_SUPABASE_URL=https://judpxlrpzdnxejtgmlcn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key do projeto>
```

O arquivo `.env.local` é ignorado pelo git (`*.local`) e é lido pelo cliente em
`src/lib/supabaseClient.ts`.

### 4. Rodar o projeto 🔥

```bash
npm run dev
```

---

## ⌨️ Comandos úteis

| Comando       | Descrição                          |
| ------------- | ---------------------------------- |
| `npm install` | Instala as Dependências do projeto |
| `npm run dev` | Inicia o projeto                   |

---

## 📁 Estrutura

```bash
src/
├── assets/     #imagens
├── components/   # componente reutilizáveis
├── pages/        # telas (Login, Cadastro)
├── services/     # comunicação com API
├── features/   # funcionalidades
│   └── auth/    # formulários de autenticação
├── App.tsx
├── main.tsx
└── index.css
```

---

## 📝 Documentações

- [US116 — Persistência de dados de usuário](../docs/us116-persistencia-usuario.md)
- [MER TS1](../docs/mer/README.md)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
