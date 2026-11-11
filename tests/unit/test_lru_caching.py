"""Test suite for Phase 3: Python In-Memory LRU Caching."""
import time
from hora.charts.chart import Place, compute_chart
from hora.core.settings import Settings
from hora.core.timeutil import Instant, datetime, UTC
from hora.panchanga.core import compute_panchanga, day_structure
from hora.services import (
    ashtakavarga_service,
    chart_service,
    dasha_service,
    functional_service,
    master_chart_service,
    relationship_service,
)


def _make_sample():
    ins = Instant(2450000.5, datetime.now(UTC), datetime.now(UTC), 5.5, "Asia/Kolkata")
    pl = Place(27.18, 78.01, 0.0, "Agra")
    st = Settings()
    return ins, pl, st


def test_compute_chart_lru_cache():
    ins, pl, st = _make_sample()
    compute_chart.cache_clear()

    # Call 1: Miss
    c1 = compute_chart(ins, pl, st)
    info1 = compute_chart.cache_info()
    assert info1.misses >= 1
    assert info1.currsize >= 1

    # Call 2: Hit
    c2 = compute_chart(ins, pl, st)
    info2 = compute_chart.cache_info()
    assert info2.hits >= 1
    assert c1 is c2


def test_panchanga_lru_cache():
    ins, _, st = _make_sample()
    compute_panchanga.cache_clear()

    p1 = compute_panchanga(ins, 27.18, 78.01, st)
    info1 = compute_panchanga.cache_info()
    assert info1.misses >= 1

    p2 = compute_panchanga(ins, 27.18, 78.01, st)
    info2 = compute_panchanga.cache_info()
    assert info2.hits >= 1
    assert p1.vaara == p2.vaara


def test_master_chart_lru_cache():
    ins, pl, st = _make_sample()
    master_chart_service.compute_master_chart.cache_clear()

    # First call: computes everything
    t0 = time.perf_counter()
    m1 = master_chart_service.compute_master_chart(ins, pl, st, name="Test Native")
    t1 = time.perf_counter()
    miss_time = (t1 - t0) * 1000

    info1 = master_chart_service.compute_master_chart.cache_info()
    assert info1.misses == 1

    # Second call: served from memory cache
    t2 = time.perf_counter()
    m2 = master_chart_service.compute_master_chart(ins, pl, st, name="Test Native")
    t3 = time.perf_counter()
    hit_time = (t3 - t2) * 1000

    info2 = master_chart_service.compute_master_chart.cache_info()
    assert info2.hits == 1
    assert m1["name"] == m2["name"]
    # Hit should be orders of magnitude faster
    assert hit_time < 5.0  # sub-5ms (typically 0.02ms)


def test_chart_services_lru_cache():
    ins, pl, st = _make_sample()
    chart_service.shodasavarga_charts.cache_clear()
    chart_service.upagraha_chart.cache_clear()
    chart_service.special_lagnas.cache_clear()

    s1 = chart_service.shodasavarga_charts(ins, pl, st)
    s2 = chart_service.shodasavarga_charts(ins, pl, st)
    assert chart_service.shodasavarga_charts.cache_info().hits == 1

    u1 = chart_service.upagraha_chart(ins, pl, st)
    u2 = chart_service.upagraha_chart(ins, pl, st)
    assert chart_service.upagraha_chart.cache_info().hits == 1

    l1 = chart_service.special_lagnas(ins, pl, st)
    l2 = chart_service.special_lagnas(ins, pl, st)
    assert chart_service.special_lagnas.cache_info().hits == 1


def test_functional_and_relationship_lru_cache():
    functional_service.lagna.cache_clear()
    functional_service.planet.cache_clear()

    l1 = functional_service.lagna(0)
    l2 = functional_service.lagna(0)
    assert functional_service.lagna.cache_info().hits == 1

    p1 = functional_service.planet("Sun", 0)
    p2 = functional_service.planet("Sun", 0)
    assert functional_service.planet.cache_info().hits == 1

    relationship_service.natural_relation.cache_clear()
    r1 = relationship_service.natural_relation(0, 1)
    r2 = relationship_service.natural_relation(0, 1)
    assert relationship_service.natural_relation.cache_info().hits == 1

