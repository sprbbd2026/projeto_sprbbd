import RegisterForm from "../features/Auth/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md rounded-2xl">

                <h1 className="text-4xl font-bold tracking-wide">
                    PORTAL SPRB-BD
                </h1>

                <h2>CADASTRO DE USUÁRIOS</h2>

                <RegisterForm />
            </div>
        </main>

    );
}