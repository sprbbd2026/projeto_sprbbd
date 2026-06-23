import { Satellite } from 'lucide-react'
import type { RouteLegendSatellite } from '../../types/route'
import styles from './RouteMapLegend.module.css'

interface RouteMapLegendProps {
  pointCount: number
  futureCount: number
  isDemo: boolean
  sateliteLabel: string
  satellites?: RouteLegendSatellite[]
}

export function RouteMapLegend({
  pointCount,
  futureCount,
  isDemo,
  sateliteLabel,
  satellites = [],
}: RouteMapLegendProps) {
  const multi = satellites.length > 1

  return (
    <div className={styles.legend} aria-label="Legenda do mapa">
      <div className={styles.legendHeader}>
        <Satellite size={14} />
        <span>{multi ? 'Constelação SPRB' : sateliteLabel}</span>
        {isDemo && <span className={styles.demoTag}>Demo</span>}
      </div>

      {multi ? (
        <ul className={styles.list}>
          {satellites.map((sat) => (
            <li key={sat.id}>
              <span className={styles.swatch} style={{ background: sat.color }} />
              {sat.label} ({sat.pointCount} pts)
            </li>
          ))}
          <li>
            <span className={styles.swatchDashed} />
            Trajetória projetada ({futureCount} pts)
          </li>
        </ul>
      ) : (
        <ul className={styles.list}>
          <li>
            <span className={styles.swatch} style={{ background: '#3b82f6' }} />
            Trilha percorrida ({pointCount} pts)
          </li>
          <li>
            <span className={styles.swatchDashed} />
            Trajetória projetada ({futureCount} pts)
          </li>
          <li>
            <span className={styles.swatchDot} style={{ background: '#22c55e' }} />
            Início da rota
          </li>
          <li>
            <span className={styles.swatchDot} style={{ background: '#f97316' }} />
            Posição atual
          </li>
          <li>
            <span className={styles.swatchDot} style={{ background: '#ef4444' }} />
            Fim do período
          </li>
        </ul>
      )}
    </div>
  )
}
