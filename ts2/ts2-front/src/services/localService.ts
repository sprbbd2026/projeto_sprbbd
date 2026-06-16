import { api } from './api';
import type { LocationPoint } from '../store/mapStore';

export interface LocalCreate {
  nome: string;
  lat: number;
  lng: number;
  categoria: string;
  rating: number;
}

export async function fetchLocais(): Promise<LocationPoint[]> {
  const { data } = await api.get<any[]>('/locais');
  return data.map((item) => ({
    id: String(item.id),
    name: item.nome,
    lat: item.lat,
    lng: item.lng,
    category: item.categoria,
    rating: item.rating,
  }));
}

export async function createLocal(payload: LocalCreate): Promise<LocationPoint> {
  const { data } = await api.post<any>('/locais', payload);
  return {
    id: String(data.id),
    name: data.nome,
    lat: data.lat,
    lng: data.lng,
    category: data.categoria,
    rating: data.rating,
  };
}
