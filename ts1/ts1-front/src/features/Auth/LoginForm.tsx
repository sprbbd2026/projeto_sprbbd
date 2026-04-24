// features/Auth/LoginForm.tsx
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth";

interface FieldErrors {
    email?: string;
    password?: string;
}

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
        setError(null);

        if (!validate()) return;

        setLoading(true);
        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-5">
            <Field
                id="email"
                label="E-mail"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={loading}
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
                disabled={loading}
            />

            <button
                type="submit"
                disabled={loading}
                className="mt-2 py-3 rounded-lg font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
                {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* MODAL DE ERRO */}
            {error && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-red-500">❌</p>
                        <p className="text-[var(--text)]">{error}</p>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition">
                            OK
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}

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
