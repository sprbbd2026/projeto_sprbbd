import { isAxiosError } from 'axios'

export function getRequestErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data
    if (detail && typeof detail === 'object' && 'detail' in detail) {
      const d = (detail as { detail: unknown }).detail
      if (typeof d === 'string') return d
      if (Array.isArray(d)) return JSON.stringify(d)
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return String(error)
}
