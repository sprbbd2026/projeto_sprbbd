export default function Satellite() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-2xl text-center space-y-6">

                <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
                    Cadastro de Satélite
                </h1>

                <p className="text-lg" style={{ color: "var(--text-h)" }}>
                    Controle Satelital
                </p>

                <section
                    className="rounded-2xl p-8 flex flex-col gap-4 text-left"
                    style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>

                    <p className="text-sm" style={{ color: "var(--text-h)" }}>
                        Área em construção. Em breve você terá acesso ao painel completo de monitoramento.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                        {["Satélites Ativos", "Alertas", "Usuários"].map((label) => (
                            <div
                                key={label}
                                className="rounded-xl p-4 text-center"
                                style={{ background: "var(--bg)" }}>
                                <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>—</p>
                                <p className="text-xs mt-1" style={{ color: "var(--text-h)" }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <p className="text-xs" style={{ color: "var(--text-h)" }}>
                    Acesso restrito a usuários autorizados
                </p>
            </div>
        </main >
    );
}
