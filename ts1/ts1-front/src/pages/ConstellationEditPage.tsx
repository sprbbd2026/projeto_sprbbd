import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getConstellationById,
    getUnassignedSatellites,
    updateConstellation,
    MIN_SATELITES_CONSTELACAO,
} from "../services/constellation";
import type { Satellite } from "../services/satellite";

export default function ConstellationEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [con_nome, setConNome] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [eligible, setEligible] = useState<Satellite[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function load() {
            try {
                const [detail, unassigned] = await Promise.all([
                    getConstellationById(Number(id)),
                    getUnassignedSatellites(),
                ]);

                setConNome(detail.con_nome ?? "");
                setSelectedIds(detail.satelites.map((s) => s.sat_id));

                // elegíveis = livres + os já membros desta constelação
                const merged = [...unassigned];
                for (const member of detail.satelites) {
                    if (!merged.some((s) => s.sat_id === member.sat_id)) {
                        merged.push(member);
                    }
                }
                merged.sort((a, b) => a.sat_id - b.sat_id);
                setEligible(merged);
            } catch {
                setError("Erro ao carregar a constelação.");
            } finally {
                setLoadingData(false);
            }
        }

        load();
    }, [id]);

    function toggleSatellite(satId: number) {
        setSelectedIds((prev) =>
            prev.includes(satId) ? prev.filter((x) => x !== satId) : [...prev, satId]
        );
    }

    const enoughSatellites = selectedIds.length >= MIN_SATELITES_CONSTELACAO;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!enoughSatellites) return;

        setLoading(true);
        setError(null);

        try {
            await updateConstellation(Number(id), {
                con_nome,
                sat_ids: selectedIds,
            });
            navigate("/constellation");
        } catch (err: any) {
            setError(err.message || "Erro ao salvar constelação.");
        } finally {
            setLoading(false);
        }
    }

    const inputStyle =
        "w-full rounded-xl px-4 py-3 bg-[var(--surface)] text-[var(--text)] outline-none border border-white/10 focus:border-[var(--accent)] transition";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div
                className="w-full max-w-2xl rounded-2xl p-8 space-y-6"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
            >
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">
                        Editar Constelação
                    </h1>
                    <p className="text-sm text-gray-400">
                        Atualize as informações e os satélites da constelação
                    </p>
                </div>

                {loadingData ? (
                    <div className="text-center py-10 text-gray-400">
                        Carregando dados da constelação...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            value={con_nome}
                            onChange={(e) => setConNome(e.target.value)}
                            placeholder="Nome da constelacao"
                            className={inputStyle}
                            required
                        />

                        {/* SATÉLITES */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm text-[var(--text)]">
                                    Satélites da constelação
                                </label>
                                <span
                                    className={`text-sm font-medium ${enoughSatellites ? "text-green-400" : "text-yellow-400"
                                        }`}
                                >
                                    {selectedIds.length}/{MIN_SATELITES_CONSTELACAO} selecionados
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                {eligible.map((sat) => (
                                    <label
                                        key={sat.sat_id}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:border-[var(--accent)] transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(sat.sat_id)}
                                            onChange={() => toggleSatellite(sat.sat_id)}
                                            className="accent-[var(--accent)]"
                                        />
                                        <span className="text-sm text-white">
                                            SAT {sat.sat_id}
                                            <span className="block text-xs text-gray-400">
                                                PRN {sat.sat_codigo_prn ?? "—"} / SVN {sat.sat_numero_svn ?? "—"}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {!enoughSatellites && (
                                <p className="text-xs text-gray-400 mt-2">
                                    Mantenha ao menos {MIN_SATELITES_CONSTELACAO} satélites
                                    selecionados.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate("/constellation")}
                                className="flex-1 rounded-xl py-3 bg-gray-600 text-white hover:opacity-80 transition"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={loading || !enoughSatellites}
                                className="flex-1 rounded-xl py-3 bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-50"
                            >
                                {loading ? "Salvando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="text-center text-red-400 text-sm">{error}</div>
                )}
            </div>
        </div>
    );
}
