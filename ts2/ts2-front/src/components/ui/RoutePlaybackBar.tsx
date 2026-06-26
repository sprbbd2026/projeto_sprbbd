import { Pause, Play } from 'lucide-react'
import styles from './RoutePlaybackBar.module.css'

export interface RoutePlaybackBarProps {
  pointIndex: number
  pointCount: number
  playing: boolean
  currentTimeLabel: string
  disabled?: boolean
  disabledHint?: string
  onTogglePlay: () => void
  onScrub: (index: number) => void
}

export function RoutePlaybackBar({
  pointIndex,
  pointCount,
  playing,
  currentTimeLabel,
  disabled = false,
  disabledHint,
  onTogglePlay,
  onScrub,
}: RoutePlaybackBarProps) {
  const maxIndex = Math.max(0, pointCount - 1)
  const canPlay = !disabled && pointCount >= 2

  return (
    <div className={styles.bar} aria-label="Controles de reprodução da rota">
      <button
        type="button"
        className={styles.playBtn}
        onClick={onTogglePlay}
        disabled={!canPlay}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
        title={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className={styles.sliderWrap}>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={maxIndex}
          step={1}
          value={pointCount > 0 ? pointIndex : 0}
          disabled={!canPlay}
          aria-valuemin={0}
          aria-valuemax={maxIndex}
          aria-valuenow={pointIndex}
          aria-label="Posição na rota"
          onChange={(e) => onScrub(Number(e.target.value))}
        />
        <div className={styles.meta}>
          <span className={styles.pointCounter}>
            Ponto {pointCount > 0 ? pointIndex + 1 : 0} / {pointCount}
          </span>
          <time className={styles.timeLabel} dateTime={currentTimeLabel}>
            {currentTimeLabel || '—'}
          </time>
        </div>
      </div>

      <span className={styles.coverageBadge} title="Cobertura orbital ativa no ponto atual">
        Cobertura ativa
      </span>

      {disabled && disabledHint && <p className={styles.hint}>{disabledHint}</p>}
    </div>
  )
}
