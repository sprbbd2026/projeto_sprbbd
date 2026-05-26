import { api } from "./api";

export interface TelemetriaData {
    id_telemetria: number;
    id_satelite: number;
    temperatura: number;
    timestamp_registro: string;
    orientacao: string;
    memoria: number;
    checksum: string;
    energia: number;
    bateria: number;
    relogio: string;
    cpu: number;
}

export async function getTelemetryHistory(codigoPrn: string): Promise<TelemetriaData[]> {
    return api(`/telemetria/historico/${codigoPrn}`, {
        method: "GET",
    });
}

export async function toggleSimulation(codigoPrn: string, status: "ativo" | "inativo"): Promise<{ message: string }> {
    return api(`/telemetria/satelite/${codigoPrn}/status`, {
        method: "PUT",
        body: { status },
    });
}