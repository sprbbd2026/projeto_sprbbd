import { api } from "./api";

export interface DashboardSummary {
  active_satellites: number;
  alerts: number;
  users: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api<DashboardSummary>("/dashboard/summary", { method: "GET" });
}
