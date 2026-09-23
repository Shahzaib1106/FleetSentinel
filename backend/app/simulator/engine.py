import asyncio
import math

from app.services.fleet_service import get_initial_fleet
from app.services.routing_service import calculate_route
from app.schemas.fleet import Fleet


class FleetSimulator:
    def __init__(self):
        self.fleet: Fleet = get_initial_fleet()

        # Calculate an initial route for every ship.
        for ship in self.fleet.ships:
            ship.route = calculate_route(
                ship.position,
                ship.destination,
            )

        self.running = False

    def calculate_heading(self, current, target):
        """
        Calculate bearing from current position to target.
        0 degrees = North
        90 degrees = East
        180 degrees = South
        270 degrees = West
        """

        lat1 = math.radians(current.lat)
        lat2 = math.radians(target.lat)

        delta_lng = math.radians(
            target.lng - current.lng
        )

        x = math.sin(delta_lng) * math.cos(lat2)

        y = (
            math.cos(lat1) * math.sin(lat2)
            - math.sin(lat1)
            * math.cos(lat2)
            * math.cos(delta_lng)
        )

        bearing = math.degrees(
            math.atan2(x, y)
        )

        return (bearing + 360) % 360

    def update_ship_position(
        self,
        ship,
        delta_seconds: float = 1.0,
    ):
        """
        Move the ship toward its current route waypoint.
        """

        if ship.status in {
            "stopped",
            "stranded",
            "arrived",
        }:
            return

        if not ship.route:
            return

        if ship.route_index >= len(ship.route):
            ship.status = "arrived"
            return

        target = ship.route[ship.route_index]

        # Update heading toward current waypoint.
        ship.heading = self.calculate_heading(
            ship.position,
            target,
        )

        # 1 knot = 1 nautical mile/hour.
        distance_nm = (
            ship.speed_knots
            * delta_seconds
            / 3600
        )

        # 1 degree latitude ≈ 60 nautical miles.
        lat_distance = distance_nm / 60

        heading_rad = math.radians(ship.heading)

        delta_lat = (
            lat_distance
            * math.cos(heading_rad)
        )

        longitude_scale = (
            60
            * math.cos(
                math.radians(
                    ship.position.lat
                )
            )
        )

        if abs(longitude_scale) < 0.001:
            delta_lng = 0
        else:
            delta_lng = (
                distance_nm
                * math.sin(heading_rad)
                / longitude_scale
            )

        new_lat = ship.position.lat + delta_lat
        new_lng = ship.position.lng + delta_lng

        # Check whether the waypoint was reached.
        remaining_distance = math.sqrt(
            (
                target.lat
                - ship.position.lat
            ) ** 2
            +
            (
                target.lng
                - ship.position.lng
            ) ** 2
        )

        movement_distance = math.sqrt(
            delta_lat ** 2
            +
            delta_lng ** 2
        )

        if movement_distance >= remaining_distance:
            ship.position.lat = target.lat
            ship.position.lng = target.lng

            ship.route_index += 1

            if ship.route_index >= len(ship.route):
                ship.status = "arrived"
        else:
            ship.position.lat = new_lat
            ship.position.lng = new_lng

    def tick(self, delta_seconds: float = 1.0):
        for ship in self.fleet.ships:
            self.update_ship_position(
                ship,
                delta_seconds,
            )

    async def run(self):
        self.running = True

        previous_time = (
            asyncio.get_event_loop().time()
        )

        while self.running:
            current_time = (
                asyncio.get_event_loop().time()
            )

            delta_seconds = (
                current_time
                - previous_time
            )

            previous_time = current_time

            self.tick(delta_seconds)

            await asyncio.sleep(1)

    def stop(self):
        self.running = False