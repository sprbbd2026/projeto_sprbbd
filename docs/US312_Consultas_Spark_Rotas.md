# US312 — Consultar logs de rotas via Apache Spark

## Entrega

A consulta é exposta pelo script:

`ts1/ts1-back/scripts/consultar_logs_rotas_spark.py`

O processamento usa Spark para ler o dataset da US311, aplicar filtros combináveis e
calcular as agregações sobre todo o recorte. O limite afeta apenas a lista exibida,
não os indicadores.

## Contrato do dataset

Formatos aceitos: Parquet, CSV com cabeçalho e JSON.

| Campo canônico | Tipo analítico | Obrigatório | Aliases aceitos |
|---|---:|:---:|---|
| `rota_id` | texto | não | `route_id` |
| `dispositivo_id` | texto | sim | `device_id`, `dis_id` |
| `satelite_id` | texto | sim | `satellite_id`, `sat_id` |
| `inicio_rota` | timestamp | sim | `route_start`, `start_time`, `timestamp_inicio` |
| `fim_rota` | timestamp | sim | `route_end`, `end_time`, `timestamp_fim` |
| `duracao_segundos` | inteiro | sim | `route_duration_seconds`, `duration_seconds`, `duracao_s` |
| `extensao_km` | decimal | sim | `route_distance_km`, `distance_km`, `distancia_km` |

Datas e horas são tratadas em UTC. Os limites de período são inclusivos e selecionam
rotas inteiramente contidas no intervalo: `inicio_rota >= inicio` e
`fim_rota <= fim`.

## Preparação

No diretório `ts1/ts1-back`:

```bash
uv sync
```

O PySpark também requer um JDK compatível disponível no `PATH`.

## Exemplos de consulta

Por dispositivo:

```bash
uv run python scripts/consultar_logs_rotas_spark.py \
  --dataset-path /dados/logs_rotas.parquet \
  --dispositivo-id DEV-01
```

Por satélite e período:

```bash
uv run python scripts/consultar_logs_rotas_spark.py \
  --dataset-path /dados/logs_rotas.parquet \
  --satelite-id SAT-01 \
  --inicio 2026-06-01T00:00:00Z \
  --fim 2026-06-30T23:59:59Z
```

Por faixa de duração, lendo CSV:

```bash
uv run python scripts/consultar_logs_rotas_spark.py \
  --dataset-path tests/fixtures/logs_rotas_us312.csv \
  --dataset-format csv \
  --duracao-minima-segundos 300 \
  --duracao-maxima-segundos 1200 \
  --limite 50
```

Os argumentos podem ser combinados. A saída JSON contém:

- `rotas`: registros filtrados, ordenados por início;
- `agregacoes.total_rotas`: quantidade total no recorte;
- `agregacoes.extensao_media_km`: extensão média no recorte;
- `metadados`: limite, quantidade retornada e ordenação aplicada.

Se o dataset estiver vazio, ou nenhum registro atender aos filtros, o script retorna
`rotas: []`, total igual a `0` e extensão média igual a `0.0`, sem erro fatal.

## Validação

```bash
uv run pytest tests/test_route_logs_spark_service.py -q
```

A suíte usa Spark local e a fixture
`ts1/ts1-back/tests/fixtures/logs_rotas_us312.csv`. Ela cobre todos os filtros,
agregações, limite independente dos indicadores, aliases do contrato e os dois
cenários de resultado vazio.
