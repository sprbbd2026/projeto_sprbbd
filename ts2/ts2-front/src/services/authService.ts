import type { TokenResponse } from '../types/auth'
import { api } from './api'

export async function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', {
    email,
    password,
  })
  return data
}
