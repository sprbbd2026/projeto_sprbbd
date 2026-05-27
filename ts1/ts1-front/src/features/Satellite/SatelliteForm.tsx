import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSatellite } from "../../services/satellite";

export default function SatelliteForm() {
    const navigate = useNavigate();

    const [sat_nome, setSatNome] = useState("");
    const [sat_modelo_hardware, setSatModeloHardware] = useState("");
    const [sat_versao_firmware, setSatVersaoFirmware] = useState("");
    const [sat_tipo_orbita, setSatTipoOrbita] = useState("");
    const [sat_status, setSatStatus] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createSatellite({
                sat_nome,
                sat_modelo_hardware,
                sat_versao_firmware,
                sat_tipo_orbita,
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

            {/* CARD */}
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-7xl bg-[var(--surface)] rounded-2xl shadow-lg p-8"
            >

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* NOME */}
                    <div>
                        <label className="block text-sm mb-2">
                            Nome do Satélite
                        </label>
                        <input
                            type="text"
                            value={sat_nome}
                            onChange={(e) => setSatNome(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required
                        />
                    </div>

                    {/* HARDWARE */}
                    <div>
                        <label className="block text-sm mb-2">
                            Modelo do Hardware
                        </label>
                        <input
                            type="text"
                            value={sat_modelo_hardware}
                            onChange={(e) => setSatModeloHardware(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required
                        />
                    </div>

                    {/* FIRMWARE */}
                    <div>
                        <label className="block text-sm mb-2">
                            Versão do Firmware
                        </label>
                        <input
                            type="text"
                            value={sat_versao_firmware}
                            onChange={(e) => setSatVersaoFirmware(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required
                        />
                    </div>

                    {/* ÓRBITA */}
                    <div>
                        <label className="block text-sm mb-2">
                            Tipo de Órbita
                        </label>

                        <select
                            value={sat_tipo_orbita}
                            onChange={(e) => setSatTipoOrbita(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white focus:ring-2 focus:ring-[var(--accent)]"
                            required>
                            <option value="">Selecione a Órbita</option>
                            <option value="IGSO">IGSO</option>
                            <option value="MEO">MEO</option>
                            <option value="GEO">GEO</option>
                            <option value="LEO">LEO</option>

                        </select>
                    </div>

                    {/* STATUS */}
                    <div className="md:col-span-2">
                        <label className="block text-sm mb-2">
                            Status
                        </label>

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

                {/* BOTÃO */}
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

            {/* ERRO */}
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