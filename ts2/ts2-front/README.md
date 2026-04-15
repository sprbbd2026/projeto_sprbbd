# 🛰️ SPRB-BD — Frontend

Interface web do **SPRB-BD** em **React 19**, **TypeScript**, **Vite** e **React Router**, com gerenciamento de estado via **Zustand** e chamadas HTTP com **Axios**. Ícones com **Lucide React**.

---

## 🛠️ Requisitos de sistema

Para desenvolver e rodar o projeto localmente você precisa de:

- **[Node.js](https://nodejs.org/)** (versão LTS recomendada; inclui **npm**)
- Navegador atualizado (Chrome, Firefox, Safari ou Edge)

Para a tela funcionar de ponta a ponta com listagem e cadastro de usuários, o **backend FastAPI** deve estar em execução (por padrão em `http://127.0.0.1:8000`). Consulte o README em `ts2/ts2-back`.

---

## ⚙️ Passo a passo rápido

Siga os passos na ordem para subir o front na primeira vez.

### 1. Clonar o repositório e entrar na pasta do frontend

```bash
git clone <url-do-repositorio>
cd ts2/ts2-front
```

### 2. Instalar dependências

```bash
npm install
```

Isso instala React, Vite, TypeScript, ESLint e as demais dependências listadas no `package.json`.

### 3. Subir o servidor de desenvolvimento 🔥

```bash
npm run dev
```

--
Pronto! O Vite informa o endereço local (em geral **http://127.0.0.1:5173**). Abra esse endereço no navegador.

Certifique-se de que o **backend** está rodando se você for testar a lista de usuários (`GET /users`) e o cadastro (`POST /users`).

---

## 📋 Scripts úteis

| Comando | Descrição |
|--------|------------|
| `npm run dev` | Servidor de desenvolvimento com hot reload |

---

## 📁 Estrutura resumida

- `src/pages/` — páginas (por exemplo tela de acesso/cadastro)
- `src/components/` — componentes reutilizáveis
- `src/services/` — cliente HTTP e chamadas à API
- `src/store/` — estado global (Zustand)
- `src/hooks/` — hooks customizados
- `public/` — arquivos estáticos (favicon, etc.)

---

## 📚 Documentação das ferramentas

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TypeScript](https://www.typescriptlang.org/)
