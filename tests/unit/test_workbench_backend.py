"""Test suite for Consolidated FastAPI Backend & SQLite CRUD."""
from fastapi.testclient import TestClient
from hora.api.main import app

client = TestClient(app)


def test_workbench_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["hora_status"] == "ok"
    assert "db" in data


def test_workbench_get_charts():
    response = client.get("/api/charts")
    assert response.status_code == 200
    charts = response.json()
    assert isinstance(charts, list)
    assert len(charts) >= 1


def test_workbench_compute():
    payload = {
        "name": "Integration Test Native",
        "year": 1995,
        "month": 8,
        "day": 24,
        "hour": 10,
        "minute": 30,
        "second": 0,
        "tz_name": "Asia/Kolkata",
        "place": {
            "name": "Agra",
            "latitude": 27.1767,
            "longitude": 78.0081,
        },
    }
    response = client.post("/api/compute", json=payload)
    assert response.status_code == 200
    chart = response.json()
    assert chart["name"] == "Integration Test Native"
    assert "Libra" in chart["lagna"]
    assert len(chart["planets"]) == 9
    assert len(chart["houses"]) == 12
    assert chart["shadbala"]["strongestPlanet"] == "Mars"
    assert "dashas" in chart
    assert "vargas" in chart


def test_workbench_crud_lifecycle():
    birth_data = {
        "year": 1980,
        "month": 5,
        "day": 15,
        "hour": 14,
        "minute": 20,
        "second": 0,
        "tz_name": "Asia/Kolkata",
        "place": {
            "name": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
    }
    # 1. Create
    create_resp = client.post("/api/charts", json={"name": "Lifecycle Chart", "birthData": birth_data})
    assert create_resp.status_code == 201
    created = create_resp.json()
    chart_id = created["id"]
    assert created["name"] == "Lifecycle Chart"

    # 2. Read single
    get_resp = client.get(f"/api/charts/{chart_id}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["id"] == chart_id
    assert fetched["name"] == "Lifecycle Chart"

    # 3. Delete
    del_resp = client.delete(f"/api/charts/{chart_id}")
    assert del_resp.status_code == 200
    assert del_resp.json() == {"ok": True}

    # 4. Read after delete -> 404
    del_check = client.get(f"/api/charts/{chart_id}")
    assert del_check.status_code == 404


def test_workbench_dasha_expand():
    body = {
        "parent": {
            "lord": "Jupiter",
            "level": 1,
            "start_jd": 2450000.5,
            "end_jd": 2455844.5,
        },
        "targetLevel": 2,
    }
    response = client.post("/api/dasha/expand", json=body)
    assert response.status_code == 200
    data = response.json()
    assert len(data.get("subperiods", [])) == 9
    assert data["subperiods"][0]["level"] == 2


def test_workbench_spa_fallback():
    # Test that SPA routes serve HTML
    resp_root = client.get("/")
    assert resp_root.status_code == 200
    assert "<!doctype html>" in resp_root.text.lower()

    resp_vargas = client.get("/vargas")
    assert resp_vargas.status_code == 200
    assert "<!doctype html>" in resp_vargas.text.lower()

