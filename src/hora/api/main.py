"""FastAPI application.

Calculation only — no persistence, no rendering.  Every endpoint is a pure
function of its request body, which makes the benchmark harness able to replay
requests against both this service and recorded JHora output.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hora import __version__
from hora.api import errors
from hora.api.models import HealthOut
from hora.api.models_reference import SettingsSchemaOut
from hora.api.routers import (
    analysis,
    argalas,
    arudhas,
    ashtakavarga,
    aspects,
    avasthas,
    baadhakas,
    benefics,
    book_charts,
    chakras,
    charts,
    colords,
    dashas,
    ephemeris,
    family,
    functional,
    graha_arudhas,
    horas,
    houses,
    karakas,
    karanas,
    lagnas,
    longevity,
    maasas,
    marakas,
    panchanga,
    planetary_yogas,
    rasi_strength,
    reference,
    relationships,
    sodhana,
    strength,
    tithis,
    transits,
    util,
    vakri,
    vargas,
    workbench,
    yogas,
)
from hora.core.settings import Settings
from hora.storage.chart_db import init_db

app = FastAPI(
    title="Hora Calculation API",
    # Documents the single error shape on every endpoint, so a client can
    # generate one error type rather than guessing per route.
    responses={
        400: {"model": errors.ErrorResponse, "description": "Bad request"},
        404: {"model": errors.ErrorResponse, "description": "Not found"},
        422: {"model": errors.ErrorResponse, "description": "Unprocessable"},
    },
    version=__version__,
    description=(
        "Vedic astrology calculation service. Results are benchmarked against "
        "Jagannatha Hora 8.0; see docs/parity.md for the current coverage and "
        "the list of rules still awaiting empirical confirmation."
    ),
)

errors.install(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ephemeris.router)
app.include_router(charts.router)
app.include_router(chakras.router)
app.include_router(maasas.router)
app.include_router(horas.router)
app.include_router(karanas.router)
app.include_router(benefics.router)
app.include_router(relationships.router)
app.include_router(tithis.router)
app.include_router(yogas.router)
app.include_router(panchanga.router)
app.include_router(dashas.router)
app.include_router(util.router)
app.include_router(reference.router)
app.include_router(vargas.router)
app.include_router(lagnas.router)
app.include_router(houses.router)
app.include_router(karakas.router)
app.include_router(arudhas.router)
app.include_router(graha_arudhas.router)
app.include_router(strength.router)
app.include_router(avasthas.router)
app.include_router(colords.router)
app.include_router(rasi_strength.router)
app.include_router(aspects.router)
app.include_router(argalas.router)
app.include_router(planetary_yogas.router)
app.include_router(ashtakavarga.router)
app.include_router(sodhana.router)
app.include_router(functional.router)
app.include_router(baadhakas.router)
app.include_router(analysis.router)
app.include_router(family.router)
app.include_router(book_charts.router)
app.include_router(marakas.router)
app.include_router(longevity.router)
app.include_router(vakri.router)
app.include_router(transits.router)
app.include_router(workbench.router)

# Initialize database schema on startup
init_db()


@app.get("/health", response_model=HealthOut, tags=["meta"])
def health() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/v1/settings/schema", response_model=SettingsSchemaOut, tags=["meta"],
         summary="Every calculation knob and its default")
def settings_schema() -> dict:
    return {"defaults": Settings().model_dump(mode="json"), "schema": Settings.model_json_schema()}


# ---------------------------------------------------------------------------
# Static Frontend Serving & Single Page App (SPA) Wildcard Fallback
# ---------------------------------------------------------------------------

from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

_frontend_dist = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    _assets_dir = _frontend_dist / "assets"
    if _assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_or_static(full_path: str):
        # Do not catch API or documentation endpoints
        if (
            full_path.startswith("api/")
            or full_path.startswith("v1/")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="Not found")

        target_file = _frontend_dist / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)

        index_file = _frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")
