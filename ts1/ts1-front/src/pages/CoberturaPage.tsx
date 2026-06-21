import { useEffect, useState } from "react";
import {
    getRegioes,
    getCoberturaPorRegiao,
    type Regiao,
    type CoberturaRegiao,
} from "../services/cobertura";

// ---- Projeção (equiretangular) sobre a América do Sul / Brasil ----
const W = 660;
const H = 768;
const VIEW = { lngMin: -85, lngMax: -30, latMax: 12, latMin: -52 };
const px = (lng: number) => ((lng - VIEW.lngMin) / (VIEW.lngMax - VIEW.lngMin)) * W;
const py = (lat: number) => ((VIEW.latMax - lat) / (VIEW.latMax - VIEW.latMin)) * H;
const toPoints = (coords: number[][]) =>
    coords.map((c) => `${px(c[0]).toFixed(1)},${py(c[1]).toFixed(1)}`).join(" ");

// Bounding box do Brasil usado no backend (apenas referência visual)
const BBOX = { lat_min: -36.0, lat_max: 7.0, lng_min: -76.0, lng_max: -32.0 };

// Contorno aproximado do Brasil (somente referência visual)
const BR: number[][] = [
    [-60, 5], [-51, 4], [-50, -1], [-44, -2.5], [-37.5, -5], [-34.8, -7],
    [-37, -12], [-39, -16], [-40.5, -20], [-42, -22.5], [-48, -25], [-48.5, -28],
    [-51, -30], [-53.5, -33.7], [-57, -30.5], [-57.7, -26], [-54.6, -25.6],
    [-58, -20], [-60, -16], [-61, -13], [-65, -10], [-70, -11], [-73, -9.5],
    [-70, -4], [-69, -1], [-67, 1], [-64, 2.2], [-60, 5],
];

const CORES = ["#1f4fd8", "#d8511f", "#1d9e55", "#7a1fd8", "#d81f6a", "#e0a800"];

// Footprint geodésico aproximado (mesma fórmula do backend), para ilustrar a
// área coberta em torno do ponto sub-satélite retornado pela API.
function footprint(lat: number, lng: number, altKm: number, n = 48): number[][] {
    const R = 6371;
    const elevMin = (5 * Math.PI) / 180;
    const rho = Math.acos(R / (R + altKm)) - elevMin;
    const latR = (lat * Math.PI) / 180;
    const lngR = (lng * Math.PI) / 180;
    const pts: number[][] = [];
    for (let k = 0; k <= n; k++) {
        const az = (k * 2 * Math.PI) / n;
        const latP = Math.asin(
            Math.sin(latR) * Math.cos(rho) +
            Math.cos(latR) * Math.sin(rho) * Math.cos(az)
        );
        const lngP =
            lngR +
            Math.atan2(
                Math.sin(az) * Math.sin(rho) * Math.cos(latR),
                Math.cos(rho) - Math.sin(latR) * Math.sin(latP)
            );
        pts.push([(lngP * 180) / Math.PI, (latP * 180) / Math.PI]);
    }
    return pts;
}

export default function CoberturaPage() {
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [result, setResult] = useState<CoberturaRegiao | null>(null);
    const [selSatId, setSelSatId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [latInput, setLatInput] = useState("");
    const [lngInput, setLngInput] = useState("");

    useEffect(() => {
        getRegioes()
            .then(setRegioes)
            .catch((err) => setError(err.message || "Erro ao carregar regiões."));
    }, []);

    async function consultar(
        consulta: { regiao: string } | { lat: number; lng: number }
    ) {
        setLoading(true);
        setError(null);
        setSelSatId(null);
        try {
            const data = await getCoberturaPorRegiao(consulta);
            setResult(data);
        } catch (err: any) {
            setResult(null);
            setError(err.message || "Erro na consulta de cobertura.");
        } finally {
            setLoading(false);
        }
    }

    function selecionarRegiao(id: string) {
        setSelId(id);
        consultar({ regiao: id });
    }

    function consultarPonto() {
        const lat = Number(latInput);
        const lng = Number(lngInput);
        if (latInput === "" || lngInput === "" || Number.isNaN(lat) || Number.isNaN(lng)) {
            setError("Informe latitude e longitude válidas.");
            return;
        }
        setSelId(null);
        consultar({ lat, lng });
    }

    function limpar() {
        setSelId(null);
        setResult(null);
        setSelSatId(null);
        setError(null);
    }

    const satelites = result?.satelites ?? [];

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <div>
                    <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
                        Cobertura por Região
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-h)" }}>
                        US308 — identifique qual satélite atende uma região. Selecione uma
                        região ou informe coordenadas.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                    {/* MAPA */}
                    <section
                        className="rounded-2xl p-4"
                        style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                    >
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: "100%", height: "auto", borderRadius: 10 }}
                        >
                            <rect x={0} y={0} width={W} height={H} fill="#e7eefb" />

                            {/* graticule */}
                            {[-80, -70, -60, -50, -40, -30].map((lng) => (
                                <line key={`v${lng}`} x1={px(lng)} y1={0} x2={px(lng)} y2={H} stroke="#d6e0f2" strokeWidth={1} />
                            ))}
                            {[10, 0, -10, -20, -30, -40, -50].map((lat) => (
                                <line key={`h${lat}`} x1={0} y1={py(lat)} x2={W} y2={py(lat)} stroke="#d6e0f2" strokeWidth={1} />
                            ))}

                            {/* Brasil (contorno aproximado) */}
                            <polygon points={toPoints(BR)} fill="#dde7d6" stroke="#b7c7a8" strokeWidth={1.5} />

                            {/* Bounding box */}
                            <rect
                                x={px(BBOX.lng_min)}
                                y={py(BBOX.lat_max)}
                                width={px(BBOX.lng_max) - px(BBOX.lng_min)}
                                height={py(BBOX.lat_min) - py(BBOX.lat_max)}
                                fill="none"
                                stroke="#9aa7c0"
                                strokeWidth={1}
                                strokeDasharray="5 4"
                            />

                            {/* Footprints dos satélites que cobrem a região */}
                            {satelites.map((s, i) => {
                                const cor = CORES[i % CORES.length];
                                const on = selSatId === null || selSatId === s.sat_id;
                                return (
                                    <polygon
                                        key={`fp${s.sat_id}`}
                                        points={toPoints(footprint(s.posicao.lat, s.posicao.lng, s.posicao.alt_km))}
                                        fill={cor}
                                        fillOpacity={on ? 0.22 : 0.05}
                                        stroke={cor}
                                        strokeWidth={1.4}
                                        strokeOpacity={on ? 0.85 : 0.2}
                                    />
                                );
                            })}

                            {/* Marcadores de região */}
                            {regioes.map((r) => (
                                <g key={r.id} style={{ cursor: "pointer" }} onClick={() => selecionarRegiao(r.id)}>
                                    <circle cx={px(r.lng)} cy={py(r.lat)} r={7} fill="#fff" stroke={selId === r.id ? "#1f4fd8" : "#1a2233"} strokeWidth={selId === r.id ? 3 : 2} />
                                    <text x={px(r.lng) + 11} y={py(r.lat) + 4} fontSize={11} fontWeight={700} fill="#1a2233">{r.nome}</text>
                                </g>
                            ))}

                            {/* Ponto consultado por coordenadas */}
                            {result && !result.regiao && (
                                <circle cx={px(result.ponto.lng)} cy={py(result.ponto.lat)} r={6} fill="#111" stroke="#fff" strokeWidth={2} />
                            )}

                            {/* Marcadores de satélite */}
                            {satelites.map((s, i) => {
                                const cor = CORES[i % CORES.length];
                                const x = px(s.posicao.lng);
                                const y = py(s.posicao.lat);
                                return (
                                    <g key={`sat${s.sat_id}`} style={{ cursor: "pointer" }} onClick={() => setSelSatId(s.sat_id)}>
                                        <rect x={x - 6} y={y - 6} width={12} height={12} transform={`rotate(45 ${x} ${y})`} fill={cor} stroke="#fff" strokeWidth={2} />
                                        <text x={x} y={y - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill={cor}>SAT{s.sat_id}</text>
                                    </g>
                                );
                            })}
                        </svg>
                        <p className="mt-2 text-xs" style={{ color: "var(--text-h)" }}>
                            ◆ satélite · ● região · área colorida = cobertura aproximada no solo.
                            Contorno do Brasil é apenas referência visual.
                        </p>
                    </section>

                    {/* PAINEL */}
                    <section
                        className="rounded-2xl p-6"
                        style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                    >
                        {/* Controles */}
                        <div className="flex flex-wrap gap-2">
                            {regioes.map((r) => (
                                <button
                                    key={r.id}
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

                        <div className="mt-4 flex flex-wrap items-end gap-2">
                            <div>
                                <label className="block text-xs" style={{ color: "var(--text-h)" }}>Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={latInput}
                                    onChange={(e) => setLatInput(e.target.value)}
                                    placeholder="-9"
                                    className="w-24 rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs" style={{ color: "var(--text-h)" }}>Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={lngInput}
                                    onChange={(e) => setLngInput(e.target.value)}
                                    placeholder="-40"
                                    className="w-24 rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <button
                                onClick={consultarPonto}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                style={{ background: "var(--accent)" }}
                            >
                                Consultar
                            </button>
                            <button
                                onClick={limpar}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ background: "var(--bg)", color: "var(--text)" }}
                            >
                                Limpar
                            </button>
                        </div>

                        {/* Resultado */}
                        <div className="mt-6">
                            {loading ? (
                                <p style={{ color: "var(--text-h)" }}>Consultando cobertura...</p>
                            ) : error ? (
                                <p className="text-red-500">{error}</p>
                            ) : !result ? (
                                <p style={{ color: "var(--text-h)" }}>
                                    Selecione uma região no mapa ou nos botões acima para ver o
                                    satélite associado.
                                </p>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                                            {result.regiao
                                                ? result.regiao.nome
                                                : `Ponto ${result.ponto.lat}, ${result.ponto.lng}`}
                                        </h2>
                                        <span
                                            className="rounded-full px-3 py-1 text-xs font-bold text-white"
                                            style={{ background: result.coberta ? "#1d9e55" : "#b03a3a" }}
                                        >
                                            {result.coberta ? "COBERTA" : "SEM COBERTURA"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm" style={{ color: "var(--text-h)" }}>
                                        {result.total} satélite(s) operacional(is) atendendo esta região.
                                    </p>

                                    <ul className="mt-4 space-y-1">
                                        {satelites.map((s, i) => (
                                            <li
                                                key={s.sat_id}
                                                onClick={() => setSelSatId(s.sat_id === selSatId ? null : s.sat_id)}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm"
                                                style={{
                                                    background: selSatId === s.sat_id ? "var(--bg)" : "transparent",
                                                }}
                                            >
                                                <span
                                                    className="inline-block h-3 w-3 rounded-full"
                                                    style={{ background: CORES[i % CORES.length] }}
                                                />
                                                <b style={{ color: "var(--text)" }}>SAT {s.sat_id}</b>
                                                <span style={{ color: "var(--text-h)" }}>· {s.sat_status}</span>
                                                <span className="ml-auto tabular-nums" style={{ color: "var(--text-h)" }}>
                                                    {s.posicao.lat}, {s.posicao.lng} · {Math.round(s.posicao.alt_km)} km
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {result.coberta && (
                                        <div
                                            className="mt-4 rounded-r-lg border-l-4 px-3 py-2 text-xs"
                                            style={{ borderColor: "var(--accent)", background: "var(--bg)", color: "var(--text-h)" }}
                                        >
                                            <b style={{ color: "var(--text)" }}>Cenário 3:</b> dada a região
                                            monitorada, o sistema apresenta o satélite associado. Clique num
                                            satélite para destacar a cobertura dele no mapa (Cenários 1 e 2).
                                        </div>
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
