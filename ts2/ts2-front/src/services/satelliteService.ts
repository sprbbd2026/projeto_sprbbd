import type { SatellitePoint } from '../store/mapStore';

export async function fetchSatelites(): Promise<SatellitePoint[]> {
  return [
  {
    id: "1",
    name: "Satélite 1",
    lat: -23.000000,
    lng: -46.000000,
    operational: true,
  },
  {
    id: "2",
    name: "Satélite 2",
    lat: -23.55200,
    lng: -45.800000,
    operational: true,
  },
  {
    id: "3",
    name: "Satélite 3",
    lat: -23.100000,
    lng: -46.000000 ,
    operational: true,
  },
  {
    id: "4",
    name: "Satélite 24",
    lat: -23.020000,
    lng: -45.63250,
    operational: false,
  }
];
}

