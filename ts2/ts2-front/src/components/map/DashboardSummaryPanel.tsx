import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertTriangle, Satellite, Users } from 'lucide-react'
import { getDashboardSummary } from '../../services/dashboardService'
import { useMapPreferencesStore } from '../../store/mapPreferencesStore'

const DEFAULT_POLL_INTERVAL_MS = 30_000

const METRICS = [
  { key: 'active_satellites' as const, label: 'Satélites ativos', icon: Satellite },
  { key: 'alerts' as const, label: 'Alertas', icon: AlertTriangle },
  { key: 'users' as const, label: 'Usuários', icon: Users },
]

function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('pt-BR')
}

export function DashboardSummaryPanel() {
  const pollIntervalMs = useMapPreferencesStore((s) => s.dashboardPollIntervalMs)
  const [values, setValues] = useState<Record<string, number | null>>({
    active_satellites: null,
    alerts: null,
    users: null,
  })
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadSummary = useCallback(async (isInitial: boolean) => {
    if (isInitial) setInitialLoading(true)
    else setRefreshing(true)

    try {
      const data = await getDashboardSummary()
      setValues({
        active_satellites: data.active_satellites,
        alerts: data.alerts,
        users: data.users,
      })
      setLastUpdated(new Date())
      setError(null)
    } catch {
      setError('Não foi possível atualizar o dashboard. Verifique se o TS1 está disponível.')
    } finally {
      if (isInitial) setInitialLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary(true)
    const interval = window.setInterval(() => void loadSummary(false), pollIntervalMs || DEFAULT_POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [loadSummary, pollIntervalMs])

  return (
    <div className="absolute top-32 left-16 z-[1000] w-[min(100%,22rem)] md:top-20 md:left-20">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Activity size={18} className="text-blue-600" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-gray-800">Painel operacional</h3>
            <p className="text-[11px] text-gray-400">
              {lastUpdated
                ? `Atualizado às ${formatLastUpdated(lastUpdated)}`
                : initialLoading
                  ? 'Carregando…'
                  : 'Aguardando…'}
              {refreshing && !initialLoading ? ' · atualizando' : ''}
            </p>
          </div>
        </div>

        {error ? (
          <p className="px-4 py-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2 p-3">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-xl bg-gray-50 px-2 py-2 text-center"
              title={label}
            >
              <Icon size={14} className="mx-auto mb-1 text-gray-500" aria-hidden />
              <p className="text-lg font-bold tabular-nums text-gray-900">
                {initialLoading && values[key] === null ? '…' : (values[key] ?? '—')}
              </p>
              <p className="text-[10px] leading-tight text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
