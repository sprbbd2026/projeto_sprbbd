import { isAxiosError } from 'axios'

export function getRequestErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Sem conexão com o servidor. Verifique se o backend TS2 está em execução (porta 8001).'
      }
      return error.message || 'Erro de rede ao contactar o servidor.'
    }

    const detail = error.response.data
    if (detail && typeof detail === 'object' && 'detail' in detail) {
      const d = (detail as { detail: unknown }).detail
      if (typeof d === 'string') return d
      if (Array.isArray(d)) return JSON.stringify(d)
    }

    if (error.response.status >= 500) {
      return 'Erro interno no servidor ao processar a requisição.'
    }

    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return String(error)
}
