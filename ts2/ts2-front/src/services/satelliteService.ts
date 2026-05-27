import { api } from './api';
import type { SatellitePoint } from '../store/mapStore';

export async function fetchSatellites(): Promise<SatellitePoint[]> {
  return [
  {
    id: "1",
    name: "Satélite 1",
    lat: -23.55052,
    lng: -46.633308,
    operational: true,
  },
  {
    id: "2",
    name: "Satélite 2",
    lat: -23.55200,
    lng: -46.63500,
    operational: true,
  },
  {
    id: "3",
    name: "Satélite 3",
    lat: -23.55350,
    lng: -46.63100,
    operational: true,
  },
  {
    id: "4",
    name: "Satélite 24",
    lat: -23.55100,
    lng: -46.63250,
    operational: true,
  }
];
}

