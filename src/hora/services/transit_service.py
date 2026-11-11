"""Transit & Gochara Analysis Service — Classical Parashari Real-Time Transits.

Computes:
1. Real-time sidereal planetary positions via Swiss Ephemeris (topocentric Lahiri)
2. Gochara houses from Janma Rasi (natal Moon) and Janma Lagna
3. Classical BPHS Chapter 25 results, snapshot (Good / Bad), and descriptions
4. Vedha (obstruction) analysis via BPHS Chapter 26 (Table 63) with Father-Son exemptions
5. Saturn Sade Sati 7.5-year cycle tracking (Rising, Peak, Setting, Inactive, exact degree orb)
6. Kantaka Shani (4th, 7th, 10th from Moon or Lagna) and Ashtama Shani (8th from Moon)
7. Natal Bhinna Ashtakavarga (BAV) evaluation on transiting signs
"""
from __future__ import annotations

import datetime
from typing import Any

from hora.api.serialize import sign_and_degree
from hora.charts.chart import Chart, Place, compute_chart
from hora.core.const import (
    GRAHA_NAMES,
    NAKSHATRA_NAMES,
    RASI_NAMES,
    Graha,
)
from hora.core.settings import Settings
from hora.core.timeutil import Instant, from_local
from hora.transits.gochara import (
    bav_transit_verdict,
    good_houses,
    house_from_janma,
    houses_from_janma,
    transit_result,
)
from hora.transits.vedha import vedha

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

PLANET_SYMBOLS = {
    "Sun": "☉",
    "Moon": "☽",
    "Mars": "♂",
    "Mercury": "☿",
    "Jupiter": "♃",
    "Venus": "♀",
    "Saturn": "♄",
    "Rahu": "☊",
    "Ketu": "☋",
}


def analyze_transits(
    transit_instant: Instant,
    transit_place: Place,
    settings: Settings,
    natal_moon_longitude: float,
    natal_lagna_rasi: int,
    natal_bav: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compute the full Gochara and Sade Sati analysis in Python."""
    # 1. Real-time planetary positions
    transit_chart = compute_chart(transit_instant, transit_place, settings)
    transit_longitudes = {
        int(g): p.longitude
        for g, p in transit_chart.positions.items()
        if g in GRAHA_NAMES
    }

    natal_moon_rasi = int(natal_moon_longitude // 30.0)

    # 2. Gochara houses & Vedha for classical 7 planets + Rahu/Ketu
    evaluated_planets = []
    favorable_count = 0
    unfavorable_count = 0

    main_grahas = [
        Graha.SUN, Graha.MOON, Graha.MARS, Graha.MERCURY,
        Graha.JUPITER, Graha.VENUS, Graha.SATURN, Graha.RAHU, Graha.KETU
    ]

    for g in main_grahas:
        g_int = int(g)
        p_name = GRAHA_NAMES[g]
        p_pos = transit_chart.positions[g]
        t_rasi = p_pos.rasi
        t_lon = p_pos.longitude

        house_from_moon = (t_rasi - natal_moon_rasi + 12) % 12 + 1
        house_from_lagna = (t_rasi - natal_lagna_rasi + 12) % 12 + 1

        # Standard Gochara result (BPHS Chapter 25)
        try:
            res = transit_result(g_int, house_from_moon)
            snapshot = res.get("snapshot", "Neutral")
            description = res.get("results", "")
        except Exception:
            if g in (Graha.RAHU, Graha.KETU):
                good = house_from_moon in (3, 6, 11)
                snapshot = "Good" if good else "Bad"
                description = (
                    "Favorable upachaya transit, victory over obstacles."
                    if good else
                    "Challenging house transit, demands mindfulness and patience."
                )
            else:
                snapshot = "Neutral"
                description = f"Transit through house {house_from_moon}."

        is_favorable = snapshot == "Good"

        # Canonical Vedha obstruction check (BPHS Chapter 26)
        vedha_info = {
            "isObstructed": False,
            "obstructedBy": None,
            "vedhaHouse": None,
            "description": "Transit operates unhindered.",
        }

        if g_int <= 6 and is_favorable:
            try:
                v_res = vedha(g_int, natal_moon_longitude, transit_longitudes)
                if v_res.get("obstructed"):
                    vedha_info["isObstructed"] = True
                    obstructors = v_res.get("obstructors", [])
                    vedha_info["obstructedBy"] = ", ".join(obstructors) if obstructors else "Malefic"
                    vedha_info["vedhaHouse"] = v_res.get("vedha_house")
                    vedha_info["description"] = (
                        f"Good results obstructed (Vedha) by {vedha_info['obstructedBy']} "
                        f"in house {v_res.get('vedha_house')}."
                    )
            except Exception:
                pass

        # Ashtakavarga transit evaluation
        bav_points = 4
        bav_verdict_str = "Neutral (4 pts)"
        bav_emphasis = None
        if natal_bav and p_name in natal_bav:
            bav_list = natal_bav[p_name]
            if isinstance(bav_list, list) and len(bav_list) == 12:
                bav_points = bav_list[t_rasi]
            elif isinstance(bav_list, dict):
                bav_points = bav_list.get(str(t_rasi), bav_list.get(t_rasi, 4))

            try:
                bav_eval = bav_transit_verdict(bav_points)
                bav_verdict_str = f"{bav_eval.get('verdict', 'neutral').capitalize()} ({bav_points} pts)"
                bav_emphasis = bav_eval.get("emphasis")
            except Exception:
                bav_verdict_str = f"{bav_points} pts"

        if is_favorable and not vedha_info["isObstructed"]:
            favorable_count += 1
        else:
            unfavorable_count += 1

        nak_idx = int(t_lon // (360.0 / 27.0))
        pada = int((t_lon % (360.0 / 27.0)) // (360.0 / 108.0)) + 1
        d_in_sign = t_lon % 30.0
        dms_str = f"{int(d_in_sign)}°{int((d_in_sign % 1) * 60):02d}'"

        evaluated_planets.append({
            "name": p_name,
            "sanskritName": PLANET_SANSKRIT.get(p_name, p_name),
            "symbol": PLANET_SYMBOLS.get(p_name, "?"),
            "transitSign": RASI_NAMES[t_rasi],
            "transitSignIndex": t_rasi,
            "longitude": round(t_lon, 4),
            "degreesInSign": round(d_in_sign, 2),
            "dms": dms_str,
            "retrograde": p_pos.is_retrograde,
            "speed": round(p_pos.speed_longitude, 4),
            "nakshatra": NAKSHATRA_NAMES[nak_idx] if nak_idx < len(NAKSHATRA_NAMES) else "",
            "pada": pada,
            "houseFromMoon": house_from_moon,
            "houseFromLagna": house_from_lagna,
            "isFavorable": is_favorable,
            "snapshot": snapshot,
            "description": description,
            "vedha": vedha_info,
            "ashtakavarga": {
                "bavPoints": bav_points,
                "rating": "High (Strong)" if bav_points >= 5 else "Critical (Weak)" if bav_points <= 3 else "Medium (Average)",
                "verdict": bav_verdict_str,
                "emphasis": bav_emphasis,
            },
        })

    # 3. Saturn Sade Sati & Kantaka Shani Engine
    saturn_pos = transit_chart.positions[Graha.SATURN]
    s_rasi = saturn_pos.rasi
    s_lon = saturn_pos.longitude

    diff_lon = abs(s_lon - natal_moon_longitude)
    if diff_lon > 180:
        diff_lon = 360 - diff_lon
    degree_orb = round(diff_lon, 2)

    saturn_house_from_moon = (s_rasi - natal_moon_rasi + 12) % 12 + 1
    saturn_house_from_lagna = (s_rasi - natal_lagna_rasi + 12) % 12 + 1

    is_exact_orb = saturn_house_from_moon == 1 and degree_orb <= 5.0

    sade_sati: dict[str, Any] = {
        "isActive": False,
        "phase": "none",
        "phaseNumber": 0,
        "phaseName": "Inactive",
        "sanskritName": "Nir-mukta",
        "intensity": "None",
        "description": "Saturn is currently not transiting the 12th, 1st, or 2nd house from your Janma Rasi (Moon).",
        "saturnSign": RASI_NAMES[s_rasi],
        "saturnSignIndex": s_rasi,
        "natalMoonSign": RASI_NAMES[natal_moon_rasi],
        "natalMoonSignIndex": natal_moon_rasi,
        "degreeOrb": degree_orb,
        "isExactOrb": False,
        "advice": [
            "You are free from Sade Sati pressures.",
            "Maintain steady work ethic and ethical foundations to maximize planetary blessings.",
        ],
        "remedies": [
            "Maintain regular Saturday discipline and acts of humble service.",
            "Light a sesame oil lamp on Saturdays during evening hours.",
        ],
    }

    if saturn_house_from_moon == 12:
        sade_sati.update({
            "isActive": True,
            "phase": "rising",
            "phaseNumber": 1,
            "phaseName": "Rising Phase (12th from Moon)",
            "sanskritName": "Aardha Sade Sati",
            "intensity": "Moderate to High",
            "description": (
                "Saturn transits the 12th house from your Janma Moon. This marks the entry into the 7.5-year cycle, "
                "highlighting mental clearing, unexpected expenditures, sleep rhythm recalibration, and overseas or secluded pursuits."
            ),
            "advice": [
                "Curate your financial expenditures rigorously; avoid speculative bets.",
                "Prioritize deep restorative sleep, meditation, and quiet downtime.",
                "Welcome foreign connections, long-distance travels, or introspective retreats.",
            ],
            "remedies": [
                "Chant Hanuman Chalisa or Dasharatha Shani Stotra on Tuesday and Saturday evenings.",
                "Feed black sesame seeds or mustard-oil fried bread to stray animals or crows on Saturdays.",
                "Donate dark blankets or footwear to elderly underprivileged individuals.",
            ],
        })
    elif saturn_house_from_moon == 1:
        sade_sati.update({
            "isActive": True,
            "phase": "peak",
            "phaseNumber": 2,
            "phaseName": "Peak Phase (Janma Shani)",
            "sanskritName": "Janma Shani (Core Sade Sati)",
            "intensity": "Maximum Intensity (Exact Orb ≤ 5°)" if is_exact_orb else "Maximum / Peak",
            "isExactOrb": is_exact_orb,
            "description": (
                "Saturn transits directly over your Janma Moon sign. This is the culmination and epicenter of the Sade Sati cycle, "
                "demanding rigorous self-honesty, emotional fortitude, physical stamina, and mature responsibility."
            ),
            "advice": [
                "Pay acute attention to physical well-being, dietary purity, and emotional grounding.",
                "Accept heavy leadership and family duties without resentment; Saturn rewards stoic diligence.",
                "Avoid rushed career gambles; build brick by brick with patience.",
            ],
            "remedies": [
                "Recite Maha Mrityunjaya Mantra 108 times daily during morning sandhya.",
                "Perform Shani Thailabhishekam (mustard or sesame oil offering) at a Shani or Shiva temple on Saturdays.",
                "Practice regular fasting or consuming salt-free kichadi on Saturdays.",
            ],
        })
    elif saturn_house_from_moon == 2:
        sade_sati.update({
            "isActive": True,
            "phase": "setting",
            "phaseNumber": 3,
            "phaseName": "Setting Phase (2nd from Moon)",
            "sanskritName": "Antya Sade Sati",
            "intensity": "Moderate",
            "description": (
                "Saturn transits the 2nd house from your Janma Moon. This is the exit phase of the 7.5-year cycle, "
                "focussing on financial consolidation, speech discipline, family ties, and practical rebuilding."
            ),
            "advice": [
                "Exercise extreme tact, humility, and gentle speech in family deliberations.",
                "Focus on liquid capital preservation and systematically retiring accumulated liabilities.",
                "Reflect on the profound wisdom learned during the peak phase and lay enduring foundations.",
            ],
            "remedies": [
                "Distribute whole urad dal and mustard oil to sanitation workers on Saturdays.",
                "Chant the Shani Gayatri Mantra daily for peaceful speech and mental serenity.",
                "Maintain respect and financial care for ancestral elders and teachers.",
            ],
        })

    ashtama_shani = {
        "isActive": saturn_house_from_moon == 8,
        "houseFromMoon": saturn_house_from_moon,
        "description": (
            "Saturn transiting 8th from Moon causes Ashtama Shani: transformative life phase requiring vitality vigilance and patience."
            if saturn_house_from_moon == 8 else ""
        ),
    }

    ardhashtama_shani = {
        "isActive": saturn_house_from_moon == 4,
        "houseFromMoon": saturn_house_from_moon,
        "description": (
            "Saturn transiting 4th from Moon causes Ardhashtama Shani: domestic heaviness, mother care, and property discipline."
            if saturn_house_from_moon == 4 else ""
        ),
    }

    kantaka_active = (
        saturn_house_from_lagna in (4, 7, 10) or saturn_house_from_moon in (4, 7, 10)
    )
    kantaka_source = []
    if saturn_house_from_lagna in (4, 7, 10):
        kantaka_source.append(f"Lagna ({saturn_house_from_lagna}th House)")
    if saturn_house_from_moon in (4, 7, 10):
        kantaka_source.append(f"Moon ({saturn_house_from_moon}th House)")

    kantaka_shani = {
        "isActive": kantaka_active,
        "activeFrom": " & ".join(kantaka_source) if kantaka_source else "None",
        "houseFromLagna": saturn_house_from_lagna,
        "houseFromMoon": saturn_house_from_moon,
        "description": (
            f"Kantaka Shani operative from {', '.join(kantaka_source)}: demanding career obligations, partnership negotiations, and structural discipline."
            if kantaka_active else ""
        ),
    }

    total_planets = len(evaluated_planets)
    favorable_ratio = round(favorable_count / total_planets, 2) if total_planets > 0 else 0.5

    return {
        "transitDate": f"{transit_chart.instant.jd_ut}",
        "natalMoonSign": RASI_NAMES[natal_moon_rasi],
        "natalMoonSignIndex": natal_moon_rasi,
        "natalLagnaSign": RASI_NAMES[natal_lagna_rasi],
        "natalLagnaSignIndex": natal_lagna_rasi,
        "planets": evaluated_planets,
        "sadeSati": sade_sati,
        "ashtamaShani": ashtama_shani,
        "ardhashtamaShani": ardhashtama_shani,
        "kantakaShani": kantaka_shani,
        "summary": {
            "favorableCount": favorable_count,
            "unfavorableCount": unfavorable_count,
            "favorableRatio": favorable_ratio,
            "overallTone": "Auspicious & Uplifting" if favorable_ratio >= 0.6 else "Challenging & Testing" if favorable_ratio <= 0.4 else "Balanced & Mixed",
        },
    }
