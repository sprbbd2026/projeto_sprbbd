import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getSatelliteById,
    updateSatellite,
    type Satellite
} from "../services/satellite";

export default function SatelliteEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<Omit<Satellite, "sat_id">>({
        sat_nome: "",
        sat_modelo_hardware: "",
        sat_versao_firmware: "",
        sat_tipo_orbita: "",
        sat_status: "",
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function load() {
            try {
                const sat = await getSatelliteById(Number(id));

                setForm({
                    sat_nome: sat.sat_nome,
                    sat_modelo_hardware: sat.sat_modelo_hardware,
                    sat_versao_firmware: sat.sat_versao_firmware,
                    sat_tipo_orbita: sat.sat_tipo_orbita,
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
            <div
                className="w-full max-w-2xl rounded-2xl p-8 space-y-6"
                style={{
                    background: "var(--surface)",
                    boxShadow: "var(--shadow)",
                }}
            >
                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">
                        Editar Satélite
                    </h1>
                    <p className="text-sm text-gray-400">
                        Atualize as informações do satélite selecionado
                    </p>
                </div>

                {/* LOADING */}
                {loadingData ? (
                    <div className="text-center py-10 text-gray-400">
                        Carregando dados do satélite...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <input
                            value={form.sat_nome}
                            onChange={(e) =>
                                setForm({ ...form, sat_nome: e.target.value })
                            }
                            placeholder="Nome do satélite"
                            className={inputStyle}
                        />

                        <input
                            value={form.sat_modelo_hardware}
                            onChange={(e) =>
                                setForm({ ...form, sat_modelo_hardware: e.target.value })
                            }
                            placeholder="Modelo de hardware"
                            className={inputStyle}
                        />

                        <input
                            value={form.sat_versao_firmware}
                            onChange={(e) =>
                                setForm({ ...form, sat_versao_firmware: e.target.value })
                            }
                            placeholder="Versão do firmware"
                            className={inputStyle}
                        />

                        <input
                            value={form.sat_tipo_orbita}
                            onChange={(e) =>
                                setForm({ ...form, sat_tipo_orbita: e.target.value })
                            }
                            placeholder="Tipo de órbita"
                            className={inputStyle}
                        />

                        {/* STATUS */}
                        <select
                            value={form.sat_status}
                            onChange={(e) =>
                                setForm({ ...form, sat_status: e.target.value })
                            }
                            className={inputStyle}
                        >
                            <option value="operacional">Operacional</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="falha">Falha</option>
                            <option value="inativo">Inativo</option>
                        </select>

                        {/* ACTIONS */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate("/satellite")}
                                className="flex-1 rounded-xl py-3 bg-gray-600 text-white hover:opacity-80 transition"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl py-3 bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-50"
                            >
                                {loading ? "Salvando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}