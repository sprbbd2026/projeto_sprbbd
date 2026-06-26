import { api } from "./api";

export interface Regiao {
    id: string;
    nome: string;
    lat: number;
    lng: number;
}

export interface PosicaoSatelite {
    lat: number;
    lng: number;
    alt_km: number;
}

export interface SateliteCobertura {
    sat_id: number;
    con_id: number | null;
    sat_status: string;
    posicao: PosicaoSatelite;
}

export interface CoberturaRegiao {
    instante?: string;
    fonte_posicao?: string;
    regiao: Regiao | null;
    ponto: { lat: number; lng: number };
    coberta: boolean;
    total: number;
    satelites: SateliteCobertura[];
}

export interface CoberturaPosicoes {
    instante: string;
    fonte_posicao: string;
    satelites: SateliteCobertura[];
}

export type ConsultaCobertura =
    | { regiao: string }
    | { lat: number; lng: number };

function qsInstante(instante?: string): string {
    return instante ? `&instante=${encodeURIComponent(instante)}` : "";
}

// GET /cobertura/regioes
export async function getRegioes(): Promise<Regiao[]> {
    return api<Regiao[]>("/cobertura/regioes", { method: "GET" });
}

// GET /cobertura/regiao?regiao=... | ?lat=&lng=
export async function getCoberturaPorRegiao(
    consulta: ConsultaCobertura,
    instante?: string,
): Promise<CoberturaRegiao> {
    const base =
        "regiao" in consulta
            ? `regiao=${encodeURIComponent(consulta.regiao)}`
            : `lat=${consulta.lat}&lng=${consulta.lng}`;
    return api<CoberturaRegiao>(
        `/cobertura/regiao?${base}${qsInstante(instante)}`,
        { method: "GET" },
    );
}

// GET /cobertura/posicoes — posições IGSO no instante (alinhado ao TS2)
export async function getPosicoesSatelites(
    instante?: string,
): Promise<CoberturaPosicoes> {
    const qs = instante
        ? `?instante=${encodeURIComponent(instante)}`
        : "";
    return api<CoberturaPosicoes>(`/cobertura/posicoes${qs}`, { method: "GET" });
}

// GET /cobertura/satelite/{id} — footprint (GeoJSON) do satélite
export interface FootprintFeatureCollection {
    type: string;
    features: Array<{
        type: string;
        properties: Record<string, unknown>;
        geometry: { type: string; coordinates: number[][][] } | null;
    }>;
}

export async function getCoberturaSatelite(
    satId: number,
): Promise<FootprintFeatureCollection> {
    return api<FootprintFeatureCollection>(`/cobertura/satelite/${satId}`, {
        method: "GET",
    });
}
