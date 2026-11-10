"""Unit tests for the Vakri Graha Intelligence Engine.

Covers astronomical motion classification, Chesta Bala, Shadbala ratio, sign dignity
preservation, classical rules, house-offset traditions, node pathways, and conflict resolution.
"""
import pytest
from fastapi.testclient import TestClient

from hora.api.main import app
from hora.charts.chart import Place, compute_chart
from hora.charts.vakri import (
    MotionClassification,
    analyze_chart_vakri,
    analyze_planet_vakri,
    classify_astronomical_motion,
)
from hora.content.vakri_corpus import CONFLICTS, PASSAGES, RULES, TEXTS, ConfidenceLevel
from hora.core.settings import Settings
from hora.core.timeutil import from_local


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def sample_chart():
    # 1999-11-01 12:00:00 Delhi, where both Jupiter and Saturn were retrograde in Aries
    instant = from_local(1999, 11, 1, 12, 0, 0, tz_name="Asia/Kolkata")
    place = Place(latitude=28.6139, longitude=77.2090)
    settings = Settings()
    return compute_chart(instant, place, settings)


# ---------------------------------------------------------------------------
# Astronomical Tests (Module A & Section 24)
# ---------------------------------------------------------------------------

def test_astronomical_motion_classification():
    """Verify daily_speed thresholding and classification."""
    # Direct planet
    m_direct = classify_astronomical_motion("Jupiter", 0.125)
    assert m_direct.motion == "direct"
    assert not m_direct.is_retrograde
    assert not m_direct.is_stationary
    assert m_direct.motion_category == "Sama"
    assert m_direct.chesta_virupas == 30.0

    # Retrograde planet
    m_retro = classify_astronomical_motion("Jupiter", -0.08)
    assert m_retro.motion == "retrograde"
    assert m_retro.is_retrograde
    assert not m_retro.is_stationary
    assert m_retro.motion_category == "Vakra"
    assert m_retro.chesta_virupas == 60.0

    # Stationary planet within tolerance
    m_stat = classify_astronomical_motion("Saturn", 0.000005, tolerance=1e-5)
    assert m_stat.motion == "stationary"
    assert not m_stat.is_retrograde
    assert m_stat.is_stationary
    assert m_stat.motion_category == "Vikala"
    assert m_stat.chesta_virupas == 15.0


def test_luminaries_not_applicable():
    """Sun and Moon must never receive ordinary Vakri classification."""
    m_sun = classify_astronomical_motion("Sun", -0.05)  # even if artificial negative speed passed
    assert m_sun.motion == "not_applicable"
    assert not m_sun.is_retrograde
    assert m_sun.motion_category == "not_applicable"
    assert m_sun.chesta_virupas == 0.0

    m_moon = classify_astronomical_motion("Moon", 13.2)
    assert m_moon.motion == "not_applicable"
    assert not m_moon.is_retrograde


def test_nodes_separate_pathway():
    """Rahu and Ketu must follow a separate classification pathway."""
    m_rahu = classify_astronomical_motion("Rahu", -0.05, is_node=True, node_type="True")
    assert m_rahu.is_node
    assert m_rahu.is_retrograde
    assert m_rahu.chesta_virupas == 0.0  # Does not receive 5-planet 60 virupa rule
    assert m_rahu.node_convention == "True"

    # True nodes occasionally direct
    m_rahu_direct = classify_astronomical_motion("Rahu", 0.02, is_node=True, node_type="True")
    assert m_rahu_direct.is_node
    assert m_rahu_direct.motion == "direct"
    assert not m_rahu_direct.is_retrograde


# ---------------------------------------------------------------------------
# Chesta Bala & Shadbala Tests (Module C & D)
# ---------------------------------------------------------------------------

def test_retrograde_chesta_strength_rule(sample_chart):
    """Retrograde planets receive 60 Virupas Chesta Bala under BPHS 27.22."""
    res_jup = analyze_planet_vakri("Jupiter", sample_chart)
    # On 1999-11-01, Jupiter is retrograde in Aries
    assert res_jup.retrograde is True
    assert res_jup.chesta_bala is not None
    assert res_jup.chesta_bala.motion_category == "Vakra"
    assert res_jup.chesta_bala.traditional_chesta_value == 60.0
    assert res_jup.chesta_bala.source == "BPHS 27.21-23"


def test_shadbala_engine_ratio(sample_chart):
    """Shadbala engine independently calculates six components and ratio against minimum."""
    res_sat = analyze_planet_vakri("Saturn", sample_chart)
    assert res_sat.shadbala is not None
    assert res_sat.shadbala.sthana_bala_virupas > 0
    assert res_sat.shadbala.dig_bala_virupas >= 0
    assert res_sat.shadbala.kala_bala_virupas > 0
    assert res_sat.shadbala.chesta_bala_virupas == 60.0  # Saturn is retrograde on 1999-11-01
    assert res_sat.shadbala.naisargika_bala_virupas == 8.57  # BPHS fixed
    assert res_sat.shadbala.required_shadbala_virupas == 300.0  # Saturn BPHS minimum
    assert res_sat.shadbala.strength_ratio > 0
    assert res_sat.shadbala.strength_status in ("meets_reference_threshold", "below_reference_threshold")


# ---------------------------------------------------------------------------
# Dignity & Non-Negotiable Rule #2 Tests (Module E)
# ---------------------------------------------------------------------------

def test_dignity_preservation_when_retrograde(sample_chart):
    """NON-NEGOTIABLE RULE #2: A debilitated/enemy retrograde planet's actual dignity is NEVER overwritten to exalted."""
    # Saturn on 1999-11-01 is in Aries (its debilitation sign) and retrograde
    res_sat = analyze_planet_vakri("Saturn", sample_chart)
    assert res_sat.retrograde is True
    assert res_sat.dignity.actual == "debilitated"  # ACTUAL DIGNITY MUST REMAIN DEBILITATED!
    assert res_sat.dignity.is_debilitated is True
    assert res_sat.dignity.is_exalted is False

    # Interpretive effect from Phaladeepika 9.20 is stored separately
    assert res_sat.dignity.retrograde_classical_effect == "exaltation_like_results"
    assert res_sat.dignity.interpretive_source == "Phaladeepika 9.20"


def test_varga_retrograde_flag_persistence(sample_chart):
    """NON-NEGOTIABLE RULE #5: Retrograde flag accompanies planet into vargas, not recalculated in D9."""
    res_jup = analyze_planet_vakri("Jupiter", sample_chart)
    assert res_jup.retrograde is True
    assert res_jup.varga_analysis.natal_retrograde_accompanies_varga is True
    # D1, D9, D10 signs are computed
    assert len(res_jup.varga_analysis.D1_sign) > 0
    assert len(res_jup.varga_analysis.D9_sign) > 0
    assert len(res_jup.varga_analysis.D10_sign) > 0


# ---------------------------------------------------------------------------
# House-Offset Tradition Tests (Module G)
# ---------------------------------------------------------------------------

def test_house_offset_rules_disabled_by_default(sample_chart):
    """Module G house offsets must be disabled by default."""
    res_jup = analyze_planet_vakri("Jupiter", sample_chart, analysis_settings={"include_house_offsets": False})
    assert res_jup.house_analysis.house_offset_influence is None


def test_house_offset_rules_when_enabled(sample_chart):
    """Module G house offsets are calculated when specifically enabled."""
    res_jup = analyze_planet_vakri("Jupiter", sample_chart, analysis_settings={"include_house_offsets": True})
    assert res_jup.house_analysis.house_offset_influence is not None
    assert res_jup.house_analysis.house_offset_influence["offset_count"] == 5  # Jupiter 5th offset
    assert res_jup.house_analysis.house_offset_influence["source"] == "BPHS alternative recension, Ch.26"


# ---------------------------------------------------------------------------
# Conflict Resolution Engine Tests (Module N)
# ---------------------------------------------------------------------------

def test_conflict_resolution_display_both(sample_chart):
    """Textual disagreements must use display_both and never an arbitrary majority vote."""
    res_sat = analyze_planet_vakri("Saturn", sample_chart)
    # Saturn is retrograde and debilitated on 1999-11-01
    conflict_topics = [c.topic for c in res_sat.textual_conflicts]
    assert "Retrograde Debilitated / Exalted Planets" in conflict_topics
    for c in res_sat.textual_conflicts:
        assert c.resolution == "display_both"
        assert len(c.diverging_rules) >= 2


# ---------------------------------------------------------------------------
# API Endpoints Integration Tests (Module 22)
# ---------------------------------------------------------------------------

def test_api_vakri_analysis_endpoint(test_client):
    """POST /v1/astrology/vakri-analysis returns valid structured analysis."""
    payload = {
        "birth_data": {
            "date": "1999-11-01",
            "time": "12:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timezone": "Asia/Kolkata",
        },
        "planet": "Jupiter",
        "calculation_settings": {
            "zodiac": "sidereal",
            "ayanamsa": "Lahiri",
            "house_system": "Whole Sign",
            "node_type": "True",
            "chart_type": "D1",
        },
        "analysis_settings": {
            "tradition": "Parashari",
            "include_phaladeepika": True,
            "include_jataka_parijata": True,
            "include_house_offsets": False,
        },
    }
    resp = test_client.post("/v1/astrology/vakri-analysis", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["planet"] == "Jupiter"
    assert data["retrograde"] is True
    assert data["motion"]["motion"] == "retrograde"
    assert data["chesta_bala"]["traditional_chesta_value"] == 60.0
    assert "interpretation" in data
    assert "summary" in data["interpretation"]
    assert len(data["classical_rules"]) > 0


def test_api_vakri_batch_endpoint(test_client):
    """POST /v1/astrology/vakri-analysis/batch returns all chart planets."""
    payload = {
        "birth_data": {
            "date": "1999-11-01",
            "time": "12:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timezone": "Asia/Kolkata",
        },
    }
    resp = test_client.post("/v1/astrology/vakri-analysis/batch", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "planets" in data
    assert "Jupiter" in data["planets"]
    assert "Saturn" in data["planets"]
    assert data["retrograde_count"] >= 2


def test_api_corpus_endpoints(test_client):
    """Verify rules, sources, and conflicts listing endpoints."""
    # Rules
    r_rules = test_client.get("/v1/astrology/vakri-rules")
    assert r_rules.status_code == 200
    rules_data = r_rules.json()
    assert len(rules_data) >= 8

    # Specific rule
    r_single = test_client.get("/v1/astrology/rules/F2_PHALADEEPIKA_EXALTATION_LIKE")
    assert r_single.status_code == 200
    rule_info = r_single.json()
    assert "Phaladeepika" in rule_info["text_title"]
    assert len(rule_info["sanskrit"]) > 0

    # Sources
    r_sources = test_client.get("/v1/astrology/sources")
    assert r_sources.status_code == 200
    assert len(r_sources.json()) >= 6

    # Conflicts
    r_conflicts = test_client.get("/v1/astrology/conflicts")
    assert r_conflicts.status_code == 200
    assert len(r_conflicts.json()) >= 3
