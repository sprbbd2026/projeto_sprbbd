import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSatellite } from "../../services/satellite";

export default function SatelliteForm() {
    const navigate = useNavigate();

    const [con_id, setConId] = useState<string>("");
    const [sat_relogio_offset, setSatRelogioOffset] = useState<string>("");
    const [sat_codigo_prn, setSatCodigoPrn] = useState<string>("");
    const [sat_numero_svn, setSatNumeroSvn] = useState<string>("");
    const [sat_status, setSatStatus] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createSatellite({
                con_id: con_id ? Number(con_id) : null,
                sat_relogio_offset: sat_relogio_offset ? Number(sat_relogio_offset) : null,
                sat_codigo_prn: sat_codigo_prn ? Number(sat_codigo_prn) : null,
                sat_numero_svn: sat_numero_svn ? Number(sat_numero_svn) : null,
                sat_status,
            });

            navigate("/satellite");
        } catch (err: any) {
            setError(err.message || "Erro ao criar satélite.");
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

                    {/* CON_ID */}
                    <div>
                        <label className="block text-sm mb-2">ID da Constelação</label>
                        <input
                            type="number"
                            value={con_id}
                            onChange={(e) => setConId(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                        />
                    </div>

                    {/* CODIGO PRN */}
                    <div>
                        <label className="block text-sm mb-2">Código PRN</label>
                        <input
                            type="number"
                            value={sat_codigo_prn}
                            onChange={(e) => setSatCodigoPrn(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                        />
                    </div>

                    {/* NUMERO SVN */}
                    <div>
                        <label className="block text-sm mb-2">Número SVN</label>
                        <input
                            type="number"
                            value={sat_numero_svn}
                            onChange={(e) => setSatNumeroSvn(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                        />
                    </div>

                    {/* RELOGIO OFFSET */}
                    <div>
                        <label className="block text-sm mb-2">Offset do Relógio</label>
                        <input
                            type="number"
                            step="any"
                            value={sat_relogio_offset}
                            onChange={(e) => setSatRelogioOffset(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                        />
                    </div>

                    {/* STATUS */}
                    <div className="md:col-span-2">
                        <label className="block text-sm mb-2">Status</label>
                        <select
                            value={sat_status}
                            onChange={(e) => setSatStatus(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required>
                            <option value="">Selecione o status</option>
                            <option value="operacional">Operacional</option>
                            <option value="falha">Falha</option>
                            <option value="manutencao">Manutenção</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50"
                    >
                        {loading ? "Enviando..." : "Criar Satélite"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-red-500">❌</p>
                        <p className="text-[var(--text)]">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition">
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
