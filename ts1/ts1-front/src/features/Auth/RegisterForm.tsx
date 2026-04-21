import { useState } from "react";
import { api } from "../../services/api";

export default function RegisterForm() {
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [accessLevel, setAccessLevel] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await api("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    document,
                    email,
                    password,
                    accessLevel,
                }),
            });

            console.log("Registro OK:", data);
        } catch (err) {
            console.error("Erro no registro", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">

                {/* NOME */}
                <div>
                    <label className="block text-sm mb-1">Nome</label>
                    <input
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* DOCUMENTO */}
                <div>
                    <label className="block text-sm mb-1">Documento</label>
                    <input
                        type="text"
                        placeholder="CPF ou outro documento"
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* EMAIL */}
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* SENHA */}
                <div>
                    <label className="block text-sm mb-1">Senha</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* NÍVEL DE ACESSO */}
                <div>
                    <label className="block text-sm mb-1">Nível de acesso</label>
                    <select
                        value={accessLevel}
                        onChange={(e) => setAccessLevel(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Cadastrar"}
                </button>
            </form>
        </div>
    );
}