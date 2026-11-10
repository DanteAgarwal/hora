"""Pydantic request and response schemas for the Vakri Graha Intelligence Engine."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class VakriPlaceIn(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    altitude: float = Field(0.0, description="Altitude in metres above sea level")
    name: Optional[str] = Field(None, description="Location name")


class VakriBirthData(BaseModel):
    """Birth data schema supporting both structured Y/M/D and ISO date/time strings."""
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format", examples=["2000-01-01"])
    time: Optional[str] = Field(None, description="Time in HH:MM:SS format", examples=["12:00:00"])
    year: Optional[int] = Field(None, ge=-5400, le=5400)
    month: Optional[int] = Field(None, ge=1, le=12)
    day: Optional[int] = Field(None, ge=1, le=31)
    hour: Optional[int] = Field(0, ge=0, le=23)
    minute: Optional[int] = Field(0, ge=0, le=59)
    second: Optional[float] = Field(0.0, ge=0.0, lt=60.0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = Field("Asia/Kolkata", examples=["Asia/Kolkata"])
    tz_name: Optional[str] = None
    utc_offset_hours: Optional[float] = None
    place: Optional[VakriPlaceIn] = None


class VakriCalculationSettings(BaseModel):
    zodiac: str = Field("sidereal", description="Zodiac system (sidereal or tropical)")
    ayanamsa: str = Field("Lahiri", description="Ayanamsa system (Lahiri, Raman, Krishnamurti, etc.)")
    house_system: str = Field("Whole Sign", description="House system (Whole Sign, Equal, Placidus, Sripati)")
    node_type: str = Field("True", description="Node convention (True or Mean)")
    chart_type: str = Field("D1", description="Divisional chart code")


class VakriAnalysisSettings(BaseModel):
    tradition: str = Field("Parashari", description="Primary astrological tradition")
    include_jataka_parijata: bool = True
    include_phaladeepika: bool = True
    include_saravali: bool = True
    include_horasara: bool = True
    include_uttara_kalamrita: bool = True
    include_house_offsets: bool = Field(False, description="Enable alternative recension house-offset rules (Module G)")
    speed_tolerance: float = Field(1e-5, description="Tolerance in deg/day to detect stationary motion")


class VakriAnalysisRequest(BaseModel):
    chart_id: Optional[str] = None
    planet: Optional[str] = Field(None, description="Specific planet to analyze (e.g., 'Jupiter') or omit for all chart planets")
    birth_data: Optional[VakriBirthData] = None
    calculation_settings: Optional[VakriCalculationSettings] = Field(default_factory=VakriCalculationSettings)
    analysis_settings: Optional[VakriAnalysisSettings] = Field(default_factory=VakriAnalysisSettings)
    tradition: str = Field("Parashari", description="Primary tradition")
    include_sources: bool = True
    include_conflicts: bool = True
    dasha_chain: Optional[list[str]] = Field(None, description="Active dasha lords, e.g. ['Jupiter', 'Saturn']")

    # Flat properties for backward compatibility with ChartRequest
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    hour: Optional[int] = None
    minute: Optional[int] = None
    second: Optional[float] = None
    tz_name: Optional[str] = None
    utc_offset_hours: Optional[float] = None
    place: Optional[VakriPlaceIn] = None


class MotionOut(BaseModel):
    motion: str
    daily_speed: float
    is_retrograde: bool
    is_stationary: bool
    motion_category: str
    chesta_virupas: float
    tolerance: float
    is_node: bool
    node_convention: Optional[str] = None


class DignityOut(BaseModel):
    actual: str
    is_exalted: bool
    is_debilitated: bool
    is_own_sign: bool
    retrograde_classical_effect: Optional[str] = None
    interpretive_source: Optional[str] = None
    explanation: Optional[str] = None


class ChestaBalaOut(BaseModel):
    motion_category: str
    traditional_chesta_value: float
    chesta_rupas: float
    source: str
    status: str
    details: str


class ShadbalaOut(BaseModel):
    sthana_bala_virupas: float
    dig_bala_virupas: float
    kala_bala_virupas: float
    chesta_bala_virupas: float
    naisargika_bala_virupas: float
    drik_bala_virupas: float
    total_shadbala_virupas: float
    total_shadbala_rupas: float
    required_shadbala_virupas: float
    required_shadbala_rupas: float
    strength_ratio: float
    strength_status: str
    reference_standard: str
    units: str


class HouseAnalysisOut(BaseModel):
    occupied_house: int
    owned_houses: list[int]
    lordship_classes: list[str]
    functional_nature: str
    dispositor: str
    dispositor_sign: str
    dispositor_house: int
    dispositor_dignity: str
    functional_explanation: str
    house_offset_influence: Optional[dict[str, Any]] = None


class AspectsOut(BaseModel):
    conjunctions: list[str]
    benefic_aspects_received: list[dict[str, Any]]
    malefic_aspects_received: list[dict[str, Any]]
    special_aspects_cast: list[dict[str, Any]]
    is_combust: bool
    combustion_orb: float
    angular_separation_from_sun: float
    planetary_war: Optional[dict[str, Any]] = None


class VargaOut(BaseModel):
    D1_sign: str
    D1_dignity: str
    D1_house: int
    D9_sign: str
    D9_dignity: str
    D9_house: int
    D10_sign: str
    D10_dignity: str
    D10_house: int
    is_vargottama: bool
    natal_retrograde_accompanies_varga: bool
    varga_interpretation: str


class DashaOut(BaseModel):
    is_active_mahadasha: bool
    is_active_antardasha: bool
    active_dasha_level: Optional[int] = None
    classical_dasha_effect: str
    source_reference: str
    edition_specific_reversal_caveat: Optional[str] = None


class ClassicalRuleOut(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    text_title: str
    chapter_verse: str
    sanskrit: str
    iast: str
    translation: str
    effect: str
    confidence: str
    witness: str


class TextualConflictOut(BaseModel):
    conflict_id: str
    topic: str
    explanation: str
    resolution: str
    diverging_rules: list[dict[str, str]]


class InterpretationOut(BaseModel):
    summary: str
    astronomical_factor: str
    motional_strength_factor: str
    dignity_factor: str
    house_lordship_factor: str
    functional_impact_factor: str
    timing_factor: str
    certainty: str


class SourceItemOut(BaseModel):
    text: str
    author: str
    chapter: str
    verse: str
    witness: str
    confidence: str


class VakriPlanetAnalysisOut(BaseModel):
    status: str = "success"
    planet: str
    retrograde: bool
    is_stationary: bool
    is_node: bool
    motion: MotionOut
    dignity: DignityOut
    chesta_bala: Optional[ChestaBalaOut] = None
    shadbala: Optional[ShadbalaOut] = None
    house_analysis: HouseAnalysisOut
    aspects_conjunctions: AspectsOut
    varga_analysis: VargaOut
    dasha_analysis: DashaOut
    classical_rules: list[ClassicalRuleOut] = Field(default_factory=list)
    textual_conflicts: list[TextualConflictOut] = Field(default_factory=list)
    interpretation: InterpretationOut
    sources: list[SourceItemOut] = Field(default_factory=list)


class VakriChartAnalysisOut(BaseModel):
    status: str = "success"
    chart_id: Optional[str] = None
    calculation_settings: dict[str, Any]
    analysis_settings: dict[str, Any]
    retrograde_count: int
    retrograde_planets: list[str]
    planets: dict[str, VakriPlanetAnalysisOut]
    chart_level_synthesis: str


class CorpusRuleOut(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    planet: str
    condition_description: str
    effect_description: str
    source_passage_id: str
    tradition: str
    confidence: str
    enabled_by_default: bool


class CorpusSourceOut(BaseModel):
    passage_id: str
    text_id: str
    text_title: str
    author: str
    chapter: str
    verse: str
    sanskrit: str
    iast: str
    translation: str
    witness: str
    confidence: str

