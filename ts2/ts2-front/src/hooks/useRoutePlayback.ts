import { useCallback, useEffect, useState } from 'react'

function stepMsFor(pointCount: number): number {
  if (pointCount <= 0) return 120
  return Math.max(35, Math.min(100, Math.round(90_000 / pointCount)))
}

export function useRoutePlayback(pointCount: number, resetKey = '', autoPlay = true) {
  const [pointIndex, setPointIndex] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)

  useEffect(() => {
    setPointIndex(0)
    setPlaying(autoPlay && pointCount >= 2)
  }, [pointCount, resetKey, autoPlay])

  useEffect(() => {
    if (!playing || pointCount < 2) return

    const interval = stepMsFor(pointCount)
    const timer = window.setInterval(() => {
      setPointIndex((current) => (current >= pointCount - 1 ? 0 : current + 1))
    }, interval)

    return () => window.clearInterval(timer)
  }, [playing, pointCount])

  const togglePlay = useCallback(() => {
    if (pointCount < 2) return
    setPlaying((wasPlaying) => !wasPlaying)
  }, [pointCount])

  const scrub = useCallback(
    (index: number) => {
      setPlaying(false)
      setPointIndex(Math.max(0, Math.min(pointCount - 1, index)))
    },
    [pointCount],
  )

  const pause = useCallback(() => setPlaying(false), [])

  const play = useCallback(() => {
    if (pointCount < 2) return
    setPlaying(true)
  }, [pointCount])

  return { pointIndex, playing, togglePlay, scrub, pause, play }
}
