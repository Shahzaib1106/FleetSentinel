import asyncio
import json
import time

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from app.simulator.engine import (
    FleetSimulator,
)


router = APIRouter()

simulator = FleetSimulator()


class ConnectionManager:

    def __init__(self):

        self.active_connections: list[
            WebSocket
        ] = []

    async def connect(
        self,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.active_connections.append(
            websocket
        )

    def disconnect(
        self,
        websocket: WebSocket,
    ):

        if (
            websocket
            in self.active_connections
        ):

            self.active_connections.remove(
                websocket
            )

    async def broadcast(
        self,
        data: dict,
    ):

        if not self.active_connections:
            return

        message = json.dumps(
            data
        )

        connections = list(
            self.active_connections
        )

        results = await asyncio.gather(
            *[
                connection.send_text(
                    message
                )
                for connection
                in connections
            ],
            return_exceptions=True,
        )

        disconnected = []

        for (
            connection,
            result,
        ) in zip(
            connections,
            results,
        ):

            if isinstance(
                result,
                Exception,
            ):

                disconnected.append(
                    connection
                )

        for connection in disconnected:

            self.disconnect(
                connection
            )


manager = ConnectionManager()


def get_fleet_payload():

    return {
        "type": "fleet_update",

        "timestamp": time.time(),

        "count": (
            simulator.fleet.count
        ),

        "ships": [
            ship.model_dump()
            for ship
            in simulator.fleet.ships
        ],
    }


async def simulator_loop():

    previous_time = (
        time.monotonic()
    )

    while True:

        current_time = (
            time.monotonic()
        )

        delta_seconds = (
            current_time
            - previous_time
        )

        previous_time = current_time

        simulator.tick(
            delta_seconds
        )

        await manager.broadcast(
            get_fleet_payload()
        )

        await asyncio.sleep(1)


@router.websocket(
    "/ws/fleet"
)
async def fleet_websocket(
    websocket: WebSocket,
):

    await manager.connect(
        websocket
    )

    try:

        await websocket.send_text(
            json.dumps(
                get_fleet_payload()
            )
        )

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )

    except Exception:

        manager.disconnect(
            websocket
        )