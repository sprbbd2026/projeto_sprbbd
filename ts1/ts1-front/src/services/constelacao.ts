import { api } from "./api";

export interface Constelacao {
    con_id: number;
    con_nome: string | null;
}

export async function getConstelacoes(): Promise<Constelacao[]> {
    return api<Constelacao[]>("/constelacoes/", { method: "GET" });
}
