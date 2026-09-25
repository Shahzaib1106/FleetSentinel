import { useMemo, useState } from 'react'
import './DispatchPage.css'

function getStatusClass(status) {
  if (status === 'critical' || status === 'distressed' || status === 'stranded' || status === 'insufficient_fuel') return 'critical'
  if (status === 'warning' || status === 'rerouting') return 'warning'
  if (status === 'stopped') return 'stopped'
  if (status === 'arrived') return 'arrived'
  return 'normal'
}

function getFuelPercent(fuel) {
  return Math.max(0, Math.min(100, Number(fuel || 0) / 100))
}

export default function DispatchPage({ ships = [] }) {
  const [selectedId, setSelectedId] = useState(ships[0]?.id || '')
  const [command, setCommand] = useState('REROUTE')
  const [destination, setDestination] = useState(ships[0]?.destination || '')
  const [speed, setSpeed] = useState(ships[0]?.speed_knots || 0)
  const [heading, setHeading] = useState(ships[0]?.heading || 0)
  const [priority, setPriority] = useState('HIGH')
  const [queue, setQueue] = useState([])
  const [message, setMessage] = useState('')

  const selectedShip = useMemo(
    () => ships.find((ship) => ship.id === selectedId) || ships[0],
    [ships, selectedId]
  )

  const selectShip = (id) => {
    const ship = ships.find((item) => item.id === id)
    setSelectedId(id)
    if (ship) {
      setDestination(ship.destination || '')
      setSpeed(ship.speed_knots || 0)
      setHeading(ship.heading || 0)
    }
    setMessage('')
  }

  const addCommand = () => {
    if (!selectedShip) return

    const item = {
      id: `${Date.now()}-${selectedShip.id}`,
      vessel: selectedShip.name,
      vesselId: selectedShip.id,
      command,
      destination: command === 'REROUTE' ? destination : '—',
      speed: command === 'SET SPEED' ? Number(speed) : selectedShip.speed_knots,
      heading: command === 'CHANGE HEADING' ? Number(heading) : selectedShip.heading,
      priority,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'QUEUED',
    }

    setQueue((previous) => [item, ...previous].slice(0, 12))
    setMessage(`${command} command queued for ${selectedShip.name}`)
  }

  const clearQueue = () => {
    setQueue([])
    setMessage('Command queue cleared')
  }

  const executeLatest = () => {
    if (!queue.length) return
    setQueue((previous) => previous.map((item, index) => index === 0 ? { ...item, status: 'DISPATCHED' } : item))
    setMessage(`Command dispatched to ${queue[0].vessel}`)
  }

  return (
    <div className="dispatch-page">
      <section className="dispatch-hero">
        <div>
          <div className="dispatch-tag"><span /> FLEET OPERATIONS</div>
          <h2>Dispatch <span>command.</span></h2>
          <p>Prepare, prioritize and queue operational commands against live fleet telemetry.</p>
        </div>
        <div className="dispatch-hero-status">
          <span className="pulse-dot" /> COMMAND LINK
          <strong>{ships.length.toString().padStart(2, '0')}</strong>
          <small>vessels available</small>
        </div>
      </section>

      <section className="dispatch-stats">
        <div className="dispatch-stat"><span>SELECTED VESSEL</span><strong>{selectedShip?.name || '—'}</strong><small>{selectedShip?.id || 'NO TELEMETRY'}</small></div>
        <div className="dispatch-stat"><span>VESSEL STATUS</span><strong className={getStatusClass(selectedShip?.status)}>{(selectedShip?.status || '—').toUpperCase()}</strong><small>Live telemetry</small></div>
        <div className="dispatch-stat"><span>FUEL</span><strong>{selectedShip ? Number(selectedShip.fuel_tons).toLocaleString() : '—'} t</strong><div className="fuel-track"><i style={{ width: `${getFuelPercent(selectedShip?.fuel_tons)}%` }} /></div></div>
        <div className="dispatch-stat"><span>QUEUE</span><strong>{queue.length.toString().padStart(2, '0')}</strong><small>pending commands</small></div>
      </section>

      <section className="dispatch-grid">
        <div className="dispatch-panel command-panel">
          <div className="dispatch-panel-head"><div><span>COMMAND BUILDER</span><h3>Fleet Control</h3></div><b>READY</b></div>

          <label>VESSEL
            <select value={selectedShip?.id || ''} onChange={(e) => selectShip(e.target.value)}>
              {ships.length === 0 && <option value="">Waiting for telemetry...</option>}
              {ships.map((ship) => <option key={ship.id} value={ship.id}>{ship.name} · {ship.id}</option>)}
            </select>
          </label>

          <div className="command-types">
            {['REROUTE', 'SET SPEED', 'CHANGE HEADING', 'HOLD POSITION'].map((item) => (
              <button key={item} className={command === item ? 'active' : ''} onClick={() => setCommand(item)}>{item}</button>
            ))}
          </div>

          {command === 'REROUTE' && (
            <label>DESTINATION
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter destination" />
            </label>
          )}

          {command === 'SET SPEED' && (
            <label>SPEED · KNOTS
              <input type="number" min="0" max="40" value={speed} onChange={(e) => setSpeed(e.target.value)} />
            </label>
          )}

          {command === 'CHANGE HEADING' && (
            <label>HEADING · DEGREES
              <input type="number" min="0" max="359" value={heading} onChange={(e) => setHeading(e.target.value)} />
            </label>
          )}

          {command === 'HOLD POSITION' && <div className="command-note">Vessel will maintain its current telemetry position until a new operational command is issued.</div>}

          <label>PRIORITY
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>CRITICAL</option><option>HIGH</option><option>NORMAL</option>
            </select>
          </label>

          <div className="command-actions">
            <button className="queue-btn" onClick={addCommand} disabled={!selectedShip}>＋ QUEUE COMMAND</button>
            <button className="dispatch-btn" onClick={executeLatest} disabled={!queue.length}>DISPATCH LATEST →</button>
          </div>
          {message && <div className="command-message">✓ {message}</div>}
          <div className="command-disclaimer">Commands are currently staged in the frontend queue. Backend execution integration can be connected next.</div>
        </div>

        <div className="dispatch-panel vessel-panel">
          <div className="dispatch-panel-head"><div><span>LIVE TELEMETRY</span><h3>Vessel Snapshot</h3></div><b className="live-badge">● LIVE</b></div>
          {selectedShip ? (
            <div className="vessel-snapshot">
              <div className="vessel-title"><div className={`vessel-orb ${getStatusClass(selectedShip.status)}`}>◈</div><div><h4>{selectedShip.name}</h4><span>{selectedShip.id} · {selectedShip.cargo}</span></div></div>
              <div className="telemetry-grid">
                <div><span>DESTINATION</span><strong>{selectedShip.destination || '—'}</strong></div>
                <div><span>SPEED</span><strong>{selectedShip.speed_knots} kn</strong></div>
                <div><span>HEADING</span><strong>{Number(selectedShip.heading).toFixed(1)}°</strong></div>
                <div><span>FUEL</span><strong>{Number(selectedShip.fuel_tons).toLocaleString()} t</strong></div>
                <div><span>LATITUDE</span><strong>{Number(selectedShip.position?.lat || 0).toFixed(5)}</strong></div>
                <div><span>LONGITUDE</span><strong>{Number(selectedShip.position?.lng || 0).toFixed(5)}</strong></div>
              </div>
              <div className="snapshot-status"><span>OPERATIONAL STATUS</span><b className={getStatusClass(selectedShip.status)}>{selectedShip.status.toUpperCase()}</b></div>
            </div>
          ) : <div className="empty-state">Waiting for live fleet telemetry...</div>}
        </div>
      </section>

      <section className="dispatch-panel queue-panel">
        <div className="dispatch-panel-head"><div><span>OPERATIONS LOG</span><h3>Command Queue</h3></div><div className="queue-head-actions"><span>{queue.length} QUEUED</span><button onClick={clearQueue}>CLEAR</button></div></div>
        {queue.length === 0 ? <div className="empty-queue">No commands queued. Select a vessel and build an operational command.</div> : (
          <div className="queue-table">
            <div className="queue-row queue-head"><span>VESSEL</span><span>COMMAND</span><span>DETAIL</span><span>PRIORITY</span><span>TIME</span><span>STATUS</span></div>
            {queue.map((item) => <div className="queue-row" key={item.id}><strong>{item.vessel}</strong><span>{item.command}</span><span>{item.destination !== '—' ? item.destination : item.command === 'SET SPEED' ? `${item.speed} kn` : item.command === 'CHANGE HEADING' ? `${item.heading}°` : 'Current position'}</span><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span><span>{item.time}</span><b>{item.status}</b></div>)}
          </div>
        )}
      </section>
    </div>
  )
}
