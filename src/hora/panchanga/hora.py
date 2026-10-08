"""Hora — the planetary hour (book section 1.3.11).

The period from one sunrise to the next is divided into 24 equal parts. The
first belongs to the lord of the weekday; the rest follow the classical order
of decreasing apparent speed, Saturn to Moon, cycling.

Note that a hora is 1/24 of the *actual* sunrise-to-sunrise interval, so it is
only approximately an hour.
"""
from __future__ import annotations

from dataclasses import dataclass

from hora.core.const import GRAHA_NAMES, HORA_LORD_ORDER, VAARA_LORD


@dataclass(frozen=True, slots=True)
class Hora:
    """One planetary hour."""

    index: int          # 1..24 from sunrise
    lord: int
    lord_name: str
    start_jd: float
    end_jd: float


def hora_lord(vaara: int, index: int) -> int:
    """Lord of the ``index``-th hora (1-based) on a weekday.

    The weekday lord takes the first hora, so the cycle is entered at that
    lord's position in the speed-ordered list.
    """
    if not 1 <= index <= 24:
        raise ValueError("hora index must be between 1 and 24")
    start = HORA_LORD_ORDER.index(VAARA_LORD[vaara])
    return int(HORA_LORD_ORDER[(start + index - 1) % 7])


def hora_at(jd_ut: float, sunrise: float, next_sunrise: float, vaara: int) -> Hora:
    """The hora running at an instant."""
    span = (next_sunrise - sunrise) / 24.0
    elapsed = jd_ut - sunrise
    index = max(1, min(int(elapsed // span) + 1, 24))
    lord = hora_lord(vaara, index)
    start = sunrise + (index - 1) * span
    return Hora(index=index, lord=lord, lord_name=GRAHA_NAMES[lord],
                start_jd=start, end_jd=start + span)


def horas_of_day(sunrise: float, next_sunrise: float, vaara: int) -> list[Hora]:
    """All 24 horas of a day."""
    span = (next_sunrise - sunrise) / 24.0
    out = []
    for i in range(1, 25):
        lord = hora_lord(vaara, i)
        start = sunrise + (i - 1) * span
        out.append(Hora(index=i, lord=lord, lord_name=GRAHA_NAMES[lord],
                        start_jd=start, end_jd=start + span))
    return out
