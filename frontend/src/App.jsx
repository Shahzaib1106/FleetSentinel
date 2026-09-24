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

  const alertShips = ships.filter(
    (ship) =>
      ship.status === 'warning' ||
      ship.status === 'critical' ||
      ship.status === 'distress' ||
      ship.status === 'stranded'
  ).length

  const lastUpdateText = lastUpdate
    ? lastUpdate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--'

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo-area">
          <div className="logo-mark">
            <span>FC</span>
          </div>

          <div>
            <h2>FLEET CRISIS</h2>
            <p>COMMAND CENTER</p>
          </div>
        </div>

        <div className="sidebar-label">COMMAND</div>

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
              <span className="nav-icon">{icon}</span>
              <span>{name}</span>

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
            ></div>

            <div>
              <strong>
                {connected ? 'SYSTEM ONLINE' : 'CONNECTING'}
              </strong>

              <span>
                {connected
                  ? 'Fleet telemetry operational'
                  : 'Waiting for backend'}
              </span>
            </div>
          </div>

          <div className="operator">
            <div className="avatar">SA</div>

            <div>
              <strong>COMMAND OPERATOR</strong>
              <span>Administrator</span>
            </div>

            <span className="more">•••</span>
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

            <h1>{activePage}</h1>
          </div>

          <div className="topbar-right">

            <div className="live-status">
              <span
                className={`connection-dot ${
                  connected ? 'online' : 'offline'
                }`}
              ></span>

              {connected
                ? 'FLEET LIVE'
                : 'CONNECTING...'}
            </div>

            <div className="clock">
              <span className="clock-icon">◷</span>
              {formattedTime}
            </div>

            <div className="notification">
              ♢
              <b>{alertShips}</b>
            </div>

          </div>
        </header>

        {/* CONTENT */}
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
                <span>NETWORK STATUS</span>

                <strong>
                  {connected ? 'OPERATIONAL' : 'CONNECTING'}
                </strong>

                <small>
                  Last update: {lastUpdateText}
                </small>
              </div>

            </div>

          </section>

          {/* STATS */}
          <section className="stats">

            {/* ACTIVE VESSELS */}
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

            {/* TRACKED SHIPS */}
            <div className="stat-card">

              <div className="stat-top">
                <span>TRACKED SHIPS</span>
                <div className="stat-icon purple">▣</div>
              </div>

              <strong>{activeShips}</strong>

              <div className="stat-footer positive">
                <span>● SYNCHRONIZED</span>
                <small>real-time tracking</small>
              </div>

            </div>

            {/* ACTIVE ALERTS */}
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

            {/* NORMAL VESSELS */}
            <div className="stat-card">

              <div className="stat-top">
                <span>NORMAL VESSELS</span>
                <div className="stat-icon green">✓</div>
              </div>

              <strong>{normalShips}</strong>

              <div className="availability">
                <div>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <small>operating normally</small>
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

                  <h3>Fleet Deployment Map</h3>
                </div>

                <button className="panel-action">
                  EXPAND ↗
                </button>

              </div>

              <div className="map">
                <FleetMap ships={ships} />
              </div>

            </div>

            {/* CRISIS */}
            <div className="panel crisis-panel">

              <div className="panel-header">

                <div>
                  <span className="panel-label">
                    INCIDENT RESPONSE
                  </span>

                  <h3>Fleet Alerts</h3>
                </div>

                <span className="crisis-count">
                  {alertShips.toString().padStart(2, '0')} ACTIVE
                </span>

              </div>

              <div className="crisis-list">

                {ships
                  .filter(
                    (ship) =>
                      ship.status !== 'normal'
                  )
                  .slice(0, 3)
                  .map((ship) => (

                    <div
                      className={`crisis-item ${ship.status}`}
                      key={ship.id}
                    >

                      <div className="crisis-indicator">
                        !
                      </div>

                      <div className="crisis-info">

                        <div className="crisis-title-row">
                          <strong>{ship.name}</strong>
                          <span>
                            {ship.status.toUpperCase()}
                          </span>
                        </div>

                        <p>
                          ◉ Destination: {ship.destination}
                        </p>

                        <small>
                          {ship.cargo} · {ship.speed_knots} kn
                        </small>

                      </div>

                      <button className="arrow-button">
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
                        <strong>All vessels normal</strong>
                        <span>NOMINAL</span>
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

                  <h3>Fleet Status</h3>
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

                {ships.slice(0, 6).map((ship) => (

                  <div
                    className="fleet-row"
                    key={ship.id}
                  >

                    <strong>{ship.name}</strong>

                    <span>{ship.cargo}</span>

                    <span>
                      → {ship.destination}
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
                              ship.fuel_tons / 100,
                              100
                            )}%`,
                          }}
                        ></span>
                      </div>

                      <small>
                        {ship.fuel_tons.toLocaleString()} t
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

                  <h3>Fleet Command</h3>
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
                        <span>LEAD VESSEL</span>

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
                        <span>DESTINATION</span>

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
                      <span>FLEET STATUS</span>

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

        </div>
      </main>
    </div>
  )
}

export default App