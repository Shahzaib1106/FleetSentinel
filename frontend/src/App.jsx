import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import FleetPage from './FleetPage'
import AnalyticsPage from './AnalyticsPage'
import './App.css'
import { useFleetSocket } from './hooks/useFleetSocket'
import FleetMap from './FleetMap'

/* ============================================================
   INCIDENT STORE
   ============================================================

   Live telemetry se incident create hone ke baad yahan store
   hota hai.

   Important:
   - Store React render ke andar mutate nahi hota.
   - Snapshot stable reference rakhta hai.
   - Navigation se incidents disappear nahi hote.
============================================================ */

const incidentStore = {
  records: new Map(),
  snapshot: [],
  listeners: new Set(),

  getSnapshot() {
    return this.snapshot
  },

  subscribe(listener) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  },

  addOrUpdateIncidents(incidents) {
    if (
      !Array.isArray(incidents) ||
      incidents.length === 0
    ) {
      return
    }

    let changed = false

    incidents.forEach((incident) => {
      if (!incident?.id) {
        return
      }

      const existing =
        this.records.get(incident.id)

      if (!existing) {
        this.records.set(
          incident.id,
          incident
        )

        changed = true
        return
      }

      const updated = {
        ...existing,
        ...incident,
      }

      this.records.set(
        incident.id,
        updated
      )

      changed = true
    })

    if (!changed) {
      return
    }

    this.snapshot = Array.from(
      this.records.values()
    )

    this.listeners.forEach(
      (listener) => {
        listener()
      }
    )
  },
}

function useIncidentRecords() {
  return useSyncExternalStore(
    incidentStore.subscribe.bind(
      incidentStore
    ),
    incidentStore.getSnapshot.bind(
      incidentStore
    ),
    incidentStore.getSnapshot.bind(
      incidentStore
    )
  )
}

/* ============================================================
   APP
============================================================ */

function App() {
  const [activePage, setActivePage] =
    useState('Dashboard')

  const [time, setTime] =
    useState(new Date())

  const [zoneBreaches, setZoneBreaches] =
    useState([])

  const [acknowledgedIncidents, setAcknowledgedIncidents] =
    useState(() => new Set())

  const [dismissedIncidents, setDismissedIncidents] =
    useState(() => new Set())

  const [incidentHistory, setIncidentHistory] =
    useState([])

  const {
    ships,
    connected,
    lastUpdate,
  } = useFleetSocket()

  /* ============================================================
     CLOCK
  ============================================================ */

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  /* ============================================================
     ZONE BREACH CALLBACK
  ============================================================ */

  const handleZoneBreachesChange =
    useCallback((breaches) => {
      setZoneBreaches(
        Array.isArray(breaches)
          ? breaches
          : []
      )
    }, [])

  /* ============================================================
     CRISIS STATUS
  ============================================================ */

  const isCrisisStatus = useCallback(
    (status) => {
      return (
        status === 'warning' ||
        status === 'critical' ||
        status === 'distress' ||
        status === 'distressed' ||
        status === 'insufficient_fuel' ||
        status === 'stranded'
      )
    },
    []
  )

  /* ============================================================
     LIVE STATUS ALERTS
  ============================================================ */

  const statusAlertShips = useMemo(() => {
    return ships.filter((ship) =>
      isCrisisStatus(ship.status)
    )
  }, [ships, isCrisisStatus])

  /* ============================================================
     STATUS ALERT IDS
  ============================================================ */

  const statusAlertIds = useMemo(() => {
    return new Set(
      statusAlertShips.map(
        (ship, index) =>
          ship.id ||
          ship.name ||
          `ship-${index}`
      )
    )
  }, [statusAlertShips])

  /* ============================================================
     ZONE-ONLY BREACHES
  ============================================================ */

  const zoneOnlyBreaches = useMemo(() => {
    return zoneBreaches.filter(
      (breach) =>
        !statusAlertIds.has(
          breach.shipId
        )
    )
  }, [
    zoneBreaches,
    statusAlertIds,
  ])

  /* ============================================================
     BREACH LOOKUP
  ============================================================ */

  const breachByShipId = useMemo(() => {
    return new Map(
      zoneBreaches.map((breach) => [
        breach.shipId,
        breach,
      ])
    )
  }, [zoneBreaches])

  /* ============================================================
     CURRENT LIVE INCIDENTS
  ============================================================ */

  const allIncidents = useMemo(() => {
    const incidents = []

    /* ----------------------------------------------------------
       STATUS INCIDENTS
    ---------------------------------------------------------- */

    statusAlertShips.forEach((ship) => {
      const shipId =
        ship.id ||
        ship.name ||
        'unknown'

      const zoneBreach =
        breachByShipId.get(shipId)

      incidents.push({
        id: `status-${shipId}`,

        type: 'STATUS ALERT',

        vessel:
          ship.name ||
          'Unknown Vessel',

        vesselId:
          ship.id ||
          'N/A',

        status:
          ship.status,

        destination:
          ship.destination,

        cargo:
          ship.cargo,

        speed:
          ship.speed_knots,

        fuel:
          ship.fuel_tons,

        position:
          ship.position,

        zoneBreach:
          zoneBreach || null,
      })
    })

    /* ----------------------------------------------------------
       ZONE BREACH INCIDENTS
    ---------------------------------------------------------- */

    zoneOnlyBreaches.forEach(
      (breach) => {
        incidents.push({
          id: `zone-${breach.shipId}-${breach.zoneName}`,

          type: 'ZONE BREACH',

          vessel:
            breach.shipName ||
            'Unknown Vessel',

          vesselId:
            breach.shipId ||
            'N/A',

          status: 'active',

          position:
            breach.position,

          zoneName:
            breach.zoneName,

          zoneBreach:
            breach,
        })
      }
    )

    return incidents
  }, [
    statusAlertShips,
    zoneOnlyBreaches,
    breachByShipId,
  ])

  /* ============================================================
     STORE LIVE INCIDENTS
  ============================================================ */

  useEffect(() => {
    incidentStore.addOrUpdateIncidents(
      allIncidents
    )
  }, [allIncidents])

  /* ============================================================
     PERSISTENT INCIDENT RECORDS
  ============================================================ */

  const incidentRecords =
    useIncidentRecords()

  /* ============================================================
     ACTIVE INCIDENTS
  ============================================================ */

  const activeIncidents = useMemo(() => {
    return incidentRecords.filter(
      (incident) =>
        !dismissedIncidents.has(
          incident.id
        )
    )
  }, [
    incidentRecords,
    dismissedIncidents,
  ])

  const totalCrisisCount =
    activeIncidents.length

  /* ============================================================
     ACKNOWLEDGE INCIDENT
  ============================================================ */

  const acknowledgeIncident = useCallback(
    (incident) => {
      if (
        acknowledgedIncidents.has(
          incident.id
        )
      ) {
        return
      }

      setAcknowledgedIncidents(
        (previous) => {
          const next =
            new Set(previous)

          next.add(
            incident.id
          )

          return next
        }
      )

      setIncidentHistory(
        (previous) => [
          {
            ...incident,
            action:
              'ACKNOWLEDGED',
            timestamp:
              new Date(),
          },
          ...previous,
        ]
      )
    },
    [acknowledgedIncidents]
  )

  /* ============================================================
     DISMISS INCIDENT
  ============================================================ */

  const dismissIncident = useCallback(
    (incident) => {
      if (
        dismissedIncidents.has(
          incident.id
        )
      ) {
        return
      }

      setDismissedIncidents(
        (previous) => {
          const next =
            new Set(previous)

          next.add(
            incident.id
          )

          return next
        }
      )

      setIncidentHistory(
        (previous) => [
          {
            ...incident,
            action:
              'DISMISSED',
            timestamp:
              new Date(),
          },
          ...previous,
        ]
      )
    },
    [dismissedIncidents]
  )

  /* ============================================================
     DISPLAY DATA
  ============================================================ */

  const formattedTime =
    time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const lastUpdateText =
    lastUpdate
      ? lastUpdate.toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }
        )
      : '--:--:--'

  const activeShips =
    ships.length

  const normalShips =
    ships.filter(
      (ship) =>
        ship.status === 'normal'
    ).length

  const dashboardIncidents =
    activeIncidents.slice(0, 3)

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="app-shell">

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <aside className="sidebar">

        <div className="logo-area">

          <div className="logo-mark">
            <span>FC</span>
          </div>

          <div>
            <h2>
              FLEET CRISIS
            </h2>

            <p>
              COMMAND CENTER
            </p>
          </div>

        </div>

        <div className="sidebar-label">
          COMMAND
        </div>

        <nav className="navigation">

          {[
            ['⌂', 'Dashboard'],
            ['▣', 'Fleet'],
            ['⚠', 'Crisis Center'],
            ['➤', 'Dispatch'],
            ['◈', 'Analytics'],
          ].map(
            ([icon, name]) => (
              <button
                key={name}
                className={`nav-button ${
                  activePage === name
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  setActivePage(
                    name
                  )
                }
              >

                <span className="nav-icon">
                  {icon}
                </span>

                <span>
                  {name}
                </span>

                {name ===
                  'Crisis Center' && (
                  <span className="nav-alert">
                    {totalCrisisCount}
                  </span>
                )}

              </button>
            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="network-card">

            <div
              className={`online-dot ${
                connected
                  ? ''
                  : 'offline'
              }`}
            ></div>

            <div>

              <strong>
                {connected
                  ? 'SYSTEM ONLINE'
                  : 'CONNECTING'}
              </strong>

              <span>
                {connected
                  ? 'Fleet telemetry operational'
                  : 'Waiting for backend'}
              </span>

            </div>

          </div>

          <div className="operator">

            <div className="avatar">
              SA
            </div>

            <div>

              <strong>
                COMMAND OPERATOR
              </strong>

              <span>
                Administrator
              </span>

            </div>

            <span className="more">
              •••
            </span>

          </div>

        </div>

      </aside>

      {/* ================================================== */}
      {/* MAIN */}
      {/* ================================================== */}

      <main className="main-area">

        {/* ================================================== */}
        {/* TOPBAR */}
        {/* ================================================== */}

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              OPERATIONS
              <span>/</span>
              LIVE COMMAND
            </div>

            <h1>
              {activePage}
            </h1>

          </div>

          <div className="topbar-right">

            <div className="live-status">

              <span
                className={`connection-dot ${
                  connected
                    ? 'online'
                    : 'offline'
                }`}
              ></span>

              {connected
                ? 'FLEET LIVE'
                : 'CONNECTING...'}

            </div>

            <div className="clock">

              <span className="clock-icon">
                ◷
              </span>

              {formattedTime}

            </div>

            <div className="notification">

              ♢

              <b>
                {totalCrisisCount}
              </b>

            </div>

          </div>

        </header>

        {/* ================================================== */}
        {/* CRISIS CENTER */}
        {/* ================================================== */}

        {activePage ===
        'Crisis Center' ? (

          <div className="dashboard-content">

            <section className="hero">

              <div>

                <div className="section-tag">
                  <span></span>
                  INCIDENT RESPONSE
                </div>

                <h2>
                  Crisis
                  <br />
                  <span>
                    command center.
                  </span>
                </h2>

                <p>
                  Live monitoring and
                  response management
                  for active fleet
                  incidents.
                </p>

              </div>

              <div className="hero-status">

                <div className="radar">
                  <div className="radar-ring ring-one"></div>
                  <div className="radar-ring ring-two"></div>
                  <div className="radar-ring ring-three"></div>
                  <div className="radar-center"></div>
                  <div className="radar-line"></div>
                </div>

                <div>

                  <span>
                    ACTIVE INCIDENTS
                  </span>

                  <strong>
                    {totalCrisisCount}
                  </strong>

                  <small>
                    Persistent response
                    queue
                  </small>

                </div>

              </div>

            </section>

            {/* ================================================== */}
            {/* CRISIS STATS */}
            {/* ================================================== */}

            <section className="stats">

              <div className="stat-card danger-card">

                <div className="stat-top">

                  <span>
                    ACTIVE INCIDENTS
                  </span>

                  <div className="stat-icon red">
                    ⚠
                  </div>

                </div>

                <strong>
                  {totalCrisisCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>

                <div className="stat-footer danger-text">

                  <span>
                    ● LIVE
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    ZONE BREACHES
                  </span>

                  <div className="stat-icon red">
                    !
                  </div>

                </div>

                <strong>
                  {zoneBreaches.length}
                </strong>

                <div className="stat-footer danger-text">

                  <span>
                    ● MONITORING
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    ACKNOWLEDGED
                  </span>

                  <div className="stat-icon green">
                    ✓
                  </div>

                </div>

                <strong>
                  {
                    acknowledgedIncidents.size
                  }
                </strong>

                <div className="stat-footer positive">

                  <span>
                    ● REVIEWED
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    HISTORY
                  </span>

                  <div className="stat-icon purple">
                    ▣
                  </div>

                </div>

                <strong>
                  {incidentHistory.length}
                </strong>

                <div className="stat-footer positive">

                  <span>
                    ● LOGGED
                  </span>

                </div>

              </div>

            </section>

            {/* ================================================== */}
            {/* INCIDENT GRID */}
            {/* ================================================== */}

            <section
              className="bottom-grid"
              style={{
                gridTemplateColumns:
                  'minmax(0, 1.5fr) minmax(300px, 1fr)',
              }}
            >

              {/* ACTIVE INCIDENTS */}

              <div className="panel fleet-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      LIVE RESPONSE
                    </span>

                    <h3>
                      Active Incidents
                    </h3>

                  </div>

                  <span className="crisis-count">

                    {totalCrisisCount
                      .toString()
                      .padStart(
                        2,
                        '0'
                      )}{' '}
                    ACTIVE

                  </span>

                </div>

                <div
                  style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: '10px',
                  }}
                >

                  {activeIncidents.length ===
                    0 && (
                    <div className="crisis-item normal">

                      <div className="crisis-indicator">
                        ✓
                      </div>

                      <div className="crisis-info">

                        <div className="crisis-title-row">

                          <strong>
                            No active incidents
                          </strong>

                          <span>
                            NOMINAL
                          </span>

                        </div>

                        <p>
                          ◉ Continuous fleet
                          monitoring active
                        </p>

                      </div>

                    </div>
                  )}

                  {activeIncidents.map(
                    (incident) => {

                      const acknowledged =
                        acknowledgedIncidents.has(
                          incident.id
                        )

                      const isZone =
                        incident.type ===
                        'ZONE BREACH'

                      return (
                        <div
                          className={`crisis-item ${
                            isZone
                              ? 'critical'
                              : incident.status
                          }`}
                          key={
                            incident.id
                          }
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'flex-start',
                            gap: '10px',
                          }}
                        >

                          <div className="crisis-indicator">
                            !
                          </div>

                          <div
                            className="crisis-info"
                            style={{
                              flex: 1,
                            }}
                          >

                            <div className="crisis-title-row">

                              <strong>
                                {
                                  incident.vessel
                                }
                              </strong>

                              <span>
                                {isZone
                                  ? 'ZONE BREACH'
                                  : String(
                                      incident.status
                                    ).toUpperCase()}
                              </span>

                            </div>

                            <p>
                              ◉ ID:{' '}
                              {
                                incident.vesselId
                              }
                            </p>

                            {isZone && (
                              <p>
                                ⚠ Restricted
                                Zone:{' '}
                                {
                                  incident.zoneName
                                }
                              </p>
                            )}

                            {!isZone && (
                              <p>
                                ◉ Destination:{' '}
                                {
                                  incident.destination ||
                                  'N/A'
                                }
                              </p>
                            )}

                            {incident.position && (
                              <small>
                                📍{' '}
                                {Number(
                                  incident
                                    .position
                                    .lat
                                ).toFixed(5)}
                                ,{' '}
                                {Number(
                                  incident
                                    .position
                                    .lng
                                ).toFixed(5)}
                              </small>
                            )}

                            {acknowledged && (
                              <small
                                style={{
                                  display:
                                    'block',
                                  marginTop:
                                    '5px',
                                  color:
                                    '#22c55e',
                                  fontWeight:
                                    '700',
                                }}
                              >
                                ✓ ACKNOWLEDGED
                              </small>
                            )}

                            <div
                              style={{
                                display:
                                  'flex',
                                gap: '6px',
                                marginTop:
                                  '9px',
                              }}
                            >

                              {!acknowledged && (
                                <button
                                  onClick={() =>
                                    acknowledgeIncident(
                                      incident
                                    )
                                  }
                                  style={{
                                    border:
                                      '1px solid #22c55e',
                                    background:
                                      'rgba(34,197,94,.12)',
                                    color:
                                      '#22c55e',
                                    borderRadius:
                                      '4px',
                                    padding:
                                      '5px 8px',
                                    fontSize:
                                      '9px',
                                    fontWeight:
                                      '700',
                                    cursor:
                                      'pointer',
                                  }}
                                >
                                  ACKNOWLEDGE
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  dismissIncident(
                                    incident
                                  )
                                }
                                style={{
                                  border:
                                    '1px solid #6b7280',
                                  background:
                                    'transparent',
                                  color:
                                    '#9ca3af',
                                  borderRadius:
                                    '4px',
                                  padding:
                                    '5px 8px',
                                  fontSize:
                                    '9px',
                                  fontWeight:
                                    '700',
                                  cursor:
                                    'pointer',
                                }}
                              >
                                DISMISS
                              </button>

                            </div>

                          </div>

                        </div>
                      )
                    }
                  )}

                </div>

              </div>

              {/* INCIDENT HISTORY */}

              <div className="panel response-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      AUDIT TRAIL
                    </span>

                    <h3>
                      Incident History
                    </h3>

                  </div>

                </div>

                <div
                  style={{
                    padding: '12px',
                    maxHeight:
                      '420px',
                    overflowY:
                      'auto',
                  }}
                >

                  {incidentHistory.length ===
                  0 ? (
                    <div
                      style={{
                        padding:
                          '25px 10px',
                        textAlign:
                          'center',
                        color:
                          '#6b7280',
                        fontSize:
                          '11px',
                      }}
                    >
                      No response
                      actions
                      recorded yet.
                    </div>
                  ) : (
                    incidentHistory.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.id}-${index}`}
                          style={{
                            padding:
                              '10px 0',
                            borderBottom:
                              '1px solid rgba(255,255,255,.06)',
                          }}
                        >

                          <strong
                            style={{
                              display:
                                'block',
                              fontSize:
                                '11px',
                            }}
                          >
                            {
                              item.vessel
                            }
                          </strong>

                          <small
                            style={{
                              display:
                                'block',
                              color:
                                '#9ca3af',
                              marginTop:
                                '3px',
                            }}
                          >
                            {
                              item.action
                            }{' '}
                            ·{' '}
                            {
                              item.type
                            }
                          </small>

                          <small
                            style={{
                              display:
                                'block',
                              color:
                                '#6b7280',
                              marginTop:
                                '3px',
                            }}
                          >
                            {new Date(
                              item.timestamp
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  '2-digit',
                                minute:
                                  '2-digit',
                                second:
                                  '2-digit',
                              }
                            )}
                          </small>

                        </div>
                      )
                    )
                  )}

                </div>

              </div>

            </section>

          </div>

        ) : activePage === 'Analytics' ? (

          <div className="dashboard-content">
            <AnalyticsPage
              ships={ships}
              incidents={activeIncidents}
              incidentHistory={incidentHistory}
            />
          </div>

        ) : activePage === 'Fleet' ? (

          <div className="dashboard-content">
            <FleetPage ships={ships} />
          </div>

        ) : (

          /* ================================================== */
          /* DASHBOARD */
          /* ================================================== */

          <div className="dashboard-content">

            {/* HERO */}

            <section className="hero">

              <div>

                <div className="section-tag">
                  <span></span>
                  COMMAND OVERVIEW
                </div>

                <h2>
                  Fleet situation
                  <br />
                  <span>
                    at a glance.
                  </span>
                </h2>

                <p>
                  Real-time visibility
                  across commercial
                  vessels, operational
                  alerts, and crisis
                  response operations
                  in the Strait of
                  Hormuz.
                </p>

              </div>

              <div className="hero-status">

                <div className="radar">
                  <div className="radar-ring ring-one"></div>
                  <div className="radar-ring ring-two"></div>
                  <div className="radar-ring ring-three"></div>
                  <div className="radar-center"></div>
                  <div className="radar-line"></div>
                </div>

                <div>

                  <span>
                    NETWORK STATUS
                  </span>

                  <strong>
                    {connected
                      ? 'OPERATIONAL'
                      : 'CONNECTING'}
                  </strong>

                  <small>
                    Last update:{' '}
                    {lastUpdateText}
                  </small>

                </div>

              </div>

            </section>

            {/* STATS */}

            <section className="stats">

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    ACTIVE VESSELS
                  </span>

                  <div className="stat-icon blue">
                    ▦
                  </div>

                </div>

                <strong>
                  {activeShips
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>

                <div className="stat-footer positive">

                  <span>
                    ● LIVE
                  </span>

                  <small>
                    active vessels
                  </small>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    TRACKED SHIPS
                  </span>

                  <div className="stat-icon purple">
                    ▣
                  </div>

                </div>

                <strong>
                  {activeShips}
                </strong>

                <div className="stat-footer positive">

                  <span>
                    ● SYNCHRONIZED
                  </span>

                  <small>
                    real-time
                    tracking
                  </small>

                </div>

              </div>

              <div className="stat-card danger-card">

                <div className="stat-top">

                  <span>
                    ACTIVE ALERTS
                  </span>

                  <div className="stat-icon red">
                    ⚠
                  </div>

                </div>

                <strong>
                  {totalCrisisCount
                    .toString()
                    .padStart(
                      2,
                      '0'
                    )}
                </strong>

                <div className="stat-footer danger-text">

                  <span>
                    ● LIVE ALERTS
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span>
                    NORMAL VESSELS
                  </span>

                  <div className="stat-icon green">
                    ✓
                  </div>

                </div>

                <strong>
                  {normalShips}
                </strong>

                <div className="availability">

                  <div>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <small>
                    operating normally
                  </small>

                </div>

              </div>

            </section>

            {/* MAIN GRID */}

            <section className="main-grid">

              {/* MAP */}

              <div className="panel map-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      LIVE OPERATIONS
                    </span>

                    <h3>
                      Fleet Deployment
                      Map
                    </h3>

                  </div>

                  <button className="panel-action">
                    EXPAND ↗
                  </button>

                </div>

                <div
                  style={{
                    height:
                      '420px',
                    width:
                      '100%',
                  }}
                >

                  <FleetMap
                    ships={ships}
                    onZoneBreachesChange={
                      handleZoneBreachesChange
                    }
                  />

                </div>

              </div>

              {/* FLEET ALERTS */}

              <div className="panel crisis-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      INCIDENT RESPONSE
                    </span>

                    <h3>
                      Fleet Alerts
                    </h3>

                  </div>

                  <span className="crisis-count">

                    {totalCrisisCount
                      .toString()
                      .padStart(
                        2,
                        '0'
                      )}{' '}
                    ACTIVE

                  </span>

                </div>

                <div className="crisis-list">

                  {dashboardIncidents.map(
                    (incident) => (
                      <div
                        className={`crisis-item ${
                          incident.type ===
                          'ZONE BREACH'
                            ? 'critical'
                            : incident.status
                        }`}
                        key={
                          incident.id
                        }
                      >

                        <div className="crisis-indicator">
                          !
                        </div>

                        <div className="crisis-info">

                          <div className="crisis-title-row">

                            <strong>
                              {
                                incident.vessel
                              }
                            </strong>

                            <span>
                              {incident.type ===
                              'ZONE BREACH'
                                ? 'ZONE BREACH'
                                : String(
                                    incident.status
                                  ).toUpperCase()}
                            </span>

                          </div>

                          <p>
                            ◉ ID:{' '}
                            {
                              incident.vesselId
                            }
                          </p>

                          <small>
                            {incident.type ===
                            'ZONE BREACH'
                              ? `Restricted Zone: ${incident.zoneName}`
                              : `Destination: ${
                                  incident.destination ||
                                  'N/A'
                                }`}
                          </small>

                        </div>

                        <button
                          className="arrow-button"
                          onClick={() =>
                            setActivePage(
                              'Crisis Center'
                            )
                          }
                        >
                          →
                        </button>

                      </div>
                    )
                  )}

                  {totalCrisisCount ===
                    0 && (
                    <div className="crisis-item normal">

                      <div className="crisis-indicator">
                        ✓
                      </div>

                      <div className="crisis-info">

                        <div className="crisis-title-row">

                          <strong>
                            All vessels
                            normal
                          </strong>

                          <span>
                            NOMINAL
                          </span>

                        </div>

                        <p>
                          ◉ No active
                          fleet alerts
                        </p>

                        <small>
                          Continuous
                          monitoring
                          active
                        </small>

                      </div>

                    </div>
                  )}

                </div>

                <button
                  className="view-all"
                  onClick={() =>
                    setActivePage(
                      'Crisis Center'
                    )
                  }
                >
                  VIEW ALL ALERTS
                  <span>
                    →
                  </span>
                </button>

              </div>

            </section>

            {/* BOTTOM GRID */}

            <section className="bottom-grid">

              {/* FLEET STATUS */}

              <div className="panel fleet-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      VESSEL MONITORING
                    </span>

                    <h3>
                      Fleet Status
                    </h3>

                  </div>

                  <button
                    className="panel-action"
                    onClick={() =>
                      setActivePage(
                        'Fleet'
                      )
                    }
                  >
                    VIEW FLEET →
                  </button>

                </div>

                <div className="fleet-table">

                  <div className="table-head">

                    <span>
                      VESSEL
                    </span>

                    <span>
                      CARGO
                    </span>

                    <span>
                      DESTINATION
                    </span>

                    <span>
                      STATUS
                    </span>

                    <span>
                      FUEL
                    </span>

                  </div>

                  {ships
                    .slice(0, 6)
                    .map(
                      (ship) => (
                        <div
                          className="fleet-row"
                          key={
                            ship.id
                          }
                        >

                          <strong>
                            {ship.name}
                          </strong>

                          <span>
                            {ship.cargo}
                          </span>

                          <span>
                            →{' '}
                            {
                              ship.destination
                            }
                          </span>

                          <span
                            className={`unit-status ${ship.status}`}
                          >

                            <i></i>

                            {ship.status.toUpperCase()}

                          </span>

                          <div className="battery">

                            <div>

                              <span
                                style={{
                                  width: `${Math.min(
                                    ship.fuel_tons /
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></span>

                            </div>

                            <small>
                              {ship.fuel_tons.toLocaleString()}{' '}
                              t
                            </small>

                          </div>

                        </div>
                      )
                    )}

                  {ships.length ===
                    0 && (
                    <div className="fleet-row">

                      <span>
                        Waiting for
                        fleet
                        telemetry...
                      </span>

                    </div>
                  )}

                </div>

              </div>

              {/* FLEET COMMAND */}

              <div className="panel response-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-label">
                      FLEET OPERATIONS
                    </span>

                    <h3>
                      Fleet Command
                    </h3>

                  </div>

                  <div className="dispatch-live">
                    ● LIVE
                  </div>

                </div>

                <div className="dispatch-route">

                  {ships.length >
                  0 ? (
                    <>
                      <div className="dispatch-node">

                        <div className="node-icon">
                          ◉
                        </div>

                        <div>

                          <span>
                            LEAD VESSEL
                          </span>

                          <strong>
                            {
                              ships[0]
                                .name
                            }
                          </strong>

                          <small>
                            {
                              ships[0]
                                .cargo
                            }{' '}
                            ·{' '}
                            {
                              ships[0]
                                .speed_knots
                            }{' '}
                            kn
                          </small>

                        </div>

                      </div>

                      <div className="route-line">

                        <span>
                          LIVE
                        </span>

                      </div>

                      <div className="dispatch-node">

                        <div className="node-icon vehicle">
                          →
                        </div>

                        <div>

                          <span>
                            DESTINATION
                          </span>

                          <strong>
                            {
                              ships[0]
                                .destination
                            }
                          </strong>

                          <small>
                            Heading{' '}
                            {
                              ships[0]
                                .heading
                            }
                            °
                          </small>

                        </div>

                      </div>
                    </>
                  ) : (
                    <div className="dispatch-node">

                      <div>

                        <span>
                          FLEET STATUS
                        </span>

                        <strong>
                          Waiting for
                          telemetry...
                        </strong>

                      </div>

                    </div>
                  )}

                </div>

                <button
                  className="dispatch-button"
                  onClick={() =>
                    setActivePage(
                      'Fleet'
                    )
                  }
                >
                  OPEN FLEET CONTROL
                  <span>
                    →
                  </span>
                </button>

              </div>

            </section>

          </div>
        )}

      </main>
    </div>
  )
}

export default App