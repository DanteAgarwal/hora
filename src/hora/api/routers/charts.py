"""Chart endpoints: rasi chart, divisional charts and upagrahas.

HTTP only — every calculation lives in :mod:`hora.services.chart_service`.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from hora.api.deps import to_instant, to_place
from hora.api.models import (
    RasiChartOut,
    SpecialLagnaResponse,
    UpagrahaResponse,
    VargaResponse,
)
from hora.api.models_reference import VargaCatalogOut
from hora.api.schemas import ChartRequest, VargaRequest
from hora.services import chart_service, master_chart_service, reference_service

router = APIRouter(prefix="/v1/chart", tags=["charts"])


@router.post("/master",
             summary="Complete Vedic Kundli master assembly in one single call")
def master_chart(req: ChartRequest) -> dict:
    return master_chart_service.compute_master_chart(
        to_instant(req), to_place(req), req.settings
    )


@router.post("/rasi", response_model=RasiChartOut,
             summary="Full D-1 chart with bhavas, dignities and combustion")
def rasi_chart(req: ChartRequest) -> dict:
    return chart_service.rasi_chart(to_instant(req), to_place(req), req.settings)


@router.post("/vargas", response_model=VargaResponse,
             summary="One or more divisional charts")
def varga_charts(req: VargaRequest) -> dict:
    try:
        return chart_service.varga_charts(
            to_instant(req), to_place(req), req.settings, req.charts, req.variants
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shodasavarga", response_model=VargaResponse,
             summary="All sixteen shodasavarga charts at once")
def shodasavarga(req: ChartRequest) -> dict:
    return chart_service.shodasavarga_charts(to_instant(req), to_place(req), req.settings)


@router.post("/upagrahas", response_model=UpagrahaResponse,
             summary="All eleven upagrahas (book chapter 4)")
def upagrahas(req: ChartRequest) -> dict:
    """Five Sun-based upagrahas plus the six that need the birth time.

    The time-based six depend on whether the birth was by day or by night, so
    the sunrise-anchored day structure is computed and echoed back.
    """
    try:
        return chart_service.upagraha_chart(to_instant(req), to_place(req), req.settings)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/special-lagnas", response_model=SpecialLagnaResponse,
             summary="Bhaava, Hora, Ghati and Sree lagnas (book chapter 5)")
def special_lagnas(req: ChartRequest) -> dict:
    try:
        return chart_service.special_lagnas(to_instant(req), to_place(req), req.settings)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/varga-catalog", response_model=VargaCatalogOut,
            summary="Divisional charts this service knows by name")
def varga_catalog() -> dict:
    return reference_service.varga_catalog()
