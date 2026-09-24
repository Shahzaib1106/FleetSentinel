import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'

const shipIcon = new L.DivIcon({
  className: 'ship-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55));
    ">
      🚢
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function MapInitialView({ ships }) {
  const map = useMap()
  const hasInitialised = useRef(false)

  useEffect(() => {
    // Only fit the map ONCE when the first valid fleet data arrives.
    // Re-fitting on every WebSocket update was causing the map to
    // immediately undo manual zoom/pan actions.
    if (hasInitialised.current) return

    const validShips = ships.filter(
      (ship) =>
        ship.position &&
        typeof ship.position.lat === 'number' &&
        typeof ship.position.lng === 'number'
    )

    if (!validShips.length) return

    const bounds = L.latLngBounds(
      validShips.map((ship) => [
        ship.position.lat,
        ship.position.lng,
      ])
    )

    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 10,
      animate: false,
    })

    hasInitialised.current = true
  }, [ships, map])

  return null
}

function getStatusLabel(status) {
  if (!status) return 'UNKNOWN'
  return status.toUpperCase()
}

function getFuelText(ship) {
  if (typeof ship.fuel_tons === 'number') {
    return `${ship.fuel_tons.toLocaleString()} t`
  }

  return 'N/A'
}

export default function FleetMap({ ships }) {
  return (
    <div
      style={{
        width: '100%',
        height: '300px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={[26.53, 56.21]}
        zoom={8}
        scrollWheelZoom={true}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* English-labeled basemap */}
        <TileLayer
          attribution='&copy; Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <MapInitialView ships={ships} />

        {ships.map((ship, index) => {
          if (
            !ship.position ||
            typeof ship.position.lat !== 'number' ||
            typeof ship.position.lng !== 'number'
          ) {
            return null
          }

          const markerKey = ship.id || ship.name || `ship-${index}`

          return (
            <Marker
              key={markerKey}
              position={[
                ship.position.lat,
                ship.position.lng,
              ]}
              icon={shipIcon}
            >
              <Popup>
                <div
                  style={{
                    minWidth: '220px',
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.45',
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      marginBottom: '8px',
                    }}
                  >
                    🚢 {ship.name || 'Unknown Ship'}
                  </div>

                  <div><strong>Ship ID:</strong> {ship.id || 'N/A'}</div>
                  <div><strong>Status:</strong> {getStatusLabel(ship.status)}</div>
                  <div><strong>Cargo:</strong> {ship.cargo || 'N/A'}</div>
                  <div><strong>Destination:</strong> {ship.destination || 'N/A'}</div>
                  <div><strong>Fuel Remaining:</strong> {getFuelText(ship)}</div>
                  <div><strong>Speed:</strong> {typeof ship.speed_knots === 'number' ? `${ship.speed_knots} kn` : 'N/A'}</div>
                  <div><strong>Heading:</strong> {typeof ship.heading === 'number' ? `${ship.heading}°` : 'N/A'}</div>
                  <div><strong>Latitude:</strong> {ship.position.lat.toFixed(5)}</div>
                  <div><strong>Longitude:</strong> {ship.position.lng.toFixed(5)}</div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
