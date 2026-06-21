// services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL as string;

type ApiOptions = Omit<RequestInit, "body"> & {
    body?: any;
};

export async function api<T>(
    path: string,
    options: ApiOptions = {}
): Promise<T> {
    const { body, headers, ...rest } = options;

    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...rest,
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        let errorMessage = "Erro na requisição";

        try {
            const errorData = await response.json();
            errorMessage =
                errorData.detail ||
                errorData.message ||
                errorMessage;
        } catch { }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
}
