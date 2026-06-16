import axios from 'axios'

import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const { accessToken, deviceUid } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  if (deviceUid) {
    config.headers['X-Device-UID'] = deviceUid
  }

  return config
})
