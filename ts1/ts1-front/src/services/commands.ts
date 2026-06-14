import { api } from "./api";

const PathCommands = "/commands";

export const COMMAND_TYPES = ["RESET", "CONFIG", "PING", "CUSTOM"] as const;
export type CommandType = (typeof COMMAND_TYPES)[number];

export const DEFAULT_STATION_ID = 1;

export interface CommandCreateRequest {
    est_id: number;
    sat_id: number;
    cmd_tipo: CommandType;
    cmd_payload_binario: string;
    cmd_descricao?: string | null;
}

export interface CommandResponse {
    cmd_id: number;
    est_id: number;
    sat_id: number;
    cmd_tipo: string;
    cmd_status: string;
    cmd_timestamp: string;
    cmd_descricao?: string | null;
}

export interface CommandDetailResponse extends CommandResponse {
    opr_id?: number | null;
    cmd_payload_binario?: string | null;
}

export interface CommandListResponse {
    items: CommandResponse[];
    total: number;
    skip: number;
    limit: number;
}

export interface ListCommandsParams {
    sat_id?: number;
    cmd_tipo?: string;
    skip?: number;
    limit?: number;
}

export function encodePayloadToBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
}

export function decodePayloadFromBase64(base64: string): string {
    try {
        return decodeURIComponent(escape(atob(base64)));
    } catch {
        return base64;
    }
}

export async function sendCommand(payload: CommandCreateRequest): Promise<CommandResponse> {
    return api<CommandResponse>(PathCommands, { method: "POST", body: payload });
}

export async function listCommands(params: ListCommandsParams = {}): Promise<CommandListResponse> {
    const search = new URLSearchParams();
    if (params.sat_id !== undefined) search.set("sat_id", String(params.sat_id));
    if (params.cmd_tipo) search.set("cmd_tipo", params.cmd_tipo);
    if (params.skip !== undefined) search.set("skip", String(params.skip));
    if (params.limit !== undefined) search.set("limit", String(params.limit));

    const query = search.toString();
    return api<CommandListResponse>(`${PathCommands}${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function getCommandById(cmdId: number): Promise<CommandDetailResponse> {
    return api<CommandDetailResponse>(`${PathCommands}/${cmdId}`, { method: "GET" });
}
