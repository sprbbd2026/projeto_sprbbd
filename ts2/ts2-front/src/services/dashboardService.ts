import { ts1Api } from './ts1Api'

export interface DashboardSummary {
  active_satellites: number
  alerts: number
  users: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await ts1Api.get<DashboardSummary>('/dashboard/summary')
  return data
}
