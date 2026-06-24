import { ts1Api } from './ts1Api'

export interface Telemetry {
  id: number
  satelite_id: string
  cpu_percentual: number
  temperatura_celsius: number
  status: string
  data_hora: string
}

export async function fetchTelemetry(satId: number): Promise<Telemetry[]> {
  const { data } = await ts1Api.get<Telemetry[]>('/telemetria/dashboard', {
    params: { sat_id: satId },
  })
  return data
}
