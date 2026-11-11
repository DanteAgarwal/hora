"""Workbench API Router — Unified Node Retirement Replacement.

Consolidates SQLite persistence, chart computation, live transits, dasha expansion,
and frontend API routes directly inside FastAPI, replacing the Node.js server.
"""
from __future__ import annotations

import datetime
from typing import Any
from fastapi import APIRouter, HTTPException, Request, Response, status

from hora.storage.chart_db import (
    get_charts,
    get_chart,
    save_chart,
    delete_chart,
    get_db_path,
)
from hora.services import (
    aspect_service,
    ashtakavarga_service,
    baadhaka_service,
    chart_service,
    dasha_service,
    functional_service,
    maraka_service,
    transit_service,
    workbench_service,
)
from hora.charts.chart import Place
from hora.core.settings import Settings
from hora.core.timeutil import from_local

router = APIRouter(tags=["workbench"])


# ---------------------------------------------------------------------------
# Health & Status
# ---------------------------------------------------------------------------

@router.get("/api/health")
def api_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "db": str(get_db_path()),
        "hora_api": "http://localhost:8000",
        "hora_status": "ok",
        "hora_version": "connected",
    }


# ---------------------------------------------------------------------------
# Live Chart Computation
# ---------------------------------------------------------------------------

@router.post("/api/compute")
async def api_compute(req: Request) -> dict[str, Any]:
    body = await req.json()
    if not body or not body.get("year") or not body.get("month") or not body.get("day"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Birth data (year, month, day) is required",
        )

    try:
        name = body.get("name") or "Live chart"
        return workbench_service.compute_workbench_chart(name, body)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hora calculation failed: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Saved Charts: CRUD against SQLite
# ---------------------------------------------------------------------------

@router.get("/api/charts")
def api_get_charts() -> list[dict[str, Any]]:
    return get_charts()


@router.get("/api/charts/{chart_id}")
def api_get_chart_by_id(chart_id: int) -> dict[str, Any]:
    chart = get_chart(chart_id)
    if not chart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chart not found",
        )
    return chart


@router.post("/api/charts", status_code=status.HTTP_201_CREATED)
async def api_save_chart(req: Request) -> dict[str, Any]:
    body = await req.json()
    name = body.get("name")
    birth_data = body.get("birthData")
    if not name or not birth_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="name and birthData are required",
        )

    payload = None
    try:
        payload = workbench_service.compute_workbench_chart(name, birth_data)
    except Exception as exc:
        pass

    return save_chart(name, birth_data, payload)


@router.delete("/api/charts/{chart_id}")
def api_delete_chart(chart_id: int) -> dict[str, Any]:
    deleted = delete_chart(chart_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chart not found",
        )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Timing & Dasha Subperiods
# ---------------------------------------------------------------------------

@router.post("/api/dasha/expand")
@router.post("/api/dasha/subperiods")
async def api_dasha_expand(req: Request) -> dict[str, Any]:
    body = await req.json()
    parent = body.get("parent") or body
    if not parent or (not parent.get("lord") and not parent.get("lord_name") and not parent.get("period")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="parent dasha period with lord is required",
        )

    target_level = body.get("targetLevel") or body.get("target_level") or (int(parent.get("level", 1)) + 1)
    system = body.get("system") or "vimshottari"

    try:
        res = dasha_service.expand_period(parent, target_level=target_level, system=system)
        raw_subs = res.get("subperiods", [])
        return {
            "parent": parent,
            "targetLevel": target_level,
            "target_level": target_level,
            "subperiods": [
                workbench_service.normalize_dasha_tree_node(c, target_level)
                for c in raw_subs if c
            ],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Live Transits (Gochara) & Sade Sati
# ---------------------------------------------------------------------------

@router.post("/api/transits/live")
async def api_transits_live(req: Request) -> dict[str, Any]:
    body = await req.json()
    chart_id = body.get("chartId")
    natal_chart = body.get("chart")

    if not natal_chart and chart_id:
        natal_chart = get_chart(int(chart_id))

    if not natal_chart:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Natal chart data or valid chartId is required",
        )

    transit_date_str = body.get("transitDate")
    if transit_date_str:
        try:
            t_date = datetime.datetime.fromisoformat(transit_date_str.replace("Z", "+00:00"))
        except Exception:
            t_date = datetime.datetime.now()
    else:
        t_date = datetime.datetime.now()

    natal_birth_place = natal_chart.get("birthData", {}).get("place", {}) if isinstance(natal_chart.get("birthData"), dict) else {}
    target_place = body.get("place") or natal_birth_place or {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090}
    tz_name = body.get("tz_name") or natal_chart.get("birthData", {}).get("tz_name") or "Asia/Kolkata"

    natal_moon = next((p for p in natal_chart.get("planets", []) if p.get("name") == "Moon"), None)
    natal_moon_lon = float(natal_moon.get("longitude", 0.0)) if natal_moon else 0.0

    natal_lagna_idx = 0
    if natal_chart.get("quickFacts", {}).get("lagna"):
        natal_lagna_idx = workbench_service.parse_sign_index(natal_chart["quickFacts"]["lagna"])
    elif natal_chart.get("houses") and len(natal_chart["houses"]) > 0:
        natal_lagna_idx = max(0, int(natal_chart["houses"][0].get("signNumber", 1)) - 1)

    natal_bav_map = {}
    av_data = natal_chart.get("ashtakavarga", {})
    if isinstance(av_data, dict) and av_data.get("bav"):
        for p_name, bav_row in av_data["bav"].items():
            if isinstance(bav_row, list):
                natal_bav_map[p_name] = bav_row
            elif isinstance(bav_row, dict):
                natal_bav_map[p_name] = bav_row.get("scores") or bav_row.get("rekhas", [])

    try:
        transit_instant = from_local(
            t_date.year, t_date.month, t_date.day, t_date.hour, t_date.minute, t_date.second,
            tz_name=tz_name,
        )
        transit_place = Place(
            latitude=float(target_place.get("latitude", 28.6139)),
            longitude=float(target_place.get("longitude", 77.2090)),
            altitude=0.0,
        )
        transit_report = transit_service.analyze_transits(
            transit_instant=transit_instant,
            transit_place=transit_place,
            settings=Settings(),
            natal_moon_longitude=natal_moon_lon,
            natal_lagna_rasi=natal_lagna_idx,
            natal_bav=natal_bav_map,
        )

        transit_report["natalChart"] = {
            "name": natal_chart.get("name"),
            "date": natal_chart.get("date"),
            "lagna": natal_chart.get("lagna"),
            "moon": natal_chart.get("moon"),
            "planets": [
                {
                    "name": p.get("name"),
                    "symbol": p.get("symbol"),
                    "sign": p.get("sign"),
                    "signIndex": p.get("signIndex"),
                    "dms": p.get("dms"),
                    "houseNumber": p.get("houseNumber"),
                }
                for p in natal_chart.get("planets", [])
            ],
        }
        transit_report["targetPlace"] = target_place
        return transit_report
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute live transits: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Direct Analysis Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/analysis/functional/{lagna}")
def api_functional_lagna(lagna: int) -> dict[str, Any]:
    return functional_service.lagna(int(lagna))

