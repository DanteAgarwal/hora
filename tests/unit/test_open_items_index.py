"""open-items.md must hold only unresolved items, and hold all of them.

The file used to carry every closed item's full narrative and had grown to
1,925 lines, which made the fourteen things actually needing attention hard to
find. Closed items now live in closed-items.md. These tests keep the two from
drifting back together.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

DOCS = Path(__file__).resolve().parents[2] / "docs"
OPEN = DOCS / "open-items.md"
CLOSED = DOCS / "closed-items.md"

OPEN_TEXT = OPEN.read_text(encoding="utf-8")
CLOSED_TEXT = CLOSED.read_text(encoding="utf-8")

_ENTRY = re.compile(r"^### (OI-\d+)[^\n]*$", re.MULTILINE)
_DECISION_ROW = re.compile(r"^\| (OI-\d+) \| .+ \| .+ \|$", re.MULTILINE)


def _section(text: str, heading: str) -> str:
    body = text.split(f"\n## {heading}\n", 1)[1]
    return body.split("\n## ", 1)[0]


def test_no_closed_item_is_described_in_open_items():
    """The whole point of the split. A CLOSED status here means the file has
    started collecting resolved work again."""
    assert "**CLOSED**" not in OPEN_TEXT
    assert "· **CLOSED**" not in OPEN_TEXT


def test_open_items_does_not_grow_narrative():
    """A register nobody reads is not a register.

    A raw line ceiling was the first cut, but it punishes finding real items:
    the file went 249 -> 417 lines as chapters 4 to 7 were swept, and every
    one of those lines was a new open item. What actually matters is whether
    entries are turning into essays, so the budget is **per item**.
    """
    entries = len(_ENTRY.findall(OPEN_TEXT)) + len(
        _DECISION_ROW.findall(_section(OPEN_TEXT, "Waiting on you"))
    )
    lines = len(OPEN_TEXT.splitlines())
    assert entries >= 10, "the parser found too few entries to judge"
    assert lines / entries < 20, (
        f"{lines} lines over {entries} items — entries are becoming essays"
    )


def test_no_single_entry_dominates_the_file():
    """One runaway entry is the other way narrative creeps in."""
    starts = [(m.group(1), m.start()) for m in re.finditer(r"^### (OI-\d+)", OPEN_TEXT, re.MULTILINE)]
    for index, (name, start) in enumerate(starts):
        end = starts[index + 1][1] if index + 1 < len(starts) else len(OPEN_TEXT)
        assert OPEN_TEXT[start:end].count("\n") < 40, f"{name} is too long"


def test_every_decision_row_has_a_detail_block():
    rows = _DECISION_ROW.findall(_section(OPEN_TEXT, "Waiting on you"))
    assert rows, "the decisions table is empty or its shape changed"
    blocks = set(_ENTRY.findall(OPEN_TEXT))
    for item in rows:
        assert item in blocks, f"{item} is in the decisions table with no detail"


def test_the_counts_line_matches_the_entries():
    """The summary at the top is the first thing read; it must not lie."""
    match = re.search(
        r"\*\*(\d+) waiting on Amit · (\d+) waiting on evidence · (\d+) parked\*\*",
        OPEN_TEXT,
    )
    assert match, "the counts line is missing or its shape changed"
    amit, evidence, parked = (int(g) for g in match.groups())
    assert len(_DECISION_ROW.findall(_section(OPEN_TEXT, "Waiting on you"))) == amit
    assert len(_ENTRY.findall(_section(OPEN_TEXT, "Waiting on evidence"))) == evidence
    assert len(_ENTRY.findall(_section(OPEN_TEXT, "Parked"))) == parked


def test_every_evidence_item_says_what_would_close_it():
    """An open item with no closing condition can never be closed, only
    forgotten."""
    section = _section(OPEN_TEXT, "Waiting on evidence")
    blocks = re.split(r"^### ", section, flags=re.MULTILINE)[1:]
    for block in blocks:
        name = block.split("\n", 1)[0]
        assert "**Closes when:**" in block, f"{name} has no closing condition"


def test_no_item_appears_in_both_files():
    open_ids = set(_ENTRY.findall(OPEN_TEXT)) | set(
        _DECISION_ROW.findall(_section(OPEN_TEXT, "Waiting on you"))
    )
    closed_ids = set(re.findall(r"^## (OI-\d+) ", CLOSED_TEXT, re.MULTILINE))
    assert not (open_ids & closed_ids), open_ids & closed_ids


def test_closed_items_exists_and_is_indexed():
    ids = re.findall(r"^## (OI-\d+) ", CLOSED_TEXT, re.MULTILINE)
    assert ids, "closed-items.md has no entries"
    rows = set(re.findall(r"^\| \[(OI-\d+)\]", CLOSED_TEXT, re.MULTILINE))
    assert set(ids) == rows, "closed-items.md index and sections disagree"


@pytest.mark.parametrize("doc", [OPEN, CLOSED])
def test_the_two_files_link_to_each_other(doc):
    text = doc.read_text(encoding="utf-8")
    other = "closed-items.md" if doc is OPEN else "open-items.md"
    assert other in text, f"{doc.name} does not point at {other}"


def test_no_code_cites_an_open_item_that_does_not_exist():
    """OI-54 was cited in `constants/varga.py` and a test before it existed
    here — a dangling reference nothing would have caught.

    Every OI number appearing in src/ or tests/ must resolve to an entry in
    open-items.md or closed-items.md.
    """
    root = DOCS.parent
    cited: set[str] = set()
    for folder in ("src", "tests"):
        for path in (root / folder).rglob("*.py"):
            cited |= set(re.findall(r"OI-\d+", path.read_text(encoding="utf-8")))

    known = set(re.findall(r"^### (OI-\d+)", OPEN_TEXT, re.MULTILINE))
    known |= set(re.findall(r"^\| (OI-\d+)", OPEN_TEXT, re.MULTILINE))
    known |= set(re.findall(r"^## (OI-\d+) ", CLOSED_TEXT, re.MULTILINE))

    assert cited, "the sweep found no citations, so it is not working"
    assert not (cited - known), sorted(cited - known)


def test_no_chart_or_figure_is_called_missing_when_we_have_it():
    """A claim that the book has not given us something must be true.

    This guard exists because it once was not. `SANKHYA_EXAMPLE` recorded
    "Figure 1 has not been supplied" and an open item sent Amit looking for a
    chart that was already a fixture in `tests/unit/test_book_1_3_4.py`, with
    the Figure 1 link written in its own docstring. He could not find it,
    and handed over the whole book to unblock the work.

    So: every "Chart N"/"Figure N" the repo says is missing must genuinely
    have no fixture. Cheap to check, and the cost of not checking was real.
    """
    import re
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    claim = re.compile(
        r"(Chart|Figure)\s+(\d+)[^.\n]{0,80}?"
        r"(has not been (supplied|given)|was not supplied|not been given to us)",
        re.IGNORECASE)

    fixtures: set[str] = set()
    for path in (root / "tests").rglob("*.py"):
        fixtures |= set(re.findall(r"^(CHART_\d+|RAMA_GRAHAS)\s*=",
                                   path.read_text(encoding="utf-8"), re.MULTILINE))

    problems = []
    for folder in ("docs", "tests", "src"):
        for path in sorted((root / folder).rglob("*")):
            if path.suffix not in (".md", ".py") or "__pycache__" in str(path):
                continue
            if path.name == Path(__file__).name:
                continue
            for kind, number, _, _ in claim.findall(path.read_text(encoding="utf-8", errors="ignore")):
                if f"CHART_{number}" in fixtures:
                    problems.append(
                        f"{path.relative_to(root)} says {kind} {number} is "
                        f"missing, but CHART_{number} is a fixture")
    assert not problems, "\n  ".join(problems)
