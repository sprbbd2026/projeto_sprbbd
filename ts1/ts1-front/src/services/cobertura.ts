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
    regiao: Regiao | null;
    ponto: { lat: number; lng: number };
    coberta: boolean;
    total: number;
    satelites: SateliteCobertura[];
}

export type ConsultaCobertura =
    | { regiao: string }
    | { lat: number; lng: number };

// GET /cobertura/regioes
export async function getRegioes(): Promise<Regiao[]> {
    return api<Regiao[]>("/cobertura/regioes", { method: "GET" });
}

// GET /cobertura/regiao?regiao=... | ?lat=&lng=
export async function getCoberturaPorRegiao(
    consulta: ConsultaCobertura
): Promise<CoberturaRegiao> {
    const qs =
        "regiao" in consulta
            ? `regiao=${encodeURIComponent(consulta.regiao)}`
            : `lat=${consulta.lat}&lng=${consulta.lng}`;
    return api<CoberturaRegiao>(`/cobertura/regiao?${qs}`, { method: "GET" });
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
    satId: number
): Promise<FootprintFeatureCollection> {
    return api<FootprintFeatureCollection>(`/cobertura/satelite/${satId}`, {
        method: "GET",
    });
}
