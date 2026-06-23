/**
 * MapPage — US303: Visualizar histórico de localização em mapa
 */

import { useEffect, useState, useCallback } from 'react'
import { Map, Filter, RefreshCw } from 'lucide-react'
import { fetchHistoricoForSatellite } from '../utils/historicoFetch'
import { loadSatelliteCatalog } from '../services/satelliteService'
import type { Localizacao } from '../types/localizacao'
import SatelliteMap from '../components/ui/SatelliteMap'
import styles from './MapPage.module.css'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  ALL_SATELLITES_LABEL,
  ALL_SATELLITES_VALUE,
  colorForSatellite,
  defaultHistoricoEnd,
  defaultHistoricoStart,
  isAllSatellites,
} from '../utils/satelliteConstants'
import type { SatellitePoint } from '../services/satelliteService'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'
type VisualizationMode = 'fixed' | 'coverage'

export default function MapPage() {
  const [satelites, setSatelites] = useState<SatellitePoint[]>([])
  const [sateliteId, setSateliteId] = useState(ALL_SATELLITES_VALUE)
  const [dataInicio, setDataInicio] = useState(defaultHistoricoStart)
  const [dataFim, setDataFim] = useState(defaultHistoricoEnd)
  const [visualizacao, setVisualizacao] = useState<VisualizationMode>('fixed')
  const [pontos, setPontos] = useState<Localizacao[]>([])
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [usandoDemo, setUsandoDemo] = useState(false)

  useEffect(() => {
    setDataInicio(defaultHistoricoStart())
    setDataFim(defaultHistoricoEnd())
  }, [])

  useEffect(() => {
    void loadSatelliteCatalog().then((lista) => {
      setSatelites(lista)
    })
  }, [])

  const fetchHistorico = useCallback(async () => {
    if (!sateliteId.trim()) return
    setStatus('loading')
    setErrorMsg('')
    setUsandoDemo(false)

    const limit = 1000
    const ids = isAllSatellites(sateliteId)
      ? satelites.map((s) => String(s.sat_id))
      : [sateliteId.trim()]

    if (ids.length === 0) {
      setPontos([])
      setStatus('success')
      return
    }

    const batches = await Promise.all(
      ids.map((id) => fetchHistoricoForSatellite(id, dataInicio, dataFim, limit)),
    )

    const resultado = batches
      .flatMap((b) => b.pontos)
      .sort((a, b) => a.data_hora.localeCompare(b.data_hora))

    setPontos(resultado)
    setUsandoDemo(batches.some((b) => b.demo))
    setStatus('success')
  }, [sateliteId, dataInicio, dataFim, satelites])

  useEffect(() => {
    if (satelites.length > 0 && sateliteId.trim()) void fetchHistorico()
  }, [sateliteId, satelites, fetchHistorico])

  const isLoading = status === 'loading'
  const multi = isAllSatellites(sateliteId)
  const uniqueSats = new Set(pontos.map((p) => p.satelite_id)).size

  function nomeSatelite(id: string): string {
    const sat = satelites.find((s) => String(s.sat_id) === id)
    if (!sat) return `SAT-${id}`
    const prn = sat.sat_codigo_prn != null ? `PRN ${sat.sat_codigo_prn}` : `SAT-${sat.sat_id}`
    return sat.con_nome ? `${prn} · ${sat.con_nome}` : prn
  }

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>
                <Map size={28} strokeWidth={1.8} />
                Histórico de Localização
              </h1>
              <p className={styles.subtitle}>
                Alterne entre pontos fixos e cobertura orbital. Período padrão: últimos 10 dias até hoje.
              </p>
            </div>
          </header>

          <section className={styles.filtersCard} aria-label="Filtros de consulta">
            <h2 className={styles.filtersTitle}>
              <Filter size={16} />
              Filtros de Consulta
            </h2>
            <div className={styles.filtersGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor="satelite-select">Satélite</label>
                <select
                  id="satelite-select"
                  className={styles.select}
                  value={sateliteId}
                  onChange={(e) => setSateliteId(e.target.value)}
                  disabled={satelites.length === 0}
                >
                  <option value={ALL_SATELLITES_VALUE}>{ALL_SATELLITES_LABEL}</option>
                  {satelites.map((satellite) => (
                    <option key={satellite.sat_id} value={String(satellite.sat_id)}>
                      {satellite.sat_codigo_prn != null
                        ? `PRN ${satellite.sat_codigo_prn}`
                        : `SAT-${satellite.sat_id}`}
                      {satellite.con_nome ? ` · ${satellite.con_nome}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="data-inicio">Data Início</label>
                <input
                  id="data-inicio"
                  type="datetime-local"
                  className={styles.dateInput}
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="data-fim">Data Fim</label>
                <input
                  id="data-fim"
                  type="datetime-local"
                  className={styles.dateInput}
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              <button
                id="btn-consultar-historico"
                className={styles.searchBtn}
                onClick={() => void fetchHistorico()}
                disabled={isLoading || !sateliteId.trim()}
              >
                <RefreshCw size={15} className={isLoading ? styles.spinner : ''} />
                {isLoading ? 'Consultando…' : 'Consultar'}
              </button>
            </div>
          </section>

          <section className={styles.mapCard} aria-label="Mapa de localização">
            <div className={styles.mapHeader}>
              <h2 className={styles.mapTitle}>
                {visualizacao === 'coverage' ? 'Mapa de Cobertura' : 'Mapa de Pontos Fixos'}
              </h2>
              {status === 'success' && pontos.length > 0 && (
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  <Map size={13} />
                  {pontos.length} ponto{pontos.length !== 1 ? 's' : ''}
                  {multi ? ` · ${uniqueSats} satélites` : ` · ${sateliteId}`}
                  {usandoDemo ? ' · demo' : ''}
                </span>
              )}
            </div>

            {usandoDemo && status === 'success' && (
              <div className={styles.demoBanner} role="status">
                Dados de demonstração — órbitas LEO regionais (intervalo de 60 dias).
              </div>
            )}

            {status === 'error' && (
              <div className={`${styles.stateBox} ${styles.stateBoxError}`} role="alert">
                <span className={styles.stateIcon}>⚠️</span>
                <p className={styles.stateTitle}>Erro ao consultar a API</p>
                <p className={styles.stateText}>{errorMsg}</p>
              </div>
            )}

            {status === 'loading' && (
              <div className={`${styles.stateBox} ${styles.stateBoxLoading}`} role="status" aria-live="polite">
                <div className={styles.spinner} aria-hidden="true" />
                <p className={styles.stateTitle}>Carregando histórico…</p>
              </div>
            )}

            {status === 'success' && pontos.length === 0 && (
              <div className={styles.stateBox} role="status">
                <p className={styles.stateTitle}>Nenhum ponto no período</p>
                <p className={styles.stateText}>
                  O banco não possui histórico para os filtros selecionados.
                </p>
              </div>
            )}

            <div className={status === 'loading' ? styles.mapLoadingWrap : undefined}>
              <SatelliteMap
                pontos={status === 'success' ? pontos : []}
                sateliteId={multi ? ALL_SATELLITES_VALUE : sateliteId || '—'}
                visualizationMode={visualizacao}
                onToggleVisualization={() =>
                  setVisualizacao((current) => (current === 'fixed' ? 'coverage' : 'fixed'))
                }
              />
            </div>

            {status === 'success' && pontos.length > 0 && multi && (
              <div className={styles.legend} aria-label="Legenda por satélite">
                {Array.from(new Set(pontos.map((p) => p.satelite_id))).map((id, idx) => (
                  <div key={id} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: colorForSatellite(id, idx) }} />
                    SAT-{id}
                  </div>
                ))}
              </div>
            )}

            {status === 'success' && pontos.length > 0 && !multi && (
              <div className={styles.legend} aria-label="Legenda do mapa">
                {visualizacao === 'coverage' ? (
                  <>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#1d4ed8' }} />
                      Área de cobertura
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#0f172a' }} />
                      Satélite
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#22c55e' }} />
                      Ponto inicial
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                      Ponto final
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                      Trilha
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {status === 'success' && pontos.length > 0 && (
            <section className={styles.tableCard} aria-label="Tabela de pontos">
              <div className={styles.tableCardHeader}>
                <h2 className={styles.tableTitle}>Pontos de Localização</h2>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  {pontos.length} registro{pontos.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Satélite</th>
                      <th>Data / Hora</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Altitude (km)</th>
                      <th>Velocidade (km/h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontos.map((p, i) => (
                      <tr key={`${p.satelite_id}-${p.id}-${i}`}>
                        <td>{i + 1}</td>
                        <td>{nomeSatelite(p.satelite_id)}</td>
                        <td>{new Date(p.data_hora).toLocaleString('pt-BR')}</td>
                        <td>{p.latitude.toFixed(6)}</td>
                        <td>{p.longitude.toFixed(6)}</td>
                        <td>{p.altitude_km != null ? p.altitude_km.toFixed(1) : '—'}</td>
                        <td>{p.velocidade_kmh != null ? p.velocidade_kmh.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}
