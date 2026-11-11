"""Full natal chart assembly.

:func:`compute_chart` is the single entry point the API layer uses: birth data
plus settings in, a fully populated :class:`Chart` out.  Everything downstream
(dashas, balas, yogas, transits) consumes a ``Chart``.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache

from hora.charts.bhava import Bhava, build_bhavas, classify_house, house_of
from hora.charts.dignity import (
    Combustion,
    combustion,
    dignity_with_relations,
    graha_yuddha,
)
from hora.charts.vargas import VargaPosition, varga
from hora.core.const import (
    GRAHA_NAMES,
    NAKSHATRA_NAMES,
    NAKSHATRA_SPAN,
    NAVAGRAHA,
    PADA_SPAN,
    RASI_LORD,
    RASI_NAMES,
    Graha,
)
from hora.core.ephemeris import get_ephemeris
from hora.core.ephemeris.base import Houses, PlanetPosition
from hora.core.settings import Settings
from hora.core.timeutil import Instant


@dataclass(frozen=True, slots=True)
class Place:
    """An observation point on the Earth."""

    latitude: float
    longitude: float
    altitude: float = 0.0
    name: str | None = None


@dataclass(frozen=True, slots=True)
class GrahaState:
    """Everything the chart knows about one graha."""

    graha: int
    name: str
    longitude: float
    latitude: float
    speed: float
    retrograde: bool
    rasi: int
    rasi_name: str
    degrees_in_rasi: float
    nakshatra: int
    nakshatra_name: str
    pada: int
    house: int
    house_labels: list[str]
    dignity: str
    combust: bool
    combustion_orb: float
    lord_of_houses: list[int]


@dataclass(frozen=True, slots=True)
class Chart:
    """A computed natal chart."""

    instant: Instant
    place: Place
    settings: Settings
    ayanamsa: float
    houses: Houses
    bhavas: list[Bhava]
    lagna_longitude: float
    lagna_rasi: int
    positions: dict[int, PlanetPosition]
    grahas: dict[int, GrahaState]
    planetary_war: list[tuple[int, int, int]] = field(default_factory=list)

    # -- convenience -------------------------------------------------------

    def rasi_of(self, graha: int) -> int:
        return self.positions[graha].rasi

    def house_of_graha(self, graha: int) -> int:
        return self.grahas[graha].house

    def grahas_in_rasi(self, rasi: int) -> list[int]:
        return [g for g, p in self.positions.items() if p.rasi == rasi]

    def lord_of_house(self, house: int) -> int:
        """Sign lord of the whole-sign house counted from the lagna."""
        return int(RASI_LORD[(self.lagna_rasi + house - 1) % 12])

    def varga_chart(self, code: str, variant: str | None = None) -> dict[int, VargaPosition]:
        """Divisional positions of every graha plus the lagna (key ``-1``)."""
        out = {g: varga(p.longitude, code, variant) for g, p in self.positions.items()}
        out[-1] = varga(self.lagna_longitude, code, variant)
        return out


def nakshatra_of(longitude: float) -> tuple[int, int]:
    """Nakshatra index (0-26) and pada (1-4) of a longitude."""
    lon = longitude % 360.0
    nak = int(lon // NAKSHATRA_SPAN)
    pada = int((lon - nak * NAKSHATRA_SPAN) // PADA_SPAN) + 1
    return nak, pada


@lru_cache(maxsize=256)
def _cached_compute_chart(
    instant: Instant,
    place: Place,
    settings: Settings,
    grahas: tuple[int, ...] | None = None,
) -> Chart:
    """Compute a natal chart for an instant and place."""
    eph = get_ephemeris(settings)
    if settings.topocentric:
        eph.set_observer(place.latitude, place.longitude, place.altitude)

    bodies = grahas or (
        tuple(NAVAGRAHA) + (Graha.URANUS, Graha.NEPTUNE, Graha.PLUTO)
        if settings.include_outer_planets else tuple(NAVAGRAHA)
    )
    positions = eph.positions(instant.jd_ut, bodies)
    houses = eph.houses(instant.jd_ut, place.latitude, place.longitude)
    bhavas = build_bhavas(houses, settings.house_system)
    lagna_rasi = int(houses.ascendant // 30.0)

    # Lordship is reported per graha so callers do not have to invert the map.
    owns: dict[int, list[int]] = {int(g): [] for g in bodies}
    for house in range(1, 13):
        lord = int(RASI_LORD[(lagna_rasi + house - 1) % 12])
        if lord in owns:
            owns[lord].append(house)

    states: dict[int, GrahaState] = {}
    for g, p in positions.items():
        nak, pada = nakshatra_of(p.longitude)
        house = house_of(p.longitude, bhavas)
        comb: Combustion = combustion(g, positions)
        states[g] = GrahaState(
            graha=int(g),
            name=GRAHA_NAMES[g],
            longitude=p.longitude,
            latitude=p.latitude,
            speed=p.speed_longitude,
            retrograde=p.is_retrograde,
            rasi=p.rasi,
            rasi_name=RASI_NAMES[p.rasi],
            degrees_in_rasi=p.degrees_in_rasi,
            nakshatra=nak,
            nakshatra_name=NAKSHATRA_NAMES[nak],
            pada=pada,
            house=house,
            house_labels=classify_house(house),
            dignity=dignity_with_relations(g, positions),
            combust=comb.combust,
            combustion_orb=comb.separation,
            lord_of_houses=owns.get(int(g), []),
        )

    return Chart(
        instant=instant,
        place=place,
        settings=settings,
        ayanamsa=eph.ayanamsa(instant.jd_ut),
        houses=houses,
        bhavas=bhavas,
        lagna_longitude=houses.ascendant,
        lagna_rasi=lagna_rasi,
        positions=positions,
        grahas=states,
        planetary_war=graha_yuddha(positions),
    )


def compute_chart(
    instant: Instant,
    place: Place,
    settings: Settings,
    *,
    grahas: tuple[int, ...] | None = None,
) -> Chart:
    """Compute a natal chart for an instant and place."""
    if grahas is not None and not isinstance(grahas, tuple):
        grahas = tuple(grahas)
    return _cached_compute_chart(instant, place, settings, grahas)


compute_chart.cache_info = _cached_compute_chart.cache_info
compute_chart.cache_clear = _cached_compute_chart.cache_clear
