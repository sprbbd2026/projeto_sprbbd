import { useEffect, useState } from "react";
import { updateSatellite, deleteSatellite, getSatellites, type Satellite } from "../services/satellite";
import { useNavigate } from "react-router-dom";
import { FaPen, FaTrashAlt } from "react-icons/fa";


export default function SatellitePage() {
    const navigate = useNavigate();
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [loading, setLoading] = useState(true);

    const statusStyles: Record<string, string> = {
        operacional: "bg-green-500/20 text-green-200",
        manutencao: "bg-yellow-500/20 text-yellow-400",
        falha: "bg-red-500/20 text-red-300",
        inativo: "bg-gray-500/20 text-gray-300",
    };

    useEffect(() => {
        async function loadSatellites() {
            try {
                const data = await getSatellites();
                setSatellites(data);
            } catch (error) {
                console.error("Erro ao buscar satélites:", error);
            } finally {
                setLoading(false);
            }
        }

        loadSatellites();
    }, []);

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                {/* header */}
                <div>
                    <h1
                        className="text-4xl font-bold"
                        style={{ color: "var(--text)" }}>
                        Gerenciar Satélites
                    </h1>

                </div>

                {/* stats */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div
                        className="rounded-2xl p-6"
                        style={{
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                        }}>
                        <p
                            className="text-sm"
                            style={{ color: "var(--text-h)" }}>
                            Total de Satélites
                        </p>

                        <h2
                            className="mt-2 text-3xl font-bold"
                            style={{ color: "var(--white)" }}>
                            {satellites.length}
                        </h2>
                    </div>

                    <div
                        className="rounded-2xl p-6"
                        style={{
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                        }}>
                        <p
                            className="text-sm"
                            style={{ color: "var(--text-h)" }}>
                            Satélites em operação
                        </p>

                        <h2 className="mt-2 text-3xl font-bold">
                            {
                                satellites.filter(
                                    (sat) => sat.sat_status.toLowerCase() === "operacional").length
                            }
                        </h2>
                    </div>

                    <div
                        className="rounded-2xl p-6"
                        style={{
                            background: "var(--surface)",
                            boxShadow: "var(--shadow)",
                        }}>
                        <p
                            className="text-sm"
                            style={{ color: "var(--text-h)" }}>
                            Órbitas diferentes
                        </p>

                        <h2 className="mt-2 text-3xl font-bold">
                            {
                                new Set(
                                    satellites.map((sat) => sat.sat_tipo_orbita)
                                ).size
                            }
                        </h2>
                    </div>
                </section>

                {/* table */}
                <section
                    className="rounded-2xl p-6"
                    style={{
                        background: "var(--surface)",
                        boxShadow: "var(--shadow)",
                    }}>

                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2
                                className="text-xl font-semibold"
                                style={{ color: "var(--text)" }}
                            >
                                Satélites cadastrados
                            </h2>
                        </div>

                        <a
                            href="/register-satellite"
                            className="rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90"
                            style={{
                                background: "var(--accent)",
                                color: "#fff",
                            }}>
                            Novo satélite
                        </a>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">
                            Carregando satélites...
                        </div>
                    ) : satellites.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                            Nenhum satélite cadastrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">

                                <thead>
                                    <tr
                                        className="border-b"
                                        style={{
                                            borderColor: "rgba(255,255,255,0.1)",
                                        }}>
                                        <th className="py-3 text-left text-sm text-gray-400">
                                            Nome
                                        </th>

                                        <th className="py-3 text-left text-sm text-gray-400">
                                            Hardware
                                        </th>

                                        <th className="py-3 text-left text-sm text-gray-400">
                                            Firmware
                                        </th>

                                        <th className="py-3 text-left text-sm text-gray-400">
                                            Órbita
                                        </th>

                                        <th className="py-3 text-left text-sm text-gray-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {satellites.map((satellite) => (
                                        <tr
                                            key={satellite.sat_id}
                                            className="border-b"
                                            style={{
                                                borderColor: "rgba(255,255,255,0.05)",
                                            }}
                                        >
                                            <td
                                                className="py-4"
                                                style={{ color: "var(--text)" }}
                                            >
                                                {satellite.sat_nome}
                                            </td>

                                            <td
                                                className="py-4"
                                                style={{ color: "var(--text-h)" }}
                                            >
                                                {satellite.sat_modelo_hardware}
                                            </td>

                                            <td
                                                className="py-4"
                                                style={{ color: "var(--text-h)" }}
                                            >
                                                {satellite.sat_versao_firmware}
                                            </td>

                                            <td
                                                className="py-4"
                                                style={{ color: "var(--text-h)" }}>
                                                {satellite.sat_tipo_orbita}
                                            </td>

                                            <td className="py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium
                                                    ${statusStyles[satellite.sat_status] || "bg-gray-500/20 text-gray-300"}`}>
                                                    {satellite.sat_status.charAt(0).toUpperCase() + satellite.sat_status.slice(1)}
                                                </span>
                                            </td>

                                            <td className="py-4">
                                                <div className="flex gap-3 items-center">
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/satellites/edit/${satellite.sat_id}`)
                                                        }
                                                        className="p-2 text-blue-400 hover:text-blue-300"
                                                    >
                                                        <FaPen />
                                                    </button>

                                                    <button
                                                        onClick={async () => {
                                                            await deleteSatellite(satellite.sat_id);
                                                            setSatellites((prev) =>
                                                                prev.filter(
                                                                    (s) => s.sat_id !== satellite.sat_id
                                                                )
                                                            );
                                                        }}
                                                        className="p-2 text-red-400 hover:text-red-300"
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
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
        </main>
    );
}