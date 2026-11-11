"""Panchanga — the five limbs, plus sunrise-relative day structure.

JHora computes the panchanga for a *day*, anchored at sunrise, and reports the
element current at sunrise together with the time it ends.  When an element
ends and its successor also ends before the next sunrise, both are listed;
that is reproduced here by walking forward until the next sunrise is passed.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import swisseph as swe

from hora.core.const import (
    ABHIJIT_END,
    ABHIJIT_START,
    NAKSHATRA_SPAN,
    TITHI_LORD,
    VAARA_LORD,
    VAARA_NAMES,
    Graha,
)
from hora.core.ephemeris import get_ephemeris
from hora.core.names import NameScheme
from hora.core.names import name as lookup_name
from hora.core.settings import Settings
from hora.core.timeutil import Instant, norm360
from hora.panchanga.calendar import LunarMonth, SolarDate, lunar_months, solar_date
from hora.panchanga.hora import Hora, hora_at
from hora.panchanga.solver import solve_angle_crossing

#: Angular span of each element, in degrees.
TITHI_SPAN = 12.0
KARANA_SPAN = 6.0
YOGA_SPAN = NAKSHATRA_SPAN


@dataclass(frozen=True, slots=True)
class Element:
    """One panchanga limb: which one it is and when it ends.

    ``index`` is 0-based for programmatic use; ``number`` is the 1-based value
    the book and every almanac print (tithi 1-30, yoga 1-27).
    """

    index: int
    number: int
    name: str
    name_standard: str
    end_jd: float | None
    lord: int | None = None


@dataclass(frozen=True, slots=True)
class DayStructure:
    """Sunrise-anchored skeleton of a day."""

    sunrise: float
    sunset: float
    next_sunrise: float
    moonrise: float | None
    moonset: float | None
    day_length: float       # in days
    night_length: float


@dataclass(frozen=True, slots=True)
class Panchanga:
    instant: Instant
    day: DayStructure
    vaara: int
    vaara_name: str
    vaara_lord: int
    tithis: list[Element]
    nakshatras: list[Element]
    yogas: list[Element]
    karanas: list[Element]
    sun_longitude: float
    moon_longitude: float
    #: 0 = sukla (waxing), 1 = krishna (waning).
    paksha: int
    paksha_name: str
    #: Nakshatra under the 28-fold scheme, or None when outside Abhijit.
    abhijit_active: bool
    hora: Hora
    lunar_months: dict[str, LunarMonth]
    solar_date: SolarDate


class _Angles:
    """Lazily-evaluated Sun/Moon angles at arbitrary JD, memoised per instance."""

    def __init__(self, settings: Settings) -> None:
        self._eph = get_ephemeris(settings)
        self._cache: dict[float, tuple[float, float]] = {}

    def _pair(self, jd: float) -> tuple[float, float]:
        hit = self._cache.get(jd)
        if hit is None:
            pos = self._eph.positions(jd, (Graha.SUN, Graha.MOON))
            hit = (pos[Graha.SUN].longitude, pos[Graha.MOON].longitude)
            self._cache[jd] = hit
        return hit

    def elongation(self, jd: float) -> float:
        """Moon minus Sun — drives tithi and karana."""
        sun, moon = self._pair(jd)
        return norm360(moon - sun)

    def moon(self, jd: float) -> float:
        return self._pair(jd)[1]

    def sum(self, jd: float) -> float:
        """Sun plus Moon — drives yoga."""
        sun, moon = self._pair(jd)
        return norm360(sun + moon)


# --------------------------------------------------------------------------
# Pure limb arithmetic
#
# These are the definitions from book sections 1.3.8 (tithi), 1.3.9 (yoga) and
# 1.3.10 (karana). Everything else in this module builds on them, and the
# book's worked examples are tested through them, so a wrong formula cannot
# hide behind a test that re-derives it.
# --------------------------------------------------------------------------


def tithi_at(sun_longitude: float, moon_longitude: float) -> int:
    """1-based tithi (1..30) for a pair of longitudes.

    Book 1.3.8: divide (Moon - Sun) by 12 degrees, take the quotient, add 1.
    """
    return int(norm360(moon_longitude - sun_longitude) // TITHI_SPAN) + 1


def paksha_at(sun_longitude: float, moon_longitude: float) -> int:
    """0 = sukla (Moon 0-180 ahead), 1 = krishna (180-360)."""
    return 0 if norm360(moon_longitude - sun_longitude) < 180.0 else 1


def yoga_at(sun_longitude: float, moon_longitude: float) -> int:
    """1-based Sun-Moon yoga (1..27).

    Book 1.3.9: add the longitudes, divide by one nakshatra span, add 1.
    """
    return int(norm360(sun_longitude + moon_longitude) // YOGA_SPAN) + 1


def karana_at(sun_longitude: float, moon_longitude: float) -> int:
    """1-based karana (1..60) — the half-tithi."""
    return int(norm360(moon_longitude - sun_longitude) // KARANA_SPAN) + 1


def _element(table: str, idx: int, scheme: NameScheme, end: float | None, lord: int | None) -> Element:
    return Element(
        index=idx,
        number=idx + 1,
        name=lookup_name(table, idx, scheme),
        name_standard=lookup_name(table, idx, NameScheme.STANDARD),
        end_jd=end,
        lord=lord,
    )


def _walk(
    angle_fn,
    span: float,
    table: str,
    jd_start: float,
    jd_until: float,
    *,
    count: int,
    scheme: NameScheme,
    lords: list | None = None,
) -> list[Element]:
    """List every element active between ``jd_start`` and ``jd_until``.

    Always returns at least the element current at ``jd_start``, matching how
    JHora prints "the tithi at sunrise" plus any that also end during the day.
    """
    out: list[Element] = []
    jd = jd_start
    for _ in range(6):  # a day never contains more than a couple of boundaries
        idx = int(angle_fn(jd) // span) % count
        target = ((idx + 1) * span) % 360.0
        # A boundary is at most ~1.3 days away for the slowest limb (yoga).
        end = solve_angle_crossing(angle_fn, target, jd, jd + 2.0)
        lord = int(lords[idx]) if lords is not None else None
        out.append(_element(table, idx, scheme, end, lord))
        if end is None or end >= jd_until:
            break
        jd = end + 1e-6
    return out


@lru_cache(maxsize=256)
def day_structure(instant: Instant, latitude: float, longitude: float, altitude: float, settings: Settings) -> DayStructure:
    """Sunrise, sunset and the following sunrise for the local day."""
    eph = get_ephemeris(settings)
    # Search from local midnight so the "day" is the one the caller means.
    local_midnight_jd = instant.jd_ut - (instant.local.hour * 3600 + instant.local.minute * 60 + instant.local.second) / 86400.0
    sunrise = eph.sunrise(local_midnight_jd, latitude, longitude, altitude)
    if sunrise is None:
        raise ValueError("no sunrise at this latitude/date (polar day or night)")
    sunset = eph.sunset(sunrise, latitude, longitude, altitude)
    next_sunrise = eph.sunrise(sunrise + 0.5, latitude, longitude, altitude)
    if sunset is None or next_sunrise is None:
        raise ValueError("no sunset at this latitude/date (polar day or night)")
    return DayStructure(
        sunrise=sunrise,
        sunset=sunset,
        next_sunrise=next_sunrise,
        moonrise=eph.body_rise(local_midnight_jd, swe.MOON, latitude, longitude, altitude),
        moonset=eph.body_rise(local_midnight_jd, swe.MOON, latitude, longitude, altitude, setting=True),
        day_length=sunset - sunrise,
        night_length=next_sunrise - sunset,
    )


@lru_cache(maxsize=256)
def compute_panchanga(
    instant: Instant,
    latitude: float,
    longitude: float,
    settings: Settings,
    altitude: float = 0.0,
) -> Panchanga:
    """Full panchanga for the day containing ``instant``."""
    day = day_structure(instant, latitude, longitude, altitude, settings)
    ang = _Angles(settings)

    # The weekday changes at sunrise, not midnight.
    y, m, d, _ = swe.revjul(day.sunrise + instant.utc_offset_hours / 24.0, swe.GREG_CAL)
    vaara = int(swe.day_of_week(swe.julday(y, m, d, 12.0, swe.GREG_CAL)) + 1) % 7

    scheme = settings.name_scheme
    elong_now = ang.elongation(instant.jd_ut)
    paksha = paksha_at(0.0, elong_now)
    moon_now = ang.moon(instant.jd_ut)

    return Panchanga(
        instant=instant,
        day=day,
        vaara=vaara,
        vaara_name=VAARA_NAMES[vaara],
        vaara_lord=int(VAARA_LORD[vaara]),
        tithis=_walk(ang.elongation, TITHI_SPAN, "tithi", day.sunrise, day.next_sunrise,
                     count=30, scheme=scheme, lords=TITHI_LORD),
        nakshatras=_walk(ang.moon, NAKSHATRA_SPAN, "nakshatra", day.sunrise, day.next_sunrise,
                         count=27, scheme=scheme),
        yogas=_walk(ang.sum, YOGA_SPAN, "yoga", day.sunrise, day.next_sunrise,
                    count=27, scheme=scheme),
        karanas=_karanas(ang, day, scheme),
        sun_longitude=ang._pair(instant.jd_ut)[0],
        moon_longitude=moon_now,
        paksha=paksha,
        paksha_name=lookup_name("paksha", paksha, scheme),
        abhijit_active=ABHIJIT_START <= moon_now < ABHIJIT_END,
        hora=hora_at(instant.jd_ut, day.sunrise, day.next_sunrise, vaara),
        lunar_months=lunar_months(instant.jd_ut, settings),
        solar_date=solar_date(instant.jd_ut, settings),
    )


#: The 60 half-tithis map onto 11 karana names: 7 movable repeat 8 times
#: between the fixed Kimstughna at the start and the three fixed ones at the end.
def _karana_slot(index: int) -> int:
    """Map a half-tithi index (0-59) onto one of the 11 karana names."""
    if index == 0:
        return 10                          # Kimstughna
    if index >= 57:
        return 7 + (index - 57)            # Sakuna, Chatushpada, Naga
    return (index - 1) % 7


def _karana_name(index: int, scheme: NameScheme = NameScheme.BOOK) -> str:
    return lookup_name("karana", _karana_slot(index), scheme)


def _karanas(ang: _Angles, day: DayStructure, scheme: NameScheme) -> list[Element]:
    out: list[Element] = []
    jd = day.sunrise
    for _ in range(6):
        idx = int(ang.elongation(jd) // KARANA_SPAN) % 60
        target = ((idx + 1) * KARANA_SPAN) % 360.0
        end = solve_angle_crossing(ang.elongation, target, jd, jd + 2.0)
        slot = _karana_slot(idx)
        out.append(Element(
            index=idx,
            number=idx + 1,
            name=lookup_name("karana", slot, scheme),
            name_standard=lookup_name("karana", slot, NameScheme.STANDARD),
            end_jd=end,
            lord=None,
        ))
        if end is None or end >= day.next_sunrise:
            break
        jd = end + 1e-6
    return out
