from fastapi import APIRouter, HTTPException, Query
from app.services.tide_service import get_today_tides, get_tides_for_date

router = APIRouter(prefix="/api/v1/tides", tags=["tides"])


@router.get("/hagonoy/today")
def today():
    try:
        return get_today_tides()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/hagonoy")
def by_date(date: str = Query(..., description="YYYY-MM-DD")):
    try:
        return get_tides_for_date(date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))