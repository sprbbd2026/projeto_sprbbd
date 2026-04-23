import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div>

            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">

                    <h1 className="text-5xl">
                        PORTAL SPRB-BD
                    </h1>

                    <p className="text-gray-400 mt-3 text-2xl">
                        Controle Satelital
                    </p>

                    <div className="mt-8 flex flex-col gap-4">
                        <Link
                            to="/login"
                            className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--text-h)] active:scale-[0.98] transition-all font-semibold shadow-md"
                        >
                            Login
                        </Link>

                        <Link
                            to="/register"
                            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all font-semibold border border-white/10"
                        >
                            Criar conta
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 mt-6">
                        Acesso restrito a usuários autorizados
                    </p>

                </div>
            </main>
        </div>
    );
}