import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.simulator.engine import FleetSimulator


router = APIRouter()

simulator = FleetSimulator()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(data))
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


manager = ConnectionManager()


async def simulator_loop():
    while True:
        simulator.tick()

        fleet_data = {
            "type": "fleet_update",
            "timestamp": asyncio.get_event_loop().time(),
            "count": simulator.fleet.count,
            "ships": [
                ship.model_dump()
                for ship in simulator.fleet.ships
            ],
        }

        await manager.broadcast(fleet_data)

        await asyncio.sleep(1)


@router.websocket("/ws/fleet")
async def fleet_websocket(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        # Send current state immediately after connection
        initial_data = {
            "type": "fleet_update",
            "timestamp": asyncio.get_event_loop().time(),
            "count": simulator.fleet.count,
            "ships": [
                ship.model_dump()
                for ship in simulator.fleet.ships
            ],
        }

        await websocket.send_text(json.dumps(initial_data))

        # Keep connection alive
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)