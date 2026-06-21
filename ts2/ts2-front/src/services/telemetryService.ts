import { api } from './api'

export interface Telemetry {
  id: number
  satelite_id: string
  cpu_percentual: number
  temperatura_celsius: number
  status: string
  data_hora: string
}

export async function fetchTelemetry(): Promise<Telemetry[]> {
  const { data } = await api.get<Telemetry[]>('/telemetry')
  return data
}
