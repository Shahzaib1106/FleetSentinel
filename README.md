# FleetSentinel — Maritime Crisis Command

Real-time crisis operations dashboard for the Code Rush Web Dev Track scenario.

## Stack
- React + Vite
- React Leaflet + Leaflet Draw
- FastAPI + Python 3.11
- WebSocket real-time fleet telemetry
- Open-Meteo weather integration
- Docker Compose

## Implemented core
- Exactly 15 provided cargo ships
- 1 Hz backend simulation and WebSocket broadcast
- Smooth frontend interpolation
- Command dispatch: reroute, speed, heading, hold
- Runtime restricted zones with edit/delete and backend persistence
- Navigable-water constrained route calculation and rerouting
- Geofence and 2 km proximity alerts
- Fuel risk states and 30% adverse-weather fuel penalty
- Weather-aware fleet telemetry
- Captain distress endpoint with structured severity/problem/injury extraction
- One-hour fleet playback buffer at 30-second snapshots

## Local run
### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# keep this terminal running
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

WebSocket: `ws://127.0.0.1:8000/ws/fleet`
API: `http://127.0.0.1:8000`

After stopping backend work, run `deactivate` in the backend terminal.

## Docker
```powershell
docker compose up --build
```
Then open `http://localhost`.

## Main APIs
- `GET /health`
- `GET /api/fleet`
- `POST /api/dispatch/command`
- `GET /api/dispatch/incidents`
- `POST /api/dispatch/incident/action`
- `GET/POST/PUT/DELETE /api/dispatch/zones`
- `GET /api/dispatch/alerts`
- `GET /api/dispatch/playback`
- `POST /api/dispatch/distress`
- `WS /ws/fleet`

## Notes
Weather uses Open-Meteo's free forecast endpoint. If the weather service is temporarily unavailable, the simulator falls back to neutral weather instead of stopping the fleet.
