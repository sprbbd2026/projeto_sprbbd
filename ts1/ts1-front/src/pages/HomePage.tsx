import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md px-8 py-10 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">

                <h1 className="text-4xl font-bold tracking-wide">
                    PORTAL SPRB-BD
                </h1>
                <p className="text-gray-400 mt-3 text-sm">
                    Controle Satelital
                </p>


                {/* BOTÕES */}
                <div className="mt-8 flex flex-col gap-4">

                    <Link
                        to="/login"
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-semibold shadow-md">
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
    );
}