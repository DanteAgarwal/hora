"""FastAPI application.

Calculation only — no persistence, no rendering.  Every endpoint is a pure
function of its request body, which makes the benchmark harness able to replay
requests against both this service and recorded JHora output.
"""
from __future__ import annotations

from fastapi import FastAPI

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
    util,
    vakri,
    vargas,
    yogas,
)
from hora.core.settings import Settings

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


@app.get("/health", response_model=HealthOut, tags=["meta"])
def health() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/v1/settings/schema", response_model=SettingsSchemaOut, tags=["meta"],
         summary="Every calculation knob and its default")
def settings_schema() -> dict:
    return {"defaults": Settings().model_dump(mode="json"), "schema": Settings.model_json_schema()}
