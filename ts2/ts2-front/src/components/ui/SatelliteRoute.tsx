import { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { api } from '../services/api'; // <--- Importando o seu axios configurado

interface RouteData {
    satelite_id: string;
    rota: { latitude: number; longitude: number; data_hora: string }[];
}

interface SatelliteRouteProps {
    sateliteId: string;
    startTime: string;
    endTime: string;
}

export function SatelliteRoute({ sateliteId, startTime, endTime }: SatelliteRouteProps) {
    const [routePositions, setRoutePositions] = useState<LatLngExpression[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoute() {
            try {
                setErrorMsg(null);

                // Usando o axios em vez do fetch nativo.
                // Ele automaticamente usa o baseURL do seu vite.env!
                const response = await api.get<RouteData>(`/telemetry/${sateliteId}/route`, {
                    params: {
                        start_time: startTime,
                        end_time: endTime
                    }
                });

                // O axios já converte o JSON automaticamente em response.data
                const latLngs: LatLngExpression[] = response.data.rota.map(p => [p.latitude, p.longitude]);
                setRoutePositions(latLngs);

            } catch (error: any) {
                // Tratamento de erro específico do Axios para o nosso 404
                if (error.response && error.response.status === 404) {
                    setErrorMsg("Nenhuma rota encontrada para este período.");
                    setRoutePositions([]);
                } else {
                    setErrorMsg("Erro ao carregar os dados da rota.");
                    console.error(error);
                }
            }
        }

        if (sateliteId && startTime && endTime) {
            fetchRoute();
        }
    }, [sateliteId, startTime, endTime]);

    return (
        <>
            {errorMsg && console.log(errorMsg)}

            {routePositions.length > 0 && (
                <Polyline pathOptions={{ color: 'blue', weight: 4 }} positions={routePositions}>
                    <Popup>Rota do Satélite {sateliteId}</Popup>
                </Polyline>
            )}
        </>
    );
}