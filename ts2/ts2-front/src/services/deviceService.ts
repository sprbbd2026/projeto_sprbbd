import { api } from './api';

export interface ConnectedDevice {
  uuid: string;
  lat: number | null;
  lng: number | null;
  metadados: unknown | null;
}

/** Lista os dispositivos com login ativo do usuário autenticado. */
export async function fetchConnectedDevices(): Promise<ConnectedDevice[]> {
  const { data } = await api.get<ConnectedDevice[]>('/dispositivos/conectados');
  return data;
}
