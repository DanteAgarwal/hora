"""Editorial content store — kept strictly apart from calculation.

Calculation is right or wrong against JHora and is unit-tested against numbers.
Content is editorial: sourced prose and keyword lists that grow over time from
many classical works. Mixing the two would make a content typo look like a
calculation failure, and would bloat every chart response.

Nothing in this package is imported by anything under ``hora.charts``,
``hora.panchanga``, ``hora.dasha`` or ``hora.core``. The join is by integer id.

**Licence gating.** Each source carries a ``licence_status``. Sources marked
``unconfirmed`` are loaded and queryable in-process but are withheld from API
responses unless ``HORA_SERVE_UNCONFIRMED_CONTENT`` is set. That keeps material
whose redistribution rights are unsettled out of public responses by default.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

import yaml

CONTENT_DIR = Path(
    os.environ.get("HORA_CONTENT_PATH", Path(__file__).resolve().parents[3] / "data" / "content")
)

#: Sources whose redistribution rights are settled.
CONFIRMED = "confirmed"
UNCONFIRMED = "unconfirmed"


def serving_unconfirmed_allowed() -> bool:
    """Whether licence-unconfirmed entries may leave the process."""
    return os.environ.get("HORA_SERVE_UNCONFIRMED_CONTENT", "").lower() in ("1", "true", "yes")


@dataclass(frozen=True, slots=True)
class Term:
    term: str
    #: Our editorial tag, not the source author's.
    category: str


@dataclass(frozen=True, slots=True)
class Condition:
    """When a conditional clause of a result applies.

    The book writes these in square brackets — "[in lagna]", "[if waning]",
    "[in Ar, Ta, Ge, Vi]". Every field is optional and an omitted field places
    no restriction; a Condition with nothing set but ``otherwise`` is the
    "[else]" branch.
    """

    #: Houses the graha must occupy, 1-indexed. "[in lagna]" is ``[1]``.
    houses: tuple[int, ...] = ()
    #: Rasis the graha must occupy, 0 = Aries.
    rasis: tuple[int, ...] = ()
    #: Grahas that must share the rasi. "[in 5th with Rahu]" sets both.
    joined_by: tuple[int, ...] = ()
    #: Grahas that must NOT share the rasi. "[without Jupiter]".
    not_joined_by: tuple[int, ...] = ()
    #: "malefic" or "benefic" — the nature of the lord of the occupied rasi.
    #: "[in a malefic rasi]".
    rasi_lord: str | None = None
    #: "strong" or "weak". The book writes "[if strong]" without saying which
    #: measure, and chapter 15 derives none that can settle it, so this is
    #: expected to resolve as undetermined until a strength measure exists.
    strength: str | None = None
    #: "malefics" or "benefics" — conjoined or aspected by.
    associated_with: str | None = None
    #: "waxing" or "waning", for the Moon.
    moon_phase: str | None = None
    #: Dignities that satisfy it, e.g. ("exalted", "own", "friend").
    dignity: tuple[str, ...] = ()
    #: True for the "[else]" / "[elsewhere]" branch, which applies when no
    #: other condition on the same entry does.
    otherwise: bool = False

    @property
    def unconditional(self) -> bool:
        return not (
            self.houses or self.rasis or self.joined_by or self.not_joined_by
            or self.associated_with or self.moon_phase or self.dignity
            or self.rasi_lord or self.strength or self.otherwise
        )


@dataclass(frozen=True, slots=True)
class Result:
    """One clause of a result, with the condition it hangs on."""

    text: str
    condition: Condition = field(default_factory=Condition)


@dataclass(frozen=True, slots=True)
class Entry:
    """Indications for one subject from one source."""

    subject: str
    subject_id: int
    subject_name: str
    #: Second half of a composite key, where a subject needs one. Avastha
    #: results are keyed by (avastha index, graha), so the avastha index is the
    #: subject_id and the graha is the qualifier.
    qualifier: int | None
    qualifier_name: str | None
    source: str
    licence_status: str
    verbatim: str
    terms: list[Term] = field(default_factory=list)
    #: Conditional clauses, where the source splits a result into branches.
    results: list[Result] = field(default_factory=list)
    transcription_notes: str | None = None

    @property
    def servable(self) -> bool:
        return self.licence_status == CONFIRMED or serving_unconfirmed_allowed()

    def by_category(self) -> dict[str, list[str]]:
        out: dict[str, list[str]] = {}
        for t in self.terms:
            out.setdefault(t.category, []).append(t.term)
        return out


@dataclass(frozen=True, slots=True)
class ContentStore:
    """All loaded content, indexed by (subject, subject_id)."""

    sources: dict[str, dict]
    entries: dict[tuple[str, int], list[Entry]]
    categorisation_notes: dict[str, str]

    def get(
        self,
        subject: str,
        subject_id: int,
        *,
        source: str | None = None,
        qualifier: int | None = None,
    ) -> list[Entry]:
        """Entries for a subject id, optionally narrowed.

        ``qualifier`` selects one half of a composite key. Passing None keeps
        every qualifier, so existing single-key callers are unaffected.
        """
        found = self.entries.get((subject, subject_id), [])
        if source is not None:
            found = [e for e in found if e.source == source]
        if qualifier is not None:
            found = [e for e in found if e.qualifier == qualifier]
        return found

    def subjects(self) -> list[str]:
        return sorted({s for s, _ in self.entries})


def _condition(raw: dict | None) -> Condition:
    if not raw:
        return Condition()
    return Condition(
        houses=tuple(raw.get("houses", ())),
        rasis=tuple(raw.get("rasis", ())),
        joined_by=tuple(raw.get("joined_by", ())),
        not_joined_by=tuple(raw.get("not_joined_by", ())),
        rasi_lord=raw.get("rasi_lord"),
        strength=raw.get("strength"),
        associated_with=raw.get("associated_with"),
        moon_phase=raw.get("moon_phase"),
        dignity=tuple(raw.get("dignity", ())),
        otherwise=bool(raw.get("otherwise", False)),
    )


def _load_file(path: Path) -> tuple[str, dict, list[Entry], str]:
    doc = yaml.safe_load(path.read_text(encoding='utf-8'))
    subject = doc["subject"]
    #: A composite-key subject names its second key in ``qualifier_field``.
    qualifier_field = doc.get("qualifier_field")
    entries = [
        Entry(
            subject=subject,
            subject_id=e[subject],
            subject_name=e.get(f"{subject}_name", str(e[subject])),
            qualifier=e.get(qualifier_field) if qualifier_field else None,
            qualifier_name=(
                e.get(f"{qualifier_field}_name") if qualifier_field else None
            ),
            source=e["source"],
            licence_status=e.get("licence_status", UNCONFIRMED),
            verbatim=e.get("verbatim", ""),
            terms=[Term(term=t["term"], category=t["category"]) for t in e.get("terms", [])],
            results=[
                Result(text=r["text"], condition=_condition(r.get("when")))
                for r in e.get("results", [])
            ],
            transcription_notes=e.get("transcription_notes"),
        )
        for e in doc.get("entries", [])
    ]
    return subject, doc.get("sources", {}), entries, doc.get("categorisation_note", "")


@lru_cache(maxsize=1)
def get_store() -> ContentStore:
    """Load every YAML file in the content directory. Cached for the process."""
    sources: dict[str, dict] = {}
    entries: dict[tuple[str, int], list[Entry]] = {}
    notes: dict[str, str] = {}
    if CONTENT_DIR.is_dir():
        for path in sorted(CONTENT_DIR.glob("*.yaml")):
            subject, srcs, items, note = _load_file(path)
            sources.update(srcs)
            notes[subject] = note
            for item in items:
                entries.setdefault((item.subject, item.subject_id), []).append(item)
    return ContentStore(sources=sources, entries=entries, categorisation_notes=notes)
