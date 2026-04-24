import { useState } from "react";
import { registerUser, type AccessLevel } from "../../services/userPersistence";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function RegisterForm() {
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accessLevel, setAccessLevel] = useState<AccessLevel | "">("");
    const [status, setStatus] = useState<SubmitStatus>("idle");
    const [feedback, setFeedback] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!accessLevel) {
            setStatus("error");
            setFeedback("Selecione um nível de acesso.");
            return;
        }

        setStatus("loading");
        setFeedback("");

        try {
            const created = await registerUser({
                name,
                document,
                email,
                password,
                accessLevel,
            });

            setStatus("success");
            setFeedback(
                `Usuário ${created.usr_nome} cadastrado com sucesso ` +
                `(usr_id=${created.usr_id}, perfil=${created.perfil?.prf_nome ?? "-"}).`
            );

            setName("");
            setDocument("");
            setEmail("");
            setPassword("");
            setAccessLevel("");
        } catch (err) {
            setStatus("error");
            setFeedback(
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao cadastrar usuário."
            );
        }
    }

    const isLoading = status === "loading";

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
                        onChange={(e) => setAccessLevel(e.target.value as AccessLevel | "")}
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
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--text-h)] transition disabled:opacity-50">
                    {isLoading ? "Enviando..." : "Cadastrar"}
                </button>

                {status === "success" && (
                    <p className="text-sm text-green-600" role="status">
                        {feedback}
                    </p>
                )}
                {status === "error" && (
                    <p className="text-sm text-red-600" role="alert">
                        {feedback}
                    </p>
                )}
            </form>
        </div>
    );
}
