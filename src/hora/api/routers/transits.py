"""Transits API router — Gochara, Vedha, Sade Sati & Ashtakavarga transit scores."""
from __future__ import annotations

import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from hora.charts.chart import Place
from hora.core.settings import Ayanamsa, Settings
from hora.core.timeutil import from_local
from hora.services import transit_service

router = APIRouter(prefix="/v1/transits", tags=["transits"])


class TransitAnalysisRequest(BaseModel):
    natal_moon_longitude: float = Field(..., description="Natal Moon sidereal longitude in degrees (0-360)")
    natal_lagna_rasi: int = Field(0, ge=0, le=11, description="Natal Lagna sign index (0=Aries, ..., 11=Pisces)")
    natal_bav: dict[str, Any] | None = Field(None, description="Bhinna Ashtakavarga points per planet")
    transit_year: int | None = Field(None, description="Transit calendar year (defaults to current)")
    transit_month: int | None = Field(None, description="Transit month 1-12 (defaults to current)")
    transit_day: int | None = Field(None, description="Transit day 1-31 (defaults to current)")
    transit_hour: int = Field(12, ge=0, le=23)
    transit_minute: int = Field(0, ge=0, le=59)
    transit_second: float = Field(0.0, ge=0.0, lt=60.0)
    transit_tz: str = Field("Asia/Kolkata", description="Timezone name")
    latitude: float = Field(28.6139, description="Observation latitude")
    longitude: float = Field(77.2090, description="Observation longitude")
    ayanamsa: str = Field("Lahiri", description="Ayanamsa system name")


@router.post("/analysis", summary="Compute live real-time Gochara, Sade Sati, and Ashtakavarga transit analysis")
def transit_analysis(req: TransitAnalysisRequest) -> dict:
    now = datetime.datetime.now()
    year = req.transit_year or now.year
    month = req.transit_month or now.month
    day = req.transit_day or now.day

    try:
        instant = from_local(
            year, month, day, req.transit_hour, req.transit_minute, req.transit_second,
            tz_name=req.transit_tz
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid date/time for transit: {exc}") from exc

    place = Place(latitude=req.latitude, longitude=req.longitude, altitude=0.0)

    settings = Settings()
    ay_upper = req.ayanamsa.upper()
    for ay in Ayanamsa:
        if ay.name == ay_upper or ay.value.upper() == ay_upper:
            settings = settings.model_copy(update={"ayanamsa": ay})
            break

    try:
        return transit_service.analyze_transits(
            transit_instant=instant,
            transit_place=place,
            settings=settings,
            natal_moon_longitude=req.natal_moon_longitude,
            natal_lagna_rasi=req.natal_lagna_rasi,
            natal_bav=req.natal_bav,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transit calculation error: {exc}") from exc

