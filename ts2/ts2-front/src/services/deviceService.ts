import { api } from './api';

export interface ConnectedDevice {
  uuid: string;
  ultimo_sinal: string;
  lat: number | null;
  lng: number | null;
  metadados: unknown | null;
}

/** Lista os dispositivos atualmente online. */
export async function fetchConnectedDevices(): Promise<ConnectedDevice[]> {
  const { data } = await api.get<ConnectedDevice[]>('/dispositivos/conectados');
  return data;
}

/**
 * Envia um "sinal de vida" do dispositivo atual.
 * O header X-Device-UID é injetado automaticamente pelo interceptor do `api`.
 */
export async function sendHeartbeat(): Promise<void> {
  await api.post('/dispositivos/heartbeat');
}
