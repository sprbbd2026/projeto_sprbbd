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

export interface Usuario {
    usr_id: number;
    prf_id: number;
    usr_nome: string;
    usr_email: string;
    usr_login: string;
    usr_senha_hash: string;
    usr_status: string;
    perfil?: Perfil | null;
}

// Mapeia o valor do <select> do formulário para o prf_nome usado em public.perfil.
// Ajustar aqui se os perfis do banco usarem outros rótulos (ex.: OPERADOR, ADMIN).
const PERFIL_NOME_POR_ACCESS_LEVEL: Record<AccessLevel, string> = {
    admin: "Admin",
    user: "Usuário",
    manager: "Gerente",
};

async function hashPassword(plain: string): Promise<string> {
    const bytes = new TextEncoder().encode(plain);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function resolvePerfilId(accessLevel: AccessLevel): Promise<number> {
    const prfNome = PERFIL_NOME_POR_ACCESS_LEVEL[accessLevel];

    const { data, error } = await supabase
        .from("perfil")
        .select("prf_id")
        .eq("prf_nome", prfNome)
        .maybeSingle();

    if (error) {
        throw new Error(`Falha ao consultar perfil: ${error.message}`);
    }

    if (!data) {
        throw new Error(
            `Perfil "${prfNome}" não encontrado em public.perfil. ` +
            "Confirme os valores de prf_nome no banco ou ajuste o mapeamento em userPersistence.ts."
        );
    }

    return data.prf_id;
}

export async function registerUser(input: RegisterUserInput): Promise<Usuario> {
    const prf_id = await resolvePerfilId(input.accessLevel);
    const usr_senha_hash = await hashPassword(input.password);

    const { data, error } = await supabase
        .from("usuario")
        .insert({
            prf_id,
            usr_nome: input.name,
            usr_email: input.email,
            usr_login: input.document,
            usr_senha_hash,
            usr_status: "ATIVO",
        })
        .select("*")
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new Error(
                "Já existe um usuário com esse e-mail ou documento."
            );
        }
        throw new Error(`Falha ao cadastrar usuário: ${error.message}`);
    }

    return data as Usuario;
}

export async function getUsuarioByEmail(
    email: string
): Promise<Usuario | null> {
    const { data, error } = await supabase
        .from("usuario")
        .select("*, perfil(*)")
        .eq("usr_email", email)
        .maybeSingle();

    if (error) {
        throw new Error(`Falha ao consultar usuário: ${error.message}`);
    }

    return (data as Usuario | null) ?? null;
}
