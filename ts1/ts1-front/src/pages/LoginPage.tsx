// Página de login da US103.
// Estrutura: cabeçalho (logo ITA + nome do projeto) + formulário + link de cadastro.

import { Link } from "react-router-dom";
import LoginForm from "../features/Auth/LoginForm";
import itaLogo from "../assets/ita-logo.png";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md flex flex-col gap-8">
                {/* Cabeçalho SPRB-BD */}
                <header className="flex items-center gap-4 px-1">
                    <img src={itaLogo} alt="Logo ITA" className="h-14 w-auto" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                            Projeto SPRB-BD
                        </span>
                        <span className="text-xs mt-0.5" style={{ color: "var(--text-h)" }}>
                            Sistema de Posicionamento Regional Brasileiro em Banco de Dados
                        </span>
                    </div>
                </header>

                {/* Card com o formulário */}
                <section
                    className="rounded-2xl p-8 flex flex-col gap-6"
                    style={{
                        background: "var(--surface)",
                        boxShadow: "var(--shadow)",
                    }}>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                            Entrar na sua conta
                        </h1>
                        <p className="text-sm" style={{ color: "var(--text-h)" }}>
                            Informe suas credenciais para acessar o sistema.
                        </p>
                    </div>

                    <LoginForm />
                </section>

                {/* Link alternativo */}
                <p className="text-center text-sm" style={{ color: "var(--text-h)" }}>
                    Ainda não tem conta?{" "}
                    <Link to="/register" className="font-semibold underline" style={{ color: "var(--accent)" }}>
                        Criar conta
                    </Link>
                </p>
            </div>
        </main>
    );
}
