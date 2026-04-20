import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
            <div className="text-center max-w-md px-6 py-10 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">

                <h1 className="text-4xl font-bold tracking-wide">
                    PORTAL SPRB-BD
                </h1>

                <p className="text-gray-400 mt-3 text-sm">
                    Controle Satelital e Monitoramento de Dados
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <Link
                        to="/login"
                        className="w-full bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg font-medium"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="w-full bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-lg font-medium"
                    >
                        Registrar
                    </Link>
                </div>

                <p className="text-xs text-gray-500 mt-6">
                    Acesso restrito a usuários autorizados
                </p>
            </div>
        </main>
    );
}
