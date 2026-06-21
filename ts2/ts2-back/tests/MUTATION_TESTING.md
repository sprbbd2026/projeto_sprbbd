# Testes de Mutação (mutmut)

Testes de mutação medem a **qualidade** da suíte de testes: o `mutmut` introduz
pequenas alterações ("mutantes") no código de produção e roda os testes. Se algum
teste falha, o mutante foi **morto** 🎉 (bom). Se todos passam, o mutante
**sobreviveu** 🙁 (lacuna na suíte).

## Pré-requisitos

```powershell
.venv\Scripts\python.exe -m pip install "mutmut<3"
```

> `mutmut` 3.x **só roda em WSL**. A versão 2.x roda nativa no Windows, por isso
> fixamos `mutmut>=2.5,<3` no grupo `dev` do `pyproject.toml`.

Configuração em `setup.cfg` (`[mutmut]`): mutamos apenas `app/services/` e
`app/schemas/` (lógica pura), evitando `app/db/` que cria o engine no import.

## Como rodar

```powershell
# Força UTF-8 (o banner do mutmut usa emoji e quebra no console cp1252)
$env:PYTHONUTF8 = 1
$env:PYTHONIOENCODING = "utf-8"

.venv\Scripts\Activate.ps1   # runner do setup.cfg usa "python" -> precisa do venv ativo
mutmut run                   # roda a suíte uma vez por mutante
```

## Ver os resultados

Os comandos `mutmut results` / `mutmut result-ids` quebram com Python 3.13
(incompatibilidade do pony ORM usado internamente pelo mutmut 2.x). Alternativas
que funcionam:

```powershell
mutmut show <id>             # mostra o diff de um mutante específico
```

Resumo de sobreviventes lendo o cache SQLite diretamente:

```powershell
.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('.mutmut-cache'); [print(f'#{i} {f}:{n} | {s.strip()}') for i,f,n,s in c.execute('select m.id,sf.filename,l.line_number,l.line from Mutant m join Line l on m.line=l.id join SourceFile sf on l.sourcefile=sf.id where m.status=\"bad_survived\" order by sf.filename,l.line_number')]"
```

## Estado atual

23 mutantes — **19 mortos / 4 sobreviventes**. Os 4 sobreviventes são mutações em
texto de mensagens de log (`logger.info`/`logger.error`), consideradas de baixo
valor / equivalentes — não vale a pena travar a suíte assertando texto de log.
