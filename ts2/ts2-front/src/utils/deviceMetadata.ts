import type { DeviceMetadata } from '../types/deviceMetadata'

const STORAGE_KEY = 'ts2-device-metadata'

/**
 * Extrai nome e versão do navegador a partir do user-agent.
 */
function parseBrowser(ua: string): string {
  const patterns: [RegExp, string][] = [
    [/OPR\/(\d+[\d.]*)/, 'Opera'],
    [/Edg(?:e|A|iOS)?\/(\d+[\d.]*)/, 'Edge'],
    [/Firefox\/(\d+[\d.]*)/, 'Firefox'],
    [/(?:Chrome|CriOS)\/(\d+[\d.]*)/, 'Chrome'],
    [/Version\/(\d+[\d.]*).*Safari/, 'Safari'],
  ]

  for (const [regex, name] of patterns) {
    const match = ua.match(regex)
    if (match) return `${name} ${match[1]}`
  }

  return 'unknown'
}

/**
 * Extrai o sistema operacional a partir do user-agent.
 */
function parseOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10+'
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8'
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7'
  if (/Windows/.test(ua)) return 'Windows'

  if (/Mac OS X ([\d_]+)/.test(ua)) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)
    return `macOS ${ver?.[1]?.replace(/_/g, '.') ?? ''}`
  }

  if (/Android ([\d.]+)/.test(ua)) {
    const ver = ua.match(/Android ([\d.]+)/)
    return `Android ${ver?.[1] ?? ''}`
  }

  if (/iPhone OS ([\d_]+)/.test(ua) || /iPad/.test(ua)) {
    const ver = ua.match(/(?:iPhone|CPU) OS ([\d_]+)/)
    return `iOS ${ver?.[1]?.replace(/_/g, '.') ?? ''}`
  }

  if (/Linux/.test(ua)) return 'Linux'
  if (/CrOS/.test(ua)) return 'Chrome OS'

  return 'unknown'
}

/**
 * Detecta o tipo de dispositivo com base no user-agent.
 */
function detectDeviceType(ua: string): DeviceMetadata['deviceType'] {
  // Tablet
  if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    return 'tablet'
  }
  // Mobile
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    return 'mobile'
  }
  // Desktop
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) {
    return 'desktop'
  }
  return 'unknown'
}

/**
 * Coleta os metadados do dispositivo e armazena em `sessionStorage`.
 */
export function collectDeviceMetadata(): DeviceMetadata {
  const ua = navigator.userAgent ?? ''

  const metadata: DeviceMetadata = {
    userAgent: ua,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    deviceType: detectDeviceType(ua),
    language: navigator.language ?? 'unknown',
    timezone: Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone ?? 'unknown',
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metadata))
  } catch {
    // sessionStorage indisponível (ex: modo privado)
  }

  return metadata
}

/**
 * Recupera os metadados previamente armazenados em `sessionStorage`.
 */
export function getStoredDeviceMetadata(): DeviceMetadata | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DeviceMetadata
  } catch {
    return null
  }
}
