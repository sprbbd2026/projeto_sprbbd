import { useEffect, useState } from "react";
import {
    CircleMarker,
    GeoJSON,
    MapContainer,
    Polygon,
    Tooltip,
    useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Regiao, SateliteCobertura } from "../../services/cobertura";
import { calcularFootprint } from "../../utils/satelliteFootprint";
import styles from "./coberturaMap.module.css";

const BRAZIL_CENTER: LatLngExpression = [-14.2, -51.9];
const MAP_ZOOM = 4;
const GEOJSON_URL = "/world-countries.geo.json";

export const CORES_SATELITE = [
    "#1f4fd8",
    "#d8511f",
    "#1d9e55",
    "#7a1fd8",
    "#d81f6a",
    "#e0a800",
];

function corSatelite(satId: number): string {
    return CORES_SATELITE[(satId - 1) % CORES_SATELITE.length];
}

function MapClickHandler({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

type CoberturaMapProps = {
    regioes: Regiao[];
    posicoes: SateliteCobertura[];
    cobrindoIds: Set<number>;
    selRegiaoId: string | null;
    selSatId: number | null;
    pontoConsulta: { lat: number; lng: number } | null;
    temConsulta: boolean;
    onMapClick: (lat: number, lng: number) => void;
    onRegiaoClick: (id: string) => void;
    onSatelliteClick: (satId: number) => void;
};

export default function CoberturaMap({
    regioes,
    posicoes,
    cobrindoIds,
    selRegiaoId,
    selSatId,
    pontoConsulta,
    temConsulta,
    onMapClick,
    onRegiaoClick,
    onSatelliteClick,
}: CoberturaMapProps) {
    const [geoData, setGeoData] = useState<GeoJSON.GeoJsonObject | null>(null);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then((r) => {
                if (!r.ok) throw new Error(`GeoJSON ${r.status}`);
                return r.json() as Promise<GeoJSON.GeoJsonObject>;
            })
            .then(setGeoData)
            .catch(() => setGeoData(null));
    }, []);

    return (
        <div className={styles.mapWrap}>
            <MapContainer center={BRAZIL_CENTER} zoom={MAP_ZOOM} scrollWheelZoom>
                {geoData && (
                    <GeoJSON
                        data={geoData}
                        interactive={false}
                        style={() => ({
                            fillColor: "#cccccc",
                            fillOpacity: 1,
                            color: "#ffffff",
                            weight: 0.5,
                        })}
                    />
                )}

                <MapClickHandler onMapClick={onMapClick} />

                {posicoes.map((s) => {
                    const cor = corSatelite(s.sat_id);
                    const cobre =
                        !temConsulta || cobrindoIds.has(s.sat_id);
                    const destacado =
                        selSatId === null || selSatId === s.sat_id;
                    const visivel = cobre && destacado;
            const footprint = calcularFootprint(s.posicao.lat, s.posicao.lng);

                    return (
                        <Polygon
                            key={`fp-${s.sat_id}`}
                            positions={footprint}
                            pathOptions={{
                                color: cor,
                                fillColor: cor,
                                fillOpacity: visivel ? 0.22 : 0.04,
                                weight: visivel ? 1.4 : 0.6,
                                opacity: visivel ? 0.85 : 0.2,
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    e.originalEvent.stopPropagation();
                                    onSatelliteClick(s.sat_id);
                                },
                            }}
                        />
                    );
                })}

                {posicoes.map((s) => {
                    const cor = corSatelite(s.sat_id);
                    return (
                        <CircleMarker
                            key={`sat-${s.sat_id}`}
                            center={[s.posicao.lat, s.posicao.lng]}
                            radius={7}
                            pathOptions={{
                                color: "#fff",
                                weight: 2,
                                fillColor: cor,
                                fillOpacity: 1,
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    e.originalEvent.stopPropagation();
                                    onSatelliteClick(s.sat_id);
                                },
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                                SAT {s.sat_id}
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {regioes.map((r) => (
                    <CircleMarker
                        key={r.id}
                        center={[r.lat, r.lng]}
                        radius={selRegiaoId === r.id ? 9 : 7}
                        pathOptions={{
                            color: selRegiaoId === r.id ? "#1f4fd8" : "#1a2233",
                            weight: selRegiaoId === r.id ? 3 : 2,
                            fillColor: "#fff",
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: (e) => {
                                e.originalEvent.stopPropagation();
                                onRegiaoClick(r.id);
                            },
                        }}
                    >
                        <Tooltip direction="right" offset={[8, 0]} permanent opacity={0.9}>
                            {r.nome}
                        </Tooltip>
                    </CircleMarker>
                ))}

                {pontoConsulta && !selRegiaoId && (
                    <CircleMarker
                        center={[pontoConsulta.lat, pontoConsulta.lng]}
                        radius={6}
                        pathOptions={{
                            color: "#fff",
                            weight: 2,
                            fillColor: "#111",
                            fillOpacity: 1,
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}
