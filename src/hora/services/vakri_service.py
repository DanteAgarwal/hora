"""Service layer for Vakri Graha Intelligence calculations."""
from __future__ import annotations

import datetime
from dataclasses import asdict
from typing import Any

from hora.api.models_vakri import VakriAnalysisRequest
from hora.charts.chart import Chart, Place, compute_chart
from hora.charts.vakri import (
    VakriChartAnalysis,
    VakriPlanetAnalysis,
    analyze_chart_vakri,
    analyze_planet_vakri,
)
from hora.content.vakri_corpus import (
    CONFLICTS,
    PASSAGES,
    RULES,
    TEXTS,
    RuleConflict,
)
from hora.core.settings import Ayanamsa, HouseSystem, NodeType, Settings
from hora.core.timeutil import Instant, from_local


def _parse_birth_data_to_instant_and_place(req: VakriAnalysisRequest) -> tuple[Instant, Place, Settings]:
    """Parse flexible birth data and calculation settings into domain objects."""
    # Settings
    settings = Settings()
    calc = req.calculation_settings
    if calc:
        # Ayanamsa
        ay_name = (calc.ayanamsa or "Lahiri").upper()
        for ay in Ayanamsa:
            if ay.name == ay_name or ay.value.upper() == ay_name:
                settings = settings.model_copy(update={"ayanamsa": ay})
                break

        # House system
        hs_name = (calc.house_system or "Whole Sign").lower().replace(" ", "_")
        for hs in HouseSystem:
            if hs.value.lower() == hs_name or hs.name.lower() == hs_name:
                settings = settings.model_copy(update={"house_system": hs})
                break

        # Node type
        if calc.node_type and calc.node_type.lower() == "mean":
            settings = settings.model_copy(update={"node_type": NodeType.MEAN})
        else:
            settings = settings.model_copy(update={"node_type": NodeType.TRUE})

    # Date / Time extraction
    bd = req.birth_data
    year = req.year or (bd.year if bd else None)
    month = req.month or (bd.month if bd else None)
    day = req.day or (bd.day if bd else None)
    hour = req.hour if req.hour is not None else (bd.hour if bd and bd.hour is not None else 0)
    minute = req.minute if req.minute is not None else (bd.minute if bd and bd.minute is not None else 0)
    second = req.second if req.second is not None else (bd.second if bd and bd.second is not None else 0.0)
    tz_name = req.tz_name or (bd.tz_name if bd else None) or (bd.timezone if bd else None) or "Asia/Kolkata"
    utc_offset = req.utc_offset_hours or (bd.utc_offset_hours if bd else None)

    # Check date string format if year/month/day not set
    if (year is None or month is None or day is None) and bd and bd.date:
        d_parts = bd.date.strip().split("-")
        if len(d_parts) == 3:
            year, month, day = int(d_parts[0]), int(d_parts[1]), int(d_parts[2])

    # Check time string format if provided
    if bd and bd.time:
        t_parts = bd.time.strip().split(":")
        if len(t_parts) >= 2:
            hour = int(t_parts[0])
            minute = int(t_parts[1])
            second = float(t_parts[2]) if len(t_parts) > 2 else 0.0

    if year is None or month is None or day is None:
        raise ValueError("Invalid birth data: year, month, and day are required (either directly or via date='YYYY-MM-DD')")

    instant = from_local(
        int(year), int(month), int(day), int(hour), int(minute), float(second),
        tz_name=tz_name, utc_offset_hours=utc_offset,
    )

    # Place extraction
    lat = req.place.latitude if req.place else None
    lon = req.place.longitude if req.place else None
    alt = req.place.altitude if req.place else 0.0
    name = req.place.name if req.place else None

    if lat is None and bd:
        lat = bd.latitude or (bd.place.latitude if bd.place else None)
    if lon is None and bd:
        lon = bd.longitude or (bd.place.longitude if bd.place else None)
    if alt == 0.0 and bd and bd.place:
        alt = bd.place.altitude
    if name is None and bd and bd.place:
        name = bd.place.name

    if lat is None or lon is None:
        # Default fallback to Delhi coordinates if unspecified
        lat = 28.6139
        lon = 77.2090

    place = Place(latitude=float(lat), longitude=float(lon), altitude=float(alt), name=name)

    return instant, place, settings


def _serialize_planet_analysis(res: VakriPlanetAnalysis) -> dict[str, Any]:
    """Serialize VakriPlanetAnalysis dataclass to JSON-compatible dictionary."""
    data = asdict(res)
    data["status"] = "success"
    return data


def _serialize_chart_analysis(res: VakriChartAnalysis) -> dict[str, Any]:
    """Serialize VakriChartAnalysis dataclass to JSON-compatible dictionary."""
    data = asdict(res)
    data["status"] = "success"
    return data


def analyze_vakri(req: VakriAnalysisRequest) -> dict[str, Any]:
    """Primary handler for Vakri analysis requests."""
    instant, place, settings = _parse_birth_data_to_instant_and_place(req)
    chart = compute_chart(instant, place, settings)

    analysis_opts = req.analysis_settings.model_dump() if req.analysis_settings else {}
    analysis_opts["tradition"] = req.tradition

    if req.planet:
        # Single planet requested
        planet_name = req.planet.capitalize()
        planet_res = analyze_planet_vakri(
            planet_name,
            chart,
            analysis_settings=analysis_opts,
            dasha_chain=req.dasha_chain,
        )
        out = _serialize_planet_analysis(planet_res)
        if req.chart_id:
            out["chart_id"] = req.chart_id
        return out
    else:
        # All planets in chart
        chart_res = analyze_chart_vakri(
            chart,
            analysis_settings=analysis_opts,
            dasha_chain=req.dasha_chain,
        )
        out = _serialize_chart_analysis(chart_res)
        if req.chart_id:
            out["chart_id"] = req.chart_id
        return out


def list_vakri_rules() -> list[dict[str, Any]]:
    """Return all classical rules cataloged in the corpus."""
    out = []
    for r in RULES.values():
        p = PASSAGES[r.source_passage_id]
        t = TEXTS[p.text_id]
        out.append({
            "rule_id": r.rule_id,
            "rule_name": r.rule_name,
            "category": r.category,
            "planet": r.planet,
            "condition_description": r.condition_description,
            "effect_description": r.effect_description,
            "source_passage_id": r.source_passage_id,
            "text_title": t.title,
            "chapter_verse": f"Ch. {p.chapter}, v. {p.verse}",
            "tradition": r.tradition,
            "confidence": r.confidence.value,
            "enabled_by_default": r.enabled_by_default,
        })
    return out


def get_vakri_rule(rule_id: str) -> dict[str, Any] | None:
    """Return details for a single classical rule."""
    r = RULES.get(rule_id)
    if not r:
        return None
    p = PASSAGES[r.source_passage_id]
    t = TEXTS[p.text_id]
    return {
        "rule_id": r.rule_id,
        "rule_name": r.rule_name,
        "category": r.category,
        "planet": r.planet,
        "condition_description": r.condition_description,
        "effect_description": r.effect_description,
        "source_passage_id": r.source_passage_id,
        "text_title": t.title,
        "author": t.author,
        "chapter_verse": f"Ch. {p.chapter}, v. {p.verse}",
        "sanskrit": p.sanskrit,
        "iast": p.iast,
        "translation": p.translation,
        "commentary": p.commentary,
        "witness": p.witness,
        "tradition": r.tradition,
        "confidence": r.confidence.value,
        "enabled_by_default": r.enabled_by_default,
    }


def list_vakri_sources() -> list[dict[str, Any]]:
    """Return all classical sources and verified passages in the corpus."""
    out = []
    for p in PASSAGES.values():
        t = TEXTS[p.text_id]
        out.append({
            "passage_id": p.passage_id,
            "text_id": p.text_id,
            "text_title": t.title,
            "author": t.author,
            "chapter": p.chapter,
            "verse": p.verse,
            "sanskrit": p.sanskrit,
            "iast": p.iast,
            "translation": p.translation,
            "witness": p.witness,
            "confidence": p.confidence.value,
        })
    return out


def list_vakri_conflicts() -> list[dict[str, Any]]:
    """Return all documented doctrinal disputes and their display_both resolutions."""
    out = []
    for c in CONFLICTS.values():
        out.append({
            "conflict_id": c.conflict_id,
            "topic": c.topic,
            "explanation": c.explanation,
            "resolution": c.resolution_method,
            "diverging_rules": c.rules,
        })
    return out

