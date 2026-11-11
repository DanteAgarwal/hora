"""Workbench Chart Adapter & Presentation Service.

Adapts Python's authoritative master calculation payload into the rich
AstroChart domain model consumed by the Kundli Workbench frontend.
All calculations remain strictly grounded in the Swiss Ephemeris / Parashari engine.
"""
from __future__ import annotations

import math
from typing import Any

from hora.core.const import (
    GRAHA_NAMES,
    NAKSHATRA_NAMES,
    RASI_NAMES,
    Graha,
)
from hora.core.settings import Settings
from hora.core.timeutil import Instant, from_local
from hora.charts.chart import Place
from hora.services import master_chart_service

SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

PLANET_META = {
    "Sun": {"sanskrit": "Surya", "symbol": "☉", "short": "Su"},
    "Moon": {"sanskrit": "Chandra", "symbol": "☽", "short": "Mo"},
    "Mars": {"sanskrit": "Mangala", "symbol": "♂", "short": "Ma"},
    "Mercury": {"sanskrit": "Budha", "symbol": "☿", "short": "Me"},
    "Jupiter": {"sanskrit": "Guru", "symbol": "♃", "short": "Ju"},
    "Venus": {"sanskrit": "Shukra", "symbol": "♀", "short": "Ve"},
    "Saturn": {"sanskrit": "Shani", "symbol": "♄", "short": "Sa"},
    "Rahu": {"sanskrit": "Rahu", "symbol": "☊", "short": "Ra"},
    "Ketu": {"sanskrit": "Ketu", "symbol": "☋", "short": "Ke"},
}

NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

PLANET_NATURAL_KARAKAS = {
    "Sun": "Soul, Father, Ego, Vitality",
    "Moon": "Mind, Mother, Emotions, Nourishment",
    "Mars": "Courage, Siblings, Energy, Land",
    "Mercury": "Intellect, Speech, Commerce, Analytical Skill",
    "Jupiter": "Wisdom, Children, Wealth, Dharma",
    "Venus": "Vehicles, Spouse, Arts, Pleasure",
    "Saturn": "Longevity, Grief, Discipline, Labour",
    "Rahu": "Material desire, Maya, Foreign elements",
    "Ketu": "Moksha, Detachment, Spiritual enlightenment",
}

HOUSE_METADATA = {
    1: {"sanskrit": "Tanu Bhava", "karaka": "Sun", "purushartha": "Dharma", "bhavatBhavam": "Self", "significations": ["Physical body", "Appearance", "Vitality", "Personality"]},
    2: {"sanskrit": "Dhana Bhava", "karaka": "Jupiter", "purushartha": "Artha", "bhavatBhavam": "2nd from 1st", "significations": ["Accumulated wealth", "Speech", "Family", "Food"]},
    3: {"sanskrit": "Sahaja Bhava", "karaka": "Mars", "purushartha": "Kama", "bhavatBhavam": "3rd from 1st", "significations": ["Younger siblings", "Courage", "Efforts", "Short journeys"]},
    4: {"sanskrit": "Sukha Bhava", "karaka": "Moon", "purushartha": "Moksha", "bhavatBhavam": "4th from 1st", "significations": ["Mother", "Home", "Vehicles", "Inner happiness"]},
    5: {"sanskrit": "Putra Bhava", "karaka": "Jupiter", "purushartha": "Dharma", "bhavatBhavam": "5th from 1st", "significations": ["Children", "Intelligence", "Purva Punya", "Creativity"]},
    6: {"sanskrit": "Ari / Rina Bhava", "karaka": "Mars", "purushartha": "Artha", "bhavatBhavam": "6th from 1st", "significations": ["Enemies", "Debts", "Diseases", "Litigation"]},
    7: {"sanskrit": "Yuvati Bhava", "karaka": "Venus", "purushartha": "Kama", "bhavatBhavam": "7th from 1st", "significations": ["Spouse", "Business partners", "Public relations", "Marriage"]},
    8: {"sanskrit": "Randhra Bhava", "karaka": "Saturn", "purushartha": "Moksha", "bhavatBhavam": "8th from 1st", "significations": ["Longevity", "Sudden events", "Occult", "Transformation"]},
    9: {"sanskrit": "Dharma Bhava", "karaka": "Jupiter", "purushartha": "Dharma", "bhavatBhavam": "9th from 1st", "significations": ["Father", "Guru", "Higher wisdom", "Fortune"]},
    10: {"sanskrit": "Karma Bhava", "karaka": "Mercury", "purushartha": "Artha", "bhavatBhavam": "10th from 1st", "significations": ["Career", "Status", "Fame", "Public actions"]},
    11: {"sanskrit": "Labha Bhava", "karaka": "Jupiter", "purushartha": "Kama", "bhavatBhavam": "11th from 1st", "significations": ["Gains", "Elder siblings", "Aspirations", "Network"]},
    12: {"sanskrit": "Vyaya Bhava", "karaka": "Saturn", "purushartha": "Moksha", "bhavatBhavam": "12th from 1st", "significations": ["Expenses", "Moksha", "Foreign lands", "Bed pleasures"]},
}


def parse_sign_index(sign_str: str) -> int:
    if not sign_str:
        return 0
    clean = sign_str.strip().lower()
    for idx, s in enumerate(SIGN_NAMES):
        if s.lower() == clean or clean.startswith(s.lower()[:3]):
            return idx
    return 0


def format_dms(deg: float) -> str:
    if deg is None or math.isnan(deg):
        return '0°00\'00"'
    d = int(math.floor(deg))
    min_float = (deg - d) * 60.0
    m = int(math.floor(min_float))
    s = int(round((min_float - m) * 60.0))
    if s >= 60:
        m += 1
        s -= 60
    if m >= 60:
        d += 1
        m -= 60
    return f"{d}°{m:02d}'{s:02d}\""


def get_ordinal(n: int) -> str:
    r = n % 100
    if 11 <= r <= 13:
        return f"{n}th"
    suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def derive_house_categories(h: int) -> list[str]:
    labels = []
    if h in (1, 4, 7, 10):
        labels.append("kendra")
    if h in (1, 5, 9):
        labels.append("trikona")
    if h in (3, 6, 10, 11):
        labels.append("upachaya")
    if h in (6, 8, 12):
        labels.append("dusthana")
    if h in (2, 7):
        labels.append("maraka")
    if h in (2, 5, 8, 11):
        labels.append("panaphara")
    if h in (3, 6, 9, 12):
        labels.append("apoklima")
    return labels


def normalize_planetary_yogas(raw_yogas: Any, lagna_sign_index: int = 0) -> list[dict[str, Any]]:
    if not raw_yogas:
        return []

    y_list = raw_yogas if isinstance(raw_yogas, list) else raw_yogas.get("yogas", [])
    killed_set = set(raw_yogas.get("results_killed_by_kemadruma", [])) if isinstance(raw_yogas, dict) else set()

    normalized = []
    for y in y_list:
        raw_group = str(y.get("group", "General")).lower()
        if "raja" in raw_group:
            group = "Raja"
        elif "dhana" in raw_group:
            group = "Dhana"
        elif "mahapurusha" in raw_group:
            group = "Mahapurusha"
        elif "chandra" in raw_group or "lunar" in raw_group:
            group = "Chandra"
        elif "ravi" in raw_group or "solar" in raw_group:
            group = "Ravi"
        elif "naabhasa" in raw_group or "nabhasa" in raw_group:
            group = "Nabhasa"
        elif "vipareeta" in raw_group:
            group = "Vipareeta"
        elif "popular" in raw_group or "general" in raw_group:
            group = "General"
        else:
            group = "Other"

        participants = []
        raw_part = y.get("participants", [])
        if isinstance(raw_part, list):
            for p in raw_part:
                if isinstance(p, str):
                    participants.append(p)
                elif isinstance(p, dict):
                    participants.append(p.get("graha_name") or p.get("name") or "")

        houses_involved = y.get("houses_involved") or y.get("housesInvolved")
        if not houses_involved and isinstance(raw_part, list):
            house_set = set()
            for p in raw_part:
                if isinstance(p, dict) and isinstance(p.get("sign"), int):
                    house_set.add(((p["sign"] - lagna_sign_index + 12) % 12) + 1)
            if house_set:
                houses_involved = sorted(house_set)

        is_killed = y.get("key") in killed_set
        strength = "Killed by Kemadruma" if is_killed else ("Low" if y.get("weakened") else "High")
        effects = y.get("effects")
        if not effects and isinstance(y.get("qualifiers"), list) and y["qualifiers"]:
            effects = ", ".join(str(q) for q in y["qualifiers"])
        if is_killed and (not effects or "Kemadruma" not in effects):
            effects = f"{effects} (Fruits cancelled by Kemadruma Yoga)" if effects else "Fruits cancelled by Kemadruma Yoga"

        normalized.append({
            "key": y.get("key") or (y.get("name", "yoga").lower().replace(" ", "_")),
            "name": y.get("name", "Planetary Yoga"),
            "sanskritName": y.get("sanskrit_name") or y.get("sanskritName") or y.get("name"),
            "group": group,
            "definition": y.get("definition") or y.get("reason", ""),
            "effects": effects,
            "present": bool(y.get("present")),
            "strength": strength,
            "participants": participants,
            "housesInvolved": houses_involved or None,
            "reason": y.get("reason"),
        })
    return normalized


def normalize_dasha_tree_node(node: dict[str, Any] | None, level: int = 1) -> dict[str, Any] | None:
    if not node:
        return None
    lord = node.get("lord_name") or node.get("lord") or "Sun"
    raw_children = node.get("children") or node.get("subperiods") or []
    children = [normalize_dasha_tree_node(c, level + 1) for c in raw_children if c]

    colors = ["#c9a66b", "#7ec8c9", "#ed9e7a", "#a67ec9", "#c97e93", "#7ec98a", "#d4b483", "#5a9bc9", "#c9917e"]
    labels = ["Mahadasha", "Antardasha", "Pratyantardasha", "Sookshma", "Praana"]

    lord_idx = 0
    clean_lord = lord.capitalize()
    if clean_lord in PLANET_META:
        lord_idx = list(PLANET_META.keys()).index(clean_lord)

    return {
        "id": node.get("id") or f"{lord.lower()}-{level}-{node.get('start_jd', 0)}",
        "lord": lord,
        "planet": lord,
        "level": level,
        "levelLabel": labels[min(level - 1, len(labels) - 1)],
        "start": node.get("start", ""),
        "end": node.get("end", ""),
        "start_jd": node.get("start_jd"),
        "end_jd": node.get("end_jd"),
        "durationYears": node.get("durationYears") or node.get("duration_years") or 0,
        "color": colors[lord_idx % len(colors)],
        "subperiods": [c for c in children if c],
        "children": [c for c in children if c],
    }


def map_planet_shadbala(p_name: str, vakri_planet: dict[str, Any] | None, p_pos: dict[str, Any]) -> dict[str, Any] | None:
    if not vakri_planet:
        return None
    bala = vakri_planet.get("bala")
    if not isinstance(bala, dict):
        return None

    virupas = float(bala.get("total_virupas") or 0.0)
    rupas = float(bala.get("total_rupas") or (virupas / 60.0))
    ratio = float(bala.get("strength_ratio") or 1.0)
    required = float(bala.get("required_virupas") or 390.0)
    is_strong = bool(bala.get("is_strong", virupas >= required))

    breakdown = bala.get("breakdown", {})
    return {
        "name": p_name,
        "planet": p_name,
        "totalRupas": round(rupas, 2),
        "totalVirupas": round(virupas, 1),
        "requiredVirupas": required,
        "strengthRatio": round(ratio, 2),
        "isStrong": is_strong,
        "rank": bala.get("rank", 1),
        "relativeRank": f"{bala.get('rank', 1)} of 7",
        "breakdown": {
            "sthanaBala": float(breakdown.get("sthana", 0.0)),
            "digBala": float(breakdown.get("dig", 0.0)),
            "kaalaBala": float(breakdown.get("kaala", 0.0)),
            "chestaBala": float(breakdown.get("chesta", 0.0)),
            "naisargikaBala": float(breakdown.get("naisargika", 0.0)),
            "drikBala": float(breakdown.get("drik", 0.0)),
        },
    }


def build_varga_comparison_from_master(
    d1: dict[str, Any] | None,
    d9: dict[str, Any] | None,
    planets: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not planets:
        return []

    d1_raw = d1.get("grahas", []) if d1 else []
    d9_raw = d9.get("grahas", []) if d9 else []
    d1_grahas = {g.get("name"): g for g in d1_raw} if isinstance(d1_raw, list) else (d1_raw if isinstance(d1_raw, dict) else {})
    d9_grahas = {g.get("name"): g for g in d9_raw} if isinstance(d9_raw, list) else (d9_raw if isinstance(d9_raw, dict) else {})
    d9_lagna = d9.get("lagna", {}) if d9 else {}
    d9_lagna_idx = d9_lagna.get("rasi", 0)

    rows = []
    for pl in planets:
        p_name = pl["name"]
        d1_g = d1_grahas.get(p_name, {})
        d9_g = d9_grahas.get(p_name, {})

        d1_sign_idx = pl.get("signIndex", 0)
        d9_sign_idx = d9_g.get("rasi", d1_sign_idx)
        d9_house = ((d9_sign_idx - d9_lagna_idx + 12) % 12) + 1
        is_vargottama = d1_sign_idx == d9_sign_idx

        rows.append({
            "planet": p_name,
            "retrograde": pl.get("retrograde", False),
            "combust": pl.get("combust", False),
            "d1Sign": SIGN_NAMES[d1_sign_idx],
            "d1SignIndex": d1_sign_idx,
            "d1Dms": d1_g.get("dms") or pl.get("dms", '0°00\'00"'),
            "targetVargaCode": "D9",
            "targetSign": SIGN_NAMES[d9_sign_idx],
            "targetSignIndex": d9_sign_idx,
            "targetHouse": d9_house,
            "targetDms": d9_g.get("dms", '0°00\'00"'),
            "targetDignity": d9_g.get("dignity", "Neutral"),
            "d9Sign": SIGN_NAMES[d9_sign_idx],
            "d9SignIndex": d9_sign_idx,
            "d9House": d9_house,
            "d9Dignity": d9_g.get("dignity", "Neutral"),
            "isVargottama": is_vargottama,
            "dignityShift": "Vargottama (Auspicious)" if is_vargottama else "Consistent",
            "shiftTone": "favorable" if is_vargottama else "neutral",
        })
    return rows


def build_chart_from_master(name: str, birth_data: dict[str, Any], master: dict[str, Any]) -> dict[str, Any]:
    """Convert Python master calculation payload into AstroChart domain object."""
    if not master or "chart" not in master:
        raise ValueError("Invalid master chart payload returned by Python Hora engine")

    rasi = master["chart"]
    lagna_info = rasi.get("lagna", {})
    lagna_sign_index = lagna_info.get("rasi", parse_sign_index(lagna_info.get("rasi_name", "Aries")))
    lagna_deg = lagna_info.get("degrees_in_rasi", (lagna_info.get("longitude", 0.0) % 30.0))
    lagna_dms = lagna_info.get("dms") or format_dms(lagna_deg)

    # 1. Planets
    raw_grahas = rasi.get("grahas", [])
    planets = []

    for i, p in enumerate(raw_grahas):
        p_name = p.get("name", "Unknown")
        sign_index = p.get("rasi", parse_sign_index(p.get("rasi_name") or p.get("sign", "Aries")))
        sign_name = SIGN_NAMES[sign_index] if 0 <= sign_index < 12 else "Aries"
        deg_in_sign = p.get("degrees_in_rasi", (p.get("longitude", 0.0) % 30.0))
        dms_val = p.get("dms")
        dms = dms_val if (dms_val and "°" in str(dms_val)) else format_dms(deg_in_sign)
        longitude = p.get("longitude", sign_index * 30.0 + deg_in_sign)
        house_num = p.get("house", (((sign_index - lagna_sign_index + 12) % 12) + 1))
        meta = PLANET_META.get(p_name, {"sanskrit": p_name, "symbol": "✦", "short": p_name[:2]})
        dispositor = SIGN_LORDS.get(sign_name, "—")

        nak_raw = p.get("nakshatra", 1)
        nak_num = int(nak_raw) if str(nak_raw).isdigit() else 1
        nak_lord = NAKSHATRA_LORDS[(nak_num - 1) % 9]
        nak_name = p.get("nakshatra_name") or (NAKSHATRA_NAMES[nak_num - 1] if 1 <= nak_num <= 27 else "Ashwini")
        pada = p.get("pada", 1)

        lord_of_houses = p.get("lord_of_houses") or []
        if not lord_of_houses:
            for h in range(1, 13):
                h_sign_idx = (lagna_sign_index + (h - 1)) % 12
                if SIGN_LORDS.get(SIGN_NAMES[h_sign_idx]) == p_name:
                    lord_of_houses.append(h)

        p_pos = {
            "id": p.get("id", i),
            "name": p_name,
            "sanskritName": meta["sanskrit"],
            "symbol": meta["symbol"],
            "short": meta["short"],
            "sign": sign_name,
            "signNumber": sign_index + 1,
            "signIndex": sign_index,
            "degreeInSign": deg_in_sign,
            "dms": dms,
            "longitude": longitude,
            "latitude": p.get("latitude"),
            "speed": p.get("speed"),
            "retrograde": bool(p.get("retrograde")),
            "combust": bool(p.get("combust")),
            "houseNumber": house_num,
            "houseOrdinal": get_ordinal(house_num),
            "houseLabels": p.get("house_labels") or derive_house_categories(house_num),
            "nakshatra": nak_name,
            "nakshatraNumber": nak_num,
            "nakshatraLord": nak_lord,
            "pada": pada,
            "dignity": p.get("dignity", "Neutral"),
            "lordOfHouses": lord_of_houses,
            "dispositor": dispositor,
            "sunSeparation": p.get("sun_separation"),
            "naturalKaraka": PLANET_NATURAL_KARAKAS.get(p_name, "—"),
            "aspectsCast": [],
            "aspectsReceived": [],
            "vakri": master.get("vakri_analysis", {}).get("planets", {}).get(p_name),
        }

        # Chara Karakas
        ck_list = master.get("chara_karakas", [])
        if isinstance(ck_list, list):
            for ck in ck_list:
                if ck.get("graha_name") == p_name or ck.get("graha") == p.get("id"):
                    p_pos["charaKaraka"] = f"{ck.get('name')} ({ck.get('symbol')})"
                    p_pos["charaKarakaCode"] = ck.get("symbol")
                    p_pos["charaKarakaRank"] = ck.get("order")
                    p_pos["isAtmakaraka"] = ck.get("symbol") == "AK"
                    break

        # Functional nature
        fn_planets = master.get("functional_nature", {}).get("planets", {})
        if p_name in fn_planets:
            fn = fn_planets[p_name]
            p_pos["functionalNature"] = fn.get("nature")
            p_pos["isYogakaraka"] = bool(fn.get("yogakaraka"))
            p_pos["functionalType"] = (
                "Yogakaraka" if fn.get("yogakaraka")
                else "Functional Benefic" if fn.get("nature") == "benefic"
                else "Functional Malefic" if fn.get("nature") == "malefic"
                else "Neutral"
            )
            if fn.get("houses"):
                p_pos["functionalWhy"] = f"Lord of houses {', '.join(str(h) for h in fn['houses'])}"

        # Ashtakavarga BAV points
        bav_list = master.get("ashtakavarga", {}).get("bhinnashtakavarga", [])
        if isinstance(bav_list, list):
            for b_item in bav_list:
                if b_item.get("owner") == p_name and isinstance(b_item.get("rekhas"), list):
                    pts = b_item["rekhas"][sign_index] if sign_index < len(b_item["rekhas"]) else 0
                    p_pos["bavPoints"] = pts
                    p_pos["bavGrade"] = "favorable" if pts >= 5 else "neutral" if pts == 4 else "unfavorable"
                    break

        # Baadhaka status
        b_houses = master.get("baadhakas", {}).get("houses", [])
        if b_houses and isinstance(b_houses, list):
            b_h = b_houses[0]
            is_b = p_name in b_h.get("lords", []) or p_name in b_h.get("occupants", [])
            p_pos["isBaadhaka"] = is_b
            if is_b:
                sthaana = b_h.get("sthaana_name", "Baadhaka")
                p_pos["baadhakaReason"] = (
                    f"Lord of Baadhaka Sthana ({sthaana})"
                    if p_name in b_h.get("lords", [])
                    else f"Occupies Baadhaka Sthana ({sthaana})"
                )

        # Maraka status
        mg_list = master.get("marakas", {}).get("maraka_grahas", [])
        if isinstance(mg_list, list):
            for mg in mg_list:
                if mg.get("graha_name") == p_name or mg.get("graha") == p_name:
                    p_pos["isMaraka"] = True
                    p_pos["marakaKind"] = mg.get("kind", "Maraka")
                    p_pos["marakaReasons"] = mg.get("reasons", [])
                    break

        # Shadbala
        shad = map_planet_shadbala(p_name, p_pos["vakri"], p_pos)
        if shad:
            p_pos["shadbala"] = shad

        planets.append(p_pos)

    # 2. Houses
    bhavas = rasi.get("bhavas", [])
    houses = []
    sav_raw = master.get("ashtakavarga", {}).get("sarvashtakavarga", [])
    if isinstance(sav_raw, dict):
        sav_array = sav_raw.get("rekhas", [])
    elif isinstance(sav_raw, list):
        sav_array = sav_raw
    else:
        sav_array = []

    for h in range(1, 13):
        bhava = bhavas[h - 1] if h - 1 < len(bhavas) else {}
        sign_index = (lagna_sign_index + (h - 1)) % 12
        sign = SIGN_NAMES[sign_index]
        lord = SIGN_LORDS[sign]
        occupants = [pl["name"] for pl in planets if pl.get("houseNumber") == h]
        sav_pts = sav_array[sign_index] if sign_index < len(sav_array) else 28
        sav_grade = "favorable" if sav_pts >= 30 else "neutral" if sav_pts >= 25 else "unfavorable"

        arudha_pada = f"A{h}"
        arudha_pada_name = f"Arudha Pada {h}"
        padas_list = master.get("arudhas", {}).get("padas", [])
        if isinstance(padas_list, list):
            for pada in padas_list:
                if pada.get("house") == h:
                    arudha_pada = pada.get("symbol") or f"A{h}"
                    arudha_pada_name = pada.get("name") or f"Arudha Pada {h}"
                    break

        b_mid = bhava.get("middle")
        deg_in_house = (b_mid % 30.0) if b_mid is not None else 0.0

        house_obj = {
            "id": h,
            "number": h,
            "ordinal": get_ordinal(h),
            "name": HOUSE_METADATA.get(h, {}).get("sanskrit", f"Bhava {h}"),
            "sign": sign,
            "signNumber": sign_index + 1,
            "signIndex": sign_index,
            "degreeInSign": deg_in_house,
            "dms": format_dms(deg_in_house),
            "longitude": b_mid if b_mid is not None else (sign_index * 30.0 + 15.0),
            "startDegree": bhava.get("start"),
            "endDegree": bhava.get("end"),
            "lord": lord,
            "occupants": occupants,
            "labels": derive_house_categories(h),
            "karaka": HOUSE_METADATA.get(h, {}).get("karaka", "—"),
            "purushartha": HOUSE_METADATA.get(h, {}).get("purushartha", "—"),
            "bhavatBhavam": HOUSE_METADATA.get(h, {}).get("bhavatBhavam", ""),
            "significations": HOUSE_METADATA.get(h, {}).get("significations", []),
            "arudhaPada": arudha_pada,
            "arudhaPadaName": arudha_pada_name,
            "arudhasHere": [],
            "isBaadhakaSthana": h == (b_houses[0].get("house") if b_houses else -1),
            "isMarakaHouse": h in (2, 7),
            "savPoints": sav_pts,
            "savGrade": sav_grade,
        }

        arg_houses = master.get("argala", {}).get("houses", [])
        if isinstance(arg_houses, list):
            for arg in arg_houses:
                if arg.get("house") == h:
                    house_obj["argalas"] = arg
                    break

        houses.append(house_obj)

    # 3. Shadbala Aggregate
    shad_planets = [p["shadbala"] for p in planets if p.get("shadbala")]
    sorted_shad = sorted(shad_planets, key=lambda x: x.get("strengthRatio", 0.0), reverse=True)
    strongest = sorted_shad[0]["name"] if sorted_shad else "Mars"
    weakest = sorted_shad[-1]["name"] if sorted_shad else "Sun"
    strong_count = sum(1 for p in shad_planets if p.get("isStrong"))
    total_count = len(shad_planets) or 7
    avg_ratio = sum(p.get("strengthRatio", 1.0) for p in shad_planets) / (total_count or 1)

    shadbala_result = {
        "planets": shad_planets,
        "strongestPlanet": strongest,
        "weakestPlanet": weakest,
        "strongCount": strong_count,
        "totalCount": total_count,
        "overallHealthScore": int(round(avg_ratio * 100)),
    }

    # 4. Dashas
    raw_periods = master.get("dashas", {}).get("periods", [])
    dashas = [normalize_dasha_tree_node(d, 1) for d in raw_periods[:9]]
    dashas = [d for d in dashas if d]

    level_labels = {1: "MD", 2: "AD", 3: "PD", 4: "SD", 5: "PAD"}
    running_list = master.get("dashas", {}).get("running", [])
    active_dasha_chain = [
        {
            "level": r.get("level", 1),
            "levelLabel": level_labels.get(r.get("level", 1), f"L{r.get('level', 1)}"),
            "lord": r.get("lord_name") or r.get("lord", "Sun"),
        }
        for r in running_list
    ]
    running_dasha = [c["lord"] for c in active_dasha_chain]

    # 5. Vargas
    vargas = master.get("vargas", {})
    varga_comparison = build_varga_comparison_from_master(vargas.get("D1"), vargas.get("D9"), planets)

    # 6. Yogas
    all_yogas_catalog = normalize_planetary_yogas(master.get("yogas"), lagna_sign_index)
    active_yogas = [y for y in all_yogas_catalog if y.get("present")]

    # 7. Special Lagnas & Upagrahas
    special_lagnas = master.get("special_lagnas", {}).get("special_lagnas", [])
    upagrahas = master.get("upagrahas", {}).get("upagrahas", [])
    special_points = {
        "specialLagnas": special_lagnas,
        "upagrahas": upagrahas,
        "pointsByHouse": {},
    }

    moon = next((p for p in planets if p["name"] == "Moon"), None)
    sun = next((p for p in planets if p["name"] == "Sun"), None)

    local_time = rasi.get("input", {}).get("local_time", "")
    date_formatted = (
        str(local_time)[:10] if local_time
        else f"{birth_data.get('year', 1995)}-{int(birth_data.get('month', 8)):02d}-{int(birth_data.get('day', 24)):02d}"
    )
    time_formatted = (
        str(local_time)[11:16] if len(str(local_time)) >= 16
        else f"{int(birth_data.get('hour', 10)):02d}:{int(birth_data.get('minute', 30)):02d}"
    )

    place_dict = birth_data.get("place", {}) if isinstance(birth_data.get("place"), dict) else {}
    location = place_dict.get("name") or birth_data.get("location") or "Agra"
    latitude = f"{place_dict.get('latitude', 27.1767)}°"
    longitude = f"{place_dict.get('longitude', 78.0081)}°"
    timezone = birth_data.get("tz_name") or birth_data.get("timezone") or "Asia/Kolkata"

    ayanamsa_name = rasi.get("settings", {}).get("ayanamsa", "Lahiri")
    ayanamsa_dms = rasi.get("ayanamsa", {}).get("dms", "Unavailable")
    calc_settings = f"{ayanamsa_name} ayanamsha • {rasi.get('settings', {}).get('house_system', 'Whole Sign')} houses"

    return {
        "name": name,
        "date": date_formatted,
        "time": time_formatted,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "timezone": timezone,
        "lagna": f"{SIGN_NAMES[lagna_sign_index]} {lagna_dms}",
        "moon": f"{moon['sign']} {moon['dms']}" if moon else "Unavailable",
        "moonNakshatra": f"{moon['nakshatra']} • Pada {moon['pada']}" if moon else "Unavailable",
        "sunSign": sun["sign"] if sun else "Unavailable",
        "currentMahadasha": " / ".join(running_dasha) if running_dasha else "Unavailable",
        "ayanamsa": ayanamsa_dms,
        "calculationSettings": calc_settings,
        "birthData": birth_data,
        "metadata": {
            "dateFormatted": date_formatted,
            "timeFormatted": time_formatted,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "timezone": timezone,
            "ayanamsaName": ayanamsa_name,
            "ayanamsaDms": ayanamsa_dms,
            "calculationSettings": calc_settings,
            "source": f"Hora Engine • {master.get('panchanga', {}).get('date_local', 'Local Epoch')}",
        },
        "quickFacts": {
            "lagna": SIGN_NAMES[lagna_sign_index],
            "lagnaDms": lagna_dms,
            "sunSign": sun["sign"] if sun else "Unavailable",
            "moonSign": moon["sign"] if moon else "Unavailable",
            "moonDms": moon["dms"] if moon else "Unavailable",
            "moonNakshatra": moon["nakshatra"] if moon else "Unavailable",
            "moonPada": moon["pada"] if moon else 1,
            "currentMahadasha": running_dasha[0] if len(running_dasha) > 0 else "Unavailable",
            "currentAntardasha": running_dasha[1] if len(running_dasha) > 1 else "Unavailable",
            "currentPratyantardasha": running_dasha[2] if len(running_dasha) > 2 else None,
        },
        "planets": planets,
        "houses": houses,
        "vargas": vargas,
        "vargaComparison": varga_comparison,
        "shadbala": shadbala_result,
        "specialLagnas": special_lagnas,
        "upagrahas": upagrahas,
        "specialPoints": special_points,
        "dashas": dashas,
        "dashaTree": dashas,
        "activeDashaChain": active_dasha_chain,
        "runningDasha": running_dasha,
        "aspectsMatrix": master.get("aspects", {}),
        "purusharthaBalance": master.get("purushartha"),
        "arudhas": master.get("arudhas"),
        "baadhakas": master.get("baadhakas"),
        "marakas": master.get("marakas"),
        "ashtakavarga": master.get("ashtakavarga"),
        "argalas": master.get("argala"),
        "functional": master.get("functional_nature"),
        "vakriAnalysis": master.get("vakri_analysis"),
        "yogas": active_yogas,
        "allYogasCatalog": all_yogas_catalog,
        "panchanga": master.get("panchanga"),
        "aspects": master.get("aspects"),
        "relationships": None,
        "raw": master,
        "rawRasi": rasi,
        "rawPanchanga": master.get("panchanga"),
        "rawDasha": master.get("dashas"),
        "shodasavarga": vargas,
    }


def compute_workbench_chart(name: str, birth_data: dict[str, Any]) -> dict[str, Any]:
    """Compute and format an AstroChart using the master calculation engine."""
    year = int(birth_data["year"])
    month = int(birth_data["month"])
    day = int(birth_data["day"])
    hour = int(birth_data.get("hour", 12))
    minute = int(birth_data.get("minute", 0))
    second = int(birth_data.get("second", 0))
    tz_name = birth_data.get("tz_name") or birth_data.get("timezone") or "Asia/Kolkata"

    place_dict = birth_data.get("place", {}) if isinstance(birth_data.get("place"), dict) else {}
    lat = float(place_dict.get("latitude", birth_data.get("latitude", 27.1767)))
    lon = float(place_dict.get("longitude", birth_data.get("longitude", 78.0081)))
    alt = float(place_dict.get("altitude", birth_data.get("altitude", 0.0)))
    place_name = place_dict.get("name") or birth_data.get("location") or "Agra"

    instant = from_local(year, month, day, hour, minute, second, tz_name=tz_name)
    place = Place(latitude=lat, longitude=lon, altitude=alt, name=place_name)

    raw_settings = birth_data.get("settings", {})
    settings = Settings(**raw_settings) if raw_settings else Settings()

    master = master_chart_service.compute_master_chart(instant, place, settings, name=name)
    return build_chart_from_master(name, birth_data, master)
