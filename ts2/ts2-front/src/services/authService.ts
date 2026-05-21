import type { TokenResponse } from '../types/auth'
import { getStoredDeviceMetadata } from '../utils/deviceMetadata'
import { api } from './api'

export async function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', {
    email,
    password,
    device_metadata: getStoredDeviceMetadata(),
  })
  return data
}
