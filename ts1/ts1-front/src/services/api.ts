// services/api.ts

const BASE_URL = "http://localhost:3000"; // trocar depois pelo backend real

type ApiOptions = RequestInit & {
    body?: any;
};

export async function api(path: string, options: ApiOptions = {}) {
    const { body, headers, ...rest } = options;

    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...rest,
    });

    if (!response.ok) {
        let errorMessage = "Erro na requisição";

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch { }

        throw new Error(errorMessage);
    }

    // evita erro em resposta vazia (204, etc)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}