import type { UserCreate, UserResponse } from '../types/user'
import { api } from './api'

export async function fetchUsers(): Promise<UserResponse[]> {
  const { data } = await api.get<UserResponse[]>('/users')
  return data
}

export async function createUser(payload: UserCreate): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>('/users', payload)
  return data
}
