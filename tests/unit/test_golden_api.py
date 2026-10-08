"""Replay every recorded API response and fail on any difference.

This is the safety net for refactoring. The engine's behaviour is defined by
what the endpoints return; if a rearrangement of the code changes any of it,
that is a regression until someone says otherwise.

Comparison is deep equality on the parsed JSON, not on raw bytes: key order in
a JSON object is not part of the contract, but every key and every value is.

To change the contract deliberately:

    python scripts/capture_golden.py

and review the diff. There is no way to make this test pass by accident.
"""
import json
import pathlib

import pytest

from tests.golden.cases import CASES

RESPONSES = pathlib.Path(__file__).resolve().parents[1] / "golden" / "responses"


def _load(case_id: str):
    path = RESPONSES / f"{case_id}.json"
    if not path.is_file():
        pytest.fail(
            f"no golden fixture for {case_id!r} — run scripts/capture_golden.py"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def _diff(expected, actual, path=""):
    """First meaningful difference between two JSON structures, as a string."""
    if type(expected) is not type(actual):
        return f"{path or 'root'}: type {type(expected).__name__} -> {type(actual).__name__}"
    if isinstance(expected, dict):
        missing = set(expected) - set(actual)
        added = set(actual) - set(expected)
        if missing:
            return f"{path or 'root'}: key(s) removed: {sorted(missing)}"
        if added:
            return f"{path or 'root'}: key(s) added: {sorted(added)}"
        for key in expected:
            found = _diff(expected[key], actual[key], f"{path}.{key}" if path else key)
            if found:
                return found
        return None
    if isinstance(expected, list):
        if len(expected) != len(actual):
            return f"{path}: length {len(expected)} -> {len(actual)}"
        for i, (e, a) in enumerate(zip(expected, actual, strict=True)):
            found = _diff(e, a, f"{path}[{i}]")
            if found:
                return found
        return None
    if expected != actual:
        return f"{path}: {expected!r} -> {actual!r}"
    return None


@pytest.mark.parametrize("case_id,method,path,body", CASES, ids=[c[0] for c in CASES])
def test_endpoint_response_is_unchanged(case_id, method, path, body, client):
    expected = _load(case_id)
    response = client.request(method, path, json=body)

    assert response.status_code == expected["status"], (
        f"{case_id}: status {expected['status']} -> {response.status_code}"
    )
    try:
        actual = response.json()
    except ValueError:
        actual = {"__text__": response.text}

    difference = _diff(expected["body"], actual)
    assert difference is None, f"{case_id}: {difference}"


def test_every_case_has_a_fixture():
    recorded = {p.stem for p in RESPONSES.glob("*.json")}
    declared = {c[0] for c in CASES}
    assert declared - recorded == set(), (
        f"missing fixtures: {sorted(declared - recorded)} — run scripts/capture_golden.py"
    )
    assert recorded - declared == set(), (
        f"orphan fixtures: {sorted(recorded - declared)} — remove them or add the cases"
    )


def test_every_endpoint_is_covered_by_at_least_one_case():
    """A new endpoint without a golden case would refactor unprotected."""
    from hora.api.main import app

    covered = {path for _, _, path, _ in CASES}
    # Path parameters are recorded with a concrete value, so match by prefix.
    for spec_path in app.openapi()["paths"]:
        template = spec_path.split("{")[0]
        assert any(c.startswith(template) for c in covered), (
            f"{spec_path} has no golden case — add one to tests/golden/cases.py"
        )


def test_error_responses_are_part_of_the_contract():
    """Error shapes matter as much as success shapes."""
    error_cases = [c for c in CASES if c[0].startswith("err_")]
    assert len(error_cases) >= 6
    for case_id, *_ in error_cases:
        assert _load(case_id)["status"] >= 400, case_id
