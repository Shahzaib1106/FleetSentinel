import math
import asyncio

from app.services.fleet_service import get_initial_fleet
from app.schemas.fleet import Fleet


class FleetSimulator:
    def __init__(self):
        self.fleet: Fleet = get_initial_fleet()
        self.running = False

    def update_ship_position(self, ship, delta_seconds: float = 1.0):
        """
        Move ship using:
        speed = knots
        heading = degrees
        time = seconds
        """

        # 1 knot = 1 nautical mile/hour
        distance_nm = ship.speed_knots * (delta_seconds / 3600)

        # Convert nautical miles to degrees
        # Approximation suitable for our simulation area
        lat_distance = distance_nm / 60

        heading_rad = math.radians(ship.heading)

        delta_lat = lat_distance * math.cos(heading_rad)

        # Longitude degree length depends on latitude
        longitude_scale = 60 * math.cos(
            math.radians(ship.position.lat)
        )

        if abs(longitude_scale) < 0.001:
            delta_lng = 0
        else:
            delta_lng = (
                distance_nm * math.sin(heading_rad)
                / longitude_scale
            )

        ship.position.lat += delta_lat
        ship.position.lng += delta_lng

    def tick(self):
        """
        Perform one simulator tick.
        """

        for ship in self.fleet.ships:
            self.update_ship_position(ship)

    async def run(self):
        """
        Run simulator at 1 Hz.
        """

        self.running = True

        while self.running:
            start_time = asyncio.get_event_loop().time()

            self.tick()

            elapsed = asyncio.get_event_loop().time() - start_time

            # Keep simulator at approximately 1 Hz
            sleep_time = max(0, 1.0 - elapsed)

            await asyncio.sleep(sleep_time)

    def stop(self):
        self.running = False