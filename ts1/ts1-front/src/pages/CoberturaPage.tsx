import { useCallback, useEffect, useMemo, useState } from "react";
import CoberturaMap, { CORES_SATELITE } from "../components/ui/CoberturaMap";
import {
    getRegioes,
    getCoberturaPorRegiao,
    getPosicoesSatelites,
    type Regiao,
    type CoberturaRegiao,
    type SateliteCobertura,
} from "../services/cobertura";

function defaultDatetimeLocal(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

function localDatetimeToIso(value: string): string {
    if (!value) return new Date().toISOString();
    return new Date(value).toISOString();
}

function formatInstante(iso?: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
    });
}

export default function CoberturaPage() {
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [instanteLocal, setInstanteLocal] = useState(defaultDatetimeLocal);
    const [posicoes, setPosicoes] = useState<SateliteCobertura[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [result, setResult] = useState<CoberturaRegiao | null>(null);
    const [selSatId, setSelSatId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPos, setLoadingPos] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const instanteIso = useMemo(
        () => localDatetimeToIso(instanteLocal),
        [instanteLocal],
    );

    const carregarPosicoes = useCallback(async (iso: string) => {
        setLoadingPos(true);
        try {
            const data = await getPosicoesSatelites(iso);
            setPosicoes(data.satelites);
        } catch (err: unknown) {
            setPosicoes([]);
            const msg = err instanceof Error ? err.message : "Erro ao carregar posições.";
            setError(msg);
        } finally {
            setLoadingPos(false);
        }
    }, []);

    useEffect(() => {
        getRegioes()
            .then(setRegioes)
            .catch((err) =>
                setError(err.message || "Erro ao carregar regiões."),
            );
    }, []);

    useEffect(() => {
        carregarPosicoes(instanteIso);
    }, [instanteIso, carregarPosicoes]);

    async function consultar(
        consulta: { regiao: string } | { lat: number; lng: number },
    ) {
        setLoading(true);
        setError(null);
        setSelSatId(null);
        try {
            const data = await getCoberturaPorRegiao(consulta, instanteIso);
            setResult(data);
        } catch (err: unknown) {
            setResult(null);
            const msg =
                err instanceof Error ? err.message : "Erro na consulta de cobertura.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    function selecionarRegiao(id: string) {
        setSelId(id);
        consultar({ regiao: id });
    }

    function consultarPonto(lat: number, lng: number) {
        setSelId(null);
        consultar({ lat, lng });
    }

    function limpar() {
        setSelId(null);
        setResult(null);
        setSelSatId(null);
        setError(null);
    }

    function usarAgora() {
        setInstanteLocal(defaultDatetimeLocal());
        limpar();
    }

    const satelites = result?.satelites ?? [];
    const cobrindoIds = useMemo(
        () => new Set(satelites.map((s) => s.sat_id)),
        [satelites],
    );

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <div>
                    <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
                        Cobertura por Região
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-h)" }}>
                        Cobertura orbital no horário escolhido, com o mesmo modelo de
                        órbita IGSO usado nas rotas do TS2. Clique numa região ou em
                        qualquer ponto do mapa para ver quais satélites atendem naquele
                        instante.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section
                        className="rounded-2xl p-4"
                        style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                    >
                        <div className="mb-3 flex flex-wrap items-end gap-3">
                            <div>
                                <label
                                    className="block text-xs font-medium"
                                    style={{ color: "var(--text-h)" }}
                                >
                                    Horário da consulta
                                </label>
                                <input
                                    type="datetime-local"
                                    value={instanteLocal}
                                    onChange={(e) => {
                                        setInstanteLocal(e.target.value);
                                        setResult(null);
                                        setSelId(null);
                                    }}
                                    className="rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={usarAgora}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ background: "var(--bg)", color: "var(--text)" }}
                            >
                                Agora
                            </button>
                            {loadingPos && (
                                <span className="text-xs" style={{ color: "var(--text-h)" }}>
                                    Atualizando órbitas…
                                </span>
                            )}
                        </div>

                        <CoberturaMap
                            regioes={regioes}
                            posicoes={posicoes}
                            cobrindoIds={cobrindoIds}
                            selRegiaoId={selId}
                            selSatId={selSatId}
                            pontoConsulta={result?.ponto ?? null}
                            temConsulta={result !== null}
                            onMapClick={consultarPonto}
                            onRegiaoClick={selecionarRegiao}
                            onSatelliteClick={(id) =>
                                setSelSatId((prev) => (prev === id ? null : id))
                            }
                        />

                        <p className="mt-2 text-xs" style={{ color: "var(--text-h)" }}>
                            ● região · ◆ satélite · área colorida = footprint no solo.
                            Clique no mapa para consultar um ponto sem digitar coordenadas.
                        </p>
                    </section>

                    <section
                        className="rounded-2xl p-6"
                        style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                    >
                        <div className="flex flex-wrap gap-2">
                            {regioes.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => selecionarRegiao(r.id)}
                                    className="rounded-full px-3 py-1 text-sm font-medium transition"
                                    style={
                                        selId === r.id
                                            ? { background: "var(--accent)", color: "#fff" }
                                            : { background: "var(--bg)", color: "var(--text)" }
                                    }
                                >
                                    {r.nome}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={limpar}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ background: "var(--bg)", color: "var(--text)" }}
                            >
                                Limpar consulta
                            </button>
                        </div>

                        <p className="mt-4 text-xs" style={{ color: "var(--text-h)" }}>
                            Instantâneo:{" "}
                            <b style={{ color: "var(--text)" }}>
                                {formatInstante(result?.instante ?? instanteIso)}
                            </b>
                            {result?.fonte_posicao === "orbita_igso_ts2" && (
                                <> · órbita IGSO (TS2)</>
                            )}
                        </p>

                        <div className="mt-4">
                            {loading ? (
                                <p style={{ color: "var(--text-h)" }}>
                                    Consultando cobertura…
                                </p>
                            ) : error ? (
                                <p className="text-red-500">{error}</p>
                            ) : !result ? (
                                <p style={{ color: "var(--text-h)" }}>
                                    Selecione uma região ou clique no mapa para ver quais
                                    satélites cobrem aquele ponto no horário escolhido.
                                </p>
                            ) : (
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2
                                            className="text-lg font-semibold"
                                            style={{ color: "var(--text)" }}
                                        >
                                            {result.regiao
                                                ? result.regiao.nome
                                                : `Ponto ${result.ponto.lat.toFixed(4)}, ${result.ponto.lng.toFixed(4)}`}
                                        </h2>
                                        <span
                                            className="rounded-full px-3 py-1 text-xs font-bold text-white"
                                            style={{
                                                background: result.coberta
                                                    ? "#1d9e55"
                                                    : "#b03a3a",
                                            }}
                                        >
                                            {result.coberta ? "COBERTA" : "SEM COBERTURA"}
                                        </span>
                                    </div>
                                    <p
                                        className="mt-1 text-sm"
                                        style={{ color: "var(--text-h)" }}
                                    >
                                        {result.total} satélite(s) operacional(is) atendendo
                                        neste instante.
                                    </p>

                                    <ul className="mt-4 space-y-1">
                                        {satelites.map((s, i) => (
                                            <li
                                                key={s.sat_id}
                                                onClick={() =>
                                                    setSelSatId(
                                                        s.sat_id === selSatId
                                                            ? null
                                                            : s.sat_id,
                                                    )
                                                }
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm"
                                                style={{
                                                    background:
                                                        selSatId === s.sat_id
                                                            ? "var(--bg)"
                                                            : "transparent",
                                                }}
                                            >
                                                <span
                                                    className="inline-block h-3 w-3 rounded-full"
                                                    style={{
                                                        background:
                                                            CORES_SATELITE[
                                                                i % CORES_SATELITE.length
                                                            ],
                                                    }}
                                                />
                                                <b style={{ color: "var(--text)" }}>
                                                    SAT {s.sat_id}
                                                </b>
                                                <span style={{ color: "var(--text-h)" }}>
                                                    · {s.sat_status}
                                                </span>
                                                <span
                                                    className="ml-auto tabular-nums"
                                                    style={{ color: "var(--text-h)" }}
                                                >
                                                    {s.posicao.lat}, {s.posicao.lng} ·{" "}
                                                    {Math.round(s.posicao.alt_km)} km
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {!result.coberta && (
                                        <p
                                            className="mt-4 text-sm"
                                            style={{ color: "var(--text-h)" }}
                                        >
                                            Nenhum satélite operacional cobre este ponto no
                                            horário selecionado. Tente outro instante ou outra
                                            região.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
