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

/** Retorno do cadastro: sem `usr_senha_hash`. */
export interface Usuario {
    usr_id: number;
    prf_id: number;
    usr_nome: string;
    usr_email: string;
    usr_login: string;
    usr_status: string;
    perfil?: Perfil | null;
}

function apiBaseUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!base?.trim()) {
        throw new Error(
            "Defina VITE_API_BASE_URL no .env.local (URL do BFF ts1-back, ex.: http://127.0.0.1:8000)."
        );
    }
    return base.replace(/\/$/, "");
}

function mapHttpError(status: number, detail: string): string {
    if (status === 409) {
        return detail || "Já existe um usuário com esse e-mail ou documento.";
    }
    if (status === 422) {
        return detail || "Dados inválidos.";
    }
    if (status === 429) {
        return "Muitas tentativas. Aguarde um instante e tente novamente.";
    }
    return detail || "Falha ao cadastrar usuário.";
}

function parseRegisterPayload(data: unknown): Usuario {
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
 * Cadastro via BFF (`ts1/ts1-back`): POST /api/v1/register.
 * A service role fica só no servidor; o browser não chama mais a RPC no Supabase.
 */
export async function registerUser(input: RegisterUserInput): Promise<Usuario> {
    const url = `${apiBaseUrl()}/api/v1/register`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: input.name,
            email: input.email,
            password: input.password,
            document: input.document,
            accessLevel: input.accessLevel,
        }),
    });

    const text = await res.text();
    let body: unknown;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        throw new Error(text || `Erro HTTP ${res.status}`);
    }

    if (!res.ok) {
        const detail =
            body &&
            typeof body === "object" &&
            "detail" in body &&
            typeof (body as { detail: unknown }).detail === "string"
                ? (body as { detail: string }).detail
                : typeof body === "object" &&
                    body &&
                    "message" in body &&
                    typeof (body as { message: unknown }).message === "string"
                  ? (body as { message: string }).message
                  : res.statusText;
        throw new Error(mapHttpError(res.status, detail));
    }

    return parseRegisterPayload(body);
}
