import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    COMMAND_TYPES,
    decodePayloadFromBase64,
    getCommandById,
    listCommands,
    type CommandDetailResponse,
    type CommandResponse,
} from "../services/commands";
import { getSatellites, type Satellite } from "../services/satellite";

function formatTimestamp(value: string): string {
    return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
    });
}

const statusStyles: Record<string, string> = {
    ENVIADO: "bg-green-500/20 text-green-200",
    REGISTRADO: "bg-blue-500/20 text-blue-200",
    ERRO: "bg-red-500/20 text-red-300",
};

export default function CommandHistoryPage() {
    const [commands, setCommands] = useState<CommandResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [satFilter, setSatFilter] = useState("");
    const [tipoFilter, setTipoFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detail, setDetail] = useState<CommandDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadCommands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listCommands({
                sat_id: satFilter ? Number(satFilter) : undefined,
                cmd_tipo: tipoFilter || undefined,
                limit: 100,
            });
            setCommands(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar o histórico de comandos.");
        } finally {
            setLoading(false);
        }
    }, [satFilter, tipoFilter]);

    useEffect(() => {
        getSatellites().then(setSatellites).catch(console.error);
    }, []);

    useEffect(() => {
        void loadCommands();
    }, [loadCommands]);

    useEffect(() => {
        if (selectedId === null) {
            setDetail(null);
            return;
        }

        setDetailLoading(true);
        getCommandById(selectedId)
            .then(setDetail)
            .catch(() => setError("Não foi possível carregar os detalhes do comando."))
            .finally(() => setDetailLoading(false));
    }, [selectedId]);

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
                            Histórico de Comandos
                        </h1>
                        <p className="mt-2 text-sm" style={{ color: "var(--text-h)" }}>
                            Consulte todas as solicitações enviadas aos dispositivos.
                        </p>
                    </div>
                    <Link
                        to="/commands/send"
                        className="rounded-xl px-4 py-2 text-sm font-medium text-center transition hover:opacity-90"
                        style={{ background: "var(--accent)", color: "#fff" }}
                    >
                        Enviar novo comando
                    </Link>
                </div>

                <section
                    className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
                    style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                >
                    <div>
                        <label className="block text-sm mb-2 text-gray-400">Satélite</label>
                        <select
                            value={satFilter}
                            onChange={(e) => setSatFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white"
                        >
                            <option value="">Todos</option>
                            {satellites.map((sat) => (
                                <option key={sat.sat_id} value={sat.sat_id}>
                                    SAT-{sat.sat_id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-2 text-gray-400">Tipo</label>
                        <select
                            value={tipoFilter}
                            onChange={(e) => setTipoFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-[var(--surface)] text-white"
                        >
                            <option value="">Todos</option>
                            {COMMAND_TYPES.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <p className="text-sm text-gray-400">
                            {total} comando{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}
                        </p>
                    </div>
                </section>

                <section
                    className="rounded-2xl p-6"
                    style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
                >
                    {error && (
                        <p className="mb-4 text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <div className="py-10 text-center text-gray-400">Carregando histórico...</div>
                    ) : commands.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                            Nenhum comando enviado ainda.{" "}
                            <Link to="/commands/send" className="text-[var(--accent)] underline">
                                Enviar o primeiro
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                        <th className="py-3 text-left text-sm text-gray-400">ID</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Data/Hora</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Satélite</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Tipo</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Status</th>
                                        <th className="py-3 text-left text-sm text-gray-400">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commands.map((command) => (
                                        <tr
                                            key={command.cmd_id}
                                            onClick={() => setSelectedId(command.cmd_id)}
                                            className="border-b cursor-pointer hover:bg-white/5 transition"
                                            style={{ borderColor: "rgba(255,255,255,0.05)" }}
                                        >
                                            <td className="py-4" style={{ color: "var(--text)" }}>
                                                #{command.cmd_id}
                                            </td>
                                            <td className="py-4" style={{ color: "var(--text-h)" }}>
                                                {formatTimestamp(command.cmd_timestamp)}
                                            </td>
                                            <td className="py-4" style={{ color: "var(--text-h)" }}>
                                                SAT-{command.sat_id}
                                            </td>
                                            <td className="py-4" style={{ color: "var(--text-h)" }}>
                                                {command.cmd_tipo}
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        statusStyles[command.cmd_status] ??
                                                        "bg-gray-500/20 text-gray-300"
                                                    }`}
                                                >
                                                    {command.cmd_status}
                                                </span>
                                            </td>
                                            <td className="py-4 max-w-xs truncate" style={{ color: "var(--text-h)" }}>
                                                {command.cmd_descricao || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {selectedId !== null && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                Comando #{selectedId}
                            </h2>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {detailLoading || !detail ? (
                            <p className="text-gray-400">Carregando detalhes...</p>
                        ) : (
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-400">Satélite</dt>
                                    <dd className="text-white">SAT-{detail.sat_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Estação</dt>
                                    <dd className="text-white">EST-{detail.est_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Tipo</dt>
                                    <dd className="text-white">{detail.cmd_tipo}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Status</dt>
                                    <dd className="text-white">{detail.cmd_status}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-400">Enviado em</dt>
                                    <dd className="text-white">{formatTimestamp(detail.cmd_timestamp)}</dd>
                                </div>
                                {detail.opr_id != null && (
                                    <div>
                                        <dt className="text-gray-400">Operador</dt>
                                        <dd className="text-white">#{detail.opr_id}</dd>
                                    </div>
                                )}
                                {detail.cmd_descricao && (
                                    <div>
                                        <dt className="text-gray-400">Descrição</dt>
                                        <dd className="text-white">{detail.cmd_descricao}</dd>
                                    </div>
                                )}
                                {detail.cmd_payload_binario && (
                                    <div>
                                        <dt className="text-gray-400">Payload</dt>
                                        <dd className="text-white break-all font-mono text-xs bg-black/20 rounded p-2">
                                            {decodePayloadFromBase64(detail.cmd_payload_binario)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
