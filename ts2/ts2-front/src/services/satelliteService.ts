import type { SatellitePoint } from '../store/mapStore';

export async function fetchSatellites(): Promise<SatellitePoint[]> {
  return [
    {
      id: "1",
      name: "Satélite 1",
      lat: -23.2081,
      lng: -45.8828,
      operational: true,
    },
    {
      id: "2",
      name: "Satélite 2",
      lat: -23.0264,
      lng: -45.5552,
      operational: true,
    },
    {
      id: "3",
      name: "Satélite 3",
      lat: -23.3052,
      lng: -45.9658,
      operational: true,
    },
    {
      id: "4",
      name: "Satélite 4",
      lat: -23.2050,
      lng: -45.8800,
      operational: true,
    }
  ];
}

