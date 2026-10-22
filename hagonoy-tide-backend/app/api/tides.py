
from fastapi import APIRouter, HTTPException, Query

from app.services.tide_service import (
    get_today_tides,
    get_tides_for_date,
    get_timeline_for_date,
)

router = APIRouter(prefix="/api/v1/tides", tags=["tides"])


def handle_service_error(error: RuntimeError) -> HTTPException:
    return HTTPException(status_code=502, detail=str(error))


@router.get("/hagonoy/today")
async def today():
    try:
        return await get_today_tides()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise handle_service_error(e) from e


@router.get("/hagonoy")
async def by_date(
    date: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return await get_tides_for_date(date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise handle_service_error(e) from e


@router.get("/hagonoy/timeline")
async def timeline(
    date: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return await get_timeline_for_date(date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise handle_service_error(e) from e
