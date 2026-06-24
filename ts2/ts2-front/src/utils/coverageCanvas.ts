import L from 'leaflet'
import type { LatLngTuple } from './routeProjection'

/** Azul uniforme — opacidade fixa mesmo com centenas de footprints sobrepostos. */
export const HISTORICO_COVERAGE_FILL = 'rgba(59, 130, 246, 0.2)'

function drawFootprintPath(ctx: CanvasRenderingContext2D, map: L.Map, footprint: LatLngTuple[]): void {
  if (footprint.length < 3) return

  ctx.beginPath()
  footprint.forEach(([lat, lng], i) => {
    const { x, y } = map.latLngToContainerPoint([lat, lng])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
}

/**
 * Desenha cobertura com opacidade constante: primeiro une todos os polígonos
 * (máscara opaca) e depois aplica uma única camada azul transparente.
 */
export function drawCoverageMask(
  map: L.Map,
  canvas: HTMLCanvasElement,
  footprints: LatLngTuple[][],
  fillStyle = HISTORICO_COVERAGE_FILL,
): void {
  const size = map.getSize()
  const topLeft = map.containerPointToLayerPoint([0, 0])
  L.DomUtil.setPosition(canvas, topLeft)

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(size.x * dpr))
  canvas.height = Math.max(1, Math.floor(size.y * dpr))
  canvas.style.width = `${size.x}px`
  canvas.style.height = `${size.y}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size.x, size.y)

  if (footprints.length === 0) return

  // União binária — sobreposições não somam alpha.
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  for (const footprint of footprints) {
    drawFootprintPath(ctx, map, footprint)
  }

  // Uma única cor/azul transparente sobre toda a área coberta.
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = fillStyle
  ctx.fillRect(0, 0, size.x, size.y)
}
