import { useCallback, useEffect, useState } from "react";
import { getDashboardSummary } from "../services/dashboard";

const POLL_INTERVAL_MS = 30_000;

const METRICS = [
  { label: "Satélites Ativos", key: "active_satellites" as const },
  { label: "Alertas", key: "alerts" as const },
  { label: "Usuários", key: "users" as const },
];

function formatLastUpdated(date: Date): string {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function MainPage() {
  const [values, setValues] = useState<Record<string, number | null>>({
    active_satellites: null,
    alerts: null,
    users: null,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSummary = useCallback(async (isInitial: boolean) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await getDashboardSummary();
      setValues({
        active_satellites: data.active_satellites,
        alerts: data.alerts,
        users: data.users,
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar resumo do dashboard:", err);
      setError(
        "Não foi possível atualizar o dashboard. Verifique se o backend está disponível."
      );
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary(true);
    const interval = setInterval(() => void loadSummary(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadSummary]);

  const showPlaceholder = (key: keyof typeof values) =>
    initialLoading && values[key] === null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>
          Bem-vindo ao PORTAL SPRB-BD
        </h1>

        <p className="text-lg" style={{ color: "var(--text-h)" }}>
          Controle Satelital
        </p>

        <section
          className="rounded-2xl p-8 flex flex-col gap-4 text-left"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
              🛰️ Painel de controle
            </h2>
            <p className="text-xs" style={{ color: "var(--text-h)" }}>
              {lastUpdated
                ? `Última atualização: ${formatLastUpdated(lastUpdated)}`
                : refreshing || initialLoading
                  ? "Carregando indicadores…"
                  : "Aguardando primeira atualização"}
              {refreshing && !initialLoading ? " · atualizando…" : ""}
            </p>
          </div>

          {error && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: "var(--text)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            {METRICS.map(({ label, key }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--bg)" }}
              >
                <p
                  className="font-bold tabular-nums"
                  style={{
                    color: "var(--stat-value)",
                    fontSize: "2.75rem",
                    lineHeight: 1.1,
                  }}
                >
                  {showPlaceholder(key) ? "…" : (values[key] ?? "—")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-h)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
