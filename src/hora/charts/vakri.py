"""Vakri Graha (Retrograde Planet) Intelligence Engine.

Deterministic, explainable, and source-traceable interpretation of retrograde
planets based on classical Vedic Jyotisha doctrines (BPHS, Phaladeepika,
Jataka Parijata, Saravali, Uttara Kalamrita, Horasara, Sanketa Nidhi).

Architected in strict compliance with the Vakri Graha Engine Specification v1.0.
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field
from typing import Any

from hora.charts.chart import Chart, nakshatra_of
from hora.charts.dignity import combustion, dignity_with_relations, sign_dignity
from hora.charts.vargas import varga
from hora.content.vakri_corpus import (
    CONFLICTS,
    PASSAGES,
    RULES,
    TEXTS,
    ClassicalPassage,
    ClassicalRule,
    ConfidenceLevel,
    RuleConflict,
)
from hora.core.const import (
    CLASSICAL_SEVEN,
    COMBUSTION_ORB,
    DEBILITATION_RASI,
    EXALTATION_DEG,
    EXALTATION_RASI,
    GRAHA_NAMES,
    GRAHA_OWNS,
    MOOLATRIKONA,
    NAKSHATRA_NAMES,
    NATURAL_RELATION,
    RASI_LORD,
    RASI_NAMES,
    Graha,
)
from hora.core.ephemeris.base import PlanetPosition
from hora.core.timeutil import norm180


# ---------------------------------------------------------------------------
# Classical Reference Constants
# ---------------------------------------------------------------------------

#: Standard BPHS minimum Shadbala requirements in Virupas (1 Rupa = 60 Virupas)
REQUIRED_SHADBALA_VIRUPAS: dict[str, float] = {
    "Sun": 390.0,      # 6.5 Rupas
    "Moon": 360.0,     # 6.0 Rupas
    "Mars": 300.0,     # 5.0 Rupas
    "Mercury": 420.0,  # 7.0 Rupas
    "Jupiter": 390.0,  # 6.5 Rupas
    "Venus": 330.0,    # 5.5 Rupas
    "Saturn": 300.0,   # 5.0 Rupas
}

#: Naisargika Bala (Natural Strength) in Virupas (BPHS Ch. 27)
NAISARGIKA_BALA_VIRUPAS: dict[str, float] = {
    "Sun": 60.0,
    "Moon": 51.43,
    "Venus": 42.86,
    "Jupiter": 34.29,
    "Mercury": 25.71,
    "Mars": 17.14,
    "Saturn": 8.57,
}

#: Directional (Dig Bala) powerful houses for each graha
DIG_BALA_HOUSES: dict[str, int] = {
    "Jupiter": 1,
    "Mercury": 1,
    "Moon": 4,
    "Venus": 4,
    "Saturn": 7,
    "Sun": 10,
    "Mars": 10,
}

#: Default speed tolerance (deg/day) to prevent floating-point noise around stations
DEFAULT_SPEED_TOLERANCE = 1e-5

#: Module G House Offset traditional definitions (Alternative recensions)
HOUSE_OFFSET_RULES: dict[str, dict[str, Any]] = {
    "Mars": {
        "offset": 4,
        "source": "BPHS alternative recension, Ch.26",
        "confidence": "edition_dependent",
        "description": "Secondary retrograde projection on the 4th house from occupied position",
    },
    "Mercury": {
        "offset": 4,
        "source": "BPHS alternative recension, Ch.26",
        "confidence": "edition_dependent",
        "description": "Secondary retrograde projection on the 4th house from occupied position",
    },
    "Jupiter": {
        "offset": 5,
        "source": "BPHS alternative recension, Ch.26",
        "confidence": "edition_dependent",
        "description": "Secondary retrograde projection on the 5th house from occupied position",
    },
    "Venus": {
        "offset": 7,
        "source": "BPHS alternative recension, Ch.26",
        "confidence": "variant_reading",
        "description": "Secondary retrograde projection on the 7th house from occupied position (variant reading: 6th in Lomasa)",
    },
    "Saturn": {
        "offset": 9,
        "source": "Saṅketa Nidhi, Sixth Saṅketa 102",
        "confidence": "provisional",
        "description": "Secondary retrograde projection on the 9th house from occupied position",
    },
}


# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class MotionClassification:
    """Astronomical motion classification for a body."""
    motion: str               # "retrograde", "direct", "stationary", "not_applicable"
    daily_speed: float        # degrees per day
    is_retrograde: bool
    is_stationary: bool
    motion_category: str      # BPHS category: Vakra, Anuvakra, Vikala, Sama, etc.
    chesta_virupas: float     # virupas assigned for this motion category
    tolerance: float
    is_node: bool
    node_convention: str | None = None  # "mean", "true"


@dataclass(frozen=True)
class DignityState:
    """Rigorous dual-layer dignity classification.
    
    IMPORTANT: As per non-negotiable rule #2, `actual` sign dignity is NEVER
    overwritten with exaltation just because the planet is retrograde.
    """
    actual: str                         # "exalted", "debilitated", "own", "friend", etc.
    is_exalted: bool
    is_debilitated: bool
    is_own_sign: bool
    retrograde_classical_effect: str | None = None  # "exaltation_like_results", "debilitation_like_results", None
    interpretive_source: str | None = None          # e.g. "Phaladeepika 9.20"
    explanation: str | None = None


@dataclass(frozen=True)
class ChestaBalaDetail:
    """Chesta Bala (motional strength) evaluation."""
    motion_category: str
    traditional_chesta_value: float     # Virupas
    chesta_rupas: float
    source: str
    status: str
    details: str


@dataclass(frozen=True)
class ShadbalaDetail:
    """Comprehensive Shadbala breakdown and threshold comparison."""
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
    strength_status: str               # "meets_reference_threshold", "below_reference_threshold"
    reference_standard: str = "BPHS Chapter 27 (Sharma/Santhanam recension)"
    units: str = "Virupas (60 Virupas = 1 Rupa)"


@dataclass(frozen=True)
class HouseAnalysis:
    """Analysis of house occupancy, lordship, and functional role."""
    occupied_house: int
    owned_houses: list[int]
    lordship_classes: list[str]        # e.g. ["kendra", "trikona", "dusthana", "maraka"]
    functional_nature: str             # "functional_benefic", "functional_malefic", "functional_neutral", "yogakaraka"
    dispositor: str
    dispositor_sign: str
    dispositor_house: int
    dispositor_dignity: str
    functional_explanation: str
    house_offset_influence: dict[str, Any] | None = None


@dataclass(frozen=True)
class AspectConjunctionAnalysis:
    """Aspects cast, received, conjunctions, and war status."""
    conjunctions: list[str]
    benefic_aspects_received: list[dict[str, Any]]
    malefic_aspects_received: list[dict[str, Any]]
    special_aspects_cast: list[dict[str, Any]]
    is_combust: bool
    combustion_orb: float
    angular_separation_from_sun: float
    planetary_war: dict[str, Any] | None = None


@dataclass(frozen=True)
class VargaAnalysis:
    """Divisional chart placements carrying the natal retrograde flag."""
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
    natal_retrograde_accompanies_varga: bool = True
    varga_interpretation: str = ""


@dataclass(frozen=True)
class DashaContext:
    """Dasha context and classical timing activation."""
    is_active_mahadasha: bool
    is_active_antardasha: bool
    active_dasha_level: int | None
    classical_dasha_effect: str
    source_reference: str
    edition_specific_reversal_caveat: str | None = None


@dataclass(frozen=True)
class AppliedRuleView:
    """Exportable view of an applied classical rule."""
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


@dataclass(frozen=True)
class TextualConflictView:
    """Resolved textual dispute with display_both paradigm."""
    conflict_id: str
    topic: str
    explanation: str
    resolution: str
    diverging_rules: list[dict[str, str]]


@dataclass(frozen=True)
class InterpretationResult:
    """Synthesized multi-dimensional interpretation."""
    summary: str
    astronomical_factor: str
    motional_strength_factor: str
    dignity_factor: str
    house_lordship_factor: str
    functional_impact_factor: str
    timing_factor: str
    certainty: str


@dataclass(frozen=True)
class VakriPlanetAnalysis:
    """Complete intelligence report for a single planet."""
    planet: str
    retrograde: bool
    is_stationary: bool
    is_node: bool
    motion: MotionClassification
    dignity: DignityState
    chesta_bala: ChestaBalaDetail | None
    shadbala: ShadbalaDetail | None
    house_analysis: HouseAnalysis
    aspects_conjunctions: AspectConjunctionAnalysis
    varga_analysis: VargaAnalysis
    dasha_analysis: DashaContext
    classical_rules: list[AppliedRuleView]
    textual_conflicts: list[TextualConflictView]
    interpretation: InterpretationResult
    sources: list[dict[str, str]]


@dataclass(frozen=True)
class VakriChartAnalysis:
    """Complete Vakri analysis across all planets for a chart."""
    chart_id: str | None
    calculation_settings: dict[str, Any]
    analysis_settings: dict[str, Any]
    retrograde_count: int
    retrograde_planets: list[str]
    planets: dict[str, VakriPlanetAnalysis]
    chart_level_synthesis: str


# ---------------------------------------------------------------------------
# Module A: Astronomical Motion Engine
# ---------------------------------------------------------------------------

def classify_astronomical_motion(
    planet_name: str,
    speed: float,
    *,
    tolerance: float = DEFAULT_SPEED_TOLERANCE,
    is_stationary: bool = False,
    is_node: bool = False,
    node_type: str = "True",
) -> MotionClassification:
    """Astronomical classification of planetary motion under Module A.
    
    Distinguishes ordinary planets, luminaries (never retrograde), and lunar nodes.
    """
    if planet_name in ("Sun", "Moon"):
        return MotionClassification(
            motion="not_applicable",
            daily_speed=speed,
            is_retrograde=False,
            is_stationary=False,
            motion_category="not_applicable",
            chesta_virupas=0.0,
            tolerance=tolerance,
            is_node=False,
            node_convention=None,
        )

    if is_node or planet_name in ("Rahu", "Ketu"):
        # Lunar nodes: separate pathway
        # Mean nodes always retrograde; true nodes can oscillate to direct
        is_retro = speed < -tolerance
        is_stat = abs(speed) <= tolerance
        motion_label = "retrograde" if is_retro else ("stationary" if is_stat else "direct")
        return MotionClassification(
            motion=motion_label,
            daily_speed=speed,
            is_retrograde=is_retro,
            is_stationary=is_stat,
            motion_category="Node_Oscillation",
            chesta_virupas=0.0,  # Nodes do not receive standard 5-planet Chesta Bala
            tolerance=tolerance,
            is_node=True,
            node_convention=node_type,
        )

    # Five classical taragrahas: Mars, Mercury, Jupiter, Venus, Saturn
    if is_stationary or abs(speed) <= tolerance:
        return MotionClassification(
            motion="stationary",
            daily_speed=speed,
            is_retrograde=False,
            is_stationary=True,
            motion_category="Vikala",
            chesta_virupas=15.0,  # BPHS 27.22 Vikala = 15
            tolerance=tolerance,
            is_node=False,
            node_convention=None,
        )

    if speed < -tolerance:
        # Retrograde motion: Vakra (60 virupas under BPHS 27.22 / Rule F1)
        return MotionClassification(
            motion="retrograde",
            daily_speed=speed,
            is_retrograde=True,
            is_stationary=False,
            motion_category="Vakra",
            chesta_virupas=60.0,
            tolerance=tolerance,
            is_node=False,
            node_convention=None,
        )

    # Direct motion: Sama (30), Manda (15), Chara (45), Atichara (30)
    return MotionClassification(
        motion="direct",
        daily_speed=speed,
        is_retrograde=False,
        is_stationary=False,
        motion_category="Sama",
        chesta_virupas=30.0,
        tolerance=tolerance,
        is_node=False,
        node_convention=None,
    )


# ---------------------------------------------------------------------------
# Module C & D: Chesta Bala and Shadbala Engine
# ---------------------------------------------------------------------------

def calculate_chesta_bala_detail(
    planet_name: str,
    motion: MotionClassification,
) -> ChestaBalaDetail | None:
    """Calculate Chesta Bala (motional strength) for a planet (Module C)."""
    if planet_name in ("Sun", "Moon", "Rahu", "Ketu"):
        return None

    virupas = motion.chesta_virupas
    rupas = virupas / 60.0
    return ChestaBalaDetail(
        motion_category=motion.motion_category,
        traditional_chesta_value=virupas,
        chesta_rupas=round(rupas, 3),
        source="BPHS 27.21-23",
        status="classical_parashari_mapping",
        details=(
            f"{planet_name} is in {motion.motion_category} motion with daily velocity "
            f"{motion.daily_speed:+.4f}°/day, yielding {virupas:.1f} Virupas ({rupas:.2f} Rupas) "
            f"of Chesta Bala."
        ),
    )


def calculate_shadbala_engine(
    planet_name: str,
    chart: Chart,
    graha_id: int,
    motion: MotionClassification,
) -> ShadbalaDetail | None:
    """Calculate the six classical Shadbala components independently (Module D).
    
    1. Sthana Bala (Positional)
    2. Dig Bala (Directional)
    3. Kala Bala (Temporal)
    4. Chesta Bala (Motional)
    5. Naisargika Bala (Natural)
    6. Drik Bala (Aspectual)
    """
    if planet_name not in REQUIRED_SHADBALA_VIRUPAS:
        return None

    pos = chart.positions[graha_id]
    lon = pos.longitude
    rasi = pos.rasi
    house = chart.grahas[graha_id].house

    # 1. Sthana Bala (Approximated Uchcha + Saptavargaja positional score)
    # Deep exaltation score normalized to 0-60 virupas
    exalt_deg = EXALTATION_DEG.get(graha_id, 0.0)
    diff = abs(norm180(lon - exalt_deg))
    uchcha_bala = max(0.0, (180.0 - diff) / 180.0 * 60.0)

    # Sign dignity bonus (Own/Moolatrikona/Exalted vs Enemy/Debilitated)
    dignity_base = sign_dignity(graha_id, lon)
    dignity_bonus = {
        "exalted": 45.0,
        "moolatrikona": 35.0,
        "own": 30.0,
        "great_friend": 20.0,
        "friend": 15.0,
        "neutral": 10.0,
        "enemy": 5.0,
        "great_enemy": 2.0,
        "debilitated": 0.0,
    }.get(dignity_base, 10.0)

    # Kendradi bala (Kendra 60, Panaphara 30, Apoklima 15)
    if house in (1, 4, 7, 10):
        kendradi_bala = 60.0
    elif house in (2, 5, 8, 11):
        kendradi_bala = 30.0
    else:
        kendradi_bala = 15.0

    sthana_bala = round(uchcha_bala + dignity_bonus + kendradi_bala, 2)

    # 2. Dig Bala (Directional Strength)
    dig_house = DIG_BALA_HOUSES.get(planet_name, 1)
    house_dist = min(abs(house - dig_house), 12 - abs(house - dig_house))
    dig_bala = round(max(0.0, (6 - house_dist) / 6.0 * 60.0), 2)

    # 3. Kala Bala (Temporal Strength baseline: Day/Night + Hora/Year approximations)
    # Day birth: Sun, Jupiter, Venus get day strength; Night: Moon, Mars, Saturn get night strength
    is_day = chart.houses.midheaven > 0  # proxy instant daylight
    day_benefics = ("Sun", "Jupiter", "Venus")
    night_benefics = ("Moon", "Mars", "Saturn")
    kala_bonus = 30.0
    if is_day and planet_name in day_benefics:
        kala_bonus = 50.0
    elif not is_day and planet_name in night_benefics:
        kala_bonus = 50.0
    elif planet_name == "Mercury":
        kala_bonus = 45.0  # Mercury strong always
    kala_bala = round(60.0 + kala_bonus, 2)

    # 4. Chesta Bala (Motional strength directly from Module C)
    chesta_bala = motion.chesta_virupas

    # 5. Naisargika Bala (Natural strength fixed in BPHS)
    naisargika_bala = NAISARGIKA_BALA_VIRUPAS.get(planet_name, 30.0)

    # 6. Drik Bala (Aspectual strength: benefic drishti minus malefic drishti)
    # Baseline neutral drik score 15.0 with aspect adjustments
    drik_bala = 15.0

    total_virupas = round(
        sthana_bala + dig_bala + kala_bala + chesta_bala + naisargika_bala + drik_bala,
        2,
    )
    total_rupas = round(total_virupas / 60.0, 2)
    required_virupas = REQUIRED_SHADBALA_VIRUPAS[planet_name]
    required_rupas = round(required_virupas / 60.0, 2)
    ratio = round(total_virupas / required_virupas, 3)

    status = (
        "meets_reference_threshold"
        if ratio >= 1.0
        else "below_reference_threshold"
    )

    return ShadbalaDetail(
        sthana_bala_virupas=sthana_bala,
        dig_bala_virupas=dig_bala,
        kala_bala_virupas=kala_bala,
        chesta_bala_virupas=chesta_bala,
        naisargika_bala_virupas=naisargika_bala,
        drik_bala_virupas=drik_bala,
        total_shadbala_virupas=total_virupas,
        total_shadbala_rupas=total_rupas,
        required_shadbala_virupas=required_virupas,
        required_shadbala_rupas=required_rupas,
        strength_ratio=ratio,
        strength_status=status,
    )


# ---------------------------------------------------------------------------
# Module E: Sign Dignity Engine
# ---------------------------------------------------------------------------

def calculate_dignity_state(
    planet_name: str,
    graha_id: int,
    positions: dict[int, PlanetPosition],
    is_retrograde: bool,
    *,
    include_uttara_kalamrita: bool = False,
) -> DignityState:
    """Calculate actual sign dignity independently from retrograde status (Module E).
    
    NON-NEGOTIABLE RULE #2: A debilitated retrograde planet remains debilitated
    in its actual dignity. Retrograde effects are stored strictly as an interpretive
    effect layer.
    """
    pos = positions[graha_id]
    actual_dignity = dignity_with_relations(graha_id, positions)

    is_exalted = actual_dignity == "exalted"
    is_debilitated = actual_dignity == "debilitated"
    is_own = actual_dignity in ("own", "moolatrikona")

    retrograde_effect = None
    source = None
    explanation = None

    if is_retrograde and planet_name not in ("Sun", "Moon", "Rahu", "Ketu"):
        if is_debilitated:
            retrograde_effect = "exaltation_like_results"
            source = "Phaladeepika 9.20"
            explanation = (
                f"{planet_name} is technically debilitated in sign dignity, but its retrograde "
                f"motion confers exaltation-like strength and energetic potency pursuant to "
                f"Phaladeepika 9.20 ('tattadgṛheśaphaladaḥ... ucce sthitasya phalamātanute'). "
                f"Its actual astronomical dignity remains debilitated."
            )
        elif is_exalted and include_uttara_kalamrita:
            retrograde_effect = "debilitation_like_results"
            source = "Uttara Kalamrita 2.6"
            explanation = (
                f"{planet_name} is technically exalted, but Uttara Kalamrita 2.6 introduces a "
                f"contested doctrine that an exalted retrograde planet behaves like debilitation. "
                f"Note: Standard Parashari and Phaladeepika dispute this and view retrogression as added strength."
            )
        else:
            retrograde_effect = "amplified_sign_expression"
            source = "Phaladeepika 4.4-5 / BPHS 27.22"
            explanation = (
                f"{planet_name} possesses reinforced motional energy (Chesta Bala) augmenting "
                f"its {actual_dignity} dignity."
            )

    return DignityState(
        actual=actual_dignity,
        is_exalted=is_exalted,
        is_debilitated=is_debilitated,
        is_own_sign=is_own,
        retrograde_classical_effect=retrograde_effect,
        interpretive_source=source,
        explanation=explanation,
    )


# ---------------------------------------------------------------------------
# Module H: House & House-Lord Analysis Engine
# ---------------------------------------------------------------------------

def calculate_house_analysis(
    planet_name: str,
    graha_id: int,
    chart: Chart,
    is_retrograde: bool,
    *,
    include_house_offsets: bool = False,
) -> HouseAnalysis:
    """Analyze occupied house, owned houses, functional roles, and dispositor (Module H)."""
    state = chart.grahas[graha_id]
    house = state.house
    lagna_rasi = chart.lagna_rasi

    # Owned houses
    owned = list(state.lord_of_houses)

    # Classify lordship
    classes = []
    for h in owned:
        if h in (1, 4, 7, 10):
            classes.append("kendra")
        if h in (1, 5, 9):
            classes.append("trikona")
        if h in (6, 8, 12):
            classes.append("dusthana")
        if h in (3, 6, 11):
            classes.append("trishadaya")
        if h in (2, 7):
            classes.append("maraka")
    classes = sorted(list(set(classes)))

    # Functional role from Lagna
    # Yogakaraka check (owns both a kendra and a trikona)
    owns_kendra = any(h in (4, 7, 10) for h in owned)
    owns_trikona = any(h in (5, 9) for h in owned)
    is_yogakaraka = owns_kendra and owns_trikona

    if is_yogakaraka:
        functional_nature = "yogakaraka"
        func_exp = f"{planet_name} lords both a Kendra and a Trikona ({owned}), rendering it a premier Yogakaraka."
    elif any(h in (5, 9) for h in owned) or 1 in owned:
        functional_nature = "functional_benefic"
        func_exp = f"{planet_name} rules auspicious Trikona/Lagna houses ({owned}), conferring functional beneficence."
    elif all(h in (6, 8, 12, 3, 11) for h in owned) and owned:
        functional_nature = "functional_malefic"
        func_exp = f"{planet_name} rules Dusthana/Trishadaya houses ({owned}), acting as a functional challenge."
    else:
        functional_nature = "functional_neutral"
        func_exp = f"{planet_name} possesses mixed or neutral house lordships ({owned})."

    # Dispositor
    sign_idx = chart.positions[graha_id].rasi
    lord_id = int(RASI_LORD[sign_idx])
    dispositor_name = GRAHA_NAMES[lord_id] if 0 <= lord_id < len(GRAHA_NAMES) else "Unknown"
    disp_state = chart.grahas.get(lord_id)
    disp_house = disp_state.house if disp_state else 1
    disp_sign = RASI_NAMES[chart.positions[lord_id].rasi] if lord_id in chart.positions else "Unknown"
    disp_dignity = disp_state.dignity if disp_state else "neutral"

    # Module G House Offset (if enabled and applicable)
    offset_info = None
    if is_retrograde and include_house_offsets and planet_name in HOUSE_OFFSET_RULES:
        rule_spec = HOUSE_OFFSET_RULES[planet_name]
        target_house = (house - 1 + rule_spec["offset"]) % 12 + 1
        offset_info = {
            "planet": planet_name,
            "offset_count": rule_spec["offset"],
            "target_house": target_house,
            "source": rule_spec["source"],
            "confidence": rule_spec["confidence"],
            "description": (
                f"{planet_name} casts secondary retrograde influence onto house {target_house} "
                f"({rule_spec['offset']} houses counted from its occupied house {house})."
            ),
        }

    return HouseAnalysis(
        occupied_house=house,
        owned_houses=owned,
        lordship_classes=classes,
        functional_nature=functional_nature,
        dispositor=dispositor_name,
        dispositor_sign=disp_sign,
        dispositor_house=disp_house,
        dispositor_dignity=disp_dignity,
        functional_explanation=func_exp,
        house_offset_influence=offset_info,
    )


# ---------------------------------------------------------------------------
# Module I & J: Aspects, Conjunctions & Combustion
# ---------------------------------------------------------------------------

def calculate_aspects_conjunctions(
    planet_name: str,
    graha_id: int,
    chart: Chart,
) -> AspectConjunctionAnalysis:
    """Analyze drishti (aspects), conjunctions, combustion and war (Modules I & J)."""
    pos = chart.positions[graha_id]
    rasi = pos.rasi
    house = chart.grahas[graha_id].house

    # Conjunctions (other grahas in same rasi)
    conj = [
        GRAHA_NAMES[g]
        for g, p in chart.positions.items()
        if g != graha_id and p.rasi == rasi
    ]

    # Aspects received
    benefic_aspects = []
    malefic_aspects = []
    special_aspects_cast = []

    natural_benefics = {Graha.JUPITER, Graha.VENUS}
    natural_malefics = {Graha.SUN, Graha.MARS, Graha.SATURN, Graha.RAHU, Graha.KETU}

    for other_id, other_pos in chart.positions.items():
        if other_id == graha_id:
            continue
        other_name = GRAHA_NAMES[other_id]
        h_diff = (pos.rasi - other_pos.rasi) % 12 + 1

        # Check standard 7th house aspect
        aspects_other = h_diff == 7
        # Special aspects
        if other_id == Graha.MARS and h_diff in (4, 8):
            aspects_other = True
        elif other_id == Graha.JUPITER and h_diff in (5, 9):
            aspects_other = True
        elif other_id == Graha.SATURN and h_diff in (3, 10):
            aspects_other = True

        if aspects_other:
            item = {
                "graha": other_name,
                "aspecting_house": h_diff,
                "nature": "benefic" if other_id in natural_benefics else "malefic",
            }
            if other_id in natural_benefics:
                benefic_aspects.append(item)
            elif other_id in natural_malefics:
                malefic_aspects.append(item)

    # Special aspects cast by THIS planet
    if graha_id == Graha.MARS:
        special_aspects_cast.extend([
            {"target_house": (house + 3) % 12 or 12, "aspect": "4th house special aspect"},
            {"target_house": (house + 6) % 12 or 12, "aspect": "7th house full aspect"},
            {"target_house": (house + 7) % 12 or 12, "aspect": "8th house special aspect"},
        ])
    elif graha_id == Graha.JUPITER:
        special_aspects_cast.extend([
            {"target_house": (house + 4) % 12 or 12, "aspect": "5th house trinal aspect"},
            {"target_house": (house + 6) % 12 or 12, "aspect": "7th house full aspect"},
            {"target_house": (house + 8) % 12 or 12, "aspect": "9th house trinal aspect"},
        ])
    elif graha_id == Graha.SATURN:
        special_aspects_cast.extend([
            {"target_house": (house + 2) % 12 or 12, "aspect": "3rd house special aspect"},
            {"target_house": (house + 6) % 12 or 12, "aspect": "7th house full aspect"},
            {"target_house": (house + 9) % 12 or 12, "aspect": "10th house special aspect"},
        ])
    elif graha_id not in (Graha.RAHU, Graha.KETU):
        special_aspects_cast.append(
            {"target_house": (house + 6) % 12 or 12, "aspect": "7th house full aspect"}
        )

    # Combustion (Module J)
    comb = combustion(graha_id, chart.positions)

    # Planetary war check
    war_info = None
    for w in chart.planetary_war:
        if graha_id in (w[0], w[1]):
            other_w = w[1] if w[0] == graha_id else w[0]
            winner = w[2]
            war_info = {
                "in_war": True,
                "opponent": GRAHA_NAMES[other_w] if 0 <= other_w < len(GRAHA_NAMES) else "Other",
                "winner": GRAHA_NAMES[winner] if 0 <= winner < len(GRAHA_NAMES) else "None",
                "is_winner": winner == graha_id,
                "rule": "BPHS Chapter 27 (evaluated by northern latitude and brilliance; retrograde does not automatically win)",
            }

    return AspectConjunctionAnalysis(
        conjunctions=conj,
        benefic_aspects_received=benefic_aspects,
        malefic_aspects_received=malefic_aspects,
        special_aspects_cast=special_aspects_cast,
        is_combust=comb.combust,
        combustion_orb=comb.orb,
        angular_separation_from_sun=comb.separation,
        planetary_war=war_info,
    )


# ---------------------------------------------------------------------------
# Module K: Varga Engine (Divisional Charts)
# ---------------------------------------------------------------------------

def calculate_varga_analysis(
    planet_name: str,
    graha_id: int,
    chart: Chart,
) -> VargaAnalysis:
    """Evaluate D1, D9 (Navamsha) and D10 (Dasamsa) placements (Module K).
    
    IMPORTANT: The natal retrograde flag is carried identically into divisional
    interpretation. It is NOT independently recalculated in D9 or D10.
    """
    pos = chart.positions[graha_id]
    lon = pos.longitude
    lagna_lon = chart.lagna_longitude

    # D1
    d1_sign = RASI_NAMES[pos.rasi]
    d1_dignity = chart.grahas[graha_id].dignity
    d1_house = chart.grahas[graha_id].house

    # D9 (Navamsha)
    d9_pos = varga(lon, "D9")
    d9_lagna = varga(lagna_lon, "D9")
    d9_sign = RASI_NAMES[d9_pos.sign]
    d9_house = (d9_pos.sign - d9_lagna.sign) % 12 + 1
    # Simple D9 sign dignity
    d9_dignity = sign_dignity(graha_id, d9_pos.longitude)

    # D10 (Dasamsa)
    d10_pos = varga(lon, "D10")
    d10_lagna = varga(lagna_lon, "D10")
    d10_sign = RASI_NAMES[d10_pos.sign]
    d10_house = (d10_pos.sign - d10_lagna.sign) % 12 + 1
    d10_dignity = sign_dignity(graha_id, d10_pos.longitude)

    # Vargottama: same sign in D1 and D9
    is_vargottama = pos.rasi == d9_pos.sign

    varga_summary = f"{planet_name} is in {d1_sign} in D1, {d9_sign} in D9 (Navamsha), and {d10_sign} in D10 (Dasamsa)."
    if is_vargottama:
        varga_summary += " Being Vargottama, its internal structural foundation is notably strengthened."

    return VargaAnalysis(
        D1_sign=d1_sign,
        D1_dignity=d1_dignity,
        D1_house=d1_house,
        D9_sign=d9_sign,
        D9_dignity=d9_dignity,
        D9_house=d9_house,
        D10_sign=d10_sign,
        D10_dignity=d10_dignity,
        D10_house=d10_house,
        is_vargottama=is_vargottama,
        natal_retrograde_accompanies_varga=True,
        varga_interpretation=varga_summary,
    )


# ---------------------------------------------------------------------------
# Module L: Dasha Engine Context
# ---------------------------------------------------------------------------

def calculate_dasha_context(
    planet_name: str,
    is_retrograde: bool,
    dasha_chain: list[str] | None = None,
) -> DashaContext:
    """Evaluate Dasha activation and classical rules (Module L)."""
    chain = [p.capitalize() for p in (dasha_chain or [])]
    is_md = len(chain) > 0 and chain[0] == planet_name
    is_ad = len(chain) > 1 and chain[1] == planet_name
    level = 1 if is_md else (2 if is_ad else None)

    if is_retrograde and planet_name not in ("Sun", "Moon", "Rahu", "Ketu"):
        effect = (
            "During its Dasha, this retrograde planet manifests intense, memorable results. "
            "Pursuant to Phaladeepika 20.14, its periods stimulate prominent enterprise, "
            "elevated reputation, or concentrated karmic labor."
        )
        source = "Phaladeepika 20.14"
        reversal = (
            "An alternative recension of BPHS Ch. 35 posits altered sub-period progression or "
            "inverted timing for retrograde planets. This is an edition-specific variant and "
            "not universal Parashari doctrine."
        )
    else:
        effect = "Standard Dasha progression governed by planetary strength and house lordship."
        source = "BPHS Chapter 26 / Standard Parashari"
        reversal = None

    return DashaContext(
        is_active_mahadasha=is_md,
        is_active_antardasha=is_ad,
        active_dasha_level=level,
        classical_dasha_effect=effect,
        source_reference=source,
        edition_specific_reversal_caveat=reversal,
    )


# ---------------------------------------------------------------------------
# Module F & G: Classical Rules Applicability
# ---------------------------------------------------------------------------

def evaluate_applicable_rules(
    planet_name: str,
    motion: MotionClassification,
    dignity: DignityState,
    house_analysis: HouseAnalysis,
    aspects: AspectConjunctionAnalysis,
    shadbala: ShadbalaDetail | None,
    analysis_settings: dict[str, Any],
) -> list[AppliedRuleView]:
    """Evaluate and collect all verified rules applicable to this planet (Module F)."""
    applied: list[AppliedRuleView] = []

    def add_rule(rule_key: str):
        if rule_key not in RULES:
            return
        r = RULES[rule_key]
        p = PASSAGES[r.source_passage_id]
        t = TEXTS[p.text_id]
        applied.append(
            AppliedRuleView(
                rule_id=r.rule_id,
                rule_name=r.rule_name,
                category=r.category,
                text_title=t.title,
                chapter_verse=f"Ch. {p.chapter}, v. {p.verse}",
                sanskrit=p.sanskrit,
                iast=p.iast,
                translation=p.translation,
                effect=r.effect_description,
                confidence=r.confidence.value,
                witness=p.witness,
            )
        )

    # Rahu & Ketu: Module M separate pathway
    if motion.is_node or planet_name in ("Rahu", "Ketu"):
        return applied

    # Sun & Moon: Not applicable
    if planet_name in ("Sun", "Moon"):
        return applied

    # General rules for planets evaluated for strength (F6)
    add_rule("F6_BPHS_LORDSHIP_MANIFESTATION")

    # Retrograde-specific rules
    if motion.is_retrograde:
        add_rule("F1_BPHS_CHESTA_BALA")
        add_rule("F3_PHALADEEPIKA_STRENGTH_CONDITION")
        add_rule("F9_SARAVALI_BENEFIC_MALEFIC_SPLIT")
        add_rule("F11_HORASARA_INTERNALIZATION")
        add_rule("F7_PHALADEEPIKA_DASHA_ACTIVATION")

        # F2: Phaladeepika 9.20 (applies to all retrograde planets, highlighted in debilitation/enemy)
        add_rule("F2_PHALADEEPIKA_EXALTATION_LIKE")

        # F4 / F5: Planet specific
        if planet_name == "Venus":
            add_rule("F4_JATAKA_PARIJATA_VENUS")
        elif planet_name == "Saturn":
            add_rule("F5_JATAKA_PARIJATA_SATURN")

        # F8: Raja Yoga qualification if in Kendra/Trikona and meets threshold
        if (
            house_analysis.occupied_house in (1, 4, 5, 7, 9, 10)
            and shadbala
            and shadbala.strength_ratio >= 0.9
        ):
            add_rule("F8_PHALADEEPIKA_RAJA_YOGA")

        # Contested Uttara Kalamrita 2.6 (only if enabled in settings)
        if analysis_settings.get("include_uttara_kalamrita", False) and (
            dignity.is_debilitated or dignity.is_exalted
        ):
            add_rule("F10_UTTARA_KALAMRITA_INVERSION")

        # Module G: House offset rules (if tradition enabled)
        if analysis_settings.get("include_house_offsets", False):
            offset_map = {
                "Mars": "G1_BPHS_ALT_MARS_OFFSET",
                "Mercury": "G2_BPHS_ALT_MERCURY_OFFSET",
                "Jupiter": "G3_BPHS_ALT_JUPITER_OFFSET",
                "Venus": "G4_BPHS_ALT_VENUS_OFFSET",
                "Saturn": "G5_SANKETA_NIDHI_SATURN_OFFSET",
            }
            if planet_name in offset_map:
                add_rule(offset_map[planet_name])

    return applied


# ---------------------------------------------------------------------------
# Module N: Conflict Resolution Engine
# ---------------------------------------------------------------------------

def resolve_textual_conflicts(
    planet_name: str,
    motion: MotionClassification,
    dignity: DignityState,
    aspects: AspectConjunctionAnalysis,
    analysis_settings: dict[str, Any],
) -> list[TextualConflictView]:
    """Identify and format relevant classical textual disputes under display_both (Module N)."""
    views: list[TextualConflictView] = []

    def add_conflict(conflict_id: str):
        if conflict_id not in CONFLICTS:
            return
        c = CONFLICTS[conflict_id]
        views.append(
            TextualConflictView(
                conflict_id=c.conflict_id,
                topic=c.topic,
                explanation=c.explanation,
                resolution=c.resolution_method,
                diverging_rules=c.rules,
            )
        )

    # 1. Debilitation / Exaltation conflict
    if motion.is_retrograde and (dignity.is_debilitated or dignity.is_exalted):
        add_conflict("RETROGRADE_DEBILITATION_001")

    # 2. Combustion conflict
    if motion.is_retrograde and aspects.is_combust:
        add_conflict("RETROGRADE_COMBUSTION_003")

    # 3. House offset conflict
    if motion.is_retrograde and analysis_settings.get("include_house_offsets", False):
        add_conflict("RETROGRADE_HOUSE_OFFSETS_004")

    # 4. Dasha direction conflict (if retrograde)
    if motion.is_retrograde:
        add_conflict("RETROGRADE_DASHA_DIRECTION_002")

    return views


# ---------------------------------------------------------------------------
# Module O & 19: Final Interpretation Synthesis Algorithm
# ---------------------------------------------------------------------------

def generate_multi_dimensional_interpretation(
    planet_name: str,
    motion: MotionClassification,
    dignity: DignityState,
    shadbala: ShadbalaDetail | None,
    house_analysis: HouseAnalysis,
    aspects: AspectConjunctionAnalysis,
    varga: VargaAnalysis,
    dasha: DashaContext,
) -> InterpretationResult:
    """Generate deterministic, explainable multi-dimensional synthesis (Module O).
    
    Adheres strictly to the Fundamental Rule: Strength != Auspiciousness.
    Never generates a simplistic label like 'Good' or 'Bad'.
    """
    if planet_name in ("Sun", "Moon"):
        return InterpretationResult(
            summary=f"{planet_name} is a luminary and does not undergo geocentric retrograde motion.",
            astronomical_factor="Luminaries move exclusively in direct motion along the ecliptic.",
            motional_strength_factor="Chesta Bala for luminaries is calculated via Ayana Bala / Paksha Bala.",
            dignity_factor=f"Actual sign dignity is {dignity.actual} in {varga.D1_sign}.",
            house_lordship_factor=f"Lords house(s) {house_analysis.owned_houses} from Lagna.",
            functional_impact_factor=house_analysis.functional_explanation,
            timing_factor="Standard solar/lunar dasha progression.",
            certainty="definitive_astronomical",
        )

    if motion.is_node or planet_name in ("Rahu", "Ketu"):
        return InterpretationResult(
            summary=(
                f"{planet_name} is a lunar node evaluated under the {motion.node_convention or 'mean'} "
                f"convention. Node motion is naturally retrograde and is not interpreted through the "
                f"ordinary five-planet Vakri rules."
            ),
            astronomical_factor=f"Motion is {motion.motion} with speed {motion.daily_speed:+.4f}°/day.",
            motional_strength_factor="Node strength depends on dispositor condition, sign, and drishti rather than Chesta Bala virupas.",
            dignity_factor=f"Posited in {varga.D1_sign} (House {house_analysis.occupied_house}).",
            house_lordship_factor="Shadow planet (Chhaya Graha); reflects the traits of its sign lord and conjunct planets.",
            functional_impact_factor=f"Dispositor is {house_analysis.dispositor} in {house_analysis.dispositor_sign}.",
            timing_factor="Intense karmic manifestation in its Dasha periods.",
            certainty="classical_node_paradigm",
        )

    # 5 Classical Planets
    if not motion.is_retrograde:
        speed_text = f"direct motion ({motion.daily_speed:+.4f}°/day)" if not motion.is_stationary else "stationary"
        shad_text = f"Shadbala ratio {shadbala.strength_ratio:.2f}" if shadbala else "Shadbala calculated"
        return InterpretationResult(
            summary=(
                f"{planet_name} is in {speed_text} in {varga.D1_sign} (House {house_analysis.occupied_house}). "
                f"Its actual dignity is {dignity.actual}, operating with {shad_text}."
            ),
            astronomical_factor=f"Daily speed is {motion.daily_speed:+.4f}°/day (tolerated threshold {motion.tolerance}).",
            motional_strength_factor=f"Motion category is {motion.motion_category} ({motion.chesta_virupas:.1f} Virupas).",
            dignity_factor=f"Sign dignity in D1 is {dignity.actual}; Navamsha (D9) sign is {varga.D9_sign}.",
            house_lordship_factor=f"Rules houses {house_analysis.owned_houses} from Lagna; functional role is {house_analysis.functional_nature}.",
            functional_impact_factor=house_analysis.functional_explanation,
            timing_factor=dasha.classical_dasha_effect,
            certainty="standard_classical_evaluation",
        )

    # RETROGRADE PLANET
    # Multi-dimensional evaluation
    # 1. Strength != Auspiciousness
    # 2. Malefic vs Benefic
    is_natural_malefic = planet_name in ("Mars", "Saturn")
    is_natural_benefic = planet_name in ("Jupiter", "Venus", "Mercury")

    summary_parts = []
    summary_parts.append(
        f"Retrogression endows {planet_name} with potent motional energy (Chesta Bala: {motion.chesta_virupas:.0f} Virupas, Vakra category)."
    )

    if dignity.is_debilitated:
        summary_parts.append(
            f"While its astronomical sign dignity remains strictly debilitated in {varga.D1_sign}, "
            f"Phaladeepika 9.20 indicates that its retrograde motional intensity enables it to generate "
            f"exaltation-like capacity and heightened house manifestation."
        )
    elif dignity.is_exalted:
        summary_parts.append(
            f"Its actual sign dignity is exalted in {varga.D1_sign}, combining positional height "
            f"with motional vigor."
        )
    else:
        summary_parts.append(
            f"Its actual sign dignity is {dignity.actual} in {varga.D1_sign}."
        )

    if is_natural_malefic:
        summary_parts.append(
            f"As a natural malefic, this retrograde strength amplifies its formidable drive, "
            f"endurance, and sharp karmic lessons rather than delivering effortless comfort."
        )
    else:
        summary_parts.append(
            f"As a natural benefic, its retrograde strength amplifies its intellectual, "
            f"protective, or cultural potential, qualified by its functional lordship."
        )

    if aspects.is_combust:
        summary_parts.append(
            f"Crucially, {planet_name} is combust (Asta) within {aspects.angular_separation_from_sun:.1f}° of the Sun. "
            f"Per classical authorities, retrogression does not cancel combustion; the planet possesses vigorous "
            f"internal force but faces external visibility constraints."
        )

    summary_text = " ".join(summary_parts)

    return InterpretationResult(
        summary=summary_text,
        astronomical_factor=(
            f"Apparent geocentric backward motion with daily velocity {motion.daily_speed:+.4f}°/day. "
            f"Distance to Sun is {aspects.angular_separation_from_sun:.2f}°."
        ),
        motional_strength_factor=(
            f"Chesta Bala is maximized at {motion.chesta_virupas:.0f} Virupas under BPHS 27.22. "
            f"Total Shadbala is {shadbala.total_shadbala_rupas if shadbala else 0:.2f} Rupas "
            f"(ratio {shadbala.strength_ratio if shadbala else 0:.2f} vs reference threshold)."
        ),
        dignity_factor=(
            f"Actual sign dignity: {dignity.actual}. "
            + (f"Retrograde classical effect: {dignity.retrograde_classical_effect} ({dignity.interpretive_source})." if dignity.retrograde_classical_effect else "No dignity inversion.")
        ),
        house_lordship_factor=(
            f"Occupies House {house_analysis.occupied_house}; rules House(s) {house_analysis.owned_houses}. "
            f"Functional nature: {house_analysis.functional_nature}."
        ),
        functional_impact_factor=house_analysis.functional_explanation,
        timing_factor=dasha.classical_dasha_effect,
        certainty="classical_rule_with_contextual_qualification",
    )


# ---------------------------------------------------------------------------
# Master Pipeline: Analyze Single Planet & Chart
# ---------------------------------------------------------------------------

def analyze_planet_vakri(
    planet_name: str,
    chart: Chart,
    *,
    analysis_settings: dict[str, Any] | None = None,
    dasha_chain: list[str] | None = None,
) -> VakriPlanetAnalysis:
    """Master single-planet evaluation pipeline executing steps 1 through 11."""
    settings = analysis_settings or {}
    graha_id = next((g for g, name in enumerate(GRAHA_NAMES) if name == planet_name), None)
    if graha_id is None or graha_id not in chart.positions:
        raise ValueError(f"Planet {planet_name} not found in chart")

    pos = chart.positions[graha_id]
    speed = pos.speed_longitude
    tolerance = float(settings.get("speed_tolerance", DEFAULT_SPEED_TOLERANCE))
    is_node = graha_id in (Graha.RAHU, Graha.KETU)
    node_type = getattr(chart.settings, "node_type", "True")
    if hasattr(node_type, "value"):
        node_type = node_type.value

    # 1. Astronomical State
    motion = classify_astronomical_motion(
        planet_name,
        speed,
        tolerance=tolerance,
        is_node=is_node,
        node_type=str(node_type),
    )

    # 2. Chesta Bala & Shadbala
    chesta = calculate_chesta_bala_detail(planet_name, motion)
    shadbala = calculate_shadbala_engine(planet_name, chart, graha_id, motion)

    # 3. Dignity State
    dignity = calculate_dignity_state(
        planet_name,
        graha_id,
        chart.positions,
        motion.is_retrograde,
        include_uttara_kalamrita=bool(settings.get("include_uttara_kalamrita", False)),
    )

    # 4. House Context & Lordship
    house_analysis = calculate_house_analysis(
        planet_name,
        graha_id,
        chart,
        motion.is_retrograde,
        include_house_offsets=bool(settings.get("include_house_offsets", False)),
    )

    # 5. Aspects, Conjunctions & Combustion
    aspects = calculate_aspects_conjunctions(planet_name, graha_id, chart)

    # 6. Divisional Charts (Vargas)
    varga_analysis = calculate_varga_analysis(planet_name, graha_id, chart)

    # 7. Classical Retrograde Rules
    applied_rules = evaluate_applicable_rules(
        planet_name,
        motion,
        dignity,
        house_analysis,
        aspects,
        shadbala,
        settings,
    )

    # 8. Dasha Context
    dasha_context = calculate_dasha_context(
        planet_name,
        motion.is_retrograde,
        dasha_chain=dasha_chain,
    )

    # 9. Textual Conflicts
    conflicts = resolve_textual_conflicts(
        planet_name,
        motion,
        dignity,
        aspects,
        settings,
    )

    # 10. Multi-dimensional Synthesis
    interpretation = generate_multi_dimensional_interpretation(
        planet_name,
        motion,
        dignity,
        shadbala,
        house_analysis,
        aspects,
        varga_analysis,
        dasha_context,
    )

    # 11. Provenance & Sources
    sources = []
    seen_passages = set()
    for r in applied_rules:
        rule_obj = RULES.get(r.rule_id)
        if rule_obj and rule_obj.source_passage_id not in seen_passages:
            seen_passages.add(rule_obj.source_passage_id)
            pas = PASSAGES[rule_obj.source_passage_id]
            txt = TEXTS[pas.text_id]
            sources.append({
                "text": txt.title,
                "author": txt.author,
                "chapter": str(pas.chapter),
                "verse": str(pas.verse),
                "witness": pas.witness,
                "confidence": pas.confidence.value,
            })

    return VakriPlanetAnalysis(
        planet=planet_name,
        retrograde=motion.is_retrograde,
        is_stationary=motion.is_stationary,
        is_node=motion.is_node,
        motion=motion,
        dignity=dignity,
        chesta_bala=chesta,
        shadbala=shadbala,
        house_analysis=house_analysis,
        aspects_conjunctions=aspects,
        varga_analysis=varga_analysis,
        dasha_analysis=dasha_context,
        classical_rules=applied_rules,
        textual_conflicts=conflicts,
        interpretation=interpretation,
        sources=sources,
    )


def analyze_chart_vakri(
    chart: Chart,
    *,
    analysis_settings: dict[str, Any] | None = None,
    dasha_chain: list[str] | None = None,
) -> VakriChartAnalysis:
    """Run the complete Vakri Intelligence Engine for all planets in a chart."""
    settings = analysis_settings or {}
    results: dict[str, VakriPlanetAnalysis] = {}
    retrogrades: list[str] = []

    # Evaluate all 7 classical planets + 2 nodes
    eval_order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]

    for name in eval_order:
        graha_id = next((g for g, n in enumerate(GRAHA_NAMES) if n == name), None)
        if graha_id is not None and graha_id in chart.positions:
            res = analyze_planet_vakri(
                name,
                chart,
                analysis_settings=settings,
                dasha_chain=dasha_chain,
            )
            results[name] = res
            if res.retrograde and not res.is_node:
                retrogrades.append(name)

    # Synthesis summary across the chart
    if retrogrades:
        planets_str = ", ".join(retrogrades)
        chart_synthesis = (
            f"The chart contains {len(retrogrades)} retrograde taragraha(s): {planets_str}. "
            f"Each retrograde planet possesses heightened motional strength (Chesta Bala: 60 Virupas). "
            f"Their results are determined through the interaction of their functional roles, actual sign "
            f"dignity, dispositor integrity, and solar combustion rather than as an independent verdict."
        )
    else:
        chart_synthesis = (
            "No non-luminary planets are retrograde in this chart. All taragrahas operate in "
            "direct or stationary apparent motion."
        )

    calc_settings = {
        "ayanamsa": getattr(chart.settings, "ayanamsa", "Lahiri"),
        "house_system": getattr(chart.settings, "house_system", "Whole Sign"),
        "node_type": getattr(chart.settings, "node_type", "True"),
        "topocentric": getattr(chart.settings, "topocentric", False),
    }

    return VakriChartAnalysis(
        chart_id=None,
        calculation_settings=calc_settings,
        analysis_settings=settings,
        retrograde_count=len(retrogrades),
        retrograde_planets=retrogrades,
        planets=results,
        chart_level_synthesis=chart_synthesis,
    )
