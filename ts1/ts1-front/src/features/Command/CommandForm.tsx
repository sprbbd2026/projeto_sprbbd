import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    COMMAND_TYPES,
    DEFAULT_STATION_ID,
    encodePayloadToBase64,
    sendCommand,
    type CommandResponse,
    type CommandType,
} from "../../services/commands";
import { getSatellites, type Satellite } from "../../services/satellite";

export default function CommandForm() {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [satId, setSatId] = useState("");
    const [cmdTipo, setCmdTipo] = useState<CommandType>("RESET");
    const [payload, setPayload] = useState("");
    const [descricao, setDescricao] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<CommandResponse | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        getSatellites()
            .then((items) => setSatellites(items.filter((s) => s.sat_status === "operacional")))
            .catch((err) => {
                console.error(err);
                setError("Não foi possível carregar a lista de satélites.");
            });
    }, []);

    async function handleConfirmSend() {
        if (!satId) {
            setError("Selecione um satélite/dispositivo.");
            setShowConfirm(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await sendCommand({
                est_id: DEFAULT_STATION_ID,
                sat_id: Number(satId),
                cmd_tipo: cmdTipo,
                cmd_payload_binario: encodePayloadToBase64(payload || cmdTipo),
                cmd_descricao: descricao.trim() || null,
            });
            setSuccess(response);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao enviar comando.";
            setError(message);
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!satId) {
            setError("Selecione um satélite/dispositivo.");
            return;
        }
        setShowConfirm(true);
    }

    const selectedSatellite = satellites.find((s) => String(s.sat_id) === satId);

    return (
        <div className="flex justify-center mt-10 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-3xl bg-[var(--surface)] rounded-2xl shadow-lg p-8 space-y-6"
            >
                <p className="text-sm text-gray-400">
                    Estação de controle: Estação Principal (ID {DEFAULT_STATION_ID})
                </p>

                <div>
                    <label className="block text-sm mb-2">Satélite / dispositivo</label>
                    <select
                        value={satId}
                        onChange={(e) => setSatId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    >
                        <option value="">Selecione o dispositivo</option>
                        {satellites.map((satellite) => (
                            <option key={satellite.sat_id} value={satellite.sat_id}>
                                SAT-{satellite.sat_id} ({satellite.sat_status})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm mb-2">Tipo de comando</label>
                    <select
                        value={cmdTipo}
                        onChange={(e) => setCmdTipo(e.target.value as CommandType)}
                        className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    >
                        {COMMAND_TYPES.map((tipo) => (
                            <option key={tipo} value={tipo}>
                                {tipo}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm mb-2">Descrição (opcional)</label>
                    <input
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex.: Reset operacional do módulo OBC"
                        className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-2">Payload</label>
                    <textarea
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        rows={4}
                        placeholder="Texto ou JSON do comando (será convertido para base64)"
                        className="w-full px-4 py-3 rounded-lg border bg-transparent text-white focus:ring-2 focus:ring-[var(--accent)]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || satellites.length === 0}
                    className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Enviar comando"}
                </button>
            </form>

            {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
                        <h2 className="text-lg font-semibold text-white">Confirmar envio</h2>
                        <p className="text-[var(--text)]">
                            Enviar comando <strong>{cmdTipo}</strong> para{" "}
                            <strong>SAT-{selectedSatellite?.sat_id}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-lg border text-white hover:bg-white/10 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConfirmSend()}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-red-500">Erro</p>
                        <p className="text-[var(--text)]" role="alert">
                            {error}
                        </p>
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-green-400">Comando enviado</p>
                        <p className="text-[var(--text)]">
                            ID {success.cmd_id} — status {success.cmd_status}
                        </p>
                        <Link
                            to="/commands"
                            className="block text-sm text-[var(--accent)] hover:underline"
                            onClick={() => setSuccess(null)}
                        >
                            Ver no histórico
                        </Link>
                        <button
                            onClick={() => setSuccess(null)}
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
