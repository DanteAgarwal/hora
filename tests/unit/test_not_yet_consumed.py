"""Keep docs/not-yet-consumed.md honest.

The register lists data that exists and is verified but that no calculation
uses. A stale register is worse than none: it would let "chapter N is done" go
on meaning "chapter N is working" long after that stopped being true.

So the register is checked against the code both ways:

  - everything it lists must really be unconsumed
  - everything unconsumed must really be listed

Either drift fails. When something becomes consumed, delete it from the
register and this test goes green again.
"""
import pathlib
import re

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "hora"
REGISTER = ROOT / "docs" / "not-yet-consumed.md"

#: Files that merely *expose* data do not count as consuming it: the constant
#: tables themselves, the facade that re-exports them, and the API endpoints
#: that publish them as reference material.
EXPOSER_PREFIXES = ("core/constants/",)
EXPOSERS = {
    "core/const.py",
    # Publishes the chapter tables as reference material; it formats constants
    # and computes nothing astrological.
    "services/reference_service.py",
    "api/routers/util.py",
    "api/routers/reference.py",
}

#: Symbols the register is responsible for tracking.
#:
#: **Discovered, not hand-listed.** This used to be a typed-out list of 37
#: names, which meant the register only covered constants somebody remembered
#: to add to it — the same closed loop that let Table 2's deity column go
#: missing. Every module-level constant in ``core/constants/`` is now tracked
#: automatically, so a new table is in scope the moment it is written.
#:
#: A tracked symbol must be either consumed by a calculation or listed in the
#: register. Nothing may be neither.
CONSTANTS_DIR = SRC / "core" / "constants"

#: ``NAME = ...`` or ``NAME: type = ...`` at column zero. Leading-underscore
#: privates are internal to their module and are not part of the contract.
_CONSTANT = re.compile(r"^([A-Z][A-Z0-9_]{2,})(?:\s*:\s*[^=]+)?\s*=", re.MULTILINE)


def _tracked() -> list[str]:
    names: set[str] = set()
    for path in sorted(CONSTANTS_DIR.glob("*.py")):
        if path.name == "__init__.py":
            continue
        names.update(_CONSTANT.findall(path.read_text(encoding="utf-8")))
    return sorted(names)


TRACKED = _tracked()


def _source_files():
    for path in SRC.rglob("*.py"):
        rel = path.relative_to(SRC).as_posix()
        if "__pycache__" in rel or rel in EXPOSERS:
            continue
        if rel.startswith(EXPOSER_PREFIXES):
            continue
        yield rel, path.read_text(encoding="utf-8")


def consumers(symbol: str) -> list[str]:
    """Files that reference a symbol outside the ones that merely expose it."""
    return [rel for rel, text in _source_files() if re.search(rf"\b{symbol}\b", text)]


@pytest.fixture(scope="module")
def register_text():
    return REGISTER.read_text(encoding="utf-8")


@pytest.mark.parametrize("symbol", TRACKED)
def test_every_tracked_symbol_is_either_consumed_or_registered(symbol, register_text):
    used = consumers(symbol)
    listed = f"`{symbol}`" in register_text
    assert used or listed, (
        f"{symbol} is used by no calculation and is not listed in "
        f"docs/not-yet-consumed.md — add it, or wire it up"
    )


@pytest.mark.parametrize("symbol", TRACKED)
def test_the_register_does_not_list_something_that_is_now_consumed(symbol, register_text):
    used = consumers(symbol)
    listed = f"`{symbol}`" in register_text
    assert not (used and listed), (
        f"{symbol} is now consumed by {used} but is still listed as unconsumed "
        f"in docs/not-yet-consumed.md — remove it from the register"
    )


def test_the_register_exists_and_names_its_own_test():
    assert REGISTER.is_file()
    assert "test_not_yet_consumed.py" in REGISTER.read_text(encoding="utf-8")


def test_only_rasi_drishti_is_used_from_the_aspects_module(register_text):
    """`charts/aspects.py` is half verified now, and the halves must stay apart.

    `rasi_drishti` was corrected against section 15.5.1's worked example and is
    imported by `charts/colord.py` (see docs/open-items.md OI-27).

    `graha_drishti_houses` and `graha_aspects_sign` were verified against
    **chapter 10** — §10.2's rules, Example 34 and Exercise 14's whole answer
    table — and are now wired into `services/aspect_service.py`.

    `drishti_value` is still unverified. It is the virupa partial-aspect table
    used by drik bala and ashtakavarga, which chapter 10 does not derive, so it
    must stay unimported until a chapter does.
    """
    aspects = SRC / "charts" / "aspects.py"
    if not aspects.is_file():
        pytest.skip("aspects.py has been removed")

    verified = {"rasi_drishti", "graha_drishti_houses", "graha_aspects_sign"}
    unverified = {"drishti_value"}
    used = set()
    for rel, text in _source_files():
        if "charts.aspects" not in text and "from hora.charts import aspects" not in text:
            continue
        for name in verified | unverified:
            if name in text:
                used.add(name)

    leaked = sorted(used & unverified)
    assert not leaked, (
        f"{leaked} are imported but unverified — derive them from the chapter "
        f"that defines them first, or keep them out of the engine"
    )
    assert "aspects.py" in register_text


def test_the_constants_package_is_only_a_data_store():
    """Nothing in core/constants may compute; it holds tables and enums only.

    If logic creeps in there it escapes the exposer rule above and the register
    silently stops working.
    """
    import ast

    for path in (SRC / "core" / "constants").glob("*.py"):
        tree = ast.parse(path.read_text())
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and not node.name.startswith("_"):
                pytest.fail(f"{path.name} defines a public function {node.name!r}")


def test_vimshottari_tables_agree():
    """The vimshottari table exists twice; pin the two copies together.

    ``constants/nakshatra.py`` defines ``VIMSHOTTARI_ORDER`` and
    ``VIMSHOTTARI_YEARS``. ``dasha/nakshatra/systems.py`` defines its own
    ``order`` and ``years`` for the same dasa and does not import them.

    They agree today. Nothing is broken. But two sources of truth for one table
    means an edit to either side diverges silently, and the dasa lengths are
    not something to discover a divergence in later. Deduplicating them changes
    behaviour-carrying code, so it is registered as a decision in
    docs/not-yet-consumed.md rather than done here; this test holds the line
    until that decision is made.
    """
    from hora.core.const import VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS
    from hora.dasha.nakshatra.systems import VIMSHOTTARI

    assert tuple(VIMSHOTTARI_ORDER) == tuple(VIMSHOTTARI.order)
    assert tuple(VIMSHOTTARI_YEARS[g] for g in VIMSHOTTARI_ORDER) == tuple(VIMSHOTTARI.years)
    assert sum(VIMSHOTTARI.years) == 120, "vimshottari is a 120-year cycle"
