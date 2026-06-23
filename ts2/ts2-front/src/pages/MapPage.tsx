/**
 * MapPage — US303: Visualizar histórico de localização em mapa
 *
 * Critérios de aceite:
 *  CA01 — Renderiza pontos/trilha quando há dados
 *  CA02 — Exibe mapa vazio com mensagem informativa
 *  CA03 — Exibe feedback de erro sem dados inconsistentes
 */

import { useEffect, useState, useCallback } from 'react'
import { Map, Filter, RefreshCw } from 'lucide-react'
import { localizacaoService } from '../services/localizacaoService'
import { fetchSatelites, type SatellitePoint } from '../services/satelliteService'
import type { Localizacao } from '../types/localizacao'
import SatelliteMap from '../components/ui/SatelliteMap'
import styles from './MapPage.module.css'
import { DashboardLayout } from '../components/layout/DashboardLayout'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'
type VisualizationMode = 'fixed' | 'coverage'

export default function MapPage() {
  // ── Estado dos satélites disponíveis ─────────────────────────
  const [satelites, setSatelites] = useState<SatellitePoint[]>([])
  const [sateliteId, setSateliteId] = useState('')

  // ── Filtros de data ───────────────────────────────────────────
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [visualizacao, setVisualizacao] = useState<VisualizationMode>('fixed')

  // ── Dados do mapa ─────────────────────────────────────────────
  const [pontos, setPontos] = useState<Localizacao[]>([])
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // ── Carrega lista de satélites ao montar ──────────────────────
  useEffect(() => {
    fetchSatelites()
      .then((satellites) => {
        setSatelites(satellites)
        if (satellites.length > 0) {
          setSateliteId(String(satellites[0].sat_id))
        }
      })
      .catch(() => {
        setSatelites([])
      })
  }, [])

  // ── Busca histórico ───────────────────────────────────────────
  const fetchHistorico = useCallback(async () => {
    if (!sateliteId.trim()) return
    setStatus('loading')
    setErrorMsg('')
    setPontos([])

    try {
      const params: Record<string, unknown> = { satelite_id: sateliteId.trim() }
      if (dataInicio) params.data_inicio = new Date(dataInicio).toISOString()
      if (dataFim) params.data_fim = new Date(dataFim).toISOString()

      const data = await localizacaoService.getHistoricoTs1(
        params as unknown as Parameters<typeof localizacaoService.getHistorico>[0]
      )
      setPontos(data)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setErrorMsg(
        'Falha ao consultar a API de histórico. Verifique se o backend está disponível.'
      )
      setStatus('error')
    }
  }, [sateliteId, dataInicio, dataFim])

  const isLoading = status === 'loading'

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.inner}>
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>SPRB-BD · US303</p>
              <h1 className={styles.title}>
                <Map size={28} strokeWidth={1.8} />
                Histórico de Localização
              </h1>
              <p className={styles.subtitle}>
                Alterne entre a visualização antiga de pontos fixos e a cobertura orbital.
              </p>
            </div>
          </header>

          {/* ── Filtros ───────────────────────────────────────────── */}
          <section className={styles.filtersCard} aria-label="Filtros de consulta">
            <h2 className={styles.filtersTitle}>
              <Filter size={16} />
              Filtros de Consulta
            </h2>
            <div className={styles.filtersGrid}>
              {/* Seleção de satélite */}
              <div className={styles.fieldGroup}>
                <label htmlFor="satelite-select">Satélite</label>
                <select
                  id="satelite-select"
                  className={styles.select}
                  value={sateliteId}
                  onChange={(e) => setSateliteId(e.target.value)}
                  disabled={satelites.length === 0}
                >
                  {satelites.length === 0 ? (
                    <option value="">Nenhum satélite disponível</option>
                  ) : (
                    satelites.map((satellite) => (
                      <option key={satellite.sat_id} value={String(satellite.sat_id)}>
                        {`SAT-${satellite.sat_id}`}
                        {satellite.con_nome ? ` · ${satellite.con_nome}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Data início */}
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

              {/* Data fim */}
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

              {/* Botão consultar */}
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

          {/* ── Painel do mapa ────────────────────────────────────── */}
          <section className={styles.mapCard} aria-label="Mapa de localização">
            <div className={styles.mapHeader}>
              <h2 className={styles.mapTitle}>
                {visualizacao === 'coverage' ? 'Mapa de Cobertura' : 'Mapa de Pontos Fixos'}
              </h2>
              {status === 'success' && pontos.length > 0 && (
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  <Map size={13} />
                  {pontos.length} ponto{pontos.length !== 1 ? 's' : ''} — {sateliteId}
                </span>
              )}
            </div>

            {/* CA03 — Erro de API */}
            {status === 'error' && (
              <div className={`${styles.stateBox} ${styles.stateBoxError}`} role="alert">
                <span className={styles.stateIcon}>⚠️</span>
                <p className={styles.stateTitle}>Erro ao consultar a API</p>
                <p className={styles.stateText}>{errorMsg}</p>
              </div>
            )}

            {/* Loading */}
            {status === 'loading' && (
              <div className={`${styles.stateBox} ${styles.stateBoxLoading}`} role="status" aria-live="polite">
                <div className={styles.spinner} aria-hidden="true" />
                <p className={styles.stateTitle}>Carregando histórico…</p>
              </div>
            )}

            {/* CA02 — Sem dados (consulta realizada mas lista vazia) */}
            {status === 'success' && pontos.length === 0 && (
              <div className={`${styles.stateBox} ${styles.stateBoxEmpty}`} role="status">
                <span className={styles.stateIcon}>🛰️</span>
                <p className={styles.stateTitle}>Nenhum ponto encontrado</p>
                <p className={styles.stateText}>
                  Não há registros de localização para <strong>SAT-{sateliteId}</strong> no
                  período informado.
                </p>
              </div>
            )}

            {/* Idle — instrução inicial */}
            {status === 'idle' && (
              <div className={`${styles.stateBox} ${styles.stateBoxEmpty}`}>
                <span className={styles.stateIcon}>🌍</span>
                <p className={styles.stateTitle}>Selecione um satélite e consulte</p>
                <p className={styles.stateText}>
                  O mapa exibirá os pontos temporais, o satélite e a área de cobertura estimada.
                </p>
              </div>
            )}

            {/* CA01 — Mapa com dados */}
            {status === 'success' && pontos.length > 0 && (
              <SatelliteMap
                pontos={pontos}
                sateliteId={sateliteId}
                visualizationMode={visualizacao}
                onToggleVisualization={() => setVisualizacao((current) => (current === 'fixed' ? 'coverage' : 'fixed'))}
              />
            )}

            {/* Legenda */}
            {status === 'success' && pontos.length > 0 && (
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
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: '#60a5fa' }} />
                      Instante consultado
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
                      Pontos intermediários
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* ── Tabela de pontos ──────────────────────────────────── */}
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
                      <th>Data / Hora</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Altitude (km)</th>
                      <th>Velocidade (km/h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontos.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
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
