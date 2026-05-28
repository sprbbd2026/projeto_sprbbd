import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSatelliteById, updateSatellite, type Satellite } from "../services/satellite";
import { getConstelacoes, type Constelacao } from "../services/constelacao";

type SatelliteForm = Omit<Satellite, "sat_id">;

export default function SatelliteEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [constelacoes, setConstelacoes] = useState<Constelacao[]>([]);
    const [form, setForm] = useState<SatelliteForm>({
        con_id: null,
        sat_relogio_offset: null,
        sat_codigo_prn: null,
        sat_numero_svn: null,
        sat_status: "",
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        getConstelacoes().then(setConstelacoes).catch(console.error);
    }, []);

    useEffect(() => {
        if (!id) return;
        async function load() {
            try {
                const sat = await getSatelliteById(Number(id));
                setForm({
                    con_id: sat.con_id,
                    sat_relogio_offset: sat.sat_relogio_offset,
                    sat_codigo_prn: sat.sat_codigo_prn,
                    sat_numero_svn: sat.sat_numero_svn,
                    sat_status: sat.sat_status,
                });
            } finally {
                setLoadingData(false);
            }
        }
        load();
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        await updateSatellite(Number(id), form);
        setLoading(false);
        navigate("/satellite");
    }

    const inputStyle =
        "w-full rounded-xl px-4 py-3 bg-[var(--surface)] text-[var(--text)] outline-none border border-white/10 focus:border-[var(--accent)] transition";

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-2xl rounded-2xl p-8 space-y-6"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Editar Satélite</h1>
                    <p className="text-sm text-gray-400">Atualize as informações do satélite selecionado</p>
                </div>

                {loadingData ? (
                    <div className="text-center py-10 text-gray-400">Carregando dados do satélite...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* CONSTELACAO */}
                        <select
                            value={form.con_id ?? ""}
                            onChange={(e) => setForm({ ...form, con_id: e.target.value ? Number(e.target.value) : null })}
                            className={inputStyle}>
                            <option value="">Selecione a constelação</option>
                            {constelacoes.map((c) => (
                                <option key={c.con_id} value={c.con_id}>
                                    {c.con_nome ?? `Constelação ${c.con_id}`}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={form.sat_codigo_prn ?? ""}
                            onChange={(e) => setForm({ ...form, sat_codigo_prn: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Código PRN"
                            className={inputStyle}
                        />

                        <input
                            type="number"
                            value={form.sat_numero_svn ?? ""}
                            onChange={(e) => setForm({ ...form, sat_numero_svn: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Número SVN"
                            className={inputStyle}
                        />

                        <input
                            type="number"
                            step="any"
                            value={form.sat_relogio_offset ?? ""}
                            onChange={(e) => setForm({ ...form, sat_relogio_offset: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Offset do Relógio"
                            className={inputStyle}
                        />

                        <select
                            value={form.sat_status}
                            onChange={(e) => setForm({ ...form, sat_status: e.target.value })}
                            className={inputStyle}>
                            <option value="operacional">Operacional</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="falha">Falha</option>
                            <option value="inativo">Inativo</option>
                        </select>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => navigate("/satellite")}
                                className="flex-1 rounded-xl py-3 bg-gray-600 text-white hover:opacity-80 transition">
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 rounded-xl py-3 bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-50">
                                {loading ? "Salvando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
