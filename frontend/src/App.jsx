import { useEffect, useState } from 'react'
import './App.css'
import { useFleetSocket } from './hooks/useFleetSocket'
import FleetMap from './FleetMap'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [time, setTime] = useState(new Date())

  const {
    ships,
    connected,
    lastUpdate,
  } = useFleetSocket()

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const activeShips = ships.length

  const normalShips = ships.filter(
    (ship) => ship.status === 'normal'
  ).length

  const isCrisisStatus = (status) =>
    status === 'warning' ||
    status === 'critical' ||
    status === 'distress' ||
    status === 'distressed' ||
    status === 'insufficient_fuel' ||
    status === 'stranded'

  const alertShips = ships.filter(
    (ship) => isCrisisStatus(ship.status)
  ).length

  const crisisVessels = ships.filter(
    (ship) => isCrisisStatus(ship.status)
  )

  const lastUpdateText = lastUpdate
    ? lastUpdate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--'

  const getStatusLabel = (status) => {
    if (!status) return 'UNKNOWN'

    return status
      .replace(/_/g, ' ')
      .toUpperCase()
  }

  const getStatusClass = (status) => {
    if (status === 'critical') return 'critical'

    if (
      status === 'distress' ||
      status === 'distressed' ||
      status === 'stranded'
    ) {
      return 'distress'
    }

    return 'warning'
  }

  const getFuelText = (ship) => {
    if (typeof ship.fuel_tons === 'number') {
      return `${ship.fuel_tons.toLocaleString()} t`
    }

    return 'N/A'
  }

  const getSpeedText = (ship) => {
    if (typeof ship.speed_knots === 'number') {
      return `${ship.speed_knots} kn`
    }

    return 'N/A'
  }

  const getPositionText = (ship) => {
    if (
      ship.position &&
      typeof ship.position.lat === 'number' &&
      typeof ship.position.lng === 'number'
    ) {
      return `${ship.position.lat.toFixed(4)}, ${ship.position.lng.toFixed(4)}`
    }

    return 'Position unavailable'
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

       <div className="logo-area">
  <div className="logo-mark">
    <span>FS</span>
  </div>

  <div>
    <h2>FLEETSENTINEL</h2>
    <p>COMMAND CENTER</p>
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
          ].map(([icon, name]) => (

            <button
              key={name}
              className={`nav-button ${
                activePage === name ? 'selected' : ''
              }`}
              onClick={() => setActivePage(name)}
            >

              <span className="nav-icon">
                {icon}
              </span>

              <span>
                {name}
              </span>

              {name === 'Crisis Center' && (
                <span className="nav-alert">
                  {alertShips}
                </span>
              )}

            </button>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <div className="network-card">

            <div
              className={`online-dot ${
                connected ? '' : 'offline'
              }`}
            />

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


      {/* MAIN */}

      <main className="main-area">

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              OPERATIONS <span>/</span> LIVE COMMAND
            </div>

            <h1>
              {activePage}
            </h1>

          </div>

          <div className="topbar-right">

            <div className="live-status">

              <span
                className={`connection-dot ${
                  connected ? 'online' : 'offline'
                }`}
              />

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
                {alertShips}
              </b>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <div className="dashboard-content">

          {/* =====================================================
              CRISIS CENTER
              ===================================================== */}

          {activePage === 'Crisis Center' ? (

            <section
              style={{
                padding: '4px 0 40px',
              }}
            >

              {/* CRISIS HEADER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >

                <div>

                  <div className="section-tag">
                    <span></span>
                    INCIDENT RESPONSE
                  </div>

                  <h2
                    style={{
                      marginTop: '12px',
                      marginBottom: '8px',
                      fontSize: '32px',
                    }}
                  >
                    Crisis Center
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      maxWidth: '700px',
                      lineHeight: '1.6',
                      opacity: 0.7,
                    }}
                  >
                    Real-time monitoring of vessels requiring
                    attention across the active fleet.
                  </p>

                </div>

                <div
                  style={{
                    minWidth: '190px',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >

                  <div
                    style={{
                      fontSize: '11px',
                      letterSpacing: '1.5px',
                      opacity: 0.55,
                      marginBottom: '8px',
                    }}
                  >
                    ACTIVE INCIDENTS
                  </div>

                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {alertShips
                      .toString()
                      .padStart(2, '0')}
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      opacity: 0.6,
                    }}
                  >
                    Live fleet alerts
                  </div>

                </div>

              </div>


              {/* CONNECTION STATUS */}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  padding: '14px 18px',
                  marginBottom: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.025)',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >

                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      background: connected
                        ? '#39d98a'
                        : '#f59e0b',
                      boxShadow: connected
                        ? '0 0 10px rgba(57,217,138,0.6)'
                        : '0 0 10px rgba(245,158,11,0.5)',
                    }}
                  />

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {connected
                      ? 'LIVE TELEMETRY CONNECTED'
                      : 'WAITING FOR BACKEND CONNECTION'}
                  </span>

                </div>

                <span
                  style={{
                    fontSize: '12px',
                    opacity: 0.55,
                  }}
                >
                  Last update: {lastUpdateText}
                </span>

              </div>


              {/* NO CRISIS */}

              {crisisVessels.length === 0 ? (

                <div
                  style={{
                    minHeight: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderRadius: '18px',
                    border: '1px solid rgba(57,217,138,0.18)',
                    background:
                      'linear-gradient(145deg, rgba(57,217,138,0.06), rgba(255,255,255,0.02))',
                  }}
                >

                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      marginBottom: '18px',
                      border:
                        '1px solid rgba(57,217,138,0.3)',
                      background:
                        'rgba(57,217,138,0.08)',
                    }}
                  >
                    ✓
                  </div>

                  <h2
                    style={{
                      margin: '0 0 10px',
                      fontSize: '24px',
                    }}
                  >
                    ALL SYSTEMS NOMINAL
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.6,
                      fontSize: '14px',
                    }}
                  >
                    No active fleet crises detected.
                  </p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      opacity: 0.45,
                      fontSize: '13px',
                    }}
                  >
                    Continuous monitoring is active.
                  </p>

                </div>

              ) : (

                /* ACTIVE CRISIS LIST */

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >

                  {crisisVessels.map((ship, index) => {

                    const statusClass =
                      getStatusClass(ship.status)

                    const statusLabel =
                      getStatusLabel(ship.status)

                    return (

                      <div
                        key={
                          ship.id ||
                          ship.name ||
                          `crisis-${index}`
                        }
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          padding: '22px',
                          borderRadius: '16px',
                          border:
                            statusClass === 'critical'
                              ? '1px solid rgba(239,68,68,0.32)'
                              : '1px solid rgba(245,158,11,0.25)',
                          background:
                            statusClass === 'critical'
                              ? 'rgba(239,68,68,0.045)'
                              : 'rgba(245,158,11,0.035)',
                        }}
                      >

                        {/* TOP ROW */}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '20px',
                            marginBottom: '20px',
                          }}
                        >

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                            }}
                          >

                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                flexShrink: 0,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 700,
                                background:
                                  statusClass === 'critical'
                                    ? 'rgba(239,68,68,0.13)'
                                    : 'rgba(245,158,11,0.13)',
                                border:
                                  statusClass === 'critical'
                                    ? '1px solid rgba(239,68,68,0.25)'
                                    : '1px solid rgba(245,158,11,0.25)',
                              }}
                            >
                              !
                            </div>

                            <div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  flexWrap: 'wrap',
                                }}
                              >

                                <h3
                                  style={{
                                    margin: 0,
                                    fontSize: '20px',
                                  }}
                                >
                                  {ship.name ||
                                    'Unknown Vessel'}
                                </h3>

                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '5px 9px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.8px',
                                    background:
                                      statusClass === 'critical'
                                        ? 'rgba(239,68,68,0.13)'
                                        : 'rgba(245,158,11,0.13)',
                                  }}
                                >
                                  {statusLabel}
                                </span>

                              </div>

                              <div
                                style={{
                                  marginTop: '5px',
                                  fontSize: '12px',
                                  opacity: 0.5,
                                }}
                              >
                                Vessel ID: {ship.id || 'N/A'}
                              </div>

                            </div>

                          </div>

                          <span
                            style={{
                              fontSize: '12px',
                              opacity: 0.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            LIVE
                          </span>

                        </div>


                        {/* DETAILS */}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(4, minmax(0, 1fr))',
                            gap: '12px',
                          }}
                        >

                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              background:
                                'rgba(255,255,255,0.025)',
                              border:
                                '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                letterSpacing: '1px',
                                opacity: 0.45,
                                marginBottom: '6px',
                              }}
                            >
                              FUEL
                            </div>

                            <strong style={{ fontSize: '15px' }}>
                              {getFuelText(ship)}
                            </strong>
                          </div>


                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              background:
                                'rgba(255,255,255,0.025)',
                              border:
                                '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                letterSpacing: '1px',
                                opacity: 0.45,
                                marginBottom: '6px',
                              }}
                            >
                              DESTINATION
                            </div>

                            <strong style={{ fontSize: '15px' }}>
                              {ship.destination || 'N/A'}
                            </strong>
                          </div>


                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              background:
                                'rgba(255,255,255,0.025)',
                              border:
                                '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                letterSpacing: '1px',
                                opacity: 0.45,
                                marginBottom: '6px',
                              }}
                            >
                              SPEED
                            </div>

                            <strong style={{ fontSize: '15px' }}>
                              {getSpeedText(ship)}
                            </strong>
                          </div>


                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              background:
                                'rgba(255,255,255,0.025)',
                              border:
                                '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                letterSpacing: '1px',
                                opacity: 0.45,
                                marginBottom: '6px',
                              }}
                            >
                              POSITION
                            </div>

                            <strong style={{ fontSize: '13px' }}>
                              {getPositionText(ship)}
                            </strong>
                          </div>

                        </div>


                        {/* SECONDARY DETAILS */}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '20px',
                            marginTop: '14px',
                            paddingTop: '14px',
                            borderTop:
                              '1px solid rgba(255,255,255,0.06)',
                          }}
                        >

                          <div
                            style={{
                              display: 'flex',
                              gap: '24px',
                              flexWrap: 'wrap',
                              fontSize: '12px',
                              opacity: 0.6,
                            }}
                          >

                            <span>
                              Cargo:{' '}
                              <strong style={{ opacity: 1 }}>
                                {ship.cargo || 'N/A'}
                              </strong>
                            </span>

                            <span>
                              Heading:{' '}
                              <strong style={{ opacity: 1 }}>
                                {typeof ship.heading === 'number'
                                  ? `${ship.heading}°`
                                  : 'N/A'}
                              </strong>
                            </span>

                          </div>

                          <button
                            onClick={() =>
                              setActivePage('Fleet')
                            }
                            style={{
                              border:
                                '1px solid rgba(255,255,255,0.1)',
                              background:
                                'rgba(255,255,255,0.04)',
                              borderRadius: '8px',
                              padding: '9px 14px',
                              cursor: 'pointer',
                              color: 'inherit',
                              fontSize: '11px',
                              fontWeight: 600,
                              letterSpacing: '0.5px',
                            }}
                          >
                            VIEW FLEET →
                          </button>

                        </div>

                      </div>

                    )
                  })}

                </div>

              )}

            </section>

          ) : (

            /* =====================================================
               DASHBOARD
               ===================================================== */

            <>

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
                    <span>at a glance.</span>
                  </h2>

                  <p>
                    Real-time visibility across commercial vessels,
                    operational alerts, and crisis response operations
                    in the Strait of Hormuz.
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
                      Last update: {lastUpdateText}
                    </small>

                  </div>

                </div>

              </section>


              {/* STATS */}

              <section className="stats">

                <div className="stat-card">

                  <div className="stat-top">
                    <span>ACTIVE VESSELS</span>
                    <div className="stat-icon blue">▦</div>
                  </div>

                  <strong>
                    {activeShips
                      .toString()
                      .padStart(2, '0')}
                  </strong>

                  <div className="stat-footer positive">
                    <span>● LIVE</span>
                    <small>active vessels</small>
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-top">
                    <span>TRACKED SHIPS</span>
                    <div className="stat-icon purple">▣</div>
                  </div>

                  <strong>
                    {activeShips}
                  </strong>

                  <div className="stat-footer positive">
                    <span>● SYNCHRONIZED</span>
                    <small>real-time tracking</small>
                  </div>

                </div>


                <div className="stat-card danger-card">

                  <div className="stat-top">
                    <span>ACTIVE ALERTS</span>
                    <div className="stat-icon red">⚠</div>
                  </div>

                  <strong>
                    {alertShips
                      .toString()
                      .padStart(2, '0')}
                  </strong>

                  <div className="stat-footer danger-text">
                    <span>● LIVE ALERTS</span>
                  </div>

                </div>


                <div className="stat-card">

                  <div className="stat-top">
                    <span>NORMAL VESSELS</span>
                    <div className="stat-icon green">✓</div>
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

                {/* REAL LIVE MAP */}

                <div className="panel map-panel">

                  <div className="panel-header">

                    <div>

                      <span className="panel-label">
                        LIVE OPERATIONS
                      </span>

                      <h3>
                        Fleet Deployment Map
                      </h3>

                    </div>

                    <button className="panel-action">
                      EXPAND ↗
                    </button>

                  </div>

                  <div
                    className="map"
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >

                    <FleetMap ships={ships} />

                    <div className="map-legend">

                      <span>
                        <i className="green-dot"></i>
                        Normal
                      </span>

                      <span>
                        <i className="blue-dot"></i>
                        Tracked
                      </span>

                      <span>
                        <i className="red-dot"></i>
                        Alert
                      </span>

                    </div>

                  </div>

                </div>


                {/* CRISIS */}

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
                      {alertShips
                        .toString()
                        .padStart(2, '0')} ACTIVE
                    </span>

                  </div>


                  <div className="crisis-list">

                    {ships
                      .filter(
                        (ship) =>
                          ship.status !== 'normal'
                      )
                      .slice(0, 3)
                      .map((ship, index) => (

                        <div
                          className={`crisis-item ${
                            ship.status
                          }`}
                          key={
                            ship.id ||
                            ship.name ||
                            `alert-${index}`
                          }
                        >

                          <div className="crisis-indicator">
                            !
                          </div>

                          <div className="crisis-info">

                            <div className="crisis-title-row">

                              <strong>
                                {ship.name}
                              </strong>

                              <span>
                                {getStatusLabel(
                                  ship.status
                                )}
                              </span>

                            </div>

                            <p>
                              ◉ Destination:{' '}
                              {ship.destination}
                            </p>

                            <small>
                              {ship.cargo} ·{' '}
                              {ship.speed_knots} kn
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

                      ))}


                    {alertShips === 0 && (

                      <div className="crisis-item normal">

                        <div className="crisis-indicator">
                          ✓
                        </div>

                        <div className="crisis-info">

                          <div className="crisis-title-row">

                            <strong>
                              All vessels normal
                            </strong>

                            <span>
                              NOMINAL
                            </span>

                          </div>

                          <p>
                            ◉ No active fleet alerts
                          </p>

                          <small>
                            Continuous monitoring active
                          </small>

                        </div>

                      </div>

                    )}

                  </div>


                  <button
                    className="view-all"
                    onClick={() =>
                      setActivePage('Crisis Center')
                    }
                  >
                    VIEW ALL ALERTS
                    <span>→</span>
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
                        setActivePage('Fleet')
                      }
                    >
                      VIEW FLEET →
                    </button>

                  </div>


                  <div className="fleet-table">

                    <div className="table-head">
                      <span>VESSEL</span>
                      <span>CARGO</span>
                      <span>DESTINATION</span>
                      <span>STATUS</span>
                      <span>FUEL</span>
                    </div>


                    {ships
                      .slice(0, 6)
                      .map((ship, index) => (

                        <div
                          className="fleet-row"
                          key={
                            ship.id ||
                            ship.name ||
                            `fleet-${index}`
                          }
                        >

                          <strong>
                            {ship.name}
                          </strong>

                          <span>
                            {ship.cargo}
                          </span>

                          <span>
                            → {ship.destination}
                          </span>

                          <span
                            className={`unit-status ${
                              ship.status
                            }`}
                          >
                            <i></i>

                            {getStatusLabel(
                              ship.status
                            )}

                          </span>

                          <div className="battery">

                            <div>

                              <span
                                style={{
                                  width: `${Math.min(
                                    ((ship.fuel_tons || 0) /
                                      100) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></span>

                            </div>

                            <small>

                              {typeof ship.fuel_tons ===
                              'number'
                                ? ship.fuel_tons.toLocaleString()
                                : 'N/A'}

                              {typeof ship.fuel_tons ===
                              'number'
                                ? ' t'
                                : ''}

                            </small>

                          </div>

                        </div>

                      ))}


                    {ships.length === 0 && (

                      <div className="fleet-row">

                        <span>
                          Waiting for fleet telemetry...
                        </span>

                      </div>

                    )}

                  </div>

                </div>


                {/* RESPONSE */}

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

                    {ships.length > 0 ? (

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
                              {ships[0].name}
                            </strong>

                            <small>
                              {ships[0].cargo} ·{' '}
                              {ships[0].speed_knots} kn
                            </small>

                          </div>

                        </div>


                        <div className="route-line">
                          <span>LIVE</span>
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
                              {ships[0].destination}
                            </strong>

                            <small>
                              Heading {ships[0].heading}°
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
                            Waiting for telemetry...
                          </strong>

                        </div>

                      </div>

                    )}

                  </div>


                  <button
                    className="dispatch-button"
                    onClick={() =>
                      setActivePage('Fleet')
                    }
                  >
                    OPEN FLEET CONTROL
                    <span>→</span>
                  </button>

                </div>

              </section>

            </>

          )}

        </div>

      </main>

    </div>
  )
}

export default App