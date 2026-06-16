import { api } from "./api";
import type { Satellite } from "./satellite";

const PathConstellations = "/constellations";
const PathCreateConstellation = "/constellations/register";
const PathUpdateConstellation = "/constellations/update";
const PathDeleteConstellation = "/constellations/delete";

export const MIN_SATELITES_CONSTELACAO = 4;

export interface Constellation {
    con_id: number;
    con_nome: string | null;
    sat_quantidade: number;
}

export interface ConstellationDetail extends Constellation {
    satelites: Satellite[];
}

export interface CreateConstellationPayload {
    con_nome: string;
    sat_ids: number[];
}

/* LISTAR */
export async function getConstellations(): Promise<Constellation[]> {
    return api<Constellation[]>(PathConstellations + "/", {
        method: "GET",
    });
}

/* DETALHE (com satélites membros) */
export async function getConstellationById(
    id: number
): Promise<ConstellationDetail> {
    return api<ConstellationDetail>(`${PathConstellations}/${id}`, {
        method: "GET",
    });
}

/* CRIAR */
export async function createConstellation(
    payload: CreateConstellationPayload
): Promise<ConstellationDetail> {
    return api<ConstellationDetail>(PathCreateConstellation, {
        method: "POST",
        body: payload,
    });
}

/* ATUALIZAR */
export async function updateConstellation(
    con_id: number,
    payload: CreateConstellationPayload
): Promise<ConstellationDetail> {
    return api<ConstellationDetail>(`${PathUpdateConstellation}/${con_id}`, {
        method: "PUT",
        body: payload,
    });
}

/* DELETAR */
export async function deleteConstellation(con_id: number): Promise<void> {
    return api<void>(`${PathDeleteConstellation}/${con_id}`, {
        method: "DELETE",
    });
}

/* SATÉLITES DISPONÍVEIS (não vinculados a nenhuma constelação) */
export async function getUnassignedSatellites(): Promise<Satellite[]> {
    return api<Satellite[]>("/satellites/?unassigned=true", {
        method: "GET",
    });
}
