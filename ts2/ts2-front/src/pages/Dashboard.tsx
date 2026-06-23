import { Activity, Cpu, Thermometer, RefreshCw, Map } from 'lucide-react'
import { useEffect, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'
import { Button } from '../components/ui/Button'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { fetchTelemetry, type Telemetry } from '../services/telemetryService'
import { fetchSatelites, type SatellitePoint } from '../services/satelliteService'

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<Telemetry[]>([])
  const [satellites, setSatellites] = useState<SatellitePoint[]>([])
  const [selectedSatId, setSelectedSatId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSatelites().then((sats) => {
      setSatellites(sats)
      if (sats.length > 0) setSelectedSatId(sats[0].sat_id)
    })
  }, [])

  const loadTelemetry = useCallback(async () => {
    if (!selectedSatId) return
    setLoading(true)
    setError('')
    try {
      const response = await fetchTelemetry(selectedSatId)
      setTelemetry(response.reverse())
    } catch (err) {
      setError('Erro ao buscar telemetria. Verifique se o backend está rodando.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedSatId])

  useEffect(() => {
    if (!selectedSatId) return
    void loadTelemetry()
    const interval = setInterval(() => void loadTelemetry(), 5000)
    return () => clearInterval(interval)
  }, [selectedSatId, loadTelemetry])

  const latest = telemetry.length > 0 ? telemetry[0] : null

  return (
    <DashboardLayout>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>SPRB-BD</p>
            <h1 className={styles.title}>Telemetria</h1>
            <p className={styles.subtitle}>
              Monitoramento da saúde operacional do sistema espacial.
            </p>
          </div>
          <div className={styles.headerActions}>
            <select
              className={styles.satSelect}
              value={selectedSatId ?? ''}
              onChange={(e) => setSelectedSatId(Number(e.target.value))}
              disabled={satellites.length === 0}
            >
              {satellites.length === 0 ? (
                <option value="">Nenhum satélite</option>
              ) : (
                satellites.map((s) => (
                  <option key={s.sat_id} value={s.sat_id}>
                    {`SAT-${s.sat_id}`}{s.con_nome ? ` · ${s.con_nome}` : ''}
                  </option>
                ))
              )}
            </select>
            <Button onClick={() => void loadTelemetry()} disabled={loading}>
              <RefreshCw className={loading ? styles.spin : ''} size={16} style={{ marginRight: '0.5rem' }} />
              Atualizar
            </Button>
            <Link to="/mapa" className={styles.navLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Map size={15} />
              Mapa de Localização
            </Link>
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Cpu className={styles.cardIcon} />
              <h2>Uso de CPU</h2>
            </div>
            <div className={styles.cardValue}>
              {latest ? `${latest.cpu_percentual.toFixed(1)}%` : '--'}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Thermometer className={styles.cardIcon} />
              <h2>Temperatura</h2>
            </div>
            <div className={styles.cardValue}>
              {latest ? `${latest.temperatura_celsius.toFixed(1)} °C` : '--'}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Activity className={styles.cardIcon} />
              <h2>Satélite Ativo</h2>
            </div>
            <div className={styles.cardValue}>
              {latest ? latest.satelite_id : '--'}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Activity className={styles.cardIcon} />
              <h2>Status do Sistema</h2>
            </div>
            <div className={styles.cardValue} style={{ textTransform: 'capitalize' }}>
              {latest ? latest.status : '--'}
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <h2>Histórico de Telemetria</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Status</th>
                  <th>CPU (%)</th>
                  <th>Temp (°C)</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.empty}>
                      Nenhum dado recebido.
                    </td>
                  </tr>
                ) : (
                  telemetry.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.data_hora).toLocaleString()}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.status || 'Operacional'}</td>
                      <td>{t.cpu_percentual.toFixed(1)}%</td>
                      <td>{t.temperatura_celsius.toFixed(1)} °C</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
