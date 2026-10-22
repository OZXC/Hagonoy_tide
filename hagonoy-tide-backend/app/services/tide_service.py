from datetime import date
from app.data.hagonoy_tides import HAGONOY_TIDES
from app.models.tide import TideEvent, TideLocation, TideDayResponse

HAGONOY_LOCATION = TideLocation(
    id="hagonoy",
    name="Hagonoy",
    province="Bulacan",
    country="Philippines",
)


def get_tides_for_date(target_date: str) -> TideDayResponse:
    raw_events = HAGONOY_TIDES.get(target_date)
    if raw_events is None:
        raise ValueError(f"No tide data for {target_date}")

    events = [TideEvent(**e) for e in raw_events]
    return TideDayResponse(
        location=HAGONOY_LOCATION,
        date=target_date,
        timezone="Asia/Manila",
        events=events,
    )


def get_today_tides() -> TideDayResponse:
    today_str = date.today().isoformat()
    return get_tides_for_date(today_str)