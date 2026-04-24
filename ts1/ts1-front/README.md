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

Crie um arquivo `.env` na pasta `ts1-front` com base no `.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

> O `.env` não vai para o git. Ajuste a URL caso o backend rode em outro endereço.

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

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
