"""SQLite storage for Kundli Workbench saved charts.

Preserves exact backwards compatibility with pre-existing databases while
enabling high-performance unified persistence inside the FastAPI service.
"""
from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any


def get_db_path() -> Path:
    """Resolve database path, checking environment, server/data, or project data."""
    env_path = os.getenv("HORA_DB_PATH")
    if env_path:
        return Path(env_path).resolve()

    project_root = Path(__file__).resolve().parent.parent.parent.parent
    server_db = project_root / "server" / "data" / "kundli-workbench.db"
    if server_db.exists():
        return server_db

    local_db = project_root / "data" / "kundli-workbench.db"
    local_db.parent.mkdir(parents=True, exist_ok=True)
    return local_db


def get_connection() -> sqlite3.Connection:
    """Return a configured connection with row factory."""
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize tables and run safe column migrations."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS charts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                birth_data TEXT,
                payload TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Ensure birth_data column exists in legacy schemas
        cur = conn.execute("PRAGMA table_info(charts)")
        columns = [row["name"] for row in cur.fetchall()]
        if "birth_data" not in columns:
            conn.execute("ALTER TABLE charts ADD COLUMN birth_data TEXT")
        conn.commit()


def get_charts() -> list[dict[str, Any]]:
    """Return all saved charts ordered by creation time descending."""
    with get_connection() as conn:
        cur = conn.execute("SELECT id, name, birth_data, payload FROM charts ORDER BY created_at DESC")
        rows = cur.fetchall()

    charts: list[dict[str, Any]] = []
    for row in rows:
        payload: dict[str, Any] = {}
        birth_data: dict[str, Any] | None = None
        if row["payload"]:
            try:
                payload = json.loads(row["payload"])
            except Exception:
                payload = {}
        if row["birth_data"]:
            try:
                birth_data = json.loads(row["birth_data"])
            except Exception:
                birth_data = None

        charts.append({
            **payload,
            "id": row["id"],
            "name": row["name"],
            "birthData": birth_data or payload.get("birthData"),
        })
    return charts


def get_chart(chart_id: int) -> dict[str, Any] | None:
    """Return a single saved chart by its integer ID."""
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT id, name, birth_data, payload FROM charts WHERE id = ?",
            (chart_id,),
        )
        row = cur.fetchone()

    if not row:
        return None

    payload: dict[str, Any] = {}
    birth_data: dict[str, Any] | None = None
    if row["payload"]:
        try:
            payload = json.loads(row["payload"])
        except Exception:
            payload = {}
    if row["birth_data"]:
        try:
            birth_data = json.loads(row["birth_data"])
        except Exception:
            birth_data = None

    return {
        **payload,
        "id": row["id"],
        "name": row["name"],
        "birthData": birth_data or payload.get("birthData"),
    }


def save_chart(name: str, birth_data: dict[str, Any], payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Insert a new chart and return the persisted domain object."""
    birth_data_json = json.dumps(birth_data)
    payload_json = json.dumps(payload) if payload else None

    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO charts (name, birth_data, payload) VALUES (?, ?, ?)",
            (name, birth_data_json, payload_json),
        )
        conn.commit()
        chart_id = cur.lastrowid

    return {
        **(payload or {}),
        "id": chart_id,
        "name": name,
        "birthData": birth_data,
    }


def update_chart(chart_id: int, payload: dict[str, Any]) -> bool:
    """Update payload JSON for an existing chart."""
    payload_json = json.dumps(payload)
    with get_connection() as conn:
        cur = conn.execute(
            "UPDATE charts SET payload = ? WHERE id = ?",
            (payload_json, chart_id),
        )
        conn.commit()
        return cur.rowcount > 0


def delete_chart(chart_id: int) -> bool:
    """Delete a chart by its ID."""
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM charts WHERE id = ?", (chart_id,))
        conn.commit()
        return cur.rowcount > 0

