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

### 3. Configurar variáveis de ambiente

Copiar `.env.example` para `.env.local`.

**Cadastro (obrigatório):** URL do BFF — com o [ts1-back](../ts1-back/README.md) **rodando**
antes do `npm run dev` do front:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Em **WSL2 + navegador no Windows**, se aparecer **Failed to fetch**, suba o BFF com
`--host 0.0.0.0` (ver README do `ts1-back`) e, se precisar, use `http://localhost:8000`
aqui para combinar com o encaminhamento de porta do Windows. Sempre **reinicie o Vite**
depois de alterar `.env.local`.

**Supabase (opcional neste fluxo):** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para
futuras telas que usem `src/lib/supabaseClient.ts` (ex.: login real).

O arquivo `.env.local` é ignorado pelo git (`*.local`).

### 3.1. SQL no Supabase (RLS + função `register_usuario`)

Rode uma vez no **SQL Editor** do Supabase o script
[../docs/sql/rls_rpc_register_usuario.sql](../docs/sql/rls_rpc_register_usuario.sql).
Detalhes em [US116 — persistência](../docs/us116-persistencia-usuario.md).

**Produção (recomendado):** após o BFF validado, rode também
[../docs/sql/revoke_anon_execute_register_usuario.sql](../docs/sql/revoke_anon_execute_register_usuario.sql)
para impedir que qualquer cliente com anon key chame a RPC diretamente.

### 4. Rodar o projeto 🔥

Em um terminal, suba o BFF (`ts1/ts1-back`). Em outro:

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

- [BFF cadastro (ts1-back)](../ts1-back/README.md)
- [US116 — Persistência de dados de usuário](../docs/us116-persistencia-usuario.md)
- [MER TS1](../docs/mer/README.md)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
