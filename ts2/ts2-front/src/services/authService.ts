import type { TokenResponse } from '../types/auth'
import { getStoredDeviceMetadata } from '../utils/deviceMetadata'
import { api } from './api'
import { useAuthStore } from '../store/authStore'

export async function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const existingDeviceUid = useAuthStore.getState().deviceUid

  const { data } = await api.post<TokenResponse>('/auth/login', {
    email,
    password,
    device_metadata: getStoredDeviceMetadata(),
    ...(existingDeviceUid ? { device_uid: existingDeviceUid } : {}),
  })

  // Salva o device_uid retornado pelo backend no localStorage
  if (data.device_uid) {
    useAuthStore.getState().setDeviceUid(data.device_uid)
  }

  return data
}
