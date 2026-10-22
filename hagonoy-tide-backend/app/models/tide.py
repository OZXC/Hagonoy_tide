from pydantic import BaseModel
from typing import Literal


class TideEvent(BaseModel):
    type: Literal["HIGH", "LOW"]
    time: str
    height_m: float


class TideLocation(BaseModel):
    id: str
    name: str
    province: str
    country: str


class TideDayResponse(BaseModel):
    location: TideLocation
    date: str
    timezone: str
    events: list[TideEvent]