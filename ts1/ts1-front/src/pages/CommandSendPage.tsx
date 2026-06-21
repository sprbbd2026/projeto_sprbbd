import { Link } from "react-router-dom";
import CommandForm from "../features/Command/CommandForm";

export default function CommandSendPage() {
    return (
        <main className="flex items-center justify-center px-4">
            <div className="w-full max-w-3xl space-y-6 mt-4 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-5xl font-bold text-center sm:text-left">Enviar Comando Remoto</h1>
                    <Link
                        to="/commands"
                        className="text-sm text-center sm:text-right text-[var(--accent)] hover:underline"
                    >
                        Ver histórico
                    </Link>
                </div>
                <p className="text-center sm:text-left text-gray-400">
                    Selecione o dispositivo, escolha o comando e confirme o envio operacional.
                </p>
                <CommandForm />
            </div>
        </main>
    );
}
