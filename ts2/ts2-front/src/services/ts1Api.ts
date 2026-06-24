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
  }

  return config
})

ts1Api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Falha no TS1 não deve encerrar a sessão do TS2 (sistemas distintos).
    return Promise.reject(error)
  },
)
