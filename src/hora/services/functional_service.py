"""Section 13.2 — functional nature, service layer."""
from __future__ import annotations

from functools import lru_cache

from hora.charts.functional import (
    FUNCTIONAL_PLANETS,
    FunctionalError,
    divergences,
    for_lagna,
    for_moon,
    from_rules,
    from_table,
    houses_owned,
    yogakaraka_of,
)
from hora.core.const import (
    CHAPTER_13_INTRO,
    FUNCTIONAL_NATURE_INTRO,
    FUNCTIONAL_NATURE_RULES,
    MOON_MOVABLE_WORDING,
    MOON_NOT_LISTED_FOR_MOVABLE,
    MOON_OMITTED_FROM,
    NATURAL_VERSUS_FUNCTIONAL,
    PLACEMENT_RULE,
    RAMAN_REFERENCE,
    RASI_ABBR,
    RASI_NAMES,
    TABLE_30_FUNCTIONAL_NATURE,
    TWO_RASI_OWNERS_NEED_JUDGEMENT,
    YOGADA_KINDS,
    YOGADA_LINKS,
    YOGADA_RULE,
)
from hora.core.validate import InputError

TABLE_IS_THE_AUTHORITY = (
    "Table 30 is what section 13.2 gives for use, so it is what we serve. "
    "The five stated rules are applied separately and agree on 72 of the "
    "table's 81 cells; the nine that differ are listed under `divergences`, "
    "and eight of them are planets owning two rasis — exactly what "
    "\"judiciously combine\" warns about."
)


def _nature(result) -> dict:
    return {
        "planet": result.planet,
        "houses": list(result.houses),
        "nature": result.nature,
        "yogakaraka": result.yogakaraka,
        "depends_on_phase": result.depends_on_phase,
        "why": result.why,
        "from_rules": from_rules(result.planet, result.lagna),
    }


@lru_cache(maxsize=16)
def lagna(sign: int) -> dict:
    """Every planet's functional nature for one lagna."""
    body = for_lagna(sign)
    return {
        "lagna": body["lagna"],
        "lagna_name": body["lagna_name"],
        "yogakaraka": body["yogakaraka"],
        "planets": [_nature(p) for p in body["planets"]],
        "moon_needs_phase": RASI_ABBR[sign] in MOON_OMITTED_FROM,
        "placement": PLACEMENT_RULE,
        "table_is_the_authority": TABLE_IS_THE_AUTHORITY,
    }


@lru_cache(maxsize=256)
def planet(name: str, sign: int, waxing: bool | None = None) -> dict:
    """One planet's functional nature. `waxing` only matters for the Moon."""
    if name == "Moon" and waxing is not None:
        return _nature(for_moon(sign, waxing))
    return _nature(from_table(name, sign))


def rules() -> dict:
    """Section 13.2's framing, its rules and Table 30."""
    return {
        "chapter_intro": CHAPTER_13_INTRO,
        "further_reading": RAMAN_REFERENCE,
        "intro": FUNCTIONAL_NATURE_INTRO,
        "rules": list(FUNCTIONAL_NATURE_RULES),
        "two_rasi_owners": TWO_RASI_OWNERS_NEED_JUDGEMENT,
        "moon_not_listed_for_movable": MOON_NOT_LISTED_FOR_MOVABLE,
        "moon_movable_wording": MOON_MOVABLE_WORDING,
        "moon_omitted_from": list(MOON_OMITTED_FROM),
        "table_30": {
            abbr: {
                "yogakaraka": yoga,
                "benefics": list(benefics),
                "neutrals": list(neutrals),
                "malefics": list(malefics),
            }
            for abbr, (yoga, benefics, neutrals, malefics)
            in TABLE_30_FUNCTIONAL_NATURE.items()
        },
        "table_is_the_authority": TABLE_IS_THE_AUTHORITY,
        "divergences": [
            {"lagna": abbr, "planet": name, "houses": list(houses),
             "from_rules": rules_say, "from_table": table_says}
            for abbr, name, houses, rules_say, table_says in divergences()
        ],
        "yogakarakas": {
            str(RASI_NAMES[sign]): yogakaraka_of(sign)
            for sign in range(12) if yogakaraka_of(sign)
        },
        "yogakaraka_rule": (
            "A yogakaraka owns a quadrant and a trine. The 1st counts as "
            "neither here: letting it serve as the trine would name ten "
            "yogakarakas where Table 30 names six."
        ),
        "placement": PLACEMENT_RULE,
        "yogada": YOGADA_RULE,
        "yogada_kinds": dict(YOGADA_KINDS),
        "yogada_links": list(YOGADA_LINKS),
        "natural_versus_functional": NATURAL_VERSUS_FUNCTIONAL,
        "planets": list(FUNCTIONAL_PLANETS),
        "planets_note": (
            "Rahu and Ketu own no rasi, and every rule in section 13.2 turns "
            "on lordship, so they have no functional nature."
        ),
        "houses_owned_example": {
            str(RASI_NAMES[s]): {p: list(houses_owned(p, s))
                                 for p in FUNCTIONAL_PLANETS}
            for s in (0,)
        },
    }


__all__ = ["FunctionalError", "InputError", "lagna", "planet", "rules"]
