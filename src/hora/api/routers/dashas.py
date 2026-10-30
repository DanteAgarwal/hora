"""Dasha endpoints.

HTTP only — the calculation lives in :mod:`hora.services.dasha_service`.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from hora.api.deps import to_instant, to_place
from hora.api.models import DashaCatalogOut, DashaResponse
from hora.api.schemas import DashaRequest
from hora.services import dasha_service, reference_service

router = APIRouter(prefix="/v1/dasha", tags=["dashas"])


@router.get("/systems", response_model=DashaCatalogOut,
            summary="Dasha systems currently implemented")
def systems() -> dict:
    return reference_service.dasha_catalog()


@router.post("", response_model=DashaResponse,
             summary="Compute a nakshatra-based dasha tree")
def dasha(req: DashaRequest) -> dict:
    try:
        return dasha_service.dasha_tree(
            to_instant(req), to_place(req), req.settings,
            system=req.system, levels=req.levels, cycles=req.cycles,
            start_star=req.start_star, reckon_from=req.reckon_from,
            as_of=req.as_of, tz_name=req.tz_name,
            utc_offset_hours=req.utc_offset_hours,
        )
    except dasha_service.UnknownDashaSystem as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except dasha_service.BadAsOf as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/expand", summary="Expand a dasha period into its sub-periods")
def expand(req: dict) -> dict:
    try:
        parent = req.get("parent") or req
        target_level = req.get("target_level") or req.get("targetLevel")
        system = req.get("system", "vimshottari")
        utc_offset_hours = req.get("utc_offset_hours", 0.0)
        return dasha_service.expand_period(
            parent,
            target_level=target_level,
            system=system,
            utc_offset_hours=utc_offset_hours,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

