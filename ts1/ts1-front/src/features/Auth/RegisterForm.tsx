import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function RegisterForm() {
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accessLevel, setAccessLevel] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: {
                    name,
                    document,
                    email,
                    password,
                    accessLevel,
                },
            });

            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message || "Erro ao cadastrar usuário.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-5 text-left">
                {/* NOME */}
                <div>
                    <label className="block text-sm mb-1">Nome</label>
                    <input
                        type="text" value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    />
                </div>

                {/* DOCUMENTO */}
                <div>
                    <label className="block text-sm mb-1">Documento</label>
                    <input
                        type="text"
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    />
                </div>

                {/* EMAIL */}
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    />
                </div>

                {/* SENHA */}
                <div>
                    <label className="block text-sm mb-1">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        required
                    />
                </div>

                {/* NÍVEL DE ACESSO */}
                <div>
                    <label className="block text-sm mb-1">Nível de acesso</label>
                    <select value={accessLevel}
                        onChange={(e) => setAccessLevel(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        required>
                        <option value="">Selecione</option>
                        <option value="admin">Admin</option>
                        <option value="user">Usuário</option>
                        <option value="manager">Gerente</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50">
                    {loading ? "Enviando..." : "Cadastrar"}
                </button>
            </form>

            {/* MODAL DE ERRO */}
            {error && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-[var(--surface)] rounded-xl shadow-lg p-6 w-full max-w-sm text-center space-y-4">
                        <p className="text-lg font-medium text-red-500">❌</p>
                        <p className="text-[var(--text)]">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition">
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}