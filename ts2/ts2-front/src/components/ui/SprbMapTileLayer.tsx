import { TileLayer } from 'react-leaflet'
import { MAP_TILE_OPTIONS, MAP_TILE_URL } from '../../utils/mapBasemap'
import './mapBasemap.module.css'

export function SprbMapTileLayer() {
  return <TileLayer url={MAP_TILE_URL} {...MAP_TILE_OPTIONS} />
}
