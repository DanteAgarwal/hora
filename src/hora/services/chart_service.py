"""Chart services: rasi, divisional charts and upagrahas."""
from __future__ import annotations

from functools import lru_cache

from hora.api.serialize import chart_out, envelope, sign_and_degree, varga_out
from hora.charts.chart import Chart, Place, compute_chart
from hora.charts.special_lagna import (
    ADVANCE_PER_MINUTE,
    SpecialLagna,
    all_special_lagnas,
    minutes_since,
    sun_longitude_at,
)
from hora.charts.upagraha import all_upagrahas, birth_period, part_lords
from hora.charts.vargas import SHODASAVARGA
from hora.core.const import (
    GRAHA_NAMES,
    SUN_BASED_UPAGRAHAS,
    UPAGRAHA_NATURE,
    VAARA_NAMES,
    Graha,
)
from hora.core.settings import Settings
from hora.core.timeutil import Instant, jd_to_local_str


@lru_cache(maxsize=128)
def rasi_chart(instant: Instant, place: Place, settings: Settings) -> dict:
    return chart_out(compute_chart(instant, place, settings))


def varga_charts(
    instant: Instant, place: Place, settings: Settings,
    codes: list[str], variants: dict[str, str],
) -> dict:
    """Divisional charts by code. Raises ValueError on an unknown code."""
    chart = compute_chart(instant, place, settings)
    out = {}
    for code in codes:
        code = code.upper()
        positions = chart.varga_chart(code, variants.get(code))
        out[code] = varga_out(positions, chart, code)
    return {**envelope(instant, place, settings), "charts": out}


@lru_cache(maxsize=128)
def shodasavarga_charts(instant: Instant, place: Place, settings: Settings) -> dict:
    chart = compute_chart(instant, place, settings)
    return {
        **envelope(instant, place, settings),
        "charts": {c: varga_out(chart.varga_chart(c), chart, c) for c in SHODASAVARGA},
    }


@lru_cache(maxsize=128)
def upagraha_chart(instant: Instant, place: Place, settings: Settings) -> dict:
    """All eleven upagrahas, with the day or night period they were derived from.

    Raises ValueError at latitudes where the Sun does not rise or set.
    """
    chart = compute_chart(instant, place, settings)
    period = birth_period(
        chart.instant.jd_ut, place.latitude, place.longitude, place.altitude, settings
    )
    positions = all_upagrahas(
        chart.positions[Graha.SUN].longitude,
        period.vaara,
        night=period.is_night,
        period_start_jd=period.start_jd,
        period_end_jd=period.end_jd,
        latitude=place.latitude,
        longitude=place.longitude,
        settings=settings,
    )
    return _upagraha_out(chart, period, positions, place, settings)


def _upagraha_out(chart: Chart, period, positions, place, settings) -> dict:
    off = chart.instant.utc_offset_hours
    sun_based = {int(u) for u in SUN_BASED_UPAGRAHAS}
    return {
        **envelope(chart.instant, place, settings),
        "born_at": "night" if period.is_night else "day",
        "vaara": VAARA_NAMES[period.vaara],
        "vaara_opened_at": jd_to_local_str(period.sunrise_jd, off),
        "period": {
            "starts": jd_to_local_str(period.start_jd, off),
            "ends": jd_to_local_str(period.end_jd, off),
            "part_length_hours": round(
                (period.end_jd - period.start_jd) * 24.0 / 8.0, 6
            ),
        },
        "part_lords": [
            None if g is None else GRAHA_NAMES[g]
            for g in part_lords(period.vaara, night=period.is_night)
        ],
        "upagrahas": [
            {
                "id": u.upagraha,
                "name": u.name,
                **sign_and_degree(u.longitude),
                "house": (u.rasi - chart.lagna_rasi) % 12 + 1,
                "group": "sun_based" if u.upagraha in sun_based else "time_based",
                "part_lord": None if u.part_lord is None else GRAHA_NAMES[u.part_lord],
                "part_index": u.part_index,
                "rises_at": (
                    None if u.rise_jd is None else jd_to_local_str(u.rise_jd, off)
                ),
                "nature_like": (
                    GRAHA_NAMES[UPAGRAHA_NATURE[u.upagraha]]
                    if u.upagraha in UPAGRAHA_NATURE else None
                ),
            }
            for u in sorted(positions.values(), key=lambda x: x.upagraha)
        ],
        "note": (
            "The five Sun-based upagrahas are described in section 4.2 as very "
            "malefic. Maandi rises at the beginning of Saturn's part; the others "
            "at the middle of their ruler's part unless upagraha_rise_point is "
            "set to 'beginning' (footnote 9)."
        ),
    }


@lru_cache(maxsize=128)
def special_lagnas(instant: Instant, place: Place, settings: Settings) -> dict:
    """The four special lagnas of chapter 5.

    Raises ValueError at latitudes where the Sun does not rise or set.
    """
    chart = compute_chart(instant, place, settings)
    period = birth_period(
        chart.instant.jd_ut, place.latitude, place.longitude, place.altitude, settings
    )
    lagnas = all_special_lagnas(
        sunrise_jd=period.sunrise_jd,
        jd_ut=chart.instant.jd_ut,
        lagna_longitude=chart.lagna_longitude,
        moon_longitude=chart.positions[Graha.MOON].longitude,
        settings=settings,
    )
    off = chart.instant.utc_offset_hours
    return {
        **envelope(instant, place, settings),
        "sunrise": jd_to_local_str(period.sunrise_jd, off),
        "sun_at_sunrise": sign_and_degree(
            sun_longitude_at(period.sunrise_jd, settings)
        ),
        "minutes_since_sunrise": round(
            minutes_since(period.sunrise_jd, chart.instant.jd_ut), 6
        ),
        "lagna": sign_and_degree(chart.lagna_longitude),
        "special_lagnas": [
            {
                "id": lagna.lagna,
                "name": lagna.name,
                "abbreviation": lagna.abbreviation,
                **sign_and_degree(lagna.longitude),
                "house": (lagna.rasi - chart.lagna_rasi) % 12 + 1,
                "signifies": lagna.signifies,
                "degrees_per_minute": ADVANCE_PER_MINUTE.get(
                    SpecialLagna(lagna.lagna)
                ),
            }
            for lagna in sorted(lagnas.values(), key=lambda x: x.lagna)
        ],
        "note": (
            "Ghati Lagna moves 1.25 degrees for every minute of birthtime error "
            "(section 5.5), which makes it the most birthtime-sensitive point in "
            "the chart. Sree Lagna is derived from the Moon's nakshatra, not from "
            "elapsed time, so it carries no rate."
        ),
    }
