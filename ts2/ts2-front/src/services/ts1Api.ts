import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_TS1_API_URL ?? 'http://localhost:8000'

export const ts1Api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

ts1Api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
    console.log('[ts1Api] Token enviado:', accessToken.substring(0, 20) + '...')
  } else {
    console.warn('[ts1Api] Nenhum token disponível no authStore')
  }

  return config
})

ts1Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout()
      localStorage.removeItem('ts2-auth-storage')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
