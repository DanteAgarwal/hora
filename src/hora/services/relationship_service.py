"""Planetary relationship service — book §3.4."""
from __future__ import annotations

from functools import lru_cache

from hora.charts.relationship import (
    CLASSICAL_SEVEN,
    COMPOUND_GLOSS,
    COMPOUND_NAMES,
    NATURAL_FRIEND_HOUSES,
    NATURAL_NAMES,
    TEMPORARY_FRIEND_HOUSES,
    RelationshipError,
    TemporaryResult,
    compound_in_chart,
    compound_row,
    derive_natural,
    house_standing,
    natural,
    natural_row,
    table_7,
    table_8,
    temporary,
)
from hora.charts.relationship import (
    CLASSICAL_SEVEN as _SEVEN,
)
from hora.charts.relationship import (
    temporary_in_chart as _temporary_in_chart,
)
from hora.core import validate
from hora.core.const import GRAHA_NAMES

InputError = validate.InputError

__all__ = [
    "InputError", "RelationshipError", "chart", "compound_relation",
    "natural_relation", "rules", "temporary_relation",
]


def chart(rasis: dict[int, int], include_nodes: bool = False) -> dict:
    """Every relationship in one chart, in one call — book §3.4 entire.

    This is the unit a caller actually wants. The three narrower endpoints
    remain for anyone who needs a single pair or the rule in isolation, but
    nothing has to be joined by hand to get the picture.
    """
    grahas = [g for g in _SEVEN if g in rasis]
    matrix: list[dict] = []
    for a in grahas:
        row: list[dict | None] = []
        for b in grahas:
            if a == b:
                row.append(None)
                continue
            row.append(_serialise_compound(compound_in_chart(a, b, rasis)))
        matrix.append({"graha": a, "graha_name": str(GRAHA_NAMES[a]), "relations": row})

    per_graha: list[dict] = []
    for a in grahas:
        rels = compound_row(a, rasis)
        by: dict[str, list[int]] = {}
        for r in rels:
            by.setdefault(r.compound, []).append(r.other)
        standing = house_standing(a, rasis)
        temp = _temporary_in_chart(a, rasis, include_nodes=include_nodes)
        per_graha.append({
            "graha": a,
            "graha_name": str(GRAHA_NAMES[a]),
            "rasi": standing.rasi,
            "rasi_name": standing.rasi_name,
            "natural": {k: v for k, v in natural_row(a).items()},
            "temporary": {"friends": list(temp.friends), "enemies": list(temp.enemies)},
            "compound": {
                "great_friends": by.get("great_friend", []),
                "friends": by.get("friend", []),
                "neutrals": by.get("neutral", []),
                "enemies": by.get("enemy", []),
                "great_enemies": by.get("great_enemy", []),
            },
            "house": {
                "lord": standing.lord,
                "lord_name": standing.lord_name,
                "owns_the_rasi": standing.owns_the_rasi,
                "relation_to_lord": standing.relation_to_lord,
                "standing": standing.house,
            },
        })

    return {
        "grahas": grahas,
        "matrix": matrix,
        "per_graha": per_graha,
        "friendly_house_note": (
            "Section 3.4.3: a planet occupying a rasi owned by a mitra or "
            "adhimitra is in a friendly house; by a satru or adhisatru, an "
            "inimical house. A sama lord is neither."
        ),
        "includes_nodes": include_nodes,
    }


def _serialise_compound(value) -> dict:
    return {
        "graha": value.graha,
        "graha_name": value.graha_name,
        "other": value.other,
        "other_name": value.other_name,
        "natural": value.natural,
        "temporary": value.temporary,
        "compound": value.compound,
        "compound_name": value.compound_name,
        "compound_gloss": value.compound_gloss,
    }


def compound_relation(
    graha: int, rasis: dict[int, int], other: int | None = None
) -> dict:
    """§3.4.3 — one pair if `other` is given, otherwise the whole row."""
    if other is not None:
        return {
            "graha": graha,
            "relations": [_serialise_compound(compound_in_chart(graha, other, rasis))],
        }
    return {
        "graha": graha,
        "relations": [_serialise_compound(r) for r in compound_row(graha, rasis)],
    }


@lru_cache(maxsize=64)
def natural_relation(graha: int, other: int) -> dict:
    """§3.4.1 — Table 7's value plus the derivation that produces it."""
    derived = derive_natural(graha, other)
    return {
        "graha": derived.graha,
        "graha_name": str(GRAHA_NAMES[derived.graha]),
        "other": derived.other,
        "other_name": str(GRAHA_NAMES[derived.other]),
        "relation": derived.relation,
        "relation_name": derived.relation_name,
        "table_7_relation": natural(graha, other),
        "from_exaltation_lord": derived.from_exaltation_lord,
        "friend_houses": list(derived.friend_houses),
        "enemy_houses": list(derived.enemy_houses),
        "reason": _reason(derived),
    }


def _reason(derived) -> str:
    parts = []
    if derived.from_exaltation_lord:
        parts.append(
            f"{GRAHA_NAMES[derived.other]} lords "
            f"{GRAHA_NAMES[derived.graha]}'s exaltation rasi"
        )
    if derived.friend_houses:
        parts.append(
            f"lords house(s) {', '.join(str(h) for h in derived.friend_houses)} "
            f"from the moolatrikona"
        )
    if derived.enemy_houses:
        parts.append(
            f"lords house(s) {', '.join(str(h) for h in derived.enemy_houses)}, "
            f"which are not friend houses"
        )
    joined = "; ".join(parts) if parts else "lords no rasi in the scheme"
    if derived.relation == "neutral":
        joined += " — a friend and an enemy on account of owning two rasis"
    return joined


def _serialise(value: TemporaryResult) -> dict:
    return {
        "graha": value.graha,
        "graha_name": value.graha_name,
        "rasi": value.rasi,
        "rasi_name": value.rasi_name,
        "friend_rasis": list(value.friend_rasis),
        "friend_rasi_names": list(value.friend_rasi_names),
        "friends": list(value.friends),
        "friend_names": [str(GRAHA_NAMES[g]) for g in value.friends],
        "enemies": list(value.enemies),
        "enemy_names": [str(GRAHA_NAMES[g]) for g in value.enemies],
        "includes_nodes": value.includes_nodes,
    }


def temporary_relation(
    graha: int, rasis: dict[int, int], include_nodes: bool = False
) -> dict:
    """§3.4.2 — every other graha's temporary relation, in one chart."""
    return _serialise(
        _temporary_in_chart(graha, rasis, include_nodes=include_nodes)
    )


def rules() -> dict:
    """§3.4's two schemes, and Table 7."""
    return {
        "section": "3.4",
        "title": "Planetary Relationships",
        "natural": {
            "section": "3.4.1",
            "derivation": (
                "Take the moolatrikona of the planet. Lord of the rasi where "
                "it is exalted is its friend. Lords of 2nd, 4th, 5th, 8th, 9th "
                "and 12th rasis from it are also its natural friends. Lords of "
                "other rasis are its natural enemies. If a planet becomes a "
                "friend and an enemy on account of owning two rasis, then it "
                "is a neutral planet."
            ),
            "counted_from": "moolatrikona",
            "friend_houses": list(NATURAL_FRIEND_HOUSES),
            "names": dict(NATURAL_NAMES),
            "table_7": table_7(),
            "derivation_reproduces_table_7": all(
                derive_natural(a, b).relation == natural(a, b)
                for a in CLASSICAL_SEVEN
                for b in CLASSICAL_SEVEN
                if a != b
            ),
        },
        "temporary": {
            "section": "3.4.2",
            "rule": (
                "Planets occupying the 2nd, 3rd, 4th, 10th, 11th and 12th "
                "rasis counted from the rasi occupied by a planet are its "
                "temporary friends. Planet occupying other rasis are its "
                "temporary enemies."
            ),
            "sanskrit_name": "tatkaala",
            "counted_from": "the rasi occupied by the planet",
            "friend_houses": list(TEMPORARY_FRIEND_HOUSES),
            "has_no_neutral": (
                "Section 3.4.2 gives two outcomes, not three. Only the natural "
                "scheme has a neutral."
            ),
            "nodes_excluded": (
                "Example 4 says Saturn is the only temporary enemy of the Sun "
                "in Lord Sree Rama's chart, though Rahu sits in the 9th from "
                "the Sun. The nodes are therefore not counted by default."
            ),
        },
        "compound": {
            "section": "3.4.3",
            "rule": (
                "We get the compound relationships between planets by "
                "combining permanent and temporary relationships as shown in "
                "Table 8."
            ),
            "names": dict(COMPOUND_NAMES),
            "glosses": dict(COMPOUND_GLOSS),
            "table_8": table_8(),
            "six_cells_five_outcomes": (
                "A natural friend who is a temporary enemy and a natural enemy "
                "who is a temporary friend both give sama, so Table 8's six "
                "cells carry five distinct names."
            ),
        },
        "house_sets_differ": (
            "Natural uses 2, 4, 5, 8, 9, 12 counted from the moolatrikona; "
            "temporary uses 2, 3, 4, 10, 11, 12 counted from the occupied "
            "rasi. Different sets, different origins."
        ),
    }


@lru_cache(maxsize=1)
def natural_table() -> list[dict]:
    """Table 7, for the reference endpoints."""
    return table_7()


@lru_cache(maxsize=64)
def relation_of(graha: int, other: int) -> str:
    """Table 7's label alone."""
    return natural(graha, other)


@lru_cache(maxsize=16)
def row(graha: int) -> dict[str, list[int]]:
    return natural_row(graha)


@lru_cache(maxsize=144)
def temporary_pair(graha_rasi: int, other_rasi: int) -> str:
    return temporary(graha_rasi, other_rasi)
