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


// ======================================================
// SHIP COLORS
// ======================================================

function getShipColor(ship, index) {
  const colors = [
    '#38bdf8',
    '#22c55e',
    '#f59e0b',
    '#a78bfa',
    '#f43f5e',
    '#14b8a6',
    '#fb7185',
    '#60a5fa',
    '#facc15',
    '#c084fc',
    '#34d399',
    '#fb923c',
    '#818cf8',
    '#2dd4bf',
    '#e879f9',
  ]

  if (typeof ship.color === 'string') {
    return ship.color
  }

  return colors[index % colors.length]
}


// ======================================================
// SHIP ICON
// ======================================================

function createShipIcon(ship, index) {
  const color = getShipColor(ship, index)

  const heading =
    typeof ship.heading === 'number'
      ? ship.heading
      : 0

  const shortName =
    ship.name && ship.name.length > 14
      ? `${ship.name.slice(0, 14)}…`
      : ship.name || `SHIP-${index + 1}`

  return new L.DivIcon({
    className: 'fleet-ship-marker',

    html: `
      <div
        style="
          position: relative;
          width: 90px;
          height: 62px;
          transform: translate(-29px, -31px);
          pointer-events: auto;
        "
      >

        <!-- Direction -->

        <div
          style="
            position: absolute;
            left: 34px;
            top: 0;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 15px solid ${color};
            transform: rotate(${heading}deg);
            transform-origin: 6px 30px;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
          "
        ></div>


        <!-- Ship -->

        <div
          style="
            position: absolute;
            left: 25px;
            top: 18px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: rgba(10, 20, 35, 0.82);
            border: 2px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 0 0 3px rgba(255,255,255,0.05),
              0 3px 8px rgba(0,0,0,0.5);
          "
        >
          <span
            style="
              font-size: 21px;
              line-height: 1;
              display: block;
              transform: rotate(${heading}deg);
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
            "
          >
            🚢
          </span>
        </div>


        <!-- Ship Name -->

        <div
          style="
            position: absolute;
            left: 0;
            top: 54px;
            width: 90px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 9px;
            font-weight: 700;
            color: white;
            text-shadow:
              0 1px 2px #000,
              0 0 3px #000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          ${shortName}
        </div>

      </div>
    `,

    iconSize: [90, 62],
    iconAnchor: [45, 31],
    popupAnchor: [0, -25],
  })
}


// ======================================================
// INITIAL MAP VIEW
// ======================================================

function MapInitialView({ ships }) {
  const map = useMap()

  const hasInitialised = useRef(false)

  useEffect(() => {
    if (hasInitialised.current) {
      return
    }

    const validShips = ships.filter(
      (ship) =>
        ship.position &&
        typeof ship.position.lat === 'number' &&
        typeof ship.position.lng === 'number'
    )

    if (validShips.length === 0) {
      return
    }

    const bounds = L.latLngBounds(
      validShips.map((ship) => [
        ship.position.lat,
        ship.position.lng,
      ])
    )

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 10,
      animate: false,
    })

    hasInitialised.current = true
  }, [ships, map])

  return null
}


// ======================================================
// STATUS
// ======================================================

function getStatusLabel(status) {
  if (!status) {
    return 'UNKNOWN'
  }

  return status
    .replace(/_/g, ' ')
    .toUpperCase()
}


function getFuelText(ship) {
  if (typeof ship.fuel_tons === 'number') {
    return `${ship.fuel_tons.toLocaleString()} t`
  }

  return 'N/A'
}


function getStatusColor(status) {
  if (status === 'critical') {
    return '#ef4444'
  }

  if (
    status === 'warning' ||
    status === 'distress' ||
    status === 'distressed' ||
    status === 'stranded'
  ) {
    return '#f59e0b'
  }

  return '#22c55e'
}


// ======================================================
// ANIMATED SHIP
// ======================================================

function AnimatedShipMarker({ ship, index }) {
  const markerRef = useRef(null)

  const animationRef = useRef(null)

  const previousPositionRef = useRef(null)


  // ----------------------------------------------------
  // Validate position
  // ----------------------------------------------------

  const hasValidPosition =
    ship.position &&
    typeof ship.position.lat === 'number' &&
    typeof ship.position.lng === 'number'


  const latitude = hasValidPosition
    ? ship.position.lat
    : null

  const longitude = hasValidPosition
    ? ship.position.lng
    : null


  // ----------------------------------------------------
  // Create icon
  // ----------------------------------------------------

  const icon = createShipIcon(
    ship,
    index
  )


  // ----------------------------------------------------
  // Animate movement
  // ----------------------------------------------------

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null ||
      !markerRef.current
    ) {
      return
    }

    const marker = markerRef.current


    // First position

    if (!previousPositionRef.current) {
      previousPositionRef.current = {
        lat: latitude,
        lng: longitude,
      }

      marker.setLatLng([
        latitude,
        longitude,
      ])

      return
    }


    const startPosition = {
      ...previousPositionRef.current,
    }

    const endPosition = {
      lat: latitude,
      lng: longitude,
    }


    // Save new position for next update

    previousPositionRef.current = {
      ...endPosition,
    }


    // Stop previous animation

    if (animationRef.current !== null) {
      cancelAnimationFrame(
        animationRef.current
      )

      animationRef.current = null
    }


    const startTime = performance.now()

    const duration = 900


    function animate(currentTime) {
      const elapsed =
        currentTime - startTime

      const progress = Math.min(
        elapsed / duration,
        1
      )


      // Ease in / ease out

      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 -
            Math.pow(
              -2 * progress + 2,
              2
            ) /
              2


      const currentLat =
        startPosition.lat +
        (endPosition.lat -
          startPosition.lat) *
          eased


      const currentLng =
        startPosition.lng +
        (endPosition.lng -
          startPosition.lng) *
          eased


      marker.setLatLng([
        currentLat,
        currentLng,
      ])


      if (progress < 1) {
        animationRef.current =
          requestAnimationFrame(
            animate
          )
      } else {
        animationRef.current = null
      }
    }


    animationRef.current =
      requestAnimationFrame(
        animate
      )


    // Cleanup

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current
        )

        animationRef.current = null
      }
    }
  }, [latitude, longitude])


  // ----------------------------------------------------
  // Component cleanup
  // ----------------------------------------------------

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(
          animationRef.current
        )

        animationRef.current = null
      }
    }
  }, [])


  // ----------------------------------------------------
  // Invalid position
  // ----------------------------------------------------

  if (!hasValidPosition) {
    return null
  }


  // ----------------------------------------------------
  // Marker
  // ----------------------------------------------------

  return (
    <Marker
      ref={markerRef}
      position={[
        latitude,
        longitude,
      ]}
      icon={icon}
    >

      <Popup>

        <div
          style={{
            minWidth: '240px',
            fontFamily:
              'Arial, sans-serif',
            lineHeight: '1.5',
          }}
        >

          <div
            style={{
              fontSize: '17px',
              fontWeight: '700',
              marginBottom: '10px',
              borderBottom:
                '1px solid #ddd',
              paddingBottom: '7px',
            }}
          >
            🚢 {ship.name || 'Unknown Ship'}
          </div>


          <div>
            <strong>Ship ID:</strong>{' '}
            {ship.id || 'N/A'}
          </div>


          <div>
            <strong>Status:</strong>{' '}

            <span
              style={{
                color:
                  getStatusColor(
                    ship.status
                  ),
                fontWeight: '700',
              }}
            >
              {getStatusLabel(
                ship.status
              )}
            </span>
          </div>


          <div>
            <strong>Cargo:</strong>{' '}
            {ship.cargo || 'N/A'}
          </div>


          <div>
            <strong>Destination:</strong>{' '}
            {ship.destination ||
              'N/A'}
          </div>


          <div>
            <strong>
              Fuel Remaining:
            </strong>{' '}
            {getFuelText(ship)}
          </div>


          <div>
            <strong>Speed:</strong>{' '}

            {typeof ship.speed_knots ===
            'number'
              ? `${ship.speed_knots} kn`
              : 'N/A'}
          </div>


          <div>
            <strong>Heading:</strong>{' '}

            {typeof ship.heading ===
            'number'
              ? `${ship.heading}°`
              : 'N/A'}
          </div>


          <div>
            <strong>Latitude:</strong>{' '}

            {latitude.toFixed(5)}
          </div>


          <div>
            <strong>Longitude:</strong>{' '}

            {longitude.toFixed(5)}
          </div>

        </div>

      </Popup>

    </Marker>
  )
}


// ======================================================
// MAIN MAP
// ======================================================

export default function FleetMap({
  ships,
}) {
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
        center={[
          26.53,
          56.21,
        ]}
        zoom={8}
        scrollWheelZoom={true}
        style={{
          width: '100%',
          height: '100%',
        }}
      >

        <TileLayer
          attribution="&copy; Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />


        <MapInitialView
          ships={ships}
        />


        {ships.map(
          (ship, index) => (
            <AnimatedShipMarker
              key={
                ship.id ||
                ship.name ||
                `ship-${index}`
              }
              ship={ship}
              index={index}
            />
          )
        )}

      </MapContainer>

    </div>
  )
}