"""Vakri Graha Intelligence Engine FastAPI Router.

Provides deterministic endpoints for retrograde planet analysis, classical rules,
textual sources, and doctrinal conflict resolution.
"""
from __future__ import annotations

from typing import Any, Union
from fastapi import APIRouter, HTTPException, Query

from hora.api.models_vakri import (
    CorpusRuleOut,
    CorpusSourceOut,
    TextualConflictOut,
    VakriAnalysisRequest,
    VakriChartAnalysisOut,
    VakriPlanetAnalysisOut,
)
from hora.services import vakri_service

router = APIRouter(prefix="/v1/astrology", tags=["vakri-analysis"])


@router.post(
    "/vakri-analysis",
    response_model=Union[VakriPlanetAnalysisOut, VakriChartAnalysisOut],
    summary="Deterministic Vakri Graha Intelligence analysis for a planet or entire chart",
)
def vakri_analysis(req: VakriAnalysisRequest) -> dict[str, Any]:
    """Execute the multi-dimensional Vakri Graha analysis pipeline.
    
    If `planet` is specified, returns detailed intelligence for that planet.
    If `planet` is omitted, returns the comprehensive chart-wide analysis.
    """
    try:
        return vakri_service.analyze_vakri(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vakri calculation failed: {str(exc)}") from exc


@router.post(
    "/vakri-analysis/batch",
    response_model=VakriChartAnalysisOut,
    summary="Batch Vakri analysis across all planets for a natal chart",
)
def vakri_analysis_batch(req: VakriAnalysisRequest) -> dict[str, Any]:
    """Run batch analysis for all planets in the chart."""
    req.planet = None  # Force chart-wide analysis
    try:
        return vakri_service.analyze_vakri(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/vakri-rules",
    response_model=list[CorpusRuleOut],
    summary="List all verified classical retrograde rules in the knowledge corpus",
)
def list_rules() -> list[dict[str, Any]]:
    """Retrieve cataloged classical retrograde rules from BPHS, Phaladeepika, etc."""
    return vakri_service.list_vakri_rules()


@router.get(
    "/rules/{rule_id}",
    summary="Retrieve full Sanskrit verse, IAST, and translation for a specific rule",
)
def get_rule(rule_id: str) -> dict[str, Any]:
    """Retrieve verified primary Sanskrit passage and commentary for a specific rule."""
    res = vakri_service.get_vakri_rule(rule_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found in corpus")
    return res


@router.get(
    "/sources",
    response_model=list[CorpusSourceOut],
    summary="List all classical Sanskrit texts and primary passages in the corpus",
)
def list_sources() -> list[dict[str, Any]]:
    """Retrieve all classical textual citations with confidence grades."""
    return vakri_service.list_vakri_sources()


@router.get(
    "/conflicts",
    response_model=list[TextualConflictOut],
    summary="List all classical doctrinal conflicts and display_both resolutions",
)
def list_conflicts() -> list[dict[str, Any]]:
    """Retrieve documented classical disputes (e.g. Phaladeepika vs Uttara Kalamrita)."""
    return vakri_service.list_vakri_conflicts()

