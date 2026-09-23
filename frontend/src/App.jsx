import { useEffect, useState } from 'react'
import './App.css'

const fleetUnits = [
  { id: 'UNIT-042', type: 'Rescue Van', location: 'Sector 7', status: 'DISPATCHED', battery: 86 },
  { id: 'UNIT-018', type: 'Emergency SUV', location: 'Gulberg', status: 'AVAILABLE', battery: 94 },
  { id: 'UNIT-031', type: 'Medical Van', location: 'DHA Phase 6', status: 'AVAILABLE', battery: 78 },
  { id: 'UNIT-067', type: 'Response Truck', location: 'Model Town', status: 'WARNING', battery: 41 },
]

const crises = [
  {
    id: 'CRISIS-03',
    title: 'Vehicle Collision',
    location: 'Sector 7, Lahore',
    priority: 'CRITICAL',
    time: '04:32',
  },
  {
    id: 'CRISIS-02',
    title: 'Medical Emergency',
    location: 'Gulberg III',
    priority: 'HIGH',
    time: '11:18',
  },
  {
    id: 'CRISIS-01',
    title: 'Road Blockage',
    location: 'Canal Road',
    priority: 'MEDIUM',
    time: '22:46',
  },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

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
              className={`nav-button ${activePage === name ? 'selected' : ''}`}
              onClick={() => setActivePage(name)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{name}</span>
              {name === 'Crisis Center' && (
                <span className="nav-alert">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="network-card">
            <div className="online-dot"></div>
            <div>
              <strong>SYSTEM ONLINE</strong>
              <span>All services operational</span>
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
              <span></span>
              LIVE MONITORING
            </div>

            <div className="clock">
              <span className="clock-icon">◷</span>
              {formattedTime}
            </div>

            <div className="notification">
              ♢
              <b>3</b>
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
                Real-time visibility across your fleet, active incidents,
                and emergency response operations.
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
                <strong>OPERATIONAL</strong>
                <small>98.7% fleet connectivity</small>
              </div>
            </div>

          </section>

          {/* STATS */}
          <section className="stats">

            <div className="stat-card">
              <div className="stat-top">
                <span>ACTIVE FLEETS</span>
                <div className="stat-icon blue">▦</div>
              </div>

              <strong>24</strong>

              <div className="stat-footer positive">
                <span>↗ 8.2%</span>
                <small>vs last week</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>TRACKED VEHICLES</span>
                <div className="stat-icon purple">▣</div>
              </div>

              <strong>148</strong>

              <div className="stat-footer positive">
                <span>↗ 12.4%</span>
                <small>vs last week</small>
              </div>
            </div>

            <div className="stat-card danger-card">
              <div className="stat-top">
                <span>ACTIVE CRISIS</span>
                <div className="stat-icon red">⚠</div>
              </div>

              <strong>03</strong>

              <div className="stat-footer danger-text">
                <span>● 2 require attention</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>AVAILABLE UNITS</span>
                <div className="stat-icon green">✓</div>
              </div>

              <strong>67</strong>

              <div className="availability">
                <div>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <small>45% ready capacity</small>
              </div>
            </div>

          </section>

          {/* MAIN GRID */}
          <section className="main-grid">

            {/* MAP */}
            <div className="panel map-panel">

              <div className="panel-header">
                <div>
                  <span className="panel-label">LIVE OPERATIONS</span>
                  <h3>Fleet Deployment Map</h3>
                </div>

                <button className="panel-action">
                  EXPAND ↗
                </button>
              </div>

              <div className="map">

                <div className="map-grid"></div>

                <div className="road road-one"></div>
                <div className="road road-two"></div>
                <div className="road road-three"></div>
                <div className="road road-four"></div>

                <div className="map-label label-one">SECTOR 7</div>
                <div className="map-label label-two">GULBERG</div>
                <div className="map-label label-three">DHA</div>

                <div className="map-point point-one">
                  <div className="pulse"></div>
                  <span>42</span>
                </div>

                <div className="map-point point-two">
                  <div className="pulse"></div>
                  <span>18</span>
                </div>

                <div className="map-point point-three">
                  <div className="pulse"></div>
                  <span>31</span>
                </div>

                <div className="map-point crisis-point">
                  <div className="crisis-pulse"></div>
                  <span>!</span>
                </div>

                <div className="map-controls">
                  <button>+</button>
                  <button>−</button>
                </div>

                <div className="map-legend">
                  <span><i className="green-dot"></i> Available</span>
                  <span><i className="blue-dot"></i> Dispatched</span>
                  <span><i className="red-dot"></i> Crisis</span>
                </div>

              </div>

            </div>

            {/* CRISIS */}
            <div className="panel crisis-panel">

              <div className="panel-header">
                <div>
                  <span className="panel-label">INCIDENT RESPONSE</span>
                  <h3>Active Crisis</h3>
                </div>

                <span className="crisis-count">03 ACTIVE</span>
              </div>

              <div className="crisis-list">

                {crises.map((crisis) => (
                  <div
                    className={`crisis-item ${crisis.priority.toLowerCase()}`}
                    key={crisis.id}
                  >

                    <div className="crisis-indicator">
                      !
                    </div>

                    <div className="crisis-info">
                      <div className="crisis-title-row">
                        <strong>{crisis.title}</strong>
                        <span>{crisis.priority}</span>
                      </div>

                      <p>◉ {crisis.location}</p>

                      <small>
                        {crisis.id} · {crisis.time} ago
                      </small>
                    </div>

                    <button className="arrow-button">→</button>

                  </div>
                ))}

              </div>

              <button
                className="view-all"
                onClick={() => setActivePage('Crisis Center')}
              >
                VIEW ALL INCIDENTS
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
                  <span className="panel-label">UNIT MONITORING</span>
                  <h3>Fleet Status</h3>
                </div>

                <button
                  className="panel-action"
                  onClick={() => setActivePage('Fleet')}
                >
                  VIEW FLEET →
                </button>
              </div>

              <div className="fleet-table">

                <div className="table-head">
                  <span>UNIT</span>
                  <span>TYPE</span>
                  <span>LOCATION</span>
                  <span>STATUS</span>
                  <span>BATTERY</span>
                </div>

                {fleetUnits.map((unit) => (
                  <div className="fleet-row" key={unit.id}>

                    <strong>{unit.id}</strong>

                    <span>{unit.type}</span>

                    <span>◉ {unit.location}</span>

                    <span className={`unit-status ${unit.status.toLowerCase()}`}>
                      <i></i>
                      {unit.status}
                    </span>

                    <div className="battery">
                      <div>
                        <span style={{ width: `${unit.battery}%` }}></span>
                      </div>
                      <small>{unit.battery}%</small>
                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* RESPONSE */}
            <div className="panel response-panel">

              <div className="panel-header">
                <div>
                  <span className="panel-label">EMERGENCY RESPONSE</span>
                  <h3>Current Dispatch</h3>
                </div>

                <div className="dispatch-live">
                  ● LIVE
                </div>
              </div>

              <div className="dispatch-route">

                <div className="dispatch-node">
                  <div className="node-icon">!</div>
                  <div>
                    <span>INCIDENT</span>
                    <strong>CRISIS-03</strong>
                    <small>Sector 7, Lahore</small>
                  </div>
                </div>

                <div className="route-line">
                  <span>04:32</span>
                </div>

                <div className="dispatch-node">
                  <div className="node-icon vehicle">▣</div>
                  <div>
                    <span>RESPONDING UNIT</span>
                    <strong>UNIT-042</strong>
                    <small>ETA 03:18</small>
                  </div>
                </div>

              </div>

              <button
                className="dispatch-button"
                onClick={() => setActivePage('Dispatch')}
              >
                OPEN DISPATCH CONTROL
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