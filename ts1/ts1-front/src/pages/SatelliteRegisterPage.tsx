import SatelliteForm from "../features/Satellite/SatelliteForm";

export default function SatelliteRegisterPage() {
    return (
        <main className="flex items-center justify-center px-4">
            <div className="w-full max-w-2xl space-y-6 mt-4 mb-8">

                <h1 className="text-5xl font-bold text-center">
                    Cadastrar Novo Satélite
                </h1>

                <SatelliteForm />

            </div>
        </main>
    );
}