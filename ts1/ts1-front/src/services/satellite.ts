import { api } from "./api";

const PathSatellites = "/satellites";
const PathCreateSatellite = "/satellites/register";
const PathUpdateSatellite = "/satellites/update";
const PathDeleteSatellite = "/satellites/delete";

export interface Satellite {
    sat_id: number;
    con_id: number | null;
    sat_relogio_offset: number | null;
    sat_codigo_prn: number | null;
    sat_numero_svn: number | null;
    sat_status: string;
}

export type CreateSatellitePayload = Omit<Satellite, "sat_id">;

export async function getSatellites(): Promise<Satellite[]> {
    return api<Satellite[]>(PathSatellites, { method: "GET" });
}

export async function createSatellite(payload: CreateSatellitePayload): Promise<Satellite> {
    return api<Satellite>(PathCreateSatellite, { method: "POST", body: payload });
}

export async function updateSatellite(sat_id: number, payload: CreateSatellitePayload): Promise<Satellite> {
    return api<Satellite>(`${PathUpdateSatellite}/${sat_id}`, { method: "PUT", body: payload });
}

export async function getSatelliteById(id: number): Promise<Satellite> {
    return api<Satellite>(`/satellites/${id}`, { method: "GET" });
}

export async function deleteSatellite(sat_id: number): Promise<void> {
    return api<void>(`${PathDeleteSatellite}/${sat_id}`, { method: "DELETE" });
}
