import asyncio
import math

from app.services.fleet_service import get_initial_fleet
from app.schemas.fleet import Fleet


class FleetSimulator:
    def __init__(self):
        self.fleet: Fleet = get_initial_fleet()
        self.running = False

    def update_ship_position(
        self,
        ship,
        delta_seconds: float = 1.0,
    ):
        """
        Advance a ship according to its current speed and heading.

        Speed: knots
        Heading: degrees from true north
        Time: seconds
        """

        if ship.status in {"stopped", "stranded", "arrived"}:
            return

        # 1 knot = 1 nautical mile per hour
        distance_nm = ship.speed_knots * (delta_seconds / 3600)

        # 1 degree latitude ≈ 60 nautical miles
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

    def tick(self, delta_seconds: float = 1.0):
        """
        Advance the complete fleet by one simulation tick.
        """

        for ship in self.fleet.ships:
            self.update_ship_position(
                ship,
                delta_seconds,
            )

    async def run(self):
        """
        Run the simulator at approximately 1 Hz.
        """

        self.running = True

        previous_time = asyncio.get_event_loop().time()

        while self.running:
            current_time = asyncio.get_event_loop().time()
            delta_seconds = current_time - previous_time
            previous_time = current_time

            self.tick(delta_seconds)

            await asyncio.sleep(1)

    def stop(self):
        self.running = False