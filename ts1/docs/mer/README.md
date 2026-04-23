# US120 — MER do Time TS#01

## Segmentos Space e Control de um Sistema de Posicionamento por Satélite

Este documento apresenta o **Modelo Entidade-Relacionamento (MER)** refinado do **Time TS#01 — Componentes de Software e Hardware de Dispositivos Satelitais**, com foco nos segmentos:

- **Space Segment**
- **Control Segment**

O objetivo é apoiar a **US120 — Elaborar MER**, garantindo:
- identificação das entidades necessárias;
- definição dos atributos principais;
- representação correta dos relacionamentos e cardinalidades;
- aderência à **3FN no núcleo estruturado do modelo**;
- base para evolução futura ao modelo lógico.

---

## Escopo do modelo

O modelo cobre, em nível conceitual refinado:

- usuários e perfis de acesso;
- estação de controle terrestre;
- satélites;
- canais de comunicação;
- comandos e seus parâmetros;
- mensagens;
- telemetria de retorno.

A proposta foi simplificada para **9 entidades**, removendo:
- `BUFFER_MENSAGEM`
- `LOCALIZACAO_SATELITE`

Nessa versão:
- o conceito de fila/buffer passa a ser representado pelo **estado da mensagem**;
- a localização do satélite passa a ser tratada como um **tipo de telemetria**, por exemplo `tlm_tipo = POSICIONAMENTO`.

---

## Convenções adotadas

- **Entidades** em maiúsculas e no singular.
- **Atributos** com **trigramação**.
- **PK** = chave primária.
- **FK** = chave estrangeira.
- Cardinalidades em notação `1:N`.
- Campos conceituais como `tlm_conteudo` foram mantidos por simplicidade e legibilidade.

---

## Diagrama MER

```mermaid
erDiagram

  PERFIL {
    int prf_id PK
    string prf_nome
    string prf_nivel_acesso
    string prf_descricao
    string prf_status
  }

  USUARIO {
    int usr_id PK
    int prf_id FK
    string usr_nome
    string usr_email
    string usr_login
    string usr_senha_hash
    string usr_status
  }

  ESTACAO_CONTROLE {
    int est_id PK
    string est_nome
    float est_latitude
    float est_longitude
    string est_status
  }

  SATELITE {
    int sat_id PK
    string sat_nome
    string sat_modelo_hardware
    string sat_versao_firmware
    string sat_tipo_orbita
    string sat_status
  }

  CANAL_COMUNICACAO {
    int cnc_id PK
    int est_id FK
    int sat_id FK
    string cnc_nome
    float cnc_frequencia_hz
    string cnc_tipo
    string cnc_protocolo_seguranca
    string cnc_status
  }

  COMANDO {
    int cmd_id PK
    int usr_id FK
    int est_id FK
    int sat_id FK
    string cmd_tipo
    string cmd_descricao
    datetime cmd_data_hora_criacao
    string cmd_status
  }

  COMANDO_PARAMETRO {
    int cmp_id PK
    int cmd_id FK
    string cmp_nome
    string cmp_valor
    string cmp_unidade
    int cmp_ordem
  }

  MENSAGEM {
    int msg_id PK
    int cnc_id FK
    int cmd_id FK
    string msg_tipo
    string msg_prioridade
    string msg_status
    datetime msg_data_hora_geracao
    datetime msg_data_hora_envio
    datetime msg_data_hora_confirmacao
  }

  TELEMETRIA {
    int tlm_id PK
    int sat_id FK
    int msg_id FK
    string tlm_tipo
    string tlm_conteudo
    datetime tlm_data_hora_coleta
    datetime tlm_data_hora_recebimento
    string tlm_status_integridade
  }

  PERFIL           ||--o{ USUARIO           : "classifica"
  USUARIO          ||--o{ COMANDO           : "gera"
  ESTACAO_CONTROLE ||--o{ COMANDO           : "emite"
  SATELITE         ||--o{ COMANDO           : "e destino de"
  COMANDO          ||--o{ COMANDO_PARAMETRO : "possui"
  ESTACAO_CONTROLE ||--o{ CANAL_COMUNICACAO : "opera"
  SATELITE         ||--o{ CANAL_COMUNICACAO : "usa"
  CANAL_COMUNICACAO||--o{ MENSAGEM          : "transmite"
  COMANDO          o|--o{ MENSAGEM          : "gera"
  SATELITE         ||--o{ TELEMETRIA        : "produz"
  MENSAGEM         ||--o{ TELEMETRIA        : "transporta"
```

---

## Entidades do modelo e sua necessidade no negócio

| Entidade | Necessidade no negócio | Observação sobre normalização |
|---|---|---|
| `PERFIL` | Classifica os usuários por nível de acesso | Evita manter perfil como texto repetido em `USUARIO` |
| `USUARIO` | Representa quem opera a central de comandos | Mantém dados de autenticação e vínculo com perfil |
| `ESTACAO_CONTROLE` | Representa o ponto de operação do segmento terrestre | Centraliza emissão e recebimento de dados |
| `SATELITE` | Representa o ativo espacial controlado/monitorado | Mantém atributos estáveis do satélite |
| `CANAL_COMUNICACAO` | Representa o vínculo operacional entre estação e satélite | Evita relacionamento N:N direto entre estação e satélite |
| `COMANDO` | Representa a instrução emitida por um usuário para um satélite | Mantém origem terrestre e destino espacial |
| `COMANDO_PARAMETRO` | Representa os parâmetros específicos de cada comando | Evita listas em atributos e melhora a 3FN |
| `MENSAGEM` | Representa o envelope de transporte de comandos e retornos | Centraliza o fluxo de transmissão |
| `TELEMETRIA` | Representa os dados retornados do satélite | Separa dado retornado do evento de transporte |

---

## Relacionamentos e cardinalidades

| Relacionamento | Cardinalidade | Obrigatório ou opcional | Explicação objetiva |
|---|---|---|---|
| `PERFIL` — `USUARIO` | `1:N` | obrigatório para `USUARIO` | Cada usuário possui um único perfil; um perfil pode classificar vários usuários |
| `USUARIO` — `COMANDO` | `1:N` | obrigatório para `COMANDO` | Cada comando é gerado por um usuário; um usuário pode gerar vários comandos |
| `ESTACAO_CONTROLE` — `COMANDO` | `1:N` | obrigatório para `COMANDO` | Cada comando é emitido por uma estação; uma estação pode emitir vários comandos |
| `SATELITE` — `COMANDO` | `1:N` | obrigatório para `COMANDO` | Cada comando tem um satélite de destino; um satélite pode receber vários comandos |
| `COMANDO` — `COMANDO_PARAMETRO` | `1:N` | opcional para `COMANDO` | Um comando pode ter zero ou vários parâmetros |
| `ESTACAO_CONTROLE` — `CANAL_COMUNICACAO` | `1:N` | obrigatório para `CANAL_COMUNICACAO` | Cada canal pertence a uma estação; uma estação pode operar vários canais |
| `SATELITE` — `CANAL_COMUNICACAO` | `1:N` | obrigatório para `CANAL_COMUNICACAO` | Cada canal está associado a um satélite; um satélite pode usar vários canais |
| `CANAL_COMUNICACAO` — `MENSAGEM` | `1:N` | obrigatório para `MENSAGEM` | Cada mensagem usa um canal; um canal pode transmitir várias mensagens |
| `COMANDO` — `MENSAGEM` | `0:1` para `MENSAGEM`, `1:N` para `COMANDO` | opcional para `MENSAGEM` | Nem toda mensagem deriva de comando |
| `SATELITE` — `TELEMETRIA` | `1:N` | obrigatório para `TELEMETRIA` | Cada telemetria vem de um satélite; um satélite pode gerar várias telemetrias |
| `MENSAGEM` — `TELEMETRIA` | `1:N` | obrigatório para `TELEMETRIA` | Cada telemetria é transportada por uma mensagem |

---

## Fluxos esperados de operação

### 1. Fluxo de envio de comando
`USUARIO → COMANDO → COMANDO_PARAMETRO → MENSAGEM → CANAL_COMUNICACAO → SATELITE`

**Resumo:**
1. Um usuário autenticado gera um comando.
2. O comando é emitido por uma estação de controle.
3. Os parâmetros do comando são registrados separadamente.
4. O comando é encapsulado em uma mensagem.
5. A mensagem é transmitida por um canal.
6. O satélite recebe e processa o comando.

---

### 2. Fluxo de retorno da telemetria
`SATELITE → TELEMETRIA → MENSAGEM → CANAL_COMUNICACAO → ESTACAO_CONTROLE → USUARIO`

**Resumo:**
1. O satélite gera dados de telemetria.
2. A telemetria é encapsulada em uma mensagem de retorno.
3. A mensagem é transmitida pelo canal.
4. A estação de controle recebe e persiste o dado.
5. O usuário consulta as informações retornadas pela central.

---

### 3. Fluxo de posição do satélite
A posição do satélite é tratada como **telemetria de posicionamento**:

`SATELITE → TELEMETRIA (tlm_tipo = POSICIONAMENTO) → MENSAGEM → ESTACAO_CONTROLE`

---

## Dicionário de dados

### 1. PERFIL

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `prf_id` | PK | Identificador único do perfil | Inteiro | Sim | `1` | Chave primária |
| `prf_nome` |  | Nome do perfil | Texto | Sim | `OPERADOR` | Deve ser semanticamente único |
| `prf_nivel_acesso` |  | Nível hierárquico do perfil | Texto | Sim | `MEDIO` | Classifica amplitude de acesso |
| `prf_descricao` |  | Descrição do papel do perfil | Texto | Não | `Perfil responsável por envio de comandos` | Útil para governança |
| `prf_status` |  | Estado do perfil | Texto | Sim | `ATIVO` | Ex.: ativo, inativo |

---

### 2. USUARIO

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `usr_id` | PK | Identificador único do usuário | Inteiro | Sim | `101` | Chave primária |
| `prf_id` | FK | Perfil associado ao usuário | Inteiro | Sim | `1` | FK para `PERFIL(prf_id)` |
| `usr_nome` |  | Nome do usuário | Texto | Sim | `João Silva` | Identificação humana |
| `usr_email` |  | E-mail do usuário | Texto | Sim | `joao.silva@empresa.com` | Idealmente único |
| `usr_login` |  | Login de autenticação | Texto | Sim | `operador01` | Idealmente único |
| `usr_senha_hash` |  | Hash da senha do usuário | Texto | Sim | `a94a8fe5...` | Não armazena senha pura |
| `usr_status` |  | Estado do usuário | Texto | Sim | `ATIVO` | Ex.: ativo, bloqueado |

---

### 3. ESTACAO_CONTROLE

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `est_id` | PK | Identificador único da estação | Inteiro | Sim | `10` | Chave primária |
| `est_nome` |  | Nome da estação | Texto | Sim | `GS_BRASIL_01` | Identificação operacional |
| `est_latitude` |  | Latitude da estação | Número real | Sim | `-23.214` | Localização geográfica |
| `est_longitude` |  | Longitude da estação | Número real | Sim | `-45.871` | Localização geográfica |
| `est_status` |  | Estado operacional da estação | Texto | Sim | `ATIVA` | Ex.: ativa, manutenção |

---

### 4. SATELITE

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `sat_id` | PK | Identificador único do satélite | Inteiro | Sim | `20` | Chave primária |
| `sat_nome` |  | Nome do satélite | Texto | Sim | `SAT_BR_01` | Identificação operacional |
| `sat_modelo_hardware` |  | Modelo/plataforma de hardware | Texto | Sim | `PLATAFORMA_XYZ` | Controle de configuração física |
| `sat_versao_firmware` |  | Versão do firmware embarcado | Texto | Sim | `v2.3.1` | Controle de configuração lógica |
| `sat_tipo_orbita` |  | Tipo de órbita | Texto | Sim | `MEO` | Ex.: MEO, GEO, IGSO |
| `sat_status` |  | Estado operacional do satélite | Texto | Sim | `OPERACIONAL` | Ex.: operacional, falha |

---

### 5. CANAL_COMUNICACAO

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `cnc_id` | PK | Identificador único do canal | Inteiro | Sim | `30` | Chave primária |
| `est_id` | FK | Estação que opera o canal | Inteiro | Sim | `10` | FK para `ESTACAO_CONTROLE(est_id)` |
| `sat_id` | FK | Satélite associado ao canal | Inteiro | Sim | `20` | FK para `SATELITE(sat_id)` |
| `cnc_nome` |  | Nome do canal | Texto | Sim | `CANAL_UPLINK_01` | Identificação operacional |
| `cnc_frequencia_hz` |  | Frequência de operação em hertz | Número real | Sim | `2250000000.0` | Frequência configurada |
| `cnc_tipo` |  | Tipo funcional do canal | Texto | Sim | `UPLINK` | Ex.: uplink, downlink |
| `cnc_protocolo_seguranca` |  | Protocolo de segurança do canal | Texto | Sim | `TLS_1_3` | Mantido como atributo conceitual |
| `cnc_status` |  | Estado atual do canal | Texto | Sim | `ATIVO` | Ex.: ativo, contingência |

---

### 6. COMANDO

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `cmd_id` | PK | Identificador único do comando | Inteiro | Sim | `100` | Chave primária |
| `usr_id` | FK | Usuário que gerou o comando | Inteiro | Sim | `101` | FK para `USUARIO(usr_id)` |
| `est_id` | FK | Estação que emitiu o comando | Inteiro | Sim | `10` | FK para `ESTACAO_CONTROLE(est_id)` |
| `sat_id` | FK | Satélite destino do comando | Inteiro | Sim | `20` | FK para `SATELITE(sat_id)` |
| `cmd_tipo` |  | Tipo funcional do comando | Texto | Sim | `AJUSTE_ATITUDE` | Ex.: alterar frequência, solicitar telemetria |
| `cmd_descricao` |  | Descrição textual do comando | Texto | Sim | `Comando para ajuste da atitude do satélite` | Detalha a intenção |
| `cmd_data_hora_criacao` |  | Data/hora de criação do comando | Data/hora | Sim | `2026-04-18 14:35:00` | Instante de geração |
| `cmd_status` |  | Estado do comando | Texto | Sim | `PENDENTE` | Ex.: pendente, enviado, executado |

---

### 7. COMANDO_PARAMETRO

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `cmp_id` | PK | Identificador único do parâmetro | Inteiro | Sim | `1001` | Chave primária |
| `cmd_id` | FK | Comando ao qual o parâmetro pertence | Inteiro | Sim | `100` | FK para `COMANDO(cmd_id)` |
| `cmp_nome` |  | Nome do parâmetro | Texto | Sim | `angulo_pitch` | Identifica o papel do parâmetro |
| `cmp_valor` |  | Valor do parâmetro | Texto | Sim | `2.5` | Mantido como texto por flexibilidade |
| `cmp_unidade` |  | Unidade de medida | Texto | Não | `grau` | Pode ser vazio para valores categóricos |
| `cmp_ordem` |  | Ordem lógica do parâmetro | Inteiro | Não | `1` | Útil quando a ordem importa |

---

### 8. MENSAGEM

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `msg_id` | PK | Identificador único da mensagem | Inteiro | Sim | `200` | Chave primária |
| `cnc_id` | FK | Canal usado para transportar a mensagem | Inteiro | Sim | `30` | FK para `CANAL_COMUNICACAO(cnc_id)` |
| `cmd_id` | FK | Comando que originou a mensagem | Inteiro | Não | `100` | FK opcional para `COMANDO(cmd_id)` |
| `msg_tipo` |  | Tipo funcional da mensagem | Texto | Sim | `COMANDO` | Ex.: comando, telemetria, confirmação |
| `msg_prioridade` |  | Prioridade atribuída à mensagem | Texto | Sim | `ALTA` | Influencia despacho |
| `msg_status` |  | Estado atual da mensagem | Texto | Sim | `ENVIADA` | Ex.: gerada, em fila, sucesso, falha |
| `msg_data_hora_geracao` |  | Data/hora de geração | Data/hora | Sim | `2026-04-18 14:36:00` | Instante de criação |
| `msg_data_hora_envio` |  | Data/hora de envio | Data/hora | Não | `2026-04-18 14:36:10` | Só existe após transmissão |
| `msg_data_hora_confirmacao` |  | Data/hora de confirmação/retorno | Data/hora | Não | `2026-04-18 14:36:20` | Só existe após resposta |

---

### 9. TELEMETRIA

| Atributo | Chave | Descrição | Tipo conceitual | Obrigatório | Exemplo | Observação |
|---|---|---|---|---|---|---|
| `tlm_id` | PK | Identificador único da telemetria | Inteiro | Sim | `300` | Chave primária |
| `sat_id` | FK | Satélite que gerou a telemetria | Inteiro | Sim | `20` | FK para `SATELITE(sat_id)` |
| `msg_id` | FK | Mensagem que transportou a telemetria | Inteiro | Sim | `200` | FK para `MENSAGEM(msg_id)` |
| `tlm_tipo` |  | Tipo da telemetria retornada | Texto | Sim | `STATUS_SUBSISTEMA` | Ex.: energia, posicionamento |
| `tlm_conteudo` |  | Conteúdo informacional da telemetria | Texto | Sim | `temperatura=42;bateria=87` | Campo genérico no nível conceitual |
| `tlm_data_hora_coleta` |  | Data/hora de coleta no satélite | Data/hora | Sim | `2026-04-18 14:36:15` | Momento em que o dado foi gerado |
| `tlm_data_hora_recebimento` |  | Data/hora de recebimento na estação | Data/hora | Sim | `2026-04-18 14:36:20` | Permite medir latência |
| `tlm_status_integridade` |  | Situação de integridade do dado | Texto | Sim | `INTEGRA` | Ex.: íntegra, corrompida |

---

## Observações importantes antes do modelo lógico

### 1. Forma normal
O modelo permanece adequado à **3FN no núcleo estruturado** das entidades e relacionamentos principais.

### 2. Campos genéricos
O atributo `tlm_conteudo` foi mantido como campo genérico no nível conceitual. Em uma etapa futura, ele pode ser decomposto para maior rigor de normalização ou consulta estruturada.

### 3. Perfis e permissões
A entidade `PERFIL` foi separada de `USUARIO` para explicitar nível de acesso e evitar redundância. Caso o sistema evolua para controle fino de permissões, uma entidade futura como `PERFIL_PERMISSAO` poderá ser adicionada.

### 4. Opcionalidade relevante
Nem toda `MENSAGEM` precisa estar associada a um `COMANDO`; mensagens de retorno e telemetria podem existir independentemente.

### 5. Localização do satélite
A localização do satélite passou a ser tratada como um tipo de telemetria, por exemplo:
- `tlm_tipo = POSICIONAMENTO`

Isso simplifica o modelo conceitual, embora reduza a especialização do histórico posicional.

---