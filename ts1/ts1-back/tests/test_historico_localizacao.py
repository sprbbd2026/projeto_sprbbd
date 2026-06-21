"""Testes integrados para US302 — Historico de localizacao de satelite.

Cobre:
  - CA01: GET com sat_id valido e intervalo retorna lista cronologica (200).
  - CA02: Satelite inexistente → 404; satelite sem telemetria → lista vazia.
  - CA03: Paginacao sem duplicatas e com next_offset correto.
  - Validacoes: from > to → 422; parametros obrigatorios → 422.
"""

import json
from datetime import datetime, timezone, timedelta

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import Satelite, Telemetria, Efemeride
from app.dependencies import get_current_user

# -----------------------------------------------------------
# Infraestrutura de teste (mesmo padrao do projeto)
# -----------------------------------------------------------
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _mock_current_user():
    return object()


@pytest.fixture(autouse=True)
def setup_db():
    """Recria tabelas a cada teste."""
    for table in (Efemeride.__table__, Telemetria.__table__, Satelite.__table__):
        table.drop(bind=engine, checkfirst=True)
    Satelite.__table__.create(bind=engine)
    Telemetria.__table__.create(bind=engine)
    Efemeride.__table__.create(bind=engine)

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.clear()


# -----------------------------------------------------------
# Helpers de seed
# -----------------------------------------------------------
_PARAMS_KEPLERIAN = json.dumps({
    "a": 26560.0,
    "e": 0.01,
    "i": 55.0,
    "omega": 120.0,
    "w": 270.0,
    "M0": 45.0,
})


def _criar_satelite(sat_id: int = 1, status: str = "operacional") -> Satelite:
    db = TestingSessionLocal()
    try:
        sat = Satelite(sat_id=sat_id, sat_status=status)
        db.add(sat)
        db.commit()
        db.refresh(sat)
        return sat
    finally:
        db.close()


def _criar_efemeride(
    sat_id: int = 1,
    efe_id: int = 1,
    timestamp_ref: datetime | None = None,
) -> Efemeride:
    db = TestingSessionLocal()
    try:
        if timestamp_ref is None:
            timestamp_ref = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        efe = Efemeride(
            efe_id=efe_id,
            sat_id=sat_id,
            efe_timestamp_ref=timestamp_ref,
            efe_params_keplerian=_PARAMS_KEPLERIAN,
        )
        db.add(efe)
        db.commit()
        db.refresh(efe)
        return efe
    finally:
        db.close()


def _criar_telemetria(
    sat_id: int = 1,
    tlm_id: int = 1,
    timestamp: datetime | None = None,
    temperatura: float = 35.0,
    energia: float = 25.0,
    cpu: float = 50.0,
) -> Telemetria:
    db = TestingSessionLocal()
    try:
        if timestamp is None:
            timestamp = datetime(2026, 6, 1, 12, 5, 0, tzinfo=timezone.utc)
        tlm = Telemetria(
            id_telemetria=tlm_id,
            id_satelite=sat_id,
            timestamp_registro=timestamp,
            temperatura=temperatura,
            energia=energia,
            cpu=cpu,
        )
        db.add(tlm)
        db.commit()
        db.refresh(tlm)
        return tlm
    finally:
        db.close()


def _client() -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# -----------------------------------------------------------
# CA01 — Lista cronologica com posicao
# -----------------------------------------------------------
@pytest.mark.asyncio
async def test_ca01_retorna_lista_cronologica_com_posicao():
    """GET com sat_id valido e intervalo retorna registros em ordem cronologica
    com posicao calculada via efemeride."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

    # 5 registros de telemetria em intervalos de 1 minuto
    for i in range(5):
        _criar_telemetria(
            sat_id=1,
            tlm_id=i + 1,
            timestamp=base + timedelta(minutes=i + 1),
            temperatura=30.0 + i,
        )

    async with _client() as client:
        params = {
            "sat_id": 1,
            "from": (base + timedelta(minutes=1)).isoformat(),
            "to": (base + timedelta(minutes=5)).isoformat(),
        }
        response = await client.get("/telemetria/locations", params=params)

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 5
    assert body["pagination"]["total"] == 5

    # Verifica ordem cronologica
    timestamps = [r["timestamp"] for r in body["data"]]
    assert timestamps == sorted(timestamps)

    # Verifica que cada registro tem posicao
    for registro in body["data"]:
        assert registro["position"] is not None
        assert "lat" in registro["position"]
        assert "lng" in registro["position"]
        assert "alt_km" in registro["position"]
        assert -90 <= registro["position"]["lat"] <= 90
        assert -180 <= registro["position"]["lng"] <= 180


@pytest.mark.asyncio
async def test_ca01_sem_parametros_from_to_retorna_todos():
    """GET apenas com sat_id retorna todo o historico disponivel."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

    for i in range(3):
        _criar_telemetria(
            sat_id=1,
            tlm_id=i + 1,
            timestamp=base + timedelta(minutes=i + 1),
        )

    async with _client() as client:
        response = await client.get("/telemetria/locations", params={"sat_id": 1})

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 3
    assert body["pagination"]["total"] == 3


@pytest.mark.asyncio
async def test_ca01_position_nulo_quando_sem_efemeride():
    """Registros sem efemeride retornam position: null."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    # NAO criamos efemeride — logo position deve ser null

    _criar_telemetria(sat_id=1, tlm_id=1, timestamp=base + timedelta(minutes=1))

    async with _client() as client:
        response = await client.get("/telemetria/locations", params={"sat_id": 1})

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["position"] is None


# -----------------------------------------------------------
# CA02 — Satelite inexistente ou sem dados
# -----------------------------------------------------------
@pytest.mark.asyncio
async def test_ca02_satelite_inexistente_retorna_404():
    """sat_id que nao existe retorna 404 com mensagem clara."""
    async with _client() as client:
        response = await client.get("/telemetria/locations", params={"sat_id": 9999})

    assert response.status_code == 404
    assert "nao encontrado" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_ca02_satelite_existe_sem_telemetria_retorna_lista_vazia():
    """Satelite cadastrado mas sem telemetria no intervalo retorna lista vazia."""
    _criar_satelite(sat_id=1)

    async with _client() as client:
        response = await client.get("/telemetria/locations", params={"sat_id": 1})

    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["pagination"]["total"] == 0


@pytest.mark.asyncio
async def test_ca02_intervalo_sem_dados_retorna_lista_vazia():
    """Intervalo de datas sem registros retorna lista vazia com total=0."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

    # Telemetria em junho de 2026
    _criar_telemetria(sat_id=1, tlm_id=1, timestamp=base + timedelta(minutes=5))

    # Consulta em janeiro de 2020 (fora do range dos dados)
    async with _client() as client:
        response = await client.get("/telemetria/locations", params={
            "sat_id": 1,
            "from": "2020-01-01T00:00:00Z",
            "to": "2020-01-02T00:00:00Z",
        })

    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["pagination"]["total"] == 0


# -----------------------------------------------------------
# CA03 — Paginacao sem duplicatas
# -----------------------------------------------------------
@pytest.mark.asyncio
async def test_ca03_paginacao_sem_duplicatas():
    """3 paginas consecutivas nao duplicam nem omitem registros."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

    # 25 registros
    for i in range(25):
        _criar_telemetria(
            sat_id=1,
            tlm_id=i + 1,
            timestamp=base + timedelta(seconds=30 * i),
        )

    todos_ids: set[int] = set()
    total_esperado = None

    async with _client() as client:
        for offset in (0, 10, 20):
            response = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "limit": 10,
                "offset": offset,
            })
            assert response.status_code == 200
            body = response.json()

            if total_esperado is None:
                total_esperado = body["pagination"]["total"]
            else:
                # total deve ser consistente entre paginas
                assert body["pagination"]["total"] == total_esperado

            ids_pagina = {r["tlm_id"] for r in body["data"]}
            assert ids_pagina.isdisjoint(todos_ids), (
                f"Duplicatas na pagina offset={offset}: {ids_pagina & todos_ids}"
            )
            todos_ids |= ids_pagina

    assert len(todos_ids) == 25
    assert total_esperado == 25


@pytest.mark.asyncio
async def test_ca03_next_offset_correto():
    """next_offset aponta para a proxima pagina ou e null na ultima."""
    _criar_satelite(sat_id=1)
    base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
    _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

    for i in range(5):
        _criar_telemetria(sat_id=1, tlm_id=i + 1, timestamp=base + timedelta(minutes=i))

    async with _client() as client:
        # Pagina 1 (limit=2, offset=0) → next_offset=2
        r1 = await client.get("/telemetria/locations", params={
            "sat_id": 1, "limit": 2, "offset": 0,
        })
        assert r1.status_code == 200
        assert r1.json()["pagination"]["next_offset"] == 2

        # Pagina 2 (limit=2, offset=2) → next_offset=4
        r2 = await client.get("/telemetria/locations", params={
            "sat_id": 1, "limit": 2, "offset": 2,
        })
        assert r2.status_code == 200
        assert r2.json()["pagination"]["next_offset"] == 4

        # Pagina 3 (limit=2, offset=4) → ultima, next_offset=null
        r3 = await client.get("/telemetria/locations", params={
            "sat_id": 1, "limit": 2, "offset": 4,
        })
        assert r3.status_code == 200
        assert r3.json()["pagination"]["next_offset"] is None


# -----------------------------------------------------------
# Validacoes
# -----------------------------------------------------------
@pytest.mark.asyncio
async def test_validacao_from_maior_que_to_retorna_422():
    """from > to deve retornar 422."""
    _criar_satelite(sat_id=1)

    async with _client() as client:
        response = await client.get("/telemetria/locations", params={
            "sat_id": 1,
            "from": "2026-06-18T00:00:00Z",
            "to": "2026-06-01T00:00:00Z",
        })

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_validacao_sat_id_ausente_retorna_400():
    """Omissao do parametro obrigatorio sat_id retorna 400.

    O projeto possui um exception_handler customizado que converte
    RequestValidationError (422) em 400 — ver app/main.py.
    """
    async with _client() as client:
        response = await client.get("/telemetria/locations")

    assert response.status_code == 400


# =====================================================================
# TESTES DESTRUTIVOS — EDGE CASES, SEGURANÇA & ROBUSTEZ (QA Sênior)
# =====================================================================
# Objetivo: encontrar falhas antes da produção.
# Cobrem: paginação abusiva, estresse de timestamp/fuso,
#         falha crítica de banco no meio do enriquecimento,
#         injection, caracteres especiais, offset extremo,
#         datas futuras, timezones exóticos, parâmetros float.


# -----------------------------------------------------------
#  BLOCO A — PAGINAÇÃO ABUSIVA
# -----------------------------------------------------------

class TestPaginacaoAbusiva:
    """Valida que o contrato limit/offset é blindado no framework e no service."""

    @pytest.mark.asyncio
    async def test_limit_acima_do_maximo(self):
        """limit=1000000 deve ser rejeitado (max=100 definido no Query)."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 1000000,
            })
        assert resp.status_code in (400, 422), (
            f"Esperado 400/422 para limit=1000000, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_limit_zero(self):
        """limit=0 deve ser rejeitado (ge=1)."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 0,
            })
        assert resp.status_code in (400, 422), (
            f"Esperado 400/422 para limit=0, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_limit_negativo(self):
        """limit=-1 deve ser rejeitado (ge=1)."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": -1,
            })
        assert resp.status_code in (400, 422), (
            f"Esperado 400/422 para limit=-1, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_offset_negativo(self):
        """offset=-1 deve ser rejeitado (ge=0)."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "offset": -1,
            })
        assert resp.status_code in (400, 422), (
            f"Esperado 400/422 para offset=-1, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_limit_negativo_com_offset_negativo(self):
        """Combinação maliciosa: limit=-999 e offset=-999."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": -999, "offset": -999,
            })
        assert resp.status_code in (400, 422), (
            f"Esperado 400/422 para limit=-999/offset=-999, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_offset_gigante_alem_do_total(self):
        """offset muito maior que total deve retornar lista vazia (não 500)."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        for i in range(5):
            _criar_telemetria(sat_id=1, tlm_id=i + 1,
                              timestamp=base + timedelta(minutes=i))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "offset": 999999,
            })
        assert resp.status_code == 200, (
            f"Offset gigante deveria retornar 200 (lista vazia), obtido {resp.status_code}"
        )
        body = resp.json()
        assert body["data"] == []
        assert body["pagination"]["total"] == 5  # total não muda
        assert body["pagination"]["next_offset"] is None


# -----------------------------------------------------------
#  BLOCO B — ESTRESSE DE TIMESTAMPS & FUSO HORÁRIO
# -----------------------------------------------------------

class TestTimestampStress:
    """Testa tolerância a formatos ISO 8601 exóticos e fusos extremos."""

    @pytest.mark.asyncio
    async def test_fuso_utc_mais_14_horario_verao_kiribati(self):
        """Fuso UTC+14 (Ilhas Line, Kiribati) — o mais extremo positivo."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=datetime(2026, 6, 1, 12, 5, 0, tzinfo=timezone.utc))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00+14:00",
                "to": "2026-06-02T00:00:00+14:00",
            })
        assert resp.status_code == 200, (
            f"UTC+14 deveria ser aceito, obtido {resp.status_code}: {resp.text}"
        )

    @pytest.mark.asyncio
    async def test_fuso_utc_menos_12_baker_island(self):
        """Fuso UTC-12 (Baker Island) — o mais extremo negativo."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=datetime(2026, 6, 1, 12, 5, 0, tzinfo=timezone.utc))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00-12:00",
                "to": "2026-06-03T00:00:00-12:00",
            })
        assert resp.status_code == 200, (
            f"UTC-12 deveria ser aceito, obtido {resp.status_code}: {resp.text}"
        )

    @pytest.mark.asyncio
    async def test_fuso_fracionario_nepal(self):
        """Fuso UTC+05:45 (Nepal) — fuso fracionário real."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=datetime(2026, 6, 1, 12, 5, 0, tzinfo=timezone.utc))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00+05:45",
                "to": "2026-06-02T00:00:00+05:45",
            })
        assert resp.status_code == 200, (
            f"UTC+05:45 deveria ser aceito, obtido {resp.status_code}: {resp.text}"
        )

    @pytest.mark.asyncio
    async def test_from_to_mesmo_valor(self):
        """from == to deve retornar registros exatamente naquele instante."""
        _criar_satelite(sat_id=1)
        ts = datetime(2026, 6, 1, 12, 5, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=ts)
        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=ts)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T12:05:00Z",
                "to": "2026-06-01T12:05:00Z",
            })
        assert resp.status_code == 200
        body = resp.json()
        assert body["pagination"]["total"] == 1

    @pytest.mark.asyncio
    async def test_timestamp_garbage_completo(self):
        """String completamente inválida deve ser rejeitada."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "NÃO-SOU-UMA-DATA-VÁLIDA!!!",
            })
        assert resp.status_code in (400, 422), (
            f"Garbage timestamp deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_timestamp_mes_13_inexistente(self):
        """Mês 13 não existe — deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-13-01T00:00:00Z",
            })
        assert resp.status_code in (400, 422), (
            f"Mês 13 deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_timestamp_dia_32_inexistente(self):
        """Dia 32 não existe — deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-01-32T00:00:00Z",
            })
        assert resp.status_code in (400, 422), (
            f"Dia 32 deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_timestamp_ano_9999_futuro_extremo(self):
        """Ano 9999 — deve ser aceito como datetime válido, retornar lista vazia."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "9999-01-01T00:00:00Z",
                "to": "9999-12-31T23:59:59Z",
            })
        assert resp.status_code == 200, (
            f"Ano 9999 deveria ser 200 (lista vazia), obtido {resp.status_code}: {resp.text}"
        )
        assert resp.json()["data"] == []

    @pytest.mark.asyncio
    async def test_timestamp_com_milissegundos_e_microssegundos(self):
        """ISO 8601 com frações de segundo (até microssegundos)."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=base + timedelta(minutes=1))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T12:00:00.123456Z",
                "to": "2026-06-01T12:10:00.999999Z",
            })
        assert resp.status_code == 200, (
            f"Microssegundos deveriam ser aceitos, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_from_to_timezones_diferentes(self):
        """from em UTC-5 e to em UTC+3 — timezones mistos no mesmo request."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=datetime(2026, 6, 1, 14, 0, 0, tzinfo=timezone.utc))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T07:00:00-05:00",   # = 12:00 UTC
                "to": "2026-06-01T17:00:00+03:00",     # = 14:00 UTC
            })
        assert resp.status_code == 200, (
            f"Timezone misto deveria ser 200, obtido {resp.status_code}: {resp.text}"
        )

    @pytest.mark.asyncio
    async def test_timestamp_sem_timezone_deve_ser_tratado(self):
        """Timestamp naive (sem offset) — FastAPI pode rejeitar ou interpretar."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00",  # sem timezone
            })
        # Pode ser 200 (se aceitar) ou 400/422 (se rejeitar naive datetime)
        assert resp.status_code in (200, 400, 422), (
            f"Status inesperado para timestamp naive: {resp.status_code}"
        )


# -----------------------------------------------------------
#  BLOCO C — FALHA CRÍTICA DE BANCO DE DADOS (OperationalError)
# -----------------------------------------------------------

class TestDatabaseFailure:
    """Simula falhas de infraestrutura durante o enriquecimento de posição."""

    @pytest.mark.asyncio
    async def test_falha_banco_durante_enriquecimento(self):
        """Se o banco falhar no meio do loop de propagação, a API não
        deve expor stack trace cru (500 genérico ou 503 com mensagem)."""
        from unittest.mock import patch, MagicMock
        from sqlalchemy.exc import OperationalError

        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        # 5 registros — o 3º dispara falha simulada de banco
        for i in range(5):
            _criar_telemetria(sat_id=1, tlm_id=i + 1,
                              timestamp=base + timedelta(minutes=i))

        call_counter = [0]

        def _propagar_falha_seletiva(db, sat_id, target_ts):
            call_counter[0] += 1
            if call_counter[0] >= 3:
                # SQLAlchemy DBAPIError signature: (statement, params, orig, ...)
                raise OperationalError(
                    statement="SELECT * FROM efemeride",
                    params={},
                    orig=ConnectionRefusedError("Connection refused"),
                )
            # Nos primeiros 2 calls, executa a função real
            from app.services.cobertura_service import propagar_posicao_historica as real
            return real(db, sat_id, target_ts)

        with patch(
            "app.services.telemetria_service.propagar_posicao_historica",
            side_effect=_propagar_falha_seletiva,
        ):
            # A exceção pode escapar via threadpool (ASGI transport não
            # consegue capturar tudo). Capturamos aqui para análise.
            try:
                async with _client() as client:
                    resp = await client.get("/telemetria/locations", params={
                        "sat_id": 1,
                    })
                status_code = resp.status_code
                body = resp.json() if resp.headers.get(
                    "content-type", ""
                ).startswith("application/json") else {"raw": resp.text[:500]}
            except Exception as exc:
                status_code = 500
                body = {"exception": type(exc).__name__, "message": str(exc)[:500]}

        # QA-FIX (v1.1): OperationalError durante enriquecimento de
        # posição agora é tratado com try/except no loop de enriquecimento
        # (telemetria_service.py). Registros afetados retornam position=null.
        assert status_code == 200, (
            f"[QA-FIX] OperationalError durante enriquecimento deve retornar "
            f"200 com partial data. "
            f"Status atual: {status_code}. Body: {body}"
        )
        # Registros não afetados devem ter posição; afetados devem ter null
        data = body.get("data", [])
        positions = [r.get("position") for r in data]
        assert any(p is not None for p in positions), (
            "Pelo menos alguns registros devem ter posição calculada"
        )
        assert any(p is None for p in positions), (
            "Registros afetados pela falha devem ter position=null"
        )

    @pytest.mark.asyncio
    async def test_efemeride_com_json_corrompido(self):
        """Efemeride com params_keplerian inválidos não pode quebrar a API.

        QA-CRITICAL (v1.0): json.loads() em propagar_posicao_historica()
        (cobertura_service.py:184) não tem try/except. JSON malformado no
        banco causa JSONDecodeError → 500 Internal Server Error.

        CORREÇÃO ESPERADA: envolver json.loads() com try/except e retornar
        None (ou logar + pular o registro), permitindo que a API responda
        200 com position=null para o registro afetado.
        """
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)

        # Efemeride com JSON malformado
        db = TestingSessionLocal()
        try:
            efe = Efemeride(
                efe_id=1,
                sat_id=1,
                efe_timestamp_ref=base,
                efe_params_keplerian="{JSON CORROMPIDO {{{{{",
            )
            db.add(efe)
            db.commit()
        finally:
            db.close()

        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=base + timedelta(minutes=1))

        async with _client() as client:
            try:
                resp = await client.get("/telemetria/locations", params={"sat_id": 1})
                status_code = resp.status_code
                detail = resp.text[:300]
            except Exception as exc:
                status_code = 500
                detail = f"{type(exc).__name__}: {str(exc)[:200]}"

        # QA-FIX (v1.1): JSONDecodeError em propagar_posicao_historica()
        # agora é tratado com try/except + log WARNING, retornando None.
        # A API responde 200 com position=null para o registro afetado.
        assert status_code == 200, (
            f"[QA-FIX] JSONDecodeError deve retornar 200 com position=null. "
            f"Status atual: {status_code}. "
            f"Detail: {detail}"
        )
        body = resp.json() if hasattr(resp, "json") else {}
        data = body.get("data", [])
        if data:
            assert data[0]["position"] is None, (
                "JSON corrompido → position deve ser null"
            )

    @pytest.mark.asyncio
    async def test_efemeride_vazia_sem_params(self):
        """Efemeride com params_keplerian=None deve ser tratada graciosamente.

        QA-CRITICAL (v1.0): json.loads(None) em propagar_posicao_historica()
        (cobertura_service.py:184) causa TypeError → 500 Internal Server Error.

        CORREÇÃO ESPERADA: verificar se efe_params_keplerian é None/NoneType
        antes de chamar json.loads(). Se for None, retornar None (posição
        não disponível), permitindo resposta 200 com position=null.
        """
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)

        db = TestingSessionLocal()
        try:
            efe = Efemeride(
                efe_id=1,
                sat_id=1,
                efe_timestamp_ref=base,
                efe_params_keplerian=None,  # NULL
            )
            db.add(efe)
            db.commit()
        finally:
            db.close()

        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=base + timedelta(minutes=1))

        async with _client() as client:
            try:
                resp = await client.get("/telemetria/locations", params={"sat_id": 1})
                status_code = resp.status_code
                detail = resp.text[:300]
            except Exception as exc:
                status_code = 500
                detail = f"{type(exc).__name__}: {str(exc)[:200]}"

        # QA-FIX (v1.1): TypeError em json.loads(None) agora é tratado com
        # verificação explícita de None antes do parse, retornando None.
        # A API responde 200 com position=null para o registro afetado.
        assert status_code == 200, (
            f"[QA-FIX] efe_params_keplerian=None deve retornar 200 com position=null. "
            f"Status atual: {status_code}. "
            f"Detail: {detail}"
        )
        body = resp.json() if hasattr(resp, "json") else {}
        data = body.get("data", [])
        if data:
            assert data[0]["position"] is None, (
                "efe_params_keplerian=None → position deve ser null"
            )


# -----------------------------------------------------------
#  BLOCO D — INJECTION, CARACTERES ESPECIAIS & SEGURANÇA
# -----------------------------------------------------------

class TestSecurityInjection:
    """Testa resistência a injection e parâmetros maliciosos."""

    @pytest.mark.asyncio
    async def test_sql_injection_classica_sat_id(self):
        """sat_id='1; DROP TABLE satelite;--' deve ser rejeitado pelo parser int."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": "1; DROP TABLE satelite;--",
            })
        assert resp.status_code in (400, 422), (
            f"SQL injection em sat_id deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_sql_injection_union_select(self):
        """sat_id='1 UNION SELECT * FROM operador' deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": "1 UNION SELECT * FROM operador",
            })
        assert resp.status_code in (400, 422), (
            f"UNION injection deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_xss_injection_timestamp(self):
        """Injetar script tag nos parâmetros de data deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "<script>alert('xss')</script>",
            })
        assert resp.status_code in (400, 422), (
            f"XSS em timestamp deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_null_byte_injection(self):
        """Null byte em parâmetro string deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00Z\x00extra",
            })
        # Deve rejeitar — null byte não pertence a ISO 8601
        assert resp.status_code in (400, 422), (
            f"Null byte deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_sat_id_float_em_vez_de_int(self):
        """sat_id=1.5 (float) deve ser rejeitado — tipo incorreto."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1.5,
            })
        assert resp.status_code in (400, 422), (
            f"sat_id float deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_sat_id_string_nao_numerica(self):
        """sat_id='abc' deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": "abc",
            })
        assert resp.status_code in (400, 422), (
            f"sat_id='abc' deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_sat_id_zero_valido(self):
        """sat_id=0 — tecnicamente válido como int. Deve retornar 404 se não existir."""
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 0,
            })
        # 404 (não existe satélite 0) ou 200 (se existir)
        assert resp.status_code in (200, 404), (
            f"sat_id=0 deveria ser 200 ou 404, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_sat_id_negativo(self):
        """sat_id=-1 deve ser aceito como int e retornar 404 (satélite não existe)."""
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": -1,
            })
        # Aceito como int, mas satélite -1 não existe → 404
        assert resp.status_code in (200, 404), (
            f"sat_id=-1 deveria ser 200 ou 404, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_limit_como_string(self):
        """limit='cem' (string não numérica) deve ser rejeitado."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": "cem",
            })
        assert resp.status_code in (400, 422), (
            f"limit='cem' deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_caracteres_unicode_extremos(self):
        """Unicode extremo (emoji, RTL override) nos parâmetros."""
        _criar_satelite(sat_id=1)
        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": "2026-06-01T00:00:00Z‮⁦EXTRA⁩",
            })
        assert resp.status_code in (400, 422), (
            f"Unicode RTL em timestamp deveria ser 400/422, obtido {resp.status_code}"
        )

    @pytest.mark.asyncio
    async def test_parametros_extras_ignorados(self):
        """Query params desconhecidos devem ser ignorados (não quebrar)."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=base + timedelta(minutes=1))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "hacker_param": "malicious_value",
                "__proto__": '{"isAdmin": true}',
                "constructor": "function(){return true}",
            })
        # Deve ignorar e seguir normalmente
        assert resp.status_code == 200, (
            f"Parâmetros extras deveriam ser ignorados, obtido {resp.status_code}"
        )


# -----------------------------------------------------------
#  BLOCO E — ROBUSTEZ ADICIONAL & CONDIÇÕES DE CONTORNO
# -----------------------------------------------------------

class TestRobustezAdicional:
    """Cobre condições que o time pode não ter considerado no happy path."""

    @pytest.mark.asyncio
    async def test_satelite_sem_telemetria_mas_com_efemeride(self):
        """Satélite tem efeméride mas zero telemetria → lista vazia 200."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        # sem telemetria

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={"sat_id": 1})

        assert resp.status_code == 200
        assert resp.json()["data"] == []
        assert resp.json()["pagination"]["total"] == 0

    @pytest.mark.asyncio
    async def test_telemetria_com_timestamp_anterior_a_efemeride(self):
        """Telemetria com timestamp anterior a TODAS as efemérides →
        usa fallback posterior (ou retorna position=None)."""
        _criar_satelite(sat_id=1)
        base_efe = datetime(2026, 6, 10, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base_efe)

        # Telemetria 5 dias ANTES da única efeméride
        tlm_ts = datetime(2026, 6, 5, 12, 0, 0, tzinfo=timezone.utc)
        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=tlm_ts)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={"sat_id": 1})

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 1
        # Deve usar o fallback (efeméride posterior) → position não nula
        assert body["data"][0]["position"] is not None, (
            "Fallback de efeméride posterior deveria gerar posição"
        )

    @pytest.mark.asyncio
    async def test_delta_t_gigante_efe_muito_antiga(self):
        """Efeméride muito antiga (2 anos) com telemetria recente —
        delta_t_s enorme, propagação deve continuar determinística."""
        _criar_satelite(sat_id=1)
        # Efeméride de 2024
        base_antiga = datetime(2024, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base_antiga)

        # Telemetria de 2026 (~2 anos depois = 63 milhões de segundos)
        tlm_ts = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=tlm_ts)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={"sat_id": 1})

        assert resp.status_code == 200
        body = resp.json()
        # A propagação deve funcionar mesmo com delta_t enorme
        assert body["data"][0]["position"] is not None, (
            "Propagação deve funcionar com delta_t grande"
        )
        # Coordenadas devem estar em ranges válidos
        pos = body["data"][0]["position"]
        assert -90 <= pos["lat"] <= 90, f"Latitude inválida: {pos['lat']}"
        assert -180 <= pos["lng"] <= 180, f"Longitude inválida: {pos['lng']}"
        assert pos["alt_km"] > 0, f"Altitude inválida: {pos['alt_km']}"

    @pytest.mark.asyncio
    async def test_multiplas_efemerides_mesmo_satelite(self):
        """Satélite com múltiplas efemérides — cada telemetria usa a mais
        próxima anterior (ou fallback posterior)."""
        _criar_satelite(sat_id=1)
        # 3 efemérides em horários diferentes
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        _criar_efemeride(sat_id=1, efe_id=2,
                          timestamp_ref=base + timedelta(hours=6))
        _criar_efemeride(sat_id=1, efe_id=3,
                          timestamp_ref=base + timedelta(hours=12))

        # Telemetria entre a 1ª e 2ª efeméride
        _criar_telemetria(sat_id=1, tlm_id=1,
                          timestamp=base + timedelta(hours=3))
        # Telemetria entre a 2ª e 3ª efeméride
        _criar_telemetria(sat_id=1, tlm_id=2,
                          timestamp=base + timedelta(hours=9))

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={"sat_id": 1})

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["data"]) == 2
        # Ambas devem ter posição (fonte_efe_id é interno, Pydantic o remove)
        for reg in body["data"]:
            assert reg["position"] is not None
            # fonte_efe_id não é exposto no schema LocationPosition
            # — validamos indiretamente via lat/lng/alt_km
            assert -90 <= reg["position"]["lat"] <= 90
            assert -180 <= reg["position"]["lng"] <= 180
            assert reg["position"]["alt_km"] > 0

    @pytest.mark.asyncio
    async def test_limit_1_offset_limite(self):
        """Paginação de 1 em 1 no limite dos dados — boundary exato."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        for i in range(3):
            _criar_telemetria(sat_id=1, tlm_id=i + 1,
                              timestamp=base + timedelta(minutes=i))

        todos_ids = set()
        async with _client() as client:
            for offset in range(3):
                resp = await client.get("/telemetria/locations", params={
                    "sat_id": 1, "limit": 1, "offset": offset,
                })
                assert resp.status_code == 200
                body = resp.json()
                assert len(body["data"]) == 1
                todos_ids.add(body["data"][0]["tlm_id"])

                # next_offset correto
                if offset < 2:
                    assert body["pagination"]["next_offset"] == offset + 1
                else:
                    assert body["pagination"]["next_offset"] is None

        assert len(todos_ids) == 3

    @pytest.mark.asyncio
    async def test_from_exclusivo_to_inclusivo_boundary(self):
        """Verifica que os limites from/to são inclusivos (>= e <=)."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        # Registros exatamente no from e no to
        t_from = datetime(2026, 6, 1, 12, 1, 0, tzinfo=timezone.utc)
        t_mid = datetime(2026, 6, 1, 12, 2, 0, tzinfo=timezone.utc)
        t_to = datetime(2026, 6, 1, 12, 3, 0, tzinfo=timezone.utc)

        _criar_telemetria(sat_id=1, tlm_id=1, timestamp=t_from)
        _criar_telemetria(sat_id=1, tlm_id=2, timestamp=t_mid)
        _criar_telemetria(sat_id=1, tlm_id=3, timestamp=t_to)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1,
                "from": t_from.isoformat(),
                "to": t_to.isoformat(),
            })

        assert resp.status_code == 200
        ids = {r["tlm_id"] for r in resp.json()["data"]}
        assert ids == {1, 2, 3}, (
            f"Esperados ids 1,2,3 (inclusivo), obtidos {ids}"
        )

    @pytest.mark.asyncio
    async def test_payload_response_sem_metadata_vazios(self):
        """Registro com temperatura/energia/cpu=None deve vir com null."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        db = TestingSessionLocal()
        try:
            tlm = Telemetria(
                id_satelite=1,
                timestamp_registro=base + timedelta(minutes=5),
                temperatura=None,
                energia=None,
                cpu=None,
            )
            db.add(tlm)
            db.commit()
        finally:
            db.close()

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={"sat_id": 1})

        assert resp.status_code == 200
        meta = resp.json()["data"][0]["metadata"]
        assert meta["temperatura"] is None
        assert meta["energia"] is None
        assert meta["cpu"] is None

    @pytest.mark.asyncio
    async def test_ordering_double_sort_consistente(self):
        """Ordenação por timestamp ASC + tlm_id ASC garante determinismo
        mesmo com timestamps iguais."""
        _criar_satelite(sat_id=1)
        ts = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=ts)

        # 5 registros com MESMO timestamp — ordem deve ser por tlm_id
        ids_inseridos = []
        for i in range(5):
            _criar_telemetria(sat_id=1, tlm_id=10 + i,
                              timestamp=ts)
            ids_inseridos.append(10 + i)

        async with _client() as client:
            resp = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 10,
            })

        assert resp.status_code == 200
        ids_retornados = [r["tlm_id"] for r in resp.json()["data"]]
        # Com mesmo timestamp, ordenação secundária por tlm_id ASC
        assert ids_retornados == sorted(ids_retornados), (
            f"Ordenação instável com timestamps iguais: {ids_retornados}"
        )

    @pytest.mark.asyncio
    async def test_concurrente_mesmo_endpoint(self):
        """Múltiplas requisições concorrentes ao mesmo endpoint (smoke test)."""
        import asyncio

        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)
        for i in range(10):
            _criar_telemetria(sat_id=1, tlm_id=i + 1,
                              timestamp=base + timedelta(minutes=i))

        async def _fazer_request():
            async with _client() as client:
                return await client.get("/telemetria/locations", params={
                    "sat_id": 1, "limit": 5, "offset": 0,
                })

        # 10 requests concorrentes
        resultados = await asyncio.gather(*[_fazer_request() for _ in range(10)])

        for resp in resultados:
            assert resp.status_code == 200
            assert resp.json()["pagination"]["total"] == 10

    @pytest.mark.asyncio
    async def test_pagination_total_consistente_com_filtro(self):
        """total do pagination deve refletir o COUNT com filtros aplicados."""
        _criar_satelite(sat_id=1)
        base = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        _criar_efemeride(sat_id=1, efe_id=1, timestamp_ref=base)

        # 15 registros em junho, 5 em julho
        for i in range(15):
            _criar_telemetria(sat_id=1, tlm_id=i + 1,
                              timestamp=base + timedelta(hours=i))
        for i in range(5):
            _criar_telemetria(sat_id=1, tlm_id=20 + i,
                              timestamp=datetime(2026, 7, 1, 12, 0, 0,
                                                  tzinfo=timezone.utc) + timedelta(hours=i))

        async with _client() as client:
            # Sem filtro: 20 total
            r1 = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 5,
            })
            assert r1.json()["pagination"]["total"] == 20

            # Filtro apenas junho: 15 total
            r2 = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 5,
                "from": "2026-06-01T00:00:00Z",
                "to": "2026-06-30T23:59:59Z",
            })
            assert r2.json()["pagination"]["total"] == 15

            # Filtro apenas julho: 5 total
            r3 = await client.get("/telemetria/locations", params={
                "sat_id": 1, "limit": 5,
                "from": "2026-07-01T00:00:00Z",
                "to": "2026-07-31T23:59:59Z",
            })
            assert r3.json()["pagination"]["total"] == 5
