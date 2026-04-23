import RegisterForm from "../features/Auth/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center rounded-2xl p-6">

                <h1 className="text-5xl">
                    PORTAL SPRB-BD
                </h1>

                <h2 className="mt-2 mb-6 text-2xl">
                    CADASTRO DE USUÁRIOS
                </h2>

                <RegisterForm />
            </div>
        </main>
    );
}