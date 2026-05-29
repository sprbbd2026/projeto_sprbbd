import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createConstellation,
    getUnassignedSatellites,
    MIN_SATELITES_CONSTELACAO,
} from "../../services/constellation";
import type { Satellite } from "../../services/satellite";

export default function ConstellationForm() {
    const navigate = useNavigate();

    const [con_nome, setConNome] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [available, setAvailable] = useState<Satellite[]>([]);
    const [loadingSats, setLoadingSats] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSats() {
            try {
                const data = await getUnassignedSatellites();
                setAvailable(data);
            } catch {
                setError("Erro ao carregar satélites disponíveis.");
            } finally {
                setLoadingSats(false);
            }
        }
        loadSats();
    }, []);

    function toggleSatellite(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    const enoughSatellites = selectedIds.length >= MIN_SATELITES_CONSTELACAO;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!enoughSatellites) return;

        setLoading(true);
        setError(null);

        try {
            await createConstellation({
                con_nome,
                sat_ids: selectedIds,
            });
            navigate("/constellation");
        } catch (err: any) {
            setError(err.message || "Erro ao criar constelação.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex justify-center mt-10 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-7xl bg-[var(--surface)] rounded-2xl shadow-lg p-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* NOME */}
                    <div className="md:col-span-2">
                        <label className="block text-sm mb-2">Nome da Constelacao</label>
                        <input
                            type="text"
                            value={con_nome}
                            onChange={(e) => setConNome(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required
                        />
                    </div>
                </div>

                {/* SATÉLITES */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm">
                            Satélites da constelação
                        </label>
                        <span
                            className={`text-sm font-medium ${enoughSatellites ? "text-green-400" : "text-yellow-400"
                                }`}
                        >
                            {selectedIds.length}/{MIN_SATELITES_CONSTELACAO} selecionados
                        </span>
                    </div>

                    {loadingSats ? (
                        <p className="text-gray-400 text-sm">Carregando satélites...</p>
                    ) : available.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                            Nenhum satélite disponível. Cadastre satélites antes de criar uma
                            constelação.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
                            {available.map((sat) => (
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
                    )}

                    {!enoughSatellites && available.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                            Selecione ao menos {MIN_SATELITES_CONSTELACAO} satélites para criar
                            a constelação.
                        </p>
                    )}
                </div>

                {/* BOTÃO */}
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={loading || !enoughSatellites}
                        className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50"
                    >
                        {loading ? "Enviando..." : "Criar Constelação"}
                    </button>
                </div>
            </form>

            {/* ERRO */}
            {error && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-red-500">❌</p>
                        <p className="text-[var(--text)]">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
