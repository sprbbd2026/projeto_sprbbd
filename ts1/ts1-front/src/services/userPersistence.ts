import { supabase } from "../lib/supabaseClient";

export type AccessLevel = "admin" | "user" | "manager";

export interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
    document: string;
    accessLevel: AccessLevel;
}

export interface Perfil {
    prf_id: number;
    prf_nome: string;
    prf_nivel_acesso: string | null;
    prf_descricao: string | null;
    prf_status: string | null;
}

/** Retorno do cadastro: sem `usr_senha_hash` (a RPC não expõe o hash). */
export interface Usuario {
    usr_id: number;
    prf_id: number;
    usr_nome: string;
    usr_email: string;
    usr_login: string;
    usr_status: string;
    perfil?: Perfil | null;
}

function mapRpcError(message: string): string {
    const m = message.toLowerCase();
    if (
        m.includes("register_usuario") &&
        (m.includes("not found") || m.includes("does not exist"))
    ) {
        return (
            "Função register_usuario não encontrada no banco. Aplique o script " +
            "ts1/docs/sql/rls_rpc_register_usuario.sql no SQL Editor do Supabase."
        );
    }
    if (m.includes("duplicate_email") || m.includes("duplicate_key")) {
        return "Já existe um usuário com esse e-mail ou documento.";
    }
    if (m.includes("duplicate_document")) {
        return "Já existe um usuário com esse documento.";
    }
    if (m.includes("e-mail inválido") || m.includes("email inválido")) {
        return "E-mail inválido.";
    }
    if (m.includes("senha deve ter")) {
        return "A senha deve ter pelo menos 6 caracteres.";
    }
    if (m.includes("nível de acesso inválido")) {
        return "Nível de acesso inválido.";
    }
    if (m.includes("não encontrado")) {
        return message;
    }
    return message || "Falha ao cadastrar usuário.";
}

function parseRpcPayload(data: unknown): Usuario {
    if (!data || typeof data !== "object") {
        throw new Error("Resposta inválida do servidor.");
    }
    const row = data as Record<string, unknown>;
    const perfilRaw = row.perfil as Record<string, unknown> | null | undefined;
    const perfil: Perfil | null = perfilRaw
        ? {
            prf_id: Number(perfilRaw.prf_id),
            prf_nome: String(perfilRaw.prf_nome),
            prf_nivel_acesso:
                perfilRaw.prf_nivel_acesso == null
                    ? null
                    : String(perfilRaw.prf_nivel_acesso),
            prf_descricao:
                perfilRaw.prf_descricao == null
                    ? null
                    : String(perfilRaw.prf_descricao),
            prf_status:
                perfilRaw.prf_status == null
                    ? null
                    : String(perfilRaw.prf_status),
        }
        : null;

    return {
        usr_id: Number(row.usr_id),
        prf_id: Number(row.prf_id),
        usr_nome: String(row.usr_nome),
        usr_email: String(row.usr_email),
        usr_login: String(row.usr_login),
        usr_status: String(row.usr_status),
        perfil,
    };
}

/**
 * Cadastro público via RPC `register_usuario` (SECURITY DEFINER no Postgres).
 * Exige que o script `ts1/docs/sql/rls_rpc_register_usuario.sql` tenha sido aplicado no Supabase.
 */
export async function registerUser(input: RegisterUserInput): Promise<Usuario> {
    const { data, error } = await supabase.rpc("register_usuario", {
        p_nome: input.name,
        p_email: input.email,
        p_documento: input.document,
        p_senha: input.password,
        p_access_level: input.accessLevel,
    });

    if (error) {
        throw new Error(mapRpcError(error.message));
    }

    return parseRpcPayload(data);
}
