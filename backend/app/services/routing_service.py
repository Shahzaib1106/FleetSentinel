import math
from typing import List, Tuple

from app.schemas.fleet import Position


# Strait of Hormuz / surrounding navigable-water polygon
NAVIGABLE_WATER = [
    (29.80, 48.60),
    (29.50, 50.00),
    (28.80, 50.80),
    (27.80, 52.00),
    (26.70, 53.50),
    (26.30, 55.00),
    (26.65, 56.10),
    (26.50, 56.40),
    (26.00, 56.80),
    (25.50, 57.50),
    (25.50, 58.50),
    (25.00, 60.00),
    (22.00, 60.00),
    (22.50, 60.00),
    (23.80, 58.80),
    (24.50, 57.20),
    (25.20, 56.50),
    (26.45, 56.45),
    (26.30, 55.90),
    (26.00, 55.50),
    (25.30, 54.50),
    (24.80, 53.00),
    (25.30, 52.00),
    (26.40, 51.50),
    (26.50, 50.30),
    (27.50, 49.80),
    (28.50, 49.00),
    (29.50, 48.30),
    (29.80, 48.60),
]


PORTS = {
    "KWT-1": (29.48, 48.34),
    "BUS-1": (28.83, 50.73),
    "DMM-1": (26.56, 50.30),
    "BAH-1": (26.50, 50.55),
    "DOH-1": (25.46, 51.95),
    "AUH-1": (25.22, 54.18),
    "DXB-1": (25.50, 54.75),
    "BND-1": (26.62, 56.11),
    "SOH-1": (24.72, 57.02),
    "MCT-1": (23.92, 58.58),
}


def point_in_polygon(lat: float, lng: float) -> bool:
    """
    Check whether a coordinate lies inside the navigable-water polygon.
    """

    inside = False
    j = len(NAVIGABLE_WATER) - 1

    for i in range(len(NAVIGABLE_WATER)):
        lat_i, lng_i = NAVIGABLE_WATER[i]
        lat_j, lng_j = NAVIGABLE_WATER[j]

        intersects = (
            ((lng_i > lng) != (lng_j > lng))
            and (
                lat
                < (lat_j - lat_i)
                * (lng - lng_i)
                / (lng_j - lng_i + 1e-12)
                + lat_i
            )
        )

        if intersects:
            inside = not inside

        j = i

    return inside


def distance_km(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """
    Approximate geographic distance using the Haversine formula.
    """

    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lng / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_km * c


def calculate_route(
    start: Position,
    destination: str,
) -> List[Position]:
    """
    Create a simple navigable route from the current ship position
    toward the destination.

    The route currently uses intermediate waypoints.
    Dynamic restricted-zone avoidance will be added later.
    """

    if destination not in PORTS:
        raise ValueError(f"Unknown destination: {destination}")

    destination_lat, destination_lng = PORTS[destination]

    start_lat = start.lat
    start_lng = start.lng

    total_distance = distance_km(
        start_lat,
        start_lng,
        destination_lat,
        destination_lng,
    )

    # Short trips can go directly to destination.
    if total_distance < 20:
        return [
            Position(
                lat=destination_lat,
                lng=destination_lng,
            )
        ]

    # Create intermediate points.
    waypoint_count = max(
        2,
        min(12, int(total_distance / 50)),
    )

    route = []

    for i in range(1, waypoint_count + 1):
        progress = i / waypoint_count

        lat = start_lat + (
            destination_lat - start_lat
        ) * progress

        lng = start_lng + (
            destination_lng - start_lng
        ) * progress

        route.append(
            Position(
                lat=lat,
                lng=lng,
            )
        )

    return route