// features/Auth/LoginForm.tsx
// Formulário de login da US103.
// Campos validados no front-end, submissão chama services/auth.login().

import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { login } from "../../services/auth";

interface FieldErrors {
    email?: string;
    password?: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [status, setStatus] = useState<SubmitStatus>("idle");
    const [feedback, setFeedback] = useState("");

    function validate(): boolean {
        const next: FieldErrors = {};

        if (!email.trim()) {
            next.email = "O e-mail é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            next.email = "Informe um e-mail válido.";
        }

        if (!password) {
            next.password = "A senha é obrigatória.";
        } else if (password.length < 6) {
            next.password = "A senha deve ter pelo menos 6 caracteres.";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("idle");
        setFeedback("");

        if (!validate()) return;

        setStatus("loading");
        try {
            const response = await login({ email, password });
            setStatus("success");
            setFeedback(`Login realizado com sucesso! Bem-vindo(a), ${response.user.nome}.`);
        } catch (err) {
            setStatus("error");
            setFeedback(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
        }
    }

    const isLoading = status === "loading";

    return (
        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-5">
            {status === "success" && (
                <div
                    role="status"
                    className="px-4 py-3 rounded-lg text-sm font-medium border"
                    style={{
                        background: "rgba(125, 170, 203, 0.12)",
                        borderColor: "var(--accent)",
                        color: "var(--text)",
                    }}
                >
                    {feedback}
                </div>
            )}

            {status === "error" && (
                <div
                    role="alert"
                    className="px-4 py-3 rounded-lg text-sm font-medium border"
                    style={{
                        background: "rgba(220, 38, 38, 0.10)",
                        borderColor: "#dc2626",
                        color: "#f87171",
                    }}
                >
                    {feedback}
                </div>
            )}

            <Field
                id="email"
                label="E-mail"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
            />

            <Field
                id="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
            />

            <button
                type="submit"
                disabled={isLoading}
                className="mt-2 py-3 rounded-lg font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                    background: "var(--accent)",
                    color: "var(--bg)",
                }}
            >
                {isLoading ? "Entrando..." : "Entrar"}
            </button>
        </form>
    );
}

// ------------------------------------------------------------
// Campo de formulário reutilizável (rótulo + input + erro)
// ------------------------------------------------------------
interface FieldProps {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    autoComplete?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    disabled?: boolean;
}

function Field({ id, label, type, placeholder, autoComplete, value, onChange, error, disabled }: FieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                className="px-4 py-3 rounded-lg text-base outline-none transition"
                style={{
                    background: "var(--surface)",
                    border: error ? "1.5px solid #dc2626" : "1.5px solid var(--border)",
                    color: "var(--text)",
                }}
            />
            {error && (
                <span className="text-sm" style={{ color: "#f87171" }}>
                    {error}
                </span>
            )}
        </div>
    );
}
