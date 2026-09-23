from pydantic import BaseModel, Field
from typing import Literal


class Position(BaseModel):
    lat: float
    lng: float


class Ship(BaseModel):
    id: str
    name: str
    position: Position

    speed_knots: float = Field(ge=0)
    heading: float = Field(ge=0, lt=360)

    destination: str
    fuel_tons: float = Field(ge=0)
    cargo: str

    status: Literal[
        "normal",
        "warning",
        "critical",
        "stranded",
        "distress",
    ] = "normal"


class Fleet(BaseModel):
    ships: list[Ship]

    @property
    def count(self) -> int:
        return len(self.ships)