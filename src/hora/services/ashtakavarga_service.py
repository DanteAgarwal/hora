"""Chapter 12 — ashtakavarga, as the API sees it."""
from __future__ import annotations

from functools import lru_cache

from hora.charts.ashtakavarga import (
    AshtakavargaError,
    available_tables,
    benefic_from_in,
    benefic_houses,
    benefic_rasis_from_chart,
    bhinnashtakavarga,
    describe,
    grade,
    is_benefic_from,
    muhurta_strength,
    natal_grade,
    prastaara,
    sarvashtakavarga,
    signs_in_chart,
    summed,
    verify_tables,
)
from hora.core import validate
from hora.core.const import (
    ASHTAKAVARGA_ALL_PLANETS_ARE_REFERENCES,
    ASHTAKAVARGA_BENEFIC_SANSKRIT,
    ASHTAKAVARGA_BENEFIC_TERM,
    ASHTAKAVARGA_INTRO,
    ASHTAKAVARGA_MALEFIC_SANSKRIT,
    ASHTAKAVARGA_MALEFIC_TERM,
    ASHTAKAVARGA_MEANS,
    ASHTAKAVARGA_NOTATION,
    ASHTAKAVARGA_PURPOSE,
    ASHTAKAVARGA_REFERENCE_POINT_NOTE,
    ASHTAKAVARGA_REFERENCES,
    ASHTAKAVARGA_TABLE_NUMBERS,
    ASHTAKAVARGA_TABLES_PENDING,
    AV_ABBREVIATIONS,
    AV_DIVISIONAL_EXAMPLE,
    AV_IN_DIVISIONAL_CHARTS,
    AV_NOT_ONLY_RASI,
    AV_TABLES_ARE_THE_SAME,
    BAV_APPLIES_TO_TRANSITS,
    BAV_COUNT_IS_CALLED_REKHAS,
    BAV_COUNT_RANGE,
    BAV_DEFINITION,
    BAV_FAVOURABLE_COUNTS,
    BAV_GRADE_NAMES,
    BAV_GRADES,
    BAV_GRADING,
    BAV_NEUTRAL_COUNTS,
    BAV_UNFAVOURABLE_COUNTS,
    BHAVA_CHAKRA_CONTROVERSY,
    BHINNA_MEANS,
    BINDU_REKHA_FOOTNOTE,
    CHART_3,
    CHART_3_BIRTH,
    CHART_3_CHARA_KARAKAS,
    CHART_3_DRAWN,
    CHART_3_TITLE,
    CHART_11_MERCURY_BAV,
    CHART_12,
    CHART_12_BIRTH,
    CHART_12_CHARA_KARAKAS,
    CHART_12_D10_DRAWN,
    CHART_12_TITLE,
    CLASSICAL_TABLE_TOTALS_PROVENANCE,
    CONTROVERSY_NAMING,
    CONTROVERSY_NAMING_IS_MINOR,
    CONTROVERSY_UNRESOLVED,
    EXAMPLE_37,
    EXAMPLE_37_HOUSES,
    EXAMPLE_37_RASIS,
    EXAMPLE_37_WORKING,
    EXAMPLE_38_BEST_RASIS,
    EXAMPLE_38_NATAL,
    EXAMPLE_38_READING,
    EXAMPLE_38_WORKING,
    EXAMPLE_38_WORST_RASIS,
    EXAMPLE_39,
    EXAMPLE_39_ANSWER,
    EXAMPLE_39_D10_CLAIMS,
    EXAMPLE_39_D10_SAV,
    EXAMPLE_39_LAGNA,
    EXAMPLE_39_RASI_SAV,
    EXAMPLE_39_READING,
    EXAMPLE_39_VERIFIED,
    EXERCISE_18,
    EXERCISE_18_ANSWER,
    EXERCISE_18_HINT,
    EXERCISE_19,
    EXERCISE_19_ANSWER,
    EXERCISE_19_CLOSING,
    EXERCISE_19_UNEXPLAINED_MARK,
    EXERCISE_20,
    EXERCISE_20_ANSWER,
    EXERCISE_20_CLOSING,
    EXERCISE_21,
    EXERCISE_21_ANSWER,
    EXERCISE_21_FINAL_ANSWER,
    EXERCISE_21_FOOTNOTE_47_UNSEEN,
    EXERCISE_21_GUESS,
    EXERCISE_21_GUESS_STEPS,
    EXERCISE_21_HINT,
    EXERCISE_21_LAGNA,
    EXERCISE_21_LAGNA_REKHAS,
    EXERCISE_21_TENTH,
    EXERCISE_21_TENTH_REKHAS,
    EXERCISE_21_VERDICT,
    FOOTNOTE_46,
    MUHURTA_DEFINITION,
    MUHURTA_FOOTNOTE,
    NAMING_AGREES_WITH_FOOTNOTE_42,
    PARASARA_CHECKSUM_ARGUMENT,
    PARASARA_CHECKSUM_INVARIANT,
    PARASARA_VARAHAMIHIRA_CONFLICT_TEXTS,
    PARASARA_VARAHAMIHIRA_CONFLICTS,
    PARASARA_VS_VARAHAMIHIRA,
    PRASTAARA_COLUMN_NOTE,
    PRASTAARA_DEFINITION,
    PRASTAARA_MEANS,
    PRASTAARA_PURPOSE,
    PRASTAARA_REPRESENTATIONS,
    PRASTAARA_TRANSIT_EXAMPLE,
    PRASTAARA_TRANSIT_REFERENCES,
    PRASTAARA_WHY,
    RASI_NAMES,
    SAMUDAAYA_MEANS,
    SARVA_MEANS,
    SAV_AVERAGE_FROM,
    SAV_DEFINITION,
    SAV_GRADE_NAMES,
    SAV_IS_SEVEN_PLANETS,
    SAV_MUHURTA_POSITIONS,
    SAV_MUHURTA_RULE,
    SAV_OVERLAP_AT,
    SAV_OWNERS,
    SAV_STRENGTH_RULE,
    SAV_STRONG_FROM,
    SAV_TOTAL,
    SAV_WORKED_EXAMPLE,
    SODHYA_PINDA_WHERE_DEFINED,
    TABLE_19_WORKED_READING,
    TABLE_27_CHART,
    TABLE_27_MERCURY_PAV,
    TABLE_27_OWNER,
    TABLE_27_TOTALS,
    TABLES_20_TO_26_NOTE,
    VARAHAMIHIRA_NOT_IMPLEMENTED,
    WHOLE_SIGN_IS_WHAT_WE_DO,
    WHOLE_SIGN_STAND,
    WHOLE_SIGN_STAND_TYPO,
    YUGA_FOOTNOTE,
    YUGA_YEARS,
)

InputError = validate.InputError


def rules() -> dict:
    """Chapter 12's framing, its notation, and which tables exist."""
    return {
        "intro": ASHTAKAVARGA_INTRO,
        "means": ASHTAKAVARGA_MEANS,
        "reference_point_note": ASHTAKAVARGA_REFERENCE_POINT_NOTE,
        "all_planets_are_references": ASHTAKAVARGA_ALL_PLANETS_ARE_REFERENCES,
        "purpose": ASHTAKAVARGA_PURPOSE,
        "references": list(ASHTAKAVARGA_REFERENCES),
        "table_numbers": dict(ASHTAKAVARGA_TABLE_NUMBERS),
        "tables_available": list(available_tables()),
        "tables_verified": verify_tables(),
        "classical_totals_provenance": CLASSICAL_TABLE_TOTALS_PROVENANCE,
        "tables_verified_note": (
            "Ninety-six hand-typed entries per table is where a silent "
            "transcription error would live, so the shape checks ship with "
            "the product. The Sun's table reaching a total of 48 — the "
            "classical figure — is an independent check on all ninety-six."
        ),
        "tables_pending": list(ASHTAKAVARGA_TABLES_PENDING),
        "tables_pending_note": TABLES_20_TO_26_NOTE,
        "notation": ASHTAKAVARGA_NOTATION,
        "benefic_entry": {
            "value": 1, "term": ASHTAKAVARGA_BENEFIC_TERM,
            "sanskrit": ASHTAKAVARGA_BENEFIC_SANSKRIT,
        },
        "malefic_entry": {
            "value": 0, "term": ASHTAKAVARGA_MALEFIC_TERM,
            "sanskrit": ASHTAKAVARGA_MALEFIC_SANSKRIT,
        },
        "bindu_rekha_footnote": BINDU_REKHA_FOOTNOTE,
        "bav_definition": BAV_DEFINITION,
        "bhinna_means": BHINNA_MEANS,
        "abbreviations": dict(AV_ABBREVIATIONS),
        "bav_grading": BAV_GRADING,
        "bav_count_range": list(BAV_COUNT_RANGE),
        "bav_count_is_called_rekhas": BAV_COUNT_IS_CALLED_REKHAS,
        "bav_grades": {str(count): name for count, name in BAV_GRADES.items()},
        "bav_grade_counts": {
            "favorable": list(BAV_FAVOURABLE_COUNTS),
            "neutral": list(BAV_NEUTRAL_COUNTS),
            "unfavorable": list(BAV_UNFAVOURABLE_COUNTS),
        },
        "bav_grade_names": list(BAV_GRADE_NAMES),
        "bav_applies_to_transits": BAV_APPLIES_TO_TRANSITS,
        "bav_naming_agrees_with_footnote_42": (
            "Section 12.3 calls the count \u201cthe number of rekhas (benefic "
            "points)\u201d, which is footnote 42\u2019s benefic term. The two "
            "passages agree, so the field name `rekhas` does not rest on our "
            "reading of the footnote alone."
        ),
        "naming_warning": (
            "PVR follows Parasara: 1 is a **rekha** and 0 is a **bindu**. "
            "Most modern software and most south Indian practice use the two "
            "words the other way round, so a figure labelled “bindus in a "
            "sign” elsewhere is what this API calls rekhas. Every count "
            "returned here counts 1s, and the fields are named `rekhas` so "
            "the two can never be confused."
        ),
        "worked_reading": TABLE_19_WORKED_READING,
        "example_37": {
            "question": EXAMPLE_37,
            "working": EXAMPLE_37_WORKING,
            "owner": "Jupiter", "reference": "Venus", "reference_sign": "Ge",
            "houses": list(EXAMPLE_37_HOUSES),
            "rasis": list(EXAMPLE_37_RASIS),
        },
        "example_38": {
            "working": EXAMPLE_38_WORKING,
            "reading": EXAMPLE_38_READING,
            "natal": EXAMPLE_38_NATAL,
            "owner": "Mercury", "chart": "Chart 11",
            "bav": list(CHART_11_MERCURY_BAV),
            "best_rasis": list(EXAMPLE_38_BEST_RASIS),
            "worst_rasis": list(EXAMPLE_38_WORST_RASIS),
        },
        "not_only_rasi": AV_NOT_ONLY_RASI,
        "in_divisional_charts": AV_IN_DIVISIONAL_CHARTS,
        "tables_are_the_same": AV_TABLES_ARE_THE_SAME,
        "divisional_example": dict(AV_DIVISIONAL_EXAMPLE),
        "divisional_note": (
            "The eight tables are chart-independent, so "
            "/v1/ashtakavarga/divisional takes longitudes and a varga code "
            "and does exactly what /chart does on the resolved signs. "
            "Nothing in the tables is re-derived per chart."
        ),
        "muhurta_definition": MUHURTA_DEFINITION,
        "sodhya_pinda_where_defined": SODHYA_PINDA_WHERE_DEFINED,
        "sav_definition": SAV_DEFINITION,
        "samudaaya_means": SAMUDAAYA_MEANS,
        "sarva_means": SARVA_MEANS,
        "sav_is_seven_planets": SAV_IS_SEVEN_PLANETS,
        "sav_owners": list(SAV_OWNERS),
        "sav_excludes": ["Lagna"],
        "sav_total": SAV_TOTAL,
        "sav_worked_example": SAV_WORKED_EXAMPLE,
        "sav_strength_rule": SAV_STRENGTH_RULE,
        "sav_grade_bands": {
            "strong": f"{SAV_STRONG_FROM} or more",
            "average": f"{SAV_AVERAGE_FROM} to {SAV_STRONG_FROM - 1}",
            "weak": f"less than {SAV_AVERAGE_FROM}",
        },
        "sav_grade_names": list(SAV_GRADE_NAMES),
        "sav_overlap_note": (
            f"The printed ranges overlap at {SAV_OVERLAP_AT}: \u201c30 or more "
            f"rekhas becomes strong\u201d and \u201c25-30 rekhas is average\u201d. "
            f"Thirty is read as strong \u2014 that clause is unambiguous and "
            f"stated first, and the muhurta rule repeats \u201c30 or more \u2026 "
            f"are favorable\u201d. See docs/book-deviations.md D-40."
        ),
        "sav_muhurta_rule": SAV_MUHURTA_RULE,
        "sav_muhurta_positions": list(SAV_MUHURTA_POSITIONS),
        "muhurta_footnote": MUHURTA_FOOTNOTE,
        "example_39": {
            "question": EXAMPLE_39,
            "reading": EXAMPLE_39_READING,
            "answer": EXAMPLE_39_ANSWER,
            "rasi_sav": list(EXAMPLE_39_RASI_SAV),
            "d10_sav": list(EXAMPLE_39_D10_SAV),
            "lagna": EXAMPLE_39_LAGNA,
            "lagna_note": (
                "The example never states the lagna. Every claim it makes "
                "fixes it: the rasi maximum of 38 is called the 11th house "
                "and the D-10 maximum of 35 is called the lagna, and both "
                "give Scorpio. Chart 3 later confirmed it: Asc 14 Sc 18."
            ),
            "verified": EXAMPLE_39_VERIFIED,
            "d10_claims": [
                {"claim": claim, "rasi": rasi, "rekhas": rekhas}
                for claim, rasi, rekhas in EXAMPLE_39_D10_CLAIMS
            ],
        },
        "controversies": {
            "naming": CONTROVERSY_NAMING,
            "naming_is_minor": CONTROVERSY_NAMING_IS_MINOR,
            "naming_agrees_with_footnote_42": NAMING_AGREES_WITH_FOOTNOTE_42,
            "parasara_vs_varahamihira": PARASARA_VS_VARAHAMIHIRA,
            "footnote_46": FOOTNOTE_46,
            "checksum_argument": PARASARA_CHECKSUM_ARGUMENT,
            "checksum_invariant": PARASARA_CHECKSUM_INVARIANT,
            "conflict_texts": list(PARASARA_VARAHAMIHIRA_CONFLICT_TEXTS),
            "conflicts": [
                {"owner": owner, "reference": reference, "house": house,
                 "parasara": parasara, "varahamihira": varahamihira,
                 "ours": parasara}
                for owner, reference, house, parasara, varahamihira
                in PARASARA_VARAHAMIHIRA_CONFLICTS
            ],
            "unresolved": CONTROVERSY_UNRESOLVED,
            "varahamihira_not_implemented": VARAHAMIHIRA_NOT_IMPLEMENTED,
            "bhava_chakra": BHAVA_CHAKRA_CONTROVERSY,
            "whole_sign_stand": WHOLE_SIGN_STAND,
            "whole_sign_stand_typo": WHOLE_SIGN_STAND_TYPO,
            "whole_sign_is_what_we_do": WHOLE_SIGN_IS_WHAT_WE_DO,
        },
        "chart_3": {
            "title": CHART_3_TITLE,
            "birth": CHART_3_BIRTH,
            "longitudes": dict(CHART_3),
            "drawn": dict(CHART_3_DRAWN),
            "chara_karakas": dict(CHART_3_CHARA_KARAKAS),
            "note": (
                "Example 39 works from this chart without reprinting it. Both "
                "of its printed SAVs recompute from these longitudes exactly. "
                "The diagram prints AL, which the longitudes do not, so it is "
                "an independent check on section 9.2 over a Scorpio lagna."
            ),
        },
        "chart_12": {
            "title": CHART_12_TITLE,
            "birth": CHART_12_BIRTH,
            "longitudes": dict(CHART_12),
            "d10_drawn": dict(CHART_12_D10_DRAWN),
            "chara_karakas": dict(CHART_12_CHARA_KARAKAS),
            "note": (
                "Chart 12's diagram is its **D-10**, not its rasi chart, so "
                "the drawn placements check the varga as well as the "
                "transcription. Our D-10 reproduces all twelve."
            ),
        },
        "prastaara": {
            "why": PRASTAARA_WHY,
            "definition": PRASTAARA_DEFINITION,
            "means": PRASTAARA_MEANS,
            "purpose": PRASTAARA_PURPOSE,
            "column_note": PRASTAARA_COLUMN_NOTE,
            "representations": list(PRASTAARA_REPRESENTATIONS),
            "transit_example": PRASTAARA_TRANSIT_EXAMPLE,
            "transit_references": list(PRASTAARA_TRANSIT_REFERENCES),
            "transit_references_note": (
                "Only Venus is an ashtakavarga reference. The DK and the 7th "
                "lord in navamsa are ways of *choosing* which graha to ask "
                "about; they resolve to a graha before a PAV sees them."
            ),
            "table_27": {
                "owner": TABLE_27_OWNER,
                "chart": TABLE_27_CHART,
                "exercise": 18,
                "rows": {reference: list(entries)
                         for reference, entries in TABLE_27_MERCURY_PAV.items()},
                "totals": list(TABLE_27_TOTALS),
                "note": (
                    "The book says Exercise 18's answer already qualifies as "
                    "Mercury's PAV. We hold both and check them against each "
                    "other rather than typing the same fact twice."
                ),
            },
        },
        "exercise_21": {
            "question": EXERCISE_21,
            "hint": EXERCISE_21_HINT,
            "chart": "Chart 12",
            "varga": "D10",
            "answer": list(EXERCISE_21_ANSWER),
            "answer_provenance": (
                "We computed this before the book's answer was supplied, and "
                "it matched all twelve figures."
            ),
            "hint_figures": {
                "lagna": {"rasi": EXERCISE_21_LAGNA,
                          "rekhas": EXERCISE_21_LAGNA_REKHAS},
                "tenth": {"rasi": EXERCISE_21_TENTH,
                          "rekhas": EXERCISE_21_TENTH_REKHAS},
            },
            "makes_sense": False,
            "verdict": EXERCISE_21_VERDICT,
            "guess": EXERCISE_21_GUESS,
            "guess_steps": [
                {"claim": claim, "decided_by": why}
                for claim, why in EXERCISE_21_GUESS_STEPS
            ],
            "final_answer": EXERCISE_21_FINAL_ANSWER,
            "final_answer_note": (
                "Every step of the guess reproduces from Chart 12's D-10. The "
                "identification does not and is not claimed to: the derivable "
                "chain stops at a famous, fortunate entertainer with speech "
                "central to her career, and the name is the book's own "
                "knowledge, not a calculation."
            ),
            "footnote_47": EXERCISE_21_FOOTNOTE_47_UNSEEN,
        },
        "exercise_20": {
            "question": EXERCISE_20,
            "closing": EXERCISE_20_CLOSING,
            "chart": "Chart 6",
            "answer": list(EXERCISE_20_ANSWER),
        },
        "exercise_19": {
            "question": EXERCISE_19,
            "closing": EXERCISE_19_CLOSING,
            "chart": "Chart 6",
            "answer": {owner: list(rekhas)
                       for owner, rekhas in EXERCISE_19_ANSWER.items()},
            "unexplained_mark": dict(EXERCISE_19_UNEXPLAINED_MARK),
            "unexplained_mark_note": (
                "The printed answer shows \u201c5*\u201d for the Moon in Pisces and "
                "nothing on the page explains the asterisk. It is not the "
                "planet\u2019s own position marked as a rule \u2014 Venus in Aries "
                "and Mercury in Gemini carry none \u2014 and the value 5 is "
                "right either way. Recorded, not interpreted."
            ),
        },
        "exercise_18": {
            "question": EXERCISE_18,
            "hint": EXERCISE_18_HINT,
            "owner": "Mercury", "chart": "Chart 6",
            "answer": {ref: list(rasis)
                       for ref, rasis in EXERCISE_18_ANSWER.items()},
        },
        "yuga_footnote": YUGA_FOOTNOTE,
        "yugas": [{"name": name, "years": years} for name, years in YUGA_YEARS],
    }


@lru_cache(maxsize=16)
def table(owner: str) -> dict:
    """One of the eight tables, in the shape the book prints it."""
    return describe(str(owner))


def muhurta(natal_reference_signs: dict[str, int],
            muhurta_signs: dict[str, int]) -> dict:
    """§12.4's muhurta rule: the natal SAV read at the muhurta chart's lagna,
    Moon and Sun."""
    return muhurta_strength(
        {str(k): int(v) for k, v in natal_reference_signs.items()},
        {str(k): int(v) for k, v in muhurta_signs.items()})


def benefic_rasis(owner: str, reference_signs: dict[str, int]) -> dict:
    """Where one planet is benefic, reference by reference — §12.2's Example
    37 and Exercise 18.

    "So ashtakavarga is essentially a system that tells us the benefic
    positions of lagna and seven planets with respect to each other." This is
    that sentence as an endpoint.
    """
    signs = {str(k): int(v) for k, v in reference_signs.items()}
    per_reference = benefic_rasis_from_chart(str(owner), signs)
    return {
        "owner": str(owner),
        "table": ASHTAKAVARGA_TABLE_NUMBERS[str(owner)],
        "reference_signs": {k: {"sign": v, "sign_name": str(RASI_NAMES[v])}
                            for k, v in signs.items()},
        "benefic_rasis": [
            {
                "reference": reference,
                "reference_sign": signs[reference],
                "reference_sign_name": str(RASI_NAMES[signs[reference]]),
                "houses": list(benefic_houses(str(owner), reference)),
                "rasis": list(rasis),
                "rasi_names": [str(RASI_NAMES[s]) for s in rasis],
            }
            for reference, rasis in per_reference.items()
        ],
    }


def divisional(reference_longitudes: dict[str, float], chart_code: str = "D1",
               owner: str | None = None) -> dict:
    """§12.5: the same eight tables applied to any divisional chart.

    "The benefic houses for each planet with respect to the 8 references are
    the same." Only the signs the references occupy change, so this resolves
    the longitudes into the named chart and then does exactly what
    /chart does.
    """
    signs = signs_in_chart(
        {str(k): float(v) for k, v in reference_longitudes.items()},
        str(chart_code))
    result = chart(signs, owner)
    result["chart"] = str(chart_code).upper()
    result["chart_note"] = (
        "Section 12.5: the eight tables do not change from chart to chart. "
        "Only the signs the eight references occupy do."
    )
    result["reference_longitudes"] = {
        k: float(v) for k, v in reference_longitudes.items()}
    return result


def chart(reference_signs: dict[str, int], owner: str | None = None) -> dict:
    """A chart's ashtakavarga.

    :param reference_signs: all eight reference points to their signs.
    :param owner: one table, or omit for every table that exists.
    """
    signs = {str(k): int(v) for k, v in reference_signs.items()}
    owners = [str(owner)] if owner else list(available_tables())
    per_owner = [
        {
            "owner": name,
            "table": ASHTAKAVARGA_TABLE_NUMBERS[name],
            "rekhas": list(result.rekhas),
            "grades": list(result.grades),
            "total": result.total,
            "natal": natal_grade(name, signs),
            "signs": [
                {"sign": sign, "sign_name": str(RASI_NAMES[sign]),
                 "rekhas": result.rekhas[sign],
                 "grade": grade(result.rekhas[sign]),
                 "from": list(result.contributors[sign])}
                for sign in range(12)
            ],
        }
        for name, result in ((n, bhinnashtakavarga(n, signs)) for n in owners)
    ]
    return {
        "reference_signs": {k: {"sign": v, "sign_name": str(RASI_NAMES[v])}
                            for k, v in signs.items()},
        "bhinnashtakavarga": per_owner,
        "sarvashtakavarga": sarvashtakavarga(signs),
        "summed": summed(signs),
        "tables_pending": list(ASHTAKAVARGA_TABLES_PENDING),
        "chart": "D1",
    }


def prastaara_view(owner: str, reference_signs: dict[str, int],
                   rasi: int | None = None,
                   references: list[str] | None = None) -> dict:
    """§12.6's PAV for one planet, and optionally its one question.

    With no `rasi`, the whole grid — Table 27's shape. With a `rasi`, the
    references that rasi is benefic from, which is what §12.6 says a BAV
    cannot tell you. With `references` too, a verdict for each one asked
    about, so a transit rule gets an answer either way rather than an absence.
    """
    pav = prastaara(owner, reference_signs)
    out: dict = {
        "owner": pav.owner,
        "table": pav.table,
        "means": PRASTAARA_MEANS,
        "purpose": PRASTAARA_PURPOSE,
        "rows": [
            {"reference": reference, "entries": list(entries),
             "benefic_in": [str(RASI_NAMES[i])
                            for i, on in enumerate(entries) if on]}
            for reference, entries in pav.rows.items()
        ],
        "rekhas": list(pav.rekhas),
        "rekhas_note": PRASTAARA_COLUMN_NOTE,
        "benefic_from": [
            {"sign": sign, "sign_name": str(RASI_NAMES[sign]),
             "references": list(pav.benefic_from[sign]),
             "rekhas": pav.rekhas[sign]}
            for sign in range(12)
        ],
        "representations": list(PRASTAARA_REPRESENTATIONS),
    }
    if rasi is not None:
        out["asked"] = (
            is_benefic_from(owner, reference_signs, rasi, references)
            if references else
            {"owner": owner, "rasi": rasi,
             "rasi_name": str(RASI_NAMES[rasi]),
             "benefic_from": list(benefic_from_in(
                 owner, reference_signs, rasi)),
             "rekhas": pav.rekhas[rasi]}
        )
    return out


__all__ = ["AshtakavargaError", "InputError", "benefic_rasis", "chart",
           "divisional", "muhurta", "prastaara_view", "rules", "table"]
