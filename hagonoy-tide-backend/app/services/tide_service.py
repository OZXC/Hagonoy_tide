
from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx

from openwaters import fetch_extremes, fetch_timeline
from app.models.tide import TideEvent, TideLocation, TideDayResponse

PH_TIMEZONE = ZoneInfo("Asia/Manila")

HAGONOY_LOCATION = TideLocation(
    id="hagonoy",
    name="Hagonoy",
    province="Bulacan",
    country="Philippines",
)


async def get_tides_for_date(target_date: str) -> TideDayResponse:
    try:
        parsed_date = date.fromisoformat(target_date)
    except ValueError as exc:
        raise ValueError("Date must use YYYY-MM-DD format") from exc

    try:
        payload = await fetch_extremes(parsed_date)
        events = [
            TideEvent(**event)
            for event in payload["events"]
        ]
    except httpx.HTTPError as exc:
        raise RuntimeError(
            "Unable to retrieve tide predictions from OpenWaters."
        ) from exc
    except (KeyError, TypeError) as exc:
        raise RuntimeError(
            "OpenWaters returned an unexpected tide response."
        ) from exc

    return TideDayResponse(
        location=HAGONOY_LOCATION,
        date=parsed_date.isoformat(),
        timezone="Asia/Manila",
        events=events,
    )


async def get_today_tides() -> TideDayResponse:
    today = datetime.now(PH_TIMEZONE).date()
    return await get_tides_for_date(today.isoformat())


async def get_timeline_for_date(target_date: str) -> dict:
    try:
        parsed_date = date.fromisoformat(target_date)
    except ValueError as exc:
        raise ValueError("Date must use YYYY-MM-DD format") from exc

    try:
        return await fetch_timeline(parsed_date)
    except httpx.HTTPError as exc:
        raise RuntimeError(
            "Unable to retrieve the water-level timeline from OpenWaters."
        ) from exc
