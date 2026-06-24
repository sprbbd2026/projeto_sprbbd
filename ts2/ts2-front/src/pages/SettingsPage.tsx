import { useEffect, useState } from 'react'
import { Palette, RotateCcw, Satellite, Settings2 } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Button } from '../components/ui/Button'
import { loadSatelliteCatalog, type SatellitePoint } from '../services/satelliteService'
import {
  DEFAULT_MAP_PREFERENCES,
  useMapPreferencesStore,
  type SatelliteColorMode,
} from '../store/mapPreferencesStore'
import { colorForSatellite } from '../utils/satelliteConstants'

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
      {label}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-800"
        />
      </div>
    </label>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-blue-700"
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-800"
      />
    </label>
  )
}

export function SettingsPage() {
  const prefs = useMapPreferencesStore()
  const [satellites, setSatellites] = useState<SatellitePoint[]>([])
  const [loadingSats, setLoadingSats] = useState(true)

  useEffect(() => {
    void loadSatelliteCatalog()
      .then(setSatellites)
      .finally(() => setLoadingSats(false))
  }, [])

  function setColorMode(mode: SatelliteColorMode) {
    prefs.setSatelliteColorMode(mode)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings2 size={24} className="text-blue-600" />
              Configurações
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Personalização visual do mapa e das trilhas — salvo em localStorage
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => prefs.resetToDefaults()}>
            <RotateCcw size={16} />
            Restaurar padrão SPRB
          </Button>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Mapa (Histórico / Rota)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorField label="Cor do oceano" value={prefs.oceanColor} onChange={(v) => prefs.setPreference('oceanColor', v)} />
            <ColorField label="Cor da terra" value={prefs.landColor} onChange={(v) => prefs.setPreference('landColor', v)} />
            <ColorField
              label="Cor da borda dos países"
              value={prefs.landBorderColor}
              onChange={(v) => prefs.setPreference('landBorderColor', v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label="Zoom inicial — Histórico"
              value={prefs.historicoMapZoom}
              min={1}
              max={12}
              onChange={(v) => prefs.setPreference('historicoMapZoom', v)}
            />
            <NumberField
              label="Zoom inicial — Rota"
              value={prefs.routeMapZoom}
              min={1}
              max={12}
              onChange={(v) => prefs.setPreference('routeMapZoom', v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ToggleField
              label="Ajustar zoom aos dados (Histórico)"
              description="Quando ativo, enquadra os pontos automaticamente."
              checked={prefs.historicoMapAutoFit}
              onChange={(v) => prefs.setPreference('historicoMapAutoFit', v)}
            />
            <ToggleField
              label="Ajustar zoom aos dados (Rota)"
              description="Quando ativo, enquadra a rota automaticamente."
              checked={prefs.routeMapAutoFit}
              onChange={(v) => prefs.setPreference('routeMapAutoFit', v)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Satellite size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Cores por satélite</h2>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={prefs.satelliteColorMode === 'auto' ? 'primary' : 'secondary'}
                onClick={() => setColorMode('auto')}
              >
                Paleta automática
              </Button>
              <Button
                type="button"
                variant={prefs.satelliteColorMode === 'custom' ? 'primary' : 'secondary'}
                onClick={() => setColorMode('custom')}
              >
                Cores personalizadas
              </Button>
            </div>
          </div>

          {loadingSats ? (
            <p className="text-sm text-gray-500">Carregando catálogo de satélites…</p>
          ) : satellites.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum satélite disponível no catálogo.</p>
          ) : (
            <ul className="space-y-3">
              {satellites.map((sat, idx) => {
                const id = String(sat.sat_id)
                const previewColor = colorForSatellite(id, idx)
                const customColor = prefs.satelliteCustomColors[id] ?? previewColor
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-4 w-4 rounded-full shrink-0 border border-white shadow"
                        style={{ background: previewColor }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">SAT-{sat.sat_id}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {sat.con_nome ?? 'Sem constelação'} · {sat.sat_status ?? '—'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="color"
                      value={customColor}
                      disabled={prefs.satelliteColorMode === 'auto'}
                      onChange={(e) => prefs.setSatelliteColor(id, e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 disabled:opacity-50"
                      aria-label={`Cor da trilha do satélite ${sat.sat_id}`}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Outras opções</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberField
              label="Intervalo do dashboard (segundos)"
              value={Math.round(prefs.dashboardPollIntervalMs / 1000)}
              min={5}
              max={300}
              onChange={(v) => prefs.setPreference('dashboardPollIntervalMs', v * 1000)}
            />
            <NumberField
              label="Espessura da trilha percorrida"
              value={prefs.routeTrailWeight}
              min={1}
              max={8}
              onChange={(v) => prefs.setPreference('routeTrailWeight', v)}
            />
            <NumberField
              label="Espessura da rota futura (tracejada)"
              value={prefs.routeDashWeight}
              min={1}
              max={8}
              onChange={(v) => prefs.setPreference('routeDashWeight', v)}
            />
          </div>

          <p className="text-xs text-gray-500">
            Padrões SPRB: oceano {DEFAULT_MAP_PREFERENCES.oceanColor}, terra{' '}
            {DEFAULT_MAP_PREFERENCES.landColor}, zoom {DEFAULT_MAP_PREFERENCES.historicoMapZoom}.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}
