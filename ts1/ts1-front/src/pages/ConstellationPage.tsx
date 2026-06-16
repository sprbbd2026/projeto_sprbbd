import { useEffect, useState } from "react";
import {
    deleteConstellation,
    getConstellations,
    type Constellation,
} from "../services/constellation";
import { useNavigate, Link } from "react-router-dom";
import { FaPen, FaTrashAlt } from "react-icons/fa";

export default function ConstellationPage() {
    const navigate = useNavigate();
    const [constellations, setConstellations] = useState<Constellation[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadConstellations() {
            try {
                const data = await getConstellations();
                setConstellations(data);
            } catch (error) {
                console.error("Erro ao buscar constelacoes:", error);
            } finally {
                setLoading(false);
            }
        }
        loadConstellations();
    }, []);

    const totalSatelites = constellations.reduce((acc, c) => acc + c.sat_quantidade, 0);

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>Gerenciar Constelacoes</h1>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl p-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
                        <p className="text-sm" style={{ color: "var(--text-h)" }}>Total de Constelacoes</p>
                        <h2 className="mt-2 text-3xl font-bold" style={{ color: "var(--white)" }}>{constellations.length}</h2>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
                        <p className="text-sm" style={{ color: "var(--text-h)" }}>Satelites em constelacoes</p>
                        <h2 className="mt-2 text-3xl font-bold">{totalSatelites}</h2>
                    </div>
                </section>

                <section className="rounded-2xl p-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>Constelacoes cadastradas</h2>
                        <Link to="/register-constellation"
                            className="rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90"
                            style={{ background: "var(--accent)", color: "#fff" }}>
                            Nova constelacao
                        </Link>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Carregando...</div>
                    ) : constellations.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">Nenhuma constelacao cadastrada.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                        <th className="py-3 text-left text-sm text-gray-400">ID</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Nome</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Satelites</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {constellations.map((c) => (
                                        <tr key={c.con_id} className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                            <td className="py-4" style={{ color: "var(--text)" }}>{c.con_id}</td>
                                            <td className="py-4" style={{ color: "var(--text)" }}>{c.con_nome ?? "—"}</td>
                                            <td className="py-4" style={{ color: "var(--text-h)" }}>{c.sat_quantidade}</td>
                                            <td className="py-4">
                                                <div className="flex gap-3 items-center">
                                                    <button onClick={() => navigate(`/constellations/edit/${c.con_id}`)}
                                                        className="p-2 text-blue-400 hover:text-blue-300"><FaPen /></button>
                                                    <button onClick={() => setConfirmDeleteId(c.con_id)}
                                                        className="p-2 text-red-400 hover:text-red-300"><FaTrashAlt /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {confirmDeleteId !== null && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-[var(--surface)] p-6 rounded-xl shadow-lg w-full max-w-sm text-center space-y-4">
                        <h2 className="text-lg font-semibold text-white">Confirmar exclusao</h2>
                        <p className="text-gray-300">Tem certeza que deseja excluir esta constelacao? Os satelites serao desvinculados.</p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button>
                            <button onClick={async () => {
                                await deleteConstellation(confirmDeleteId);
                                setConstellations((prev) => prev.filter((c) => c.con_id !== confirmDeleteId));
                                setConfirmDeleteId(null);
                            }} className="px-4 py-2 rounded-lg bg-red-500 text-white">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
