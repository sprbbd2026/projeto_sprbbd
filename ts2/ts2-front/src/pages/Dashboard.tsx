import { Activity, Cpu, Thermometer, RefreshCw, Map } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'
import { Button } from '../components/ui/Button'
import { fetchTelemetry, type Telemetry } from '../services/telemetryService'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<Telemetry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTelemetry = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchTelemetry()
      setTelemetry(response.reverse())
    } catch (err) {
      setError(`Erro ao buscar telemetria. Verifique se o backend está rodando em ${API_URL}.`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTelemetry()
    const interval = setInterval(() => void loadTelemetry(), 5000)
    return () => clearInterval(interval)
  }, [])

  const latest = telemetry.length > 0 ? telemetry[0] : null

  return (
    <main className={styles.page}>
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
            <Button onClick={() => void loadTelemetry()} disabled={loading}>
              <RefreshCw className={loading ? styles.spin : ''} size={16} style={{ marginRight: '0.5rem' }} />
              Atualizar
            </Button>
            <Link to="/mapa" className={styles.navLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Map size={15} />
              Mapa de Localização
            </Link>
            <Link to="/" className={styles.navLink}>
              Voltar ao Início
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
                  <th>ID Satélite</th>
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
                      <td>{t.satelite_id}</td>
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
    </main>
  )
}
