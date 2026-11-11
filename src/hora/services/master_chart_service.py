"""Master Chart Service — Complete Natal Kundli Assembly.

Computes the entire Vedic astrological chart in a single in-memory Python pass:
- Swiss Ephemeris astronomical positions, bhavas, lagna, ayanamsha
- Complete Panchanga (Tithi, Vaara, Nakshatra, Yoga, Karana, Sun times)
- Shodasavarga divisional charts (D1 to D60)
- Special Lagnas (Hora, Ghati, Bhava, Varnada, Sree, Indu, Pranapada) & Upagrahas
- Vimshottari Dasha tree & sub-periods
- 6-fold Parashari Shadbala (Sthana, Dig, Kaala, Chesta, Naisargika, Drik, Rupas, Ratios, Thresholds)
- Chara Karakas (Atmakaraka, Amatyakaraka, etc.)
- Functional nature & Yogakarakas for the Lagna
- Parashari Planetary Aspects & Rasi Drishti
- Arudha Padas (A1 to A12, Upapada UL, Arudha Lagna AL)
- Baadhakas & Marakas
- Ashtakavarga (BAV & SAV)
- Parashari & Classical Planetary Yogas
- Argala & Virodha Argala
- Purushartha & Elemental Balance
"""
from __future__ import annotations

import datetime
from functools import lru_cache
from typing import Any

from hora.api.serialize import (
    chart_out,
    envelope,
    panchanga_out,
    sign_and_degree,
    varga_out,
)
from hora.charts.chart import Chart, Place, compute_chart
from hora.charts.functional import for_lagna
from hora.charts.karaka import chara_karakas
from hora.charts.special_lagna import all_special_lagnas
from hora.charts.upagraha import all_upagrahas, birth_period
from hora.charts.vakri import analyze_chart_vakri
from hora.charts.vargas import SHODASAVARGA
from hora.core.const import (
    CHARA_KARAKAS,
    GRAHA_NAMES,
    KARAKA_KINDS,
    NAKSHATRA_NAMES,
    RASI_NAMES,
    Graha,
)
from hora.core.settings import Settings
from hora.core.timeutil import Instant, jd_to_local_str
from hora.panchanga.core import compute_panchanga
from hora.services import (
    argala_service,
    arudha_service,
    ashtakavarga_service,
    aspect_service,
    baadhaka_service,
    chart_service,
    dasha_service,
    maraka_service,
    planetary_yoga_service,
    relationship_service,
)

PLANET_SANSKRIT = {
    "Sun": "Surya",
    "Moon": "Chandra",
    "Mars": "Mangala",
    "Mercury": "Budha",
    "Jupiter": "Guru",
    "Venus": "Shukra",
    "Saturn": "Shani",
    "Rahu": "Rahu",
    "Ketu": "Ketu",
}


@lru_cache(maxsize=128)
def _cached_master_chart(
    instant: Instant,
    place: Place,
    settings: Settings,
    name: str = "Native",
) -> dict[str, Any]:
    """Compute the entire Vedic astrological chart in one pass."""
    # 1. Base Ephemeris Chart
    chart = compute_chart(instant, place, settings)
    rasi_data = chart_out(chart)

    # 2. Panchanga
    panchanga_raw = compute_panchanga(
        instant, place.latitude, place.longitude, settings, place.altitude
    )
    panchanga_data = panchanga_out(panchanga_raw)

    # 3. Shodasavarga
    vargas_data = {
        code: varga_out(chart.varga_chart(code), chart, code)
        for code in SHODASAVARGA
    }

    # 4. Upagrahas
    period = birth_period(
        chart.instant.jd_ut, place.latitude, place.longitude, place.altitude, settings
    )
    upagraha_positions = all_upagrahas(
        chart.positions[Graha.SUN].longitude,
        period.vaara,
        night=period.is_night,
        period_start_jd=period.start_jd,
        period_end_jd=period.end_jd,
        latitude=place.latitude,
        longitude=place.longitude,
        settings=settings,
    )
    upagrahas_data = chart_service._upagraha_out(
        chart, period, upagraha_positions, place, settings
    )

    # 5. Special Lagnas
    lagnas_dict = all_special_lagnas(
        sunrise_jd=period.sunrise_jd,
        jd_ut=chart.instant.jd_ut,
        lagna_longitude=chart.lagna_longitude,
        moon_longitude=chart.positions[Graha.MOON].longitude,
        settings=settings,
    )
    off = chart.instant.utc_offset_hours
    special_lagnas_data = {
        **envelope(instant, place, settings),
        "sunrise": jd_to_local_str(period.sunrise_jd, off),
        "lagna": sign_and_degree(chart.lagna_longitude),
        "special_lagnas": [
            {
                "id": lagna.lagna,
                "name": lagna.name,
                "abbreviation": lagna.abbreviation,
                **sign_and_degree(lagna.longitude),
                "house": (lagna.rasi - chart.lagna_rasi) % 12 + 1,
                "signifies": lagna.signifies,
            }
            for lagna in sorted(lagnas_dict.values(), key=lambda x: x.lagna)
        ],
    }

    # 6. Vimshottari Dasha Tree
    try:
        dashas_data = dasha_service.dasha_tree(
            instant,
            place,
            settings,
            system="vimshottari",
            levels=3,
            cycles=1,
            start_star=1,
            reckon_from="moon",
            as_of=None,
            tz_name=None,
            utc_offset_hours=off,
        )
    except Exception:
        dashas_data = {"periods": []}

    # 7. Vakri Analysis & 6-Fold Parashari Shadbala
    try:
        vakri_analysis = analyze_chart_vakri(chart)
        vakri_dict = {
            "planets": {
                p_name: {
                    "motion": {
                        "category": getattr(p_data.motion, "motion_category", getattr(p_data.motion, "motion", "direct")),
                        "apparent_speed": getattr(p_data.motion, "daily_speed", 0.0),
                        "mean_speed": getattr(p_data.motion, "daily_speed", 0.0),
                        "speed_ratio": 1.0,
                        "chesta_virupas": getattr(p_data.motion, "chesta_virupas", 0.0),
                    },
                    "dignity": {
                        "dignity": getattr(p_data.dignity, "actual", "Neutral"),
                        "score": 0.0,
                        "is_combust": False,
                        "combustion_separation": None,
                    },
                    "shadbala": {
                        "sthana_bala_virupas": p_data.shadbala.sthana_bala_virupas,
                        "dig_bala_virupas": p_data.shadbala.dig_bala_virupas,
                        "kala_bala_virupas": p_data.shadbala.kala_bala_virupas,
                        "chesta_bala_virupas": p_data.shadbala.chesta_bala_virupas,
                        "naisargika_bala_virupas": p_data.shadbala.naisargika_bala_virupas,
                        "drik_bala_virupas": p_data.shadbala.drik_bala_virupas,
                        "total_shadbala_virupas": p_data.shadbala.total_shadbala_virupas,
                        "total_shadbala_rupas": p_data.shadbala.total_shadbala_rupas,
                        "required_shadbala_virupas": p_data.shadbala.required_shadbala_virupas,
                        "required_shadbala_rupas": p_data.shadbala.required_shadbala_rupas,
                        "strength_ratio": p_data.shadbala.strength_ratio,
                        "strength_status": p_data.shadbala.strength_status,
                    } if getattr(p_data, "shadbala", None) else None,
                    "house_analysis": {
                        "occupied_house": getattr(p_data.house_analysis, "occupied_house", None),
                        "owned_houses": list(getattr(p_data.house_analysis, "owned_houses", [])),
                        "functional_nature": getattr(p_data.house_analysis, "functional_nature", "neutral"),
                        "lordship_classes": list(getattr(p_data.house_analysis, "lordship_classes", [])),
                    } if getattr(p_data, "house_analysis", None) else None,
                    "classical_commentary": [
                        {
                            "text_id": getattr(ref, "rule_id", ""),
                            "title": getattr(ref, "text_title", ""),
                            "sanskrit": getattr(ref, "sanskrit", ""),
                            "translation": getattr(ref, "translation", ""),
                            "reference": getattr(ref, "chapter_verse", ""),
                        }
                        for ref in getattr(p_data, "classical_rules", [])
                    ],
                }
                for p_name, p_data in vakri_analysis.planets.items()
            }
        }
    except Exception:
        vakri_dict = {"planets": {}}

    # 8. Chara Karakas
    chara_grahas = [
        Graha.SUN, Graha.MOON, Graha.MARS, Graha.MERCURY,
        Graha.JUPITER, Graha.VENUS, Graha.SATURN, Graha.RAHU
    ]
    try:
        chara_res = chara_karakas(
            {g: chart.positions[g].longitude for g in chara_grahas}
        )
        chara_dict = [
            {
                "graha": k.graha,
                "graha_name": k.graha_name,
                "advancement": round(k.advancement, 4),
                "order": k.order,
                "symbol": k.symbol,
                "name": k.name,
                "shows": k.shows,
                "shared": k.shared,
            }
            for k in chara_res
        ]
    except Exception:
        chara_dict = []

    # 9. Functional Nature & Yogakaraka for the Lagna
    try:
        fn_nature = for_lagna(chart.lagna_rasi)
        functional_dict = {
            "lagna": chart.lagna_rasi,
            "planets": {
                res.planet: {
                    "planet": res.planet,
                    "houses": list(res.houses),
                    "nature": res.nature,
                    "yogakaraka": res.yogakaraka,
                    "depends_on_phase": res.depends_on_phase,
                }
                for res in fn_nature.results
            },
        }
    except Exception:
        functional_dict = {"lagna": chart.lagna_rasi, "planets": {}}

    # 10. Planetary & Rasi Aspects
    graha_signs = {
        int(g): p.rasi
        for g, p in chart.positions.items()
        if int(g) in range(9)
    }
    graha_longitudes = {
        int(g): p.longitude
        for g, p in chart.positions.items()
        if int(g) in range(9)
    }
    try:
        aspects_data = aspect_service.chart(
            graha_signs, chart.lagna_rasi, rahu_ketu_aspects=True
        )
    except Exception:
        aspects_data = {}

    # 11. Arudha Padas (A1 to A12, Upapada UL, AL)
    try:
        arudhas_data = arudha_service.table(
            chart.lagna_rasi, graha_signs, graha_longitudes=graha_longitudes
        )
    except Exception:
        arudhas_data = {}

    # 12. Baadhakas & Marakas
    try:
        baadhakas_data = baadhaka_service.for_chart(chart.lagna_rasi, graha_signs)
    except Exception:
        baadhakas_data = {}

    try:
        marakas_data = maraka_service.marakas(chart.lagna_rasi, graha_signs)
    except Exception:
        marakas_data = {}

    # 13. Ashtakavarga (BAV & SAV)
    ref_signs = {
        GRAHA_NAMES[g]: p.rasi
        for g, p in chart.positions.items()
        if g in (
            Graha.SUN, Graha.MOON, Graha.MARS, Graha.MERCURY,
            Graha.JUPITER, Graha.VENUS, Graha.SATURN
        )
    }
    ref_signs["Lagna"] = chart.lagna_rasi
    try:
        ashtakavarga_data = ashtakavarga_service.chart(ref_signs)
    except Exception:
        ashtakavarga_data = {}

    # 14. Argala & Virodha Argala
    try:
        argala_data = argala_service.chart(graha_signs, chart.lagna_rasi)
    except Exception:
        argala_data = {}

    # 15. Classical Planetary Yogas
    try:
        t_list = panchanga_data.get("tithi") or []
        t_name = t_list[0].get("name", "") if (isinstance(t_list, list) and t_list and isinstance(t_list[0], dict)) else ""
        paksha_idx = 0 if "sukla" in t_name.lower() else 1
        yogas_data = planetary_yoga_service.chart(
            graha_signs, lagna_rasi=chart.lagna_rasi, paksha=paksha_idx
        )
    except Exception:
        yogas_data = {}

    # 16. Purushartha Balance (Dharma, Artha, Kama, Moksha)
    house_planets: dict[int, list[str]] = {h: [] for h in range(1, 13)}
    for g, state in chart.grahas.items():
        if 1 <= state.house <= 12:
            house_planets[state.house].append(state.name)

    purushartha = {
        "dharma": {
            "houses": [1, 5, 9],
            "planets": house_planets[1] + house_planets[5] + house_planets[9],
            "score": len(house_planets[1]) + len(house_planets[5]) + len(house_planets[9]),
        },
        "artha": {
            "houses": [2, 6, 10],
            "planets": house_planets[2] + house_planets[6] + house_planets[10],
            "score": len(house_planets[2]) + len(house_planets[6]) + len(house_planets[10]),
        },
        "kama": {
            "houses": [3, 7, 11],
            "planets": house_planets[3] + house_planets[7] + house_planets[11],
            "score": len(house_planets[3]) + len(house_planets[7]) + len(house_planets[11]),
        },
        "moksha": {
            "houses": [4, 8, 12],
            "planets": house_planets[4] + house_planets[8] + house_planets[12],
            "score": len(house_planets[4]) + len(house_planets[8]) + len(house_planets[12]),
        },
    }

    return {
        "name": name,
        "chart": rasi_data,
        "panchanga": panchanga_data,
        "vargas": vargas_data,
        "special_lagnas": special_lagnas_data,
        "upagrahas": upagrahas_data,
        "dashas": dashas_data,
        "vakri_analysis": vakri_dict,
        "chara_karakas": chara_dict,
        "functional_nature": functional_dict,
        "aspects": aspects_data,
        "arudhas": arudhas_data,
        "baadhakas": baadhakas_data,
        "marakas": marakas_data,
        "ashtakavarga": ashtakavarga_data,
        "argala": argala_data,
        "yogas": yogas_data,
        "purushartha": purushartha,
    }


def compute_master_chart(
    instant: Instant,
    place: Place,
    settings: Settings,
    name: str = "Native",
    birth_data_dict: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compute the entire Vedic astrological chart in one pass (with in-memory LRU caching)."""
    return _cached_master_chart(instant, place, settings, name)


compute_master_chart.cache_info = _cached_master_chart.cache_info
compute_master_chart.cache_clear = _cached_master_chart.cache_clear
