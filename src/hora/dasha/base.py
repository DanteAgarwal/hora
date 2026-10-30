"""Shared dasha machinery.

Every nakshatra-based dasha (Vimshottari, Ashtottari, Yogini, Shodasottari and
the rest) is the same algorithm with a different lord cycle, different period
lengths and a different rule for which nakshatra starts the cycle.  That
skeleton lives here; the individual systems are thin descriptors.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from hora.core import validate
from hora.core.const import (
    CIVIL_YEAR_DAYS,
    GRAHA_NAMES,
    NAKSHATRA_NAMES,
    NAKSHATRA_SPAN,
    RASI_NAMES,
    SAVANA_YEAR_DAYS,
    SIDEREAL_YEAR_DAYS,
    TROPICAL_YEAR_DAYS,
    VARIATION_CHOICE,
)
from hora.core.settings import DashaYearLength

_YEAR_DAYS = {
    DashaYearLength.SIDEREAL: SIDEREAL_YEAR_DAYS,
    DashaYearLength.TROPICAL: TROPICAL_YEAR_DAYS,
    DashaYearLength.CIVIL: CIVIL_YEAR_DAYS,
    DashaYearLength.SAVANA: SAVANA_YEAR_DAYS,
}


def year_days(mode: DashaYearLength) -> float:
    return _YEAR_DAYS[mode]


@dataclass(frozen=True, slots=True)
class DashaPeriod:
    """One period at any level of the hierarchy."""

    lord: int
    lord_name: str
    level: int              # 1 = mahadasha, 2 = antardasha, ...
    start_jd: float
    end_jd: float
    children: list[DashaPeriod] = field(default_factory=list)

    @property
    def duration_days(self) -> float:
        return self.end_jd - self.start_jd


@dataclass(frozen=True, slots=True)
class NakshatraDashaSpec:
    """Descriptor for a nakshatra-based dasha system."""

    key: str
    display_name: str
    #: Lords in cycle order.
    order: tuple[int, ...]
    #: Period length in years, parallel to ``order``.
    years: tuple[float, ...]
    #: How the starting lord is chosen from the Moon's longitude. ``mod``
    #: walks ``order`` by ``nakshatra % len(order)``, which assumes every lord
    #: covers the same span. ``arcs`` reads ``arc_starts`` instead, for a
    #: system whose lords cover unequal arcs — see §17.2.1 and Table 39.
    start_rule: str = "mod"
    #: Start degree of each lord's arc, parallel to ``order``. Required when
    #: ``start_rule`` is ``arcs``; the arcs are contiguous and wrap 0°.
    arc_starts: tuple[float, ...] = ()
    #: Where a period's first sub-period starts. Vimsottari begins each
    #: mahadasa's antardasas on the dasa lord himself (§16.3). Ashtottari
    #: begins on "the planet that comes in the table *after* the dasa lord"
    #: and ends on the lord (§17.2.2), so the whole run is rotated by one.
    sub_periods_start_after_lord: bool = False
    #: Nakshatra count the cycle is laid over — 27 for most, 28 when
    #: Abhijit is included (Ashtottari, Yogini variants).
    nakshatra_count: int = 27

    @property
    def total_years(self) -> float:
        return sum(self.years)


def _sub_periods(
    spec: NakshatraDashaSpec,
    lord: int,
    start_jd: float,
    span_days: float,
    level: int,
    max_level: int,
) -> list[DashaPeriod]:
    """Recursively divide a period among all lords, starting from ``lord``.

    Each sub-period takes the same proportion of its parent that the sub-lord's
    period takes of the whole cycle — the standard proportional rule.
    """
    if level > max_level:
        return []
    idx = spec.order.index(lord)
    if spec.sub_periods_start_after_lord:
        idx = (idx + 1) % len(spec.order)
    total = spec.total_years
    out: list[DashaPeriod] = []
    cursor = start_jd
    for k in range(len(spec.order)):
        sub_lord = spec.order[(idx + k) % len(spec.order)]
        sub_years = spec.years[(idx + k) % len(spec.order)]
        sub_days = span_days * sub_years / total
        period = DashaPeriod(
            lord=int(sub_lord),
            lord_name=GRAHA_NAMES[sub_lord],
            level=level,
            start_jd=cursor,
            end_jd=cursor + sub_days,
            children=_sub_periods(spec, sub_lord, cursor, sub_days, level + 1, max_level),
        )
        out.append(period)
        cursor = period.end_jd
    return out


def expand_sub_periods(
    spec: NakshatraDashaSpec,
    parent_lord: int | str,
    start_jd: float,
    end_jd: float,
    parent_level: int = 1,
    target_level: int = 2,
) -> list[DashaPeriod]:
    """Expand a dasha period into its sub-periods down to target_level."""
    if isinstance(parent_lord, str):
        clean = parent_lord.strip().lower()
        lord_id = next((g for g in spec.order if GRAHA_NAMES[g].lower() == clean), None)
        if lord_id is None:
            lord_id = next((k for k, v in GRAHA_NAMES.items() if str(v).lower() == clean), spec.order[0])
    else:
        lord_id = int(parent_lord)

    span_days = end_jd - start_jd
    if span_days <= 0 or target_level <= parent_level:
        return []
    return _sub_periods(spec, lord_id, start_jd, span_days, parent_level + 1, target_level)


def compute_nakshatra_dasha(
    spec: NakshatraDashaSpec,
    moon_longitude: float,
    birth_jd: float,
    year_length: DashaYearLength,
    *,
    levels: int = 2,
    cycles: int = 1,
    start_star: int = 1,
) -> list[DashaPeriod]:
    """Build the dasha tree from the Moon's longitude at birth.

    The first mahadasha is truncated: the elapsed fraction of the Moon's
    nakshatra is the fraction of that dasha already consumed at birth.  Its
    sub-periods are still laid out over the *full* mahadasha, so that antardashas
    running at birth are reported with their true boundaries — this is what
    JHora does, and it is why the first mahadasha's children can start before
    the birth moment.

    :param start_star: which constellation from the Moon's begins the cycle,
        counted inclusively. 1 is the Moon's own and the default; §16.4.1
        allows the 4th, 5th and 8th — the kshema, utpanna and adhana stars.
        The fraction left at birth always comes from the Moon's own star
        whichever is chosen, so only the lord and the sequence move.
    """
    days_per_year = year_days(year_length)
    lon = moon_longitude % 360.0
    n = len(spec.order)

    if spec.start_rule == "arcs":
        if start_star != 1:
            raise ValueError(
                f"{spec.display_name} lays its lords over unequal arcs, so "
                f"§16.4.1's 4th/5th/8th-star variations do not apply to it")
        start_index, remaining = _arc_index(spec, lon)
        elapsed_fraction = 1.0 - remaining
    else:
        nak = int(lon // NAKSHATRA_SPAN)
        elapsed_fraction = (lon - nak * NAKSHATRA_SPAN) / NAKSHATRA_SPAN
        start_index = (
            nak + validate.in_range("start_star", start_star, 1, 27) - 1) % n
    first_years = spec.years[start_index]

    # Wind back to the notional start of the running mahadasha.
    cursor = birth_jd - elapsed_fraction * first_years * days_per_year

    periods: list[DashaPeriod] = []
    for _cycle in range(cycles):
        for k in range(n):
            i = (start_index + k) % n
            lord = spec.order[i]
            span = spec.years[i] * days_per_year
            periods.append(
                DashaPeriod(
                    lord=int(lord),
                    lord_name=GRAHA_NAMES[lord],
                    level=1,
                    start_jd=cursor,
                    end_jd=cursor + span,
                    children=_sub_periods(spec, lord, cursor, span, 2, levels),
                )
            )
            cursor += span
    return periods


def _arc_index(spec: NakshatraDashaSpec, longitude: float) -> tuple[int, float]:
    """Which of §17.2.1's arcs holds this longitude, and how much of it is left.

    The arcs are unequal and the last wraps 0°, so this walks them rather than
    dividing. Returns the index into ``spec.order`` and the fraction of that
    arc still ahead of the Moon.
    """
    lon = longitude % 360.0
    starts = spec.arc_starts
    for i, start in enumerate(starts):
        end = starts[(i + 1) % len(starts)]
        inside = (start <= lon < end) if start < end else (lon >= start or lon < end)
        if inside:
            span = (end - start) % 360.0
            travelled = (lon - start) % 360.0
            return i, 1.0 - travelled / span
    raise ValueError(f"no arc holds longitude {longitude}")


def balance_at_birth(
    spec: NakshatraDashaSpec, moon_longitude: float, start_star: int = 1
) -> tuple[int, float]:
    """Lord of the birth mahadasha and the years of it remaining at birth.

    :param start_star: see :func:`compute_nakshatra_dasha`. §16.4.1 keeps the
        fraction from the Moon's own star and moves only the lord, so the
        balance is that lord's dasa length times the same fraction.
    """
    lon = moon_longitude % 360.0
    if spec.start_rule == "arcs":
        if start_star != 1:
            raise ValueError(
                f"{spec.display_name} lays its lords over unequal arcs, so "
                f"§16.4.1's 4th/5th/8th-star variations do not apply to it")
        i, remaining_fraction = _arc_index(spec, lon)
        return int(spec.order[i]), spec.years[i] * remaining_fraction

    nak = int(lon // NAKSHATRA_SPAN)
    i = (nak + validate.in_range("start_star", start_star, 1, 27) - 1) % len(spec.order)
    remaining_fraction = 1.0 - (lon - nak * NAKSHATRA_SPAN) / NAKSHATRA_SPAN
    return int(spec.order[i]), spec.years[i] * remaining_fraction


def find_running(periods: list[DashaPeriod], jd: float) -> list[DashaPeriod]:
    """Walk the tree returning the chain of periods active at ``jd``."""
    chain: list[DashaPeriod] = []
    level = periods
    while level:
        match = next((p for p in level if p.start_jd <= jd < p.end_jd), None)
        if match is None:
            break
        chain.append(match)
        level = match.children
    return chain


@dataclass(frozen=True, slots=True)
class VariationSign:
    """Which sign a variation's starting star falls in, and how that was fixed."""

    star: int
    nakshatra: int
    nakshatra_name: str
    rasi: int
    rasi_name: str
    spans_two_signs: bool
    reason: str


def variation_sign(moon_longitude: float, star: int) -> VariationSign:
    """§16.5.2's sign for one starting star, counted inclusively from Moon's.

    A nakshatra is 13°20' and a sign 30°, so a star can straddle two signs.
    The section resolves that by pada: "If the 5th star spans across 2 signs,
    take the sign containing the same quarter as occupied by Moon in
    birthstar." So the Moon's own pada picks which half of the star to read,
    not the star's midpoint or its start.

    :param moon_longitude: sidereal longitude of the Moon.
    :param star: 1 for the Moon's own star, 4, 5 or 8 for the variations.
    """
    lon = moon_longitude % 360.0
    birth_star = int(lon // NAKSHATRA_SPAN)
    quarter = NAKSHATRA_SPAN / 4
    pada = int((lon - birth_star * NAKSHATRA_SPAN) / quarter) + 1

    index = (birth_star + validate.in_range("star", star, 1, 27) - 1) % 27
    start = index * NAKSHATRA_SPAN
    first, last = int(start // 30), int((start + NAKSHATRA_SPAN - 1e-9) // 30)

    if first == last:
        rasi = first
        reason = f"{NAKSHATRA_NAMES[index]} lies wholly in {RASI_NAMES[rasi]}"
    else:
        rasi = int((start + (pada - 1) * quarter) // 30)
        reason = (
            f"{NAKSHATRA_NAMES[index]} spans {RASI_NAMES[first]} and "
            f"{RASI_NAMES[last]}; the Moon is in pada {pada} of its own star, "
            f"and that pada of {NAKSHATRA_NAMES[index]} is in {RASI_NAMES[rasi]}"
        )
    return VariationSign(
        star=int(star), nakshatra=index, nakshatra_name=NAKSHATRA_NAMES[index],
        rasi=rasi, rasi_name=RASI_NAMES[rasi],
        spans_two_signs=first != last, reason=reason,
    )


def variation_candidates(moon_longitude: float, purpose: str) -> list[VariationSign]:
    """The signs §16.5.2 says to compare, for one purpose.

    General results weigh the Moon's sign against the 5th star's; longevity
    weighs the Moon's against the 4th and 8th. The section gives no way to
    settle which sign wins — "There are no clear guidelines in the literature
    to compare the strengths" — so this returns the candidates and stops.
    """
    choice = VARIATION_CHOICE.get(purpose)
    if choice is None:
        raise ValueError(
            f"purpose must be 'general' or 'longevity', got {purpose!r}")
    return [variation_sign(moon_longitude, s) for s in choice["compare"]]
