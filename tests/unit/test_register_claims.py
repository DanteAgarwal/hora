"""Keep docs/not-yet-consumed.md's *claims* true, not just its membership.

`test_not_yet_consumed.py` checks that every constant is either consumed by a
calculation or listed in the register. It does not check that what the register
*says* about a listed constant is true.

That gap let twenty constants sit under a heading reading "Published through
`/v1/util/tables/*` and `/v1/reference/*`" while being published nowhere —
seventeen of them not even re-exported from `hora.core.const`. The register was
honest about them being unconsumed and wrong about them being reachable.

So the claim is now a test.
"""
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from hora.api.main import app
from hora.core import const as c

ROOT = Path(__file__).resolve().parents[2]
REGISTER = ROOT / "docs" / "not-yet-consumed.md"

#: The heading whose constants claim to be reachable through the API.
PUBLISHED_SECTION = "### Reference vocabulary"

#: Endpoints that publish reference material. Every parameterless GET counts:
#: the claim being tested is "reachable through the API", and tying it to two
#: URL prefixes made the guard fail on constants published correctly through a
#: third — /v1/house/rules, in the case that prompted this.
def _reference_paths(paths: list[str]) -> list[str]:
    return [path for path in paths if "{" not in path]


def _published_names() -> list[str]:
    text = REGISTER.read_text(encoding="utf-8")
    start = text.index(PUBLISHED_SECTION)
    end = text.index("###", start + len(PUBLISHED_SECTION))
    return re.findall(r"`([A-Z][A-Z0-9_]+)`", text[start:end])


@pytest.fixture(scope="module")
def reference_payload() -> str:
    """Every reference and util response, as one lowercased blob."""
    client = TestClient(app)
    paths = _reference_paths(list(app.openapi()["paths"]))
    blob = []
    for path in paths:
        response = client.get(path)
        if response.status_code == 200:
            blob.append(json.dumps(response.json(), ensure_ascii=False))
    assert blob, "no reference endpoints responded"
    return _normalise("\n".join(blob))


def _normalise(text: str) -> str:
    """Lowercase and drop what JSON encoding changes.

    ``ensure_ascii=False`` keeps an em-dash an em-dash, and stripping quotes
    and backslashes keeps a value containing "planet" comparable to its
    serialised form. Without both, a constant that *is* published fails on
    punctuation — which is a false alarm, and a guard that cries wolf gets
    switched off.
    """
    return re.sub(r'[\\"]', "", text).lower()


def _sample(value) -> str:
    """One distinctive string from a constant, to look for in the responses.

    Unwraps dicts and sequences in a single loop rather than two sequential
    ones: a tuple of dicts — FOUR_PILLARS — defeated the two-pass version,
    which stopped at the dict and returned its repr.

    Prefers the longest string it can reach, so the needle is distinctive:
    the first value of the first pillar is the number 1, which would match
    almost any response.
    """
    seen = 0
    while seen < 20:
        seen += 1
        if isinstance(value, dict):
            candidates = list(value.values())
        elif isinstance(value, (list, tuple, frozenset, set)):
            candidates = list(value)
        else:
            return str(value)
        strings = [v for v in candidates if isinstance(v, str) and len(v) >= 4]
        if strings:
            return max(strings, key=len)
        if not candidates:
            return ""
        value = candidates[0]
    return str(value)      # pragma: no cover - the depth guard


def test_the_register_lists_something_under_the_published_heading():
    assert len(_published_names()) > 10


def test_the_scan_covers_more_than_one_endpoint_family():
    """The guard is only as good as what it looks at.

    It once scanned two URL prefixes and failed on constants published through
    a third. It now scans every parameterless GET.
    """
    paths = _reference_paths(list(app.openapi()["paths"]))
    families = {path.split("/")[2] for path in paths if path.startswith("/v1/")}
    assert len(families) >= 4, families


@pytest.mark.parametrize("name", _published_names())
def test_a_constant_claimed_published_is_on_the_facade(name):
    """Re-exported from hora.core.const, the documented import surface."""
    assert hasattr(c, name), (
        f"{name} is listed in the register but is not re-exported from "
        f"hora.core.const — it was defined in core/constants/ and never wired up"
    )


def _all_strings(value, depth: int = 0) -> list[str]:
    """Every string reachable in a constant, for the strict check below."""
    if depth > 6:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        value = list(value.values())
    if isinstance(value, (list, tuple, frozenset, set)):
        return [s for item in value for s in _all_strings(item, depth + 1)]
    return []


@pytest.mark.parametrize("name", _published_names())
def test_a_small_enumeration_reaches_a_response_in_every_value(name, reference_payload):
    """For a short list of names, *all* of them must appear, not just one.

    The one-sample check passed `AYANA_NAMES` for months: its first value
    "uttara" matched inside the nakshatra names "Uttara Phalguni" and "Uttara
    Ashadha", while "dakshina" appeared nowhere and the constant was published
    nowhere at all.

    Capped at eight values so this stays a check on enumerations rather than
    on tables of prose, where a single unpublished row is a different problem.
    """
    strings = [s for s in _all_strings(getattr(c, name)) if len(s) >= 4]
    if not 1 <= len(strings) <= 8:
        pytest.skip(f"{name} has {len(strings)} strings; not a small enumeration")
    missing = [s for s in strings if _normalise(s) not in reference_payload]
    assert not missing, (
        f"{name} is listed as published but {missing} appear in no reference "
        f"or util response"
    )


@pytest.mark.parametrize("name", _published_names())
def test_a_constant_claimed_published_actually_reaches_a_response(name, reference_payload):
    """Its content must appear in some /v1/util/* or /v1/reference/* response.

    A loose check by design: it looks for one distinctive value, not the whole
    structure. Loose is enough — the failure it exists to catch is a constant
    that appears in *no* response at all.
    """
    sample = _normalise(_sample(getattr(c, name)))
    if len(sample) < 4:
        pytest.skip(f"{name}'s sample value {sample!r} is too short to search for")
    assert sample in reference_payload, (
        f"{name} is listed as published but {sample!r} appears in no "
        f"reference or util response"
    )
