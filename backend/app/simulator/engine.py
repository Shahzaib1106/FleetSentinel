import asyncio
import math

from app.services.fleet_service import get_initial_fleet
from app.services.routing_service import calculate_route
from app.schemas.fleet import Fleet


class FleetSimulator:
    """
    Simulates fleet movement, fuel consumption,
    and basic operational risk.
    """

    FUEL_BURN_PER_KNOT_HOUR = 0.12

    WARNING_FUEL_PERCENT = 30.0
    CRITICAL_FUEL_PERCENT = 15.0
    INSUFFICIENT_FUEL_PERCENT = 5.0

    def __init__(self):
        self.fleet: Fleet = get_initial_fleet()

        self.initial_fuel = {
            ship.id: ship.fuel_tons
            for ship in self.fleet.ships
        }

        for ship in self.fleet.ships:
            ship.route = calculate_route(
                ship.position,
                ship.destination,
            )

        self.running = False

    def calculate_heading(self, current, target):
        lat1 = math.radians(current.lat)
        lat2 = math.radians(target.lat)

        delta_lng = math.radians(
            target.lng - current.lng
        )

        x = (
            math.sin(delta_lng)
            * math.cos(lat2)
        )

        y = (
            math.cos(lat1)
            * math.sin(lat2)
            -
            math.sin(lat1)
            * math.cos(lat2)
            * math.cos(delta_lng)
        )

        bearing = math.degrees(
            math.atan2(x, y)
        )

        return (bearing + 360) % 360

    def get_fuel_percent(self, ship) -> float:
        starting_fuel = self.initial_fuel.get(
            ship.id,
            ship.fuel_tons,
        )

        if starting_fuel <= 0:
            return 0.0

        return max(
            0.0,
            min(
                100.0,
                (
                    ship.fuel_tons
                    / starting_fuel
                )
                * 100,
            ),
        )

    def consume_fuel(
        self,
        ship,
        delta_seconds: float,
    ):
        if ship.speed_knots <= 0:
            return

        if ship.status in {
            "stopped",
            "stranded",
            "arrived",
            "insufficient_fuel",
        }:
            return

        hours = (
            max(delta_seconds, 0.0)
            / 3600.0
        )

        fuel_used = (
            ship.speed_knots
            * self.FUEL_BURN_PER_KNOT_HOUR
            * hours
        )

        ship.fuel_tons = max(
            0.0,
            ship.fuel_tons - fuel_used,
        )

    def evaluate_risk(self, ship):
        if ship.status in {
            "stranded",
            "stopped",
            "arrived",
            "rerouting",
            "distressed",
        }:
            return

        fuel_percent = (
            self.get_fuel_percent(ship)
        )

        if (
            fuel_percent
            <= self.INSUFFICIENT_FUEL_PERCENT
        ):
            ship.status = "insufficient_fuel"

        elif (
            fuel_percent
            <= self.CRITICAL_FUEL_PERCENT
        ):
            ship.status = "critical"

        elif (
            fuel_percent
            <= self.WARNING_FUEL_PERCENT
        ):
            ship.status = "warning"

        else:
            ship.status = "normal"

    def update_ship_position(
        self,
        ship,
        delta_seconds: float = 1.0,
    ):
        """
        Move vessel according to either:
        - its calculated route
        - manually assigned heading
        """

        if ship.status in {
            "stopped",
            "stranded",
            "arrived",
            "insufficient_fuel",
        }:
            return

        # ---------------------------------------------------------
        # MANUAL HEADING MODE
        # ---------------------------------------------------------

        if ship.manual_heading:

            if ship.speed_knots <= 0:
                return

            distance_nm = (
                ship.speed_knots
                * delta_seconds
                / 3600
            )

            lat_distance = (
                distance_nm / 60
            )

            heading_rad = math.radians(
                ship.heading
            )

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

            ship.position.lat += delta_lat
            ship.position.lng += delta_lng

            return

        # ---------------------------------------------------------
        # ROUTE MODE
        # ---------------------------------------------------------

        if not ship.route:
            return

        if (
            ship.route_index
            >= len(ship.route)
        ):
            ship.status = "arrived"
            return

        target = ship.route[
            ship.route_index
        ]

        ship.heading = (
            self.calculate_heading(
                ship.position,
                target,
            )
        )

        distance_nm = (
            ship.speed_knots
            * delta_seconds
            / 3600
        )

        lat_distance = (
            distance_nm / 60
        )

        heading_rad = math.radians(
            ship.heading
        )

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

        new_lat = (
            ship.position.lat
            + delta_lat
        )

        new_lng = (
            ship.position.lng
            + delta_lng
        )

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

        if (
            movement_distance
            >= remaining_distance
        ):
            ship.position.lat = (
                target.lat
            )

            ship.position.lng = (
                target.lng
            )

            ship.route_index += 1

            if (
                ship.route_index
                >= len(ship.route)
            ):
                ship.status = "arrived"

        else:
            ship.position.lat = new_lat
            ship.position.lng = new_lng

    def tick(
        self,
        delta_seconds: float = 1.0,
    ):
        for ship in self.fleet.ships:

            self.update_ship_position(
                ship,
                delta_seconds,
            )

            self.consume_fuel(
                ship,
                delta_seconds,
            )

            self.evaluate_risk(ship)

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