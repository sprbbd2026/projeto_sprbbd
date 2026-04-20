import RegisterForm from "../features/Auth/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
            <div className="text-center max-w-md px-6 py-10 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">

                <h1 className="text-4xl font-bold tracking-wide">
                    PORTAL SPRB-BD
                </h1>

                <h2>CADASTRO DE USUÁRIOS</h2>

                <RegisterForm />
            </div>
        </main>
    );
}