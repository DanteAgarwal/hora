"""Dasha service."""
from __future__ import annotations

from datetime import datetime

from hora.api.serialize import dasha_out, envelope
from hora.charts.chart import Place, compute_chart
from hora.core.const import ASHTOTTARI_CAVEAT, VIMSOTTARI_VARIATIONS, Graha
from hora.core.settings import Settings
from hora.core.timeutil import Instant, from_local
from hora.dasha.base import balance_at_birth, compute_nakshatra_dasha, expand_sub_periods, find_running
from hora.dasha.nakshatra.systems import NAKSHATRA_DASHA_SYSTEMS


class UnknownDashaSystem(ValueError):
    """Raised when the requested dasa system is not implemented."""


class BadAsOf(ValueError):
    """Raised when ``as_of`` is not an ISO 8601 datetime."""


def dasha_tree(
    instant: Instant,
    place: Place,
    settings: Settings,
    *,
    system: str,
    levels: int,
    cycles: int,
    start_star: int = 1,
    reckon_from: str = "moon",
    as_of: str | None,
    tz_name: str | None,
    utc_offset_hours: float | None,
) -> dict:
    """A nakshatra dasa tree, plus the chain running at ``as_of`` if given."""
    spec = NAKSHATRA_DASHA_SYSTEMS.get(system)
    if spec is None:
        raise UnknownDashaSystem(f"unknown dasha system {system!r}")

    if reckon_from not in ("moon", "lagna"):
        raise UnknownDashaSystem(
            f"reckon_from must be 'moon' or 'lagna', got {reckon_from!r}")

    chart = compute_chart(instant, place, settings)
    moon = chart.positions[Graha.MOON].longitude
    # §16.4.2: "Some authorities have also recommended Vimsottari dasa from the
    # longitude of lagna instead of Moon." Everything downstream is identical;
    # only which longitude seeds the cycle changes.
    seed = moon if reckon_from == "moon" else chart.lagna_longitude
    off = chart.instant.utc_offset_hours

    periods = compute_nakshatra_dasha(
        spec, seed, chart.instant.jd_ut, settings.dasha_year_length,
        levels=levels, cycles=cycles, start_star=start_star,
    )
    lord, balance_years = balance_at_birth(spec, seed, start_star)

    as_of_jd = chart.instant.jd_ut
    if as_of:
        try:
            dt = datetime.fromisoformat(as_of)
        except ValueError as exc:
            raise BadAsOf("as_of must be ISO 8601") from exc
        as_of_jd = from_local(
            dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second,
            tz_name=tz_name, utc_offset_hours=utc_offset_hours,
        ).jd_ut

    return {
        **envelope(instant, place, settings),
        "system": {"key": spec.key, "name": spec.display_name,
                   "total_years": spec.total_years},
        "moon_longitude": round(moon, 8),
        "balance_at_birth": {"lord": lord, "years": round(balance_years, 8)},
        "year_length": settings.dasha_year_length.value,
        # §17.2.3 and chapter 17's close: this system's applicability and its
        # application are both contested, and the book says so itself. The
        # caution travels with the result rather than living in a document.
        "caveat": ASHTOTTARI_CAVEAT if system == "ashtottari" else None,
        "reckon_from": reckon_from,
        "seed_longitude": round(seed, 8),
        "start_star": start_star,
        "start_star_name": next(
            (v["name"] for v in VIMSOTTARI_VARIATIONS if v["star"] == start_star),
            f"the {start_star}th from the Moon's",
        ),
        "periods": [dasha_out(p, off) for p in periods],
        "running": [
            {"level": p.level, "lord": p.lord, "lord_name": p.lord_name}
            for p in find_running(periods, as_of_jd)
        ],
    }


def expand_period(
    parent: dict,
    target_level: int | None = None,
    system: str = "vimshottari",
    utc_offset_hours: float | None = 0.0,
) -> dict:
    """Expand a parent dasha period into its subperiods using classical proportions."""
    spec = NAKSHATRA_DASHA_SYSTEMS.get(system)
    if spec is None:
        raise UnknownDashaSystem(f"unknown dasha system {system!r}")

    lord = parent.get("lord_name") or parent.get("lord") or "Sun"
    level = int(parent.get("level") or 1)
    target = int(target_level or (level + 1))

    start_str = parent.get("start", "")
    end_str = parent.get("end", "")
    start_jd = parent.get("start_jd")
    end_jd = parent.get("end_jd")

    off = float(utc_offset_hours or 0.0)

    if start_jd is None and start_str:
        try:
            dt_s = datetime.fromisoformat(start_str.replace("Z", "+00:00").replace(" ", "T"))
            start_jd = from_local(dt_s.year, dt_s.month, dt_s.day, dt_s.hour, dt_s.minute, dt_s.second, utc_offset_hours=off).jd_ut
        except Exception:
            pass

    if end_jd is None and end_str:
        try:
            dt_e = datetime.fromisoformat(end_str.replace("Z", "+00:00").replace(" ", "T"))
            end_jd = from_local(dt_e.year, dt_e.month, dt_e.day, dt_e.hour, dt_e.minute, dt_e.second, utc_offset_hours=off).jd_ut
        except Exception:
            pass

    if start_jd is None or end_jd is None:
        raise ValueError("Could not resolve start_jd or end_jd from period input")

    sub_periods = expand_sub_periods(spec, lord, start_jd, end_jd, parent_level=level, target_level=target)
    return {
        "parent": parent,
        "target_level": target,
        "subperiods": [dasha_out(p, off) for p in sub_periods],
    }

