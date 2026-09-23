from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI

from app.services.fleet_service import get_initial_fleet
from app.api.websocket import router as websocket_router
from app.api.websocket import simulator_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    simulator_task = asyncio.create_task(simulator_loop())

    yield

    simulator_task.cancel()


app = FastAPI(
    title="Fleet Crisis Command System",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(websocket_router)


@app.get("/")
async def root():
    return {
        "system": "Fleet Crisis Command System",
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }


@app.get("/api/fleet")
async def get_fleet():
    fleet = get_initial_fleet()

    return {
        "count": fleet.count,
        "ships": fleet.ships,
    }