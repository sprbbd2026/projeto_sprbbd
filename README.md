# 🛰️ Projeto SPRB-BD

**Projeto Acadêmico para um Sistema de Posicionamento Regional Brasileiro em Banco de Dados (SPRB-BD)**

*The Academic Project for a Brazilian Data Base — Regional Positioning System (BDB-RPS)*

Este repositório e o material associado integram um **Estudo de Caso** no formato **Interdisciplinary Problem-Based Learning (IPBL)**, desenvolvido no **1º semestre de 2026**, com foco em centralizar materiais de aulas, listas, relações de alunos e artefatos produzidos.

**Navegação típica do portal (referência):** Home · Disciplinas · Repositório do projeto · Sprints · Documentação geral (artefatos) · Apresentação final · Artigos.

> **Uso do material:** todo o conteúdo publicado no portal deve ser utilizado **somente para fins acadêmicos**.

---

## 👨‍🏫 Professores

| Nome | E-mail |
|------|--------|
| Prof. Dr. Adilson Marques da Cunha | [cunha@ita.br](mailto:cunha@ita.br) |
| Prof. Dr. Luiz Alberto Vieira Dias | [vdias@ita.br](mailto:vdias@ita.br) |

---

## 🤝 Colaboradores

| Nome | E-mail |
|------|--------|
| Prof. Dr. Lineu F. S. Mialaret | [lmialaret@terra.com.br](mailto:lmialaret@terra.com.br) |
| Gildárcio S. Gonçalves | [gildarciosousa@gmail.com](mailto:gildarciosousa@gmail.com) |
| Victor A. P. Cavichioli | [vivictoaraujo@gmail.com](mailto:vivictoaraujo@gmail.com) |
| Juliana Medeiros F. da Silva | [juliana.medeirosmfs@gmail.com](mailto:juliana.medeirosmfs@gmail.com) |

---

## 🏛️ Instituição

**Aeronautics Institute of Technology — ITA**

© 2026 SPRB-BD — All rights reserved for SPRB-BD and GPES.

---

## 📂 Estrutura deste repositório

| Pasta | Descrição |
|-------|-----------|
| [`ts2/ts2-front/`](ts2/ts2-front/) | Frontend (React, Vite, TypeScript). Ver [README do front](ts2/ts2-front/README.md). |
| [`ts2/ts2-back/`](ts2/ts2-back/) | Backend (FastAPI, PostgreSQL). Ver [README do back](ts2/ts2-back/README.md). |

---

## 🏃 Sprint 1 (TS#02)

Escopo da sprint conforme planejamento do time (status e responsáveis podem ser atualizados no GitHub / quadro do projeto).

### Artefatos e ferramentas

| Recurso | Link |
|---------|------|
| Repositório GitHub (organização) | [github.com/sprbbd2026](https://github.com/sprbbd2026) |
| Kanban | [Project board no GitHub](https://github.com/users/sprbbd2026/projects/6/views/2) |
| Burndown Chart | [Planilha Google](https://docs.google.com/spreadsheets/d/1Pc5yUxPV-RvyLq4gXpbr9fyPO5WH-2ELpKsUCLFSbcM/edit?pli=1&gid=1744797886#gid=1744797886) |
| Refinamento técnico (documento) | [Google Docs](https://docs.google.com/document/d/1FlXOk5sRu6t3USotYFapx73YS7bIFjOx3y7yC-tyBg4/edit?tab=t.9t43qbiffxu6) |
| Pasta Swagger (referência sugerida) | [Google Drive](https://drive.google.com/drive/u/1/folders/1ysrnkCaY6yHw4YALDFMUeFhqJPjkq1a6) |
| Template de planilha de testes | [Google Sheets](https://docs.google.com/spreadsheets/d/1e9oa5HCPT6-N6Obtg8d9KT_kb0JJlWIw/edit?gid=1077019325#gid=1077019325) |

### User Stories da Sprint 1

#### 1.2.1 — Tela de Cadastro de Usuário (Desenvolvedor)

**Responsável (planejado):** Diogo · **Planning Poker:** 3 · **Issue:** [#29](https://github.com/sprbbd2026/projeto_sprbbd/issues/29)

**História:** *Como* desenvolvedor, *quero* uma tela de cadastro de usuário *para* registrar usuários no sistema.

**Entregas e critérios (resumo):**

- **Tela de cadastro:** interface com campos de entrada e envio; campos **nome, e-mail e senha** (obrigatórios claros); botão **Cadastrar** visível e funcional; UI organizada e utilizável.
- **Validação de formulário:** impedir envio vazio; mensagens de erro; e-mail em formato válido; senha com tamanho mínimo definido. *(Refinamento técnico no documento linkado acima.)*
- **Integração com API:** enviar dados ao clicar em Cadastrar; tratar sucesso e erro; feedback ao usuário. *(Swagger sugerido na pasta do Drive.)*

**Casos de teste (referência):** 1.2.1.1 · 1.2.1.2 · 1.2.1.3

---

#### 1.2.2 — Tela de Login de Usuário (Desenvolvedor)

**Issue:** [#33](https://github.com/sprbbd2026/projeto_sprbbd/issues/33)

**História:** *Como* desenvolvedor, *quero* uma tela de login *para* o usuário entrar no sistema.

**Entregas e critérios (resumo):**

- **Tela de login:** e-mail e senha; obrigatórios identificados; botão **Entrar** funcional; interface simples e clara.
- **Validação:** mesma linha da US 1.2.1 (campos vazios, erros, e-mail, senha mínima).
- **Integração com API:** enviar credenciais; tratar sucesso/erro; feedback; em sucesso, redirecionar para área logada.

**Casos de teste (referência):** 1.2.2.1 · 1.2.2.2 · 1.2.2.3

---

#### 1.2.3 — Cadastro de Usuário — Back-end (Desenvolvedor)

**Responsáveis (planejado):** Savio Vianna, Raphael Fernandes, João Pedro, Geison Filho, José Alberto · **Planning Poker:** 8 · **Issue:** [#30](https://github.com/sprbbd2026/projeto_sprbbd/issues/30)

**História:** *Como* desenvolvedor, *quero* registrar novos usuários via API *para* permitir cadastro com dados válidos.

**Critérios (resumo):** endpoint com nome, e-mail e senha; validação; persistência no banco; resposta de sucesso; sem e-mail duplicado; validação de e-mail e senha no back-end; erros claros.

---

#### 1.2.4 — Persistência de Dados de Usuário — Banco de Dados (Desenvolvedor)

**Issue:** [#31](https://github.com/sprbbd2026/projeto_sprbbd/issues/31)

**História:** *Como* desenvolvedor, *quero* armazenar usuários em banco estruturado *para* consistência e recuperação das informações.

**Critérios (resumo):** tabela de usuários com campos necessários; e-mail único; persistência correta; estrutura preparada para evolução sem inconsistências.

---

#### 1.2.5 — Autenticação de Acesso no Login — Back-end (Desenvolvedor)

**Issue:** [#34](https://github.com/sprbbd2026/projeto_sprbbd/issues/34)

**História:** *Como* desenvolvedor, *quero* autenticar por e-mail e senha *para* acesso seguro.

**Critérios (resumo):** endpoint com e-mail e senha; validar credenciais; permitir acesso só com dados corretos; respostas de sucesso ou erro adequadas.

---

#### 1.2.6 — Validação de Acesso no Login — Back-end (Scrum Master)

**Issue:** [#35](https://github.com/sprbbd2026/projeto_sprbbd/issues/35)

**História:** *Como* Scrum Master, *quero* validar credenciais no login *para* que só usuários corretos acessem.

**Critérios (resumo):** rejeitar credenciais inválidas; mensagens claras; não expor informações sensíveis; boas práticas de autenticação.

---

#### 1.2.7 — Gerenciamento de Sessão e Acesso (Scrum Master)

**História:** *Como* Scrum Master, *quero* controlar a sessão do usuário autenticado *para* manter acesso seguro e rotas protegidas.

**Critérios (resumo):** sessão/token após login; usuário autenticado na sessão; rotas protegidas exigem autenticação; permitir logout.

---

#### 1.2.8 — Modelagem de Banco de Dados (MER) (Desenvolvedor)

**Responsáveis (planejado):** Diogo, Marcelo Ryaj · **Planning Poker:** 8 · **Issue:** [#26](https://github.com/sprbbd2026/projeto_sprbbd/issues/26)

**História:** *Como* desenvolvedor, *quero* modelar dados com MER *para* definir estrutura lógica e relacionamentos.

**Critérios (resumo):** MER definido; validar persistência/recuperação; integrar scripts/modelos ao GitHub; documentar decisões.

---

#### 1.2.9 — Implementação de Banco de Dados (DDL/DML) (Desenvolvedor)

**Responsável (planejado):** Lidyane · **Planning Poker:** 8 · **Issue:** [#27](https://github.com/sprbbd2026/projeto_sprbbd/issues/27)

**História:** *Como* desenvolvedor, *quero* implementar o banco com DDL e DML *para* persistência e manipulação dos dados.

**Critérios (resumo):** DDL (tabelas, relacionamentos, constraints); DML para manipulação (insert, select, etc.).

---

#### 1.2.10 — Criar Planilhas de Teste (Desenvolvedor / QA)

**Responsável (planejado):** Cesar Sales · **Planning Poker:** 13 · **Issue:** [#24](https://github.com/sprbbd2026/projeto_sprbbd/issues/24)

**História:** *Como* responsável pelos testes, *quero* uma planilha de testes *para* organizar e acompanhar cenários de validação.

**Entregas (resumo):** modelo com colunas obrigatórias e padrão de IDs (ex.: TS01, TS02); planilha em Excel ou Google Sheets; casos por User Story; classificação (funcional, integração, etc.); acesso e permissões para o time; revisão com o time.

---

#### 1.2.11 — Documentos da Sprint Review (PO, Scrum Master, Desenvolvedores)

**Responsáveis (planejado):** Paulo Cesar, Augusto Nascimento · **Planning Poker:** 5 · **Issue:** [#25](https://github.com/sprbbd2026/projeto_sprbbd/issues/25)

**História:** *Como* Product Owner, *quero* os artefatos da Sprint Review (relatório, slides, vídeo demo) *para* comunicar resultados aos stakeholders.

**Entregas (resumo):**

- **Relatório sintético:** template com introdução, desenvolvimento, resultados, recomendações, backlog, requisitos, atividades, interações, burndown e kanban; PDF ou DOCX.
- **Apresentação (slides):** PDF ou PPTX alinhados ao vídeo.
- **Vídeo demo:** MP4 (referência de duração no planejamento do time; requisitos de legenda e narração conforme template da disciplina).

---

### Aprovações (referência de processo)

As colunas de aceite por **PO**, **Bkp PO**, **Prof. Cunha**, **Prof. Vieira Dias** e **ressalvas** acompanham o fluxo oficial da disciplina e devem ser atualizadas no material de gestão do projeto (planilhas / GitHub), não necessariamente neste README.

---

## 📚 Documentação adicional

- [README — Frontend](ts2/ts2-front/README.md)
- [README — Backend](ts2/ts2-back/README.md)
