// services/auth.ts
// Serviço de autenticação da US103 (Tela de Login)
// ------------------------------------------------------------
// Enquanto o back-end (US117/US118) não estiver pronto, este
// arquivo expõe uma função `login()` com comportamento mockado.
// Quando o endpoint real existir, basta alterar USE_MOCK = false
// e ajustar o path em PathLogin se necessário.
// ------------------------------------------------------------

import { api } from "./api";

const USE_MOCK = true;

// Endpoint do back-end (ajustar quando a US117 for publicada)
const PathLogin = "/auth/login";

// Credenciais aceitas pelo mock. Servem apenas para permitir
// a validação da tela enquanto não há integração real.
const MOCK_VALID_EMAIL = "usuario@teste.com";
const MOCK_VALID_PASSWORD = "senha123";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        email: string;
        nome: string;
    };
}

/**
 * Realiza o login. Lança Error em caso de falha (credencial
 * inválida, erro de servidor etc.) com uma mensagem amigável.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
    if (USE_MOCK) {
        return mockLogin(payload);
    }

    // Chamada real quando o back-end estiver disponível
    return api(PathLogin, {
        method: "POST",
        body: payload,
    });
}

// Simulação local do endpoint de login. Inclui atraso de rede
// artificial para manter o comportamento parecido com o real.
async function mockLogin({ email, password }: LoginPayload): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const emailOk = email.trim().toLowerCase() === MOCK_VALID_EMAIL;
    const passwordOk = password === MOCK_VALID_PASSWORD;

    if (!emailOk || !passwordOk) {
        throw new Error("E-mail ou senha inválidos.");
    }

    return {
        token: "mock-jwt-token-abc123",
        user: {
            email: MOCK_VALID_EMAIL,
            nome: "Usuário de Teste",
        },
    };
}
