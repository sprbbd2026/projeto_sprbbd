import ConstellationForm from "../features/Constellation/ConstellationForm";

export default function ConstellationRegisterPage() {
    return (
        <main className="flex items-center justify-center px-4">
            <div className="w-full max-w-2xl space-y-6 mt-4 mb-8">

                <h1 className="text-5xl font-bold text-center">
                    Cadastrar Nova Constelação
                </h1>

                <ConstellationForm />

            </div>
        </main>
    );
}
