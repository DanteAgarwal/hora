const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const { buildEnrichedChart, buildChartFromMaster } = require('./services/chartBuilder')
const {
  normalizeDashaTreeNode,
  expandDashaSubPeriodsBackend,
  computeActiveDashaChainBackend,
  checkDashaSandhiBackend,
  getActivatedHousesBackend,
  calculateSambhandhaBackend,
} = require('./services/dashaService')
const { calculateAspectsForChart } = require('./services/aspectsService')
const { computeDignityOverview } = require('./services/dignityService')
const { computePurusharthaBalance } = require('./services/purusharthaService')
const { buildVargaComparison, buildShodasavargaCharts } = require('./services/vargasService')
const { parseSignIndex, formatDms } = require('./services/astroConstants')
const { computeArudhaPadas } = require('./services/arudhasService')
const { computeBaadhakas, computeMarakas } = require('./services/longevityService')
const { normalizeAshtakavarga } = require('./services/ashtakavargaService')
const { computeShadbala } = require('./services/shadbalaService')
const { computeAllSpecialPoints } = require('./services/specialPointsService')
const { buildLiveGocharaReport } = require('./services/transitsService')

const app = express()
const port = process.env.PORT || 4000
const HORA_API = process.env.HORA_API || 'http://localhost:8000'
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'kundli-workbench.db')

fs.mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_data TEXT,
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Safe schema migration for pre-existing databases
const columns = db.prepare('PRAGMA table_info(charts)').all().map((c) => c.name)
if (!columns.includes('birth_data')) {
  db.exec('ALTER TABLE charts ADD COLUMN birth_data TEXT')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Forward a request to the Python Hora API and return the parsed JSON. */
async function horaFetch(urlPath, body) {
  const url = `${HORA_API}${urlPath}`
  const options = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' }

  const response = await fetch(url, options)
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const err = new Error(`Hora API ${response.status}: ${detail.slice(0, 300)}`)
    err.status = response.status
    throw err
  }
  return response.json()
}

/** Compute all chart components via Python Hora Master Engine with fallback. */
async function computeChart(name, birthData) {
  try {
    const master = await horaFetch('/v1/chart/master', birthData)
    return buildChartFromMaster(name, birthData, master)
  } catch (masterErr) {
    console.warn('[computeChart] Master calculation endpoint failed, falling back to granular calls:', masterErr.message)
  }

  const [rasiResult, panchangaResult, dashaResult, vargaResult, shodasavargaResult] = await Promise.allSettled([
    horaFetch('/v1/chart/rasi', birthData),
    horaFetch('/v1/panchanga', birthData),
    horaFetch('/v1/dasha', {
      ...birthData,
      system: 'vimshottari',
      levels: 3,
      cycles: 1,
      reckon_from: 'moon',
      as_of: new Date().toISOString(),
    }),
    horaFetch('/v1/chart/varga-catalog'),
    horaFetch('/v1/chart/shodasavarga', birthData),
  ])

  if (rasiResult.status !== 'fulfilled') {
    throw rasiResult.reason
  }

  const rasi = rasiResult.value
  const panchanga = panchangaResult.status === 'fulfilled' ? panchangaResult.value : null
  const dasha = dashaResult.status === 'fulfilled' ? dashaResult.value : null
  const vargaCatalog = vargaResult.status === 'fulfilled' ? vargaResult.value : null
  const shodasavarga = shodasavargaResult.status === 'fulfilled' ? shodasavargaResult.value : null

  // Build maps for sub-calculations
  const rasisMap = {}
  const refSigns = {}
  for (const g of rasi.grahas || []) {
    rasisMap[g.id] = g.rasi
    if (['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(g.name)) {
      refSigns[g.name] = g.rasi
    }
  }
  const lagnaRasiIdx = rasi.lagna?.rasi ?? 0
  refSigns['Lagna'] = lagnaRasiIdx

  const pakshaIdx =
    panchanga?.paksha?.index !== undefined
      ? panchanga.paksha.index
      : typeof panchanga?.paksha === 'number'
      ? panchanga.paksha
      : undefined

  // Fetch all specialized Vedic calculation modules in parallel
  const [
    aspectsRes,
    yogasRes,
    relationshipsRes,
    arudhasRes,
    baadhakasRes,
    marakasRes,
    ashtakavargaRes,
    argalasRes,
    functionalRes,
    vakriRes,
    specialLagnasRes,
    upagrahasRes,
  ] = await Promise.allSettled([
    horaFetch('/v1/aspect/chart', {
      rasis: rasisMap,
      lagna_rasi: lagnaRasiIdx,
      rahu_ketu_aspects: true,
    }),
    horaFetch('/v1/planetary-yoga/chart', {
      rasis: rasisMap,
      lagna_rasi: lagnaRasiIdx,
      include_nodes: true,
      ...(pakshaIdx !== undefined ? { paksha: pakshaIdx } : {}),
    }),
    horaFetch('/v1/relationship/chart', {
      rasis: rasisMap,
      include_nodes: true,
    }),
    horaFetch('/v1/arudha/table', {
      lagna_sign: lagnaRasiIdx,
      graha_signs: rasisMap,
    }),
    horaFetch('/v1/baadhakas/chart', {
      lagna_sign: lagnaRasiIdx,
      graha_signs: rasisMap,
    }),
    horaFetch('/v1/marakas', {
      lagna: lagnaRasiIdx,
      graha_signs: rasisMap,
    }),
    horaFetch('/v1/ashtakavarga/chart', {
      reference_signs: refSigns,
    }),
    horaFetch('/v1/argala/chart', {
      rasis: rasisMap,
      lagna_rasi: lagnaRasiIdx,
    }),
    horaFetch(`/v1/functional/lagna?sign=${lagnaRasiIdx}`),
    horaFetch('/v1/astrology/vakri-analysis/batch', {
      birth_data: {
        year: birthData.year,
        month: birthData.month,
        day: birthData.day,
        hour: birthData.hour || 0,
        minute: birthData.minute || 0,
        second: birthData.second || 0,
        tz_name: birthData.tz_name,
        latitude: birthData.place?.latitude || birthData.latitude,
        longitude: birthData.place?.longitude || birthData.longitude,
      },
      calculation_settings: {
        ayanamsa: birthData.settings?.ayanamsa || 'Lahiri',
        house_system: birthData.settings?.house_system || 'Whole Sign',
        node_type: birthData.settings?.node_type || 'True',
      },
      analysis_settings: {
        tradition: 'Parashari',
        include_jataka_parijata: true,
        include_phaladeepika: true,
        include_saravali: true,
        include_horasara: true,
        include_uttara_kalamrita: true,
        include_house_offsets: Boolean(birthData.include_house_offsets),
      },
    }),
    horaFetch('/v1/chart/special-lagnas', birthData),
    horaFetch('/v1/chart/upagrahas', birthData),
  ])

  const aspects = aspectsRes.status === 'fulfilled' ? aspectsRes.value : null
  const yogas = yogasRes.status === 'fulfilled' ? yogasRes.value : null
  const relationships = relationshipsRes.status === 'fulfilled' ? relationshipsRes.value : null
  const arudhas = arudhasRes.status === 'fulfilled' ? arudhasRes.value : null
  const baadhakas = baadhakasRes.status === 'fulfilled' ? baadhakasRes.value : null
  const marakas = marakasRes.status === 'fulfilled' ? marakasRes.value : null
  const ashtakavarga = ashtakavargaRes.status === 'fulfilled' ? ashtakavargaRes.value : null
  const argalas = argalasRes.status === 'fulfilled' ? argalasRes.value : null
  const functional = functionalRes.status === 'fulfilled' ? functionalRes.value : null
  const vakriAnalysis = vakriRes.status === 'fulfilled' ? vakriRes.value : null

  return buildEnrichedChart(
    name,
    birthData,
    rasi,
    panchanga,
    dasha,
    vargaCatalog,
    shodasavarga,
    aspects,
    yogas,
    relationships,
    arudhas,
    baadhakas,
    marakas,
    ashtakavarga,
    argalas,
    functional,
    vakriAnalysis,
    specialLagnasRes.status === 'fulfilled' ? specialLagnasRes.value : null,
    upagrahasRes.status === 'fulfilled' ? upagrahasRes.value : null
  )
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/api/health', async (_req, res) => {
  let horaStatus = 'unreachable'
  try {
    const horaHealth = await horaFetch('/health')
    horaStatus = horaHealth.status || 'ok'
  } catch { /* swallow */ }

  res.json({
    status: 'ok',
    db: dbPath,
    hora_api: HORA_API,
    hora_status: horaStatus,
  })
})

// ---------------------------------------------------------------------------
// Proxy: Forward any /api/hora/* request to the Python Hora API
// ---------------------------------------------------------------------------

app.use('/api/hora', async (req, res) => {
  try {
    const horaPath = req.url
    const result = await horaFetch(horaPath, req.method === 'POST' ? req.body : undefined)
    res.json(result)
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Live chart: Compute a fresh chart via the Python Hora API & Backend Enrichment
// ---------------------------------------------------------------------------

app.post('/api/compute', async (req, res) => {
  const birthData = req.body
  if (!birthData || !birthData.year || !birthData.month || !birthData.day) {
    return res.status(400).json({ error: 'Birth data (year, month, day) is required' })
  }

  try {
    const chart = await computeChart(birthData.name || 'Live chart', birthData)
    return res.json(chart)
  } catch (err) {
    return res.status(err.status || 502).json({
      error: `Hora calculation failed: ${err.message}`,
    })
  }
})

// ---------------------------------------------------------------------------
// Vakri Graha Intelligence Engine Endpoints (PRD Section 22)
// ---------------------------------------------------------------------------

app.all(['/api/v1/*path', '/api/astrology/*path'], async (req, res) => {
  try {
    const targetPath = req.path.startsWith('/api/v1')
      ? req.path.replace(/^\/api/, '')
      : req.path.replace(/^\/api\/astrology/, '/v1/astrology')
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const result = await horaFetch(`${targetPath}${query}`, req.method === 'POST' ? req.body : undefined)
    res.json(result)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Backend Dasha Expansion & Timing Endpoints
// ---------------------------------------------------------------------------

/**
 * Expand a parent dasha period into its subperiods down to targetLevel entirely on the backend
 */
app.post(['/api/dasha/expand', '/api/dasha/subperiods'], async (req, res) => {
  try {
    const parent = req.body?.parent || req.body
    if (!parent || (!parent.lord && !parent.lord_name && !parent.period)) {
      return res.status(400).json({ error: 'parent dasha period with lord is required' })
    }
    const targetLevel = req.body?.targetLevel || req.body?.target_level || ((parent.level || 1) + 1)

    // Attempt Python backend first
    try {
      const pythonRes = await horaFetch('/v1/dasha/expand', {
        parent,
        target_level: targetLevel,
        system: req.body?.system || 'vimshottari',
      })
      if (pythonRes && Array.isArray(pythonRes.subperiods) && pythonRes.subperiods.length > 0) {
        return res.json({
          parent,
          targetLevel,
          target_level: targetLevel,
          subperiods: pythonRes.subperiods.map((c) => normalizeDashaTreeNode(c, targetLevel)),
        })
      }
    } catch {
      // Graceful fallback to backend Node calculation
    }

    const subperiods = expandDashaSubPeriodsBackend(parent, targetLevel)
    return res.json({
      parent,
      targetLevel,
      target_level: targetLevel,
      subperiods,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate active dasha chain for an asOf date on the backend
 */
app.post('/api/dasha/active-chain', (req, res) => {
  try {
    const { dashas, asOf } = req.body
    if (!dashas || !Array.isArray(dashas)) {
      return res.status(400).json({ error: 'dashas array is required' })
    }
    const chain = computeActiveDashaChainBackend(dashas, asOf ? new Date(asOf) : new Date())
    return res.json({ chain })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Check dasha sandhi (boundary transition) on the backend
 */
app.post('/api/dasha/sandhi', (req, res) => {
  try {
    const { period, asOf } = req.body
    if (!period) {
      return res.status(400).json({ error: 'period object is required' })
    }
    const sandhi = checkDashaSandhiBackend(period, asOf ? new Date(asOf) : new Date())
    return res.json({ sandhi })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Get activated houses for a dasha period lord on the backend
 */
app.post('/api/dasha/activated-houses', (req, res) => {
  try {
    const { lordName, chart } = req.body
    if (!lordName || !chart) {
      return res.status(400).json({ error: 'lordName and chart are required' })
    }
    const houses = getActivatedHousesBackend(lordName, chart)
    return res.json({ houses })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Sambhandha relationship between two planets on the backend
 */
app.post('/api/dasha/sambhandha', (req, res) => {
  try {
    const { planetA, planetB, chart } = req.body
    if (!planetA || !planetB || !chart) {
      return res.status(400).json({ error: 'planetA, planetB, and chart are required' })
    }
    const sambhandha = calculateSambhandhaBackend(planetA, planetB, chart)
    return res.json(sambhandha)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Backend Astrological Analysis Endpoints
// ---------------------------------------------------------------------------

/**
 * Calculate Aspects Matrix (9 Grahas x 12 Bhavas) on the backend
 */
app.post('/api/analysis/special-lagnas', (req, res) => {
  try {
    const { rawSpecialLagnas, lagnaSignIndex, planets, birthData } = req.body
    const result = computeAllSpecialPoints(rawSpecialLagnas, null, lagnaSignIndex || 0, planets || [], birthData || {})
    return res.json(result.specialLagnas)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/analysis/upagrahas', (req, res) => {
  try {
    const { rawUpagrahas, lagnaSignIndex, planets } = req.body
    const result = computeAllSpecialPoints(null, rawUpagrahas, lagnaSignIndex || 0, planets || [], {})
    return res.json(result.upagrahas)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/analysis/shadbala', (req, res) => {
  try {
    const { planets, vargas, birthData } = req.body
    if (!planets || !Array.isArray(planets)) {
      return res.status(400).json({ error: 'planets array is required' })
    }
    const result = computeShadbala(planets, vargas || {}, birthData || {})
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/analysis/aspects-matrix', (req, res) => {
  try {
    const { planets, houses, lagnaSignIndex } = req.body
    if (!planets || !houses) {
      return res.status(400).json({ error: 'planets and houses are required' })
    }
    const result = calculateAspectsForChart(planets, houses, lagnaSignIndex || 0)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Dignity & Strength Overview on the backend
 */
app.post('/api/analysis/dignity-overview', (req, res) => {
  try {
    const planets = req.body?.planets || req.body?.chart?.planets
    if (!planets) {
      return res.status(400).json({ error: 'planets array is required' })
    }
    const result = computeDignityOverview(planets)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Purushartha & Stanza Balance on the backend
 */
app.post('/api/analysis/purushartha-balance', (req, res) => {
  try {
    const planets = req.body?.planets || req.body?.chart?.planets
    if (!planets) {
      return res.status(400).json({ error: 'planets array is required' })
    }
    const result = computePurusharthaBalance(planets)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Varga Comparison (D1 vs D9) on the backend
 */
app.post('/api/analysis/varga-comparison', (req, res) => {
  try {
    const chart = req.body?.chart || req.body
    if (!chart || !chart.planets || !chart.vargas) {
      return res.status(400).json({ error: 'chart with planets and vargas is required' })
    }
    const result = buildVargaComparison(chart.vargas['D1'], chart.vargas['D9'], chart.planets)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Arudhas (A1-A12, AL, UL)
 */
app.post('/api/analysis/arudhas', async (req, res) => {
  try {
    const { lagnaSignIndex, planets, rasisMap } = req.body
    let rawArudhas = null
    try {
      rawArudhas = await horaFetch('/v1/arudha/table', {
        lagna_sign: lagnaSignIndex,
        graha_signs: rasisMap || {},
      })
    } catch {}
    const result = computeArudhaPadas(lagnaSignIndex, planets || [], rawArudhas)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Baadhakas
 */
app.post('/api/analysis/baadhakas', async (req, res) => {
  try {
    const { lagnaSignIndex, planets, rasisMap } = req.body
    let rawBaadhakas = null
    try {
      rawBaadhakas = await horaFetch('/v1/baadhakas/chart', {
        lagna_sign: lagnaSignIndex,
        graha_signs: rasisMap || {},
      })
    } catch {}
    const result = computeBaadhakas(lagnaSignIndex, planets || [], rawBaadhakas)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Marakas
 */
app.post('/api/analysis/marakas', async (req, res) => {
  try {
    const { lagnaSignIndex, planets, rasisMap } = req.body
    let rawMarakas = null
    try {
      rawMarakas = await horaFetch('/v1/marakas', {
        lagna: lagnaSignIndex,
        graha_signs: rasisMap || {},
      })
    } catch {}
    const result = computeMarakas(lagnaSignIndex, planets || [], rawMarakas)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Calculate Ashtakavarga (SAV & BAV)
 */
app.post('/api/analysis/ashtakavarga', async (req, res) => {
  try {
    const { lagnaSignIndex, planets, refSigns } = req.body
    let rawAv = null
    try {
      rawAv = await horaFetch('/v1/ashtakavarga/chart', {
        reference_signs: refSigns || {},
      })
    } catch {}
    const result = normalizeAshtakavarga(rawAv, lagnaSignIndex, planets || [])
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Get Functional Nature for Lagna
 */
app.get('/api/analysis/functional/:lagna', async (req, res) => {
  try {
    const lagna = parseInt(req.params.lagna, 10) || 0
    const result = await horaFetch(`/v1/functional/lagna?sign=${lagna}`)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Get Classical Book Charts Catalog
 */
app.get('/api/book-charts', async (_req, res) => {
  try {
    const result = await horaFetch('/v1/book-charts')
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.get('/api/book-charts/:number', async (req, res) => {
  try {
    const result = await horaFetch(`/v1/book-charts/${req.params.number}`)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

/**
 * Live Gochara (Transits) & Sade Sati Tracker Endpoint
 * Calculates real-time planetary transits overlaid on natal chart,
 * evaluates Saturn Sade Sati & Kantaka Shani, and evaluates Transit Ashtakavarga scores.
 */
app.post('/api/transits/live', async (req, res) => {
  try {
    const { chartId, chart: incomingChart, transitDate, place, tz_name } = req.body

    let natalChart = incomingChart
    if (!natalChart && chartId) {
      const row = db.prepare('SELECT payload, birth_data FROM charts WHERE id = ?').get(chartId)
      if (row) {
        let payload = {}
        let birthData = null
        try { if (row.payload) payload = JSON.parse(row.payload) } catch {}
        try { if (row.birth_data) birthData = JSON.parse(row.birth_data) } catch {}
        natalChart = enrichLegacyPayload(payload)
        if (birthData && !natalChart.birthData) natalChart.birthData = birthData
      }
    }

    if (!natalChart) {
      return res.status(400).json({ error: 'Natal chart data or valid chartId is required' })
    }

    // Determine target epoch and place
    const tDate = transitDate ? new Date(transitDate) : new Date()
    const targetPlace = place || natalChart.birthData?.place || {
      name: 'New Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      altitude: 0,
    }
    const tzName = tz_name || natalChart.birthData?.tz_name || 'Asia/Kolkata'

    // Extract natal Moon and Lagna from natalChart
    const natalMoon = (natalChart.planets || []).find((p) => p.name === 'Moon')
    const natalMoonLon = natalMoon?.longitude ?? 0
    let natalLagnaSignIdx = 0
    if (natalChart.quickFacts?.lagna) {
      natalLagnaSignIdx = parseSignIndex(natalChart.quickFacts.lagna)
    } else if (natalChart.houses?.[0]?.signNumber) {
      natalLagnaSignIdx = natalChart.houses[0].signNumber - 1
    }

    // Build natal BAV map if available
    const natalBavMap = {}
    if (natalChart.ashtakavarga?.bav) {
      for (const [pName, bavRow] of Object.entries(natalChart.ashtakavarga.bav)) {
        natalBavMap[pName] = Array.isArray(bavRow) ? bavRow : (bavRow.scores || bavRow.rekhas || [])
      }
    }

    // Primary: Compute full Gochara, Vedha, Sade Sati & Ashtakavarga directly via Python Swiss Ephemeris kernel
    try {
      const transitReport = await horaFetch('/v1/transits/analysis', {
        natal_moon_longitude: natalMoonLon,
        natal_lagna_rasi: natalLagnaSignIdx,
        natal_bav: natalBavMap,
        transit_year: tDate.getFullYear(),
        transit_month: tDate.getMonth() + 1,
        transit_day: tDate.getDate(),
        transit_hour: tDate.getHours(),
        transit_minute: tDate.getMinutes(),
        transit_second: tDate.getSeconds(),
        transit_tz: tzName,
        latitude: Number(targetPlace.latitude) || 28.6139,
        longitude: Number(targetPlace.longitude) || 77.2090,
      })

      // Attach client overlay metadata
      transitReport.natalChart = {
        name: natalChart.name,
        date: natalChart.date,
        lagna: natalChart.lagna,
        moon: natalChart.moon,
        planets: (natalChart.planets || []).map((p) => ({
          name: p.name,
          symbol: p.symbol,
          sign: p.sign,
          signIndex: p.signIndex,
          dms: p.dms,
          houseNumber: p.houseNumber,
        })),
      }
      transitReport.targetPlace = targetPlace
      return res.json(transitReport)
    } catch (transitErr) {
      console.warn('[Transit API] Python transit service fallback:', transitErr.message)
      // Fallback to local gateway Gochara engine
      const transitRasi = await horaFetch('/v1/chart/rasi', {
        year: tDate.getFullYear(),
        month: tDate.getMonth() + 1,
        day: tDate.getDate(),
        hour: tDate.getHours(),
        minute: tDate.getMinutes(),
        second: tDate.getSeconds(),
        tz_name: tzName,
        place: {
          name: targetPlace.name || 'Current Location',
          latitude: Number(targetPlace.latitude) || 28.6139,
          longitude: Number(targetPlace.longitude) || 77.2090,
          altitude: Number(targetPlace.altitude) || 0,
        },
      })

      const report = buildLiveGocharaReport(transitRasi, natalChart, tDate, targetPlace)
      return res.json(report)
    }
  } catch (err) {
    console.error('[Transits API Error]', err)
    return res.status(err.status || 500).json({ error: err.message || 'Failed to compute live transits' })
  }
})

// ---------------------------------------------------------------------------
// Saved charts: CRUD against SQLite
// ---------------------------------------------------------------------------
// Legacy Chart Payload Enricher (Graceful Backward Compatibility)
// ---------------------------------------------------------------------------

function enrichLegacyPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const planets = payload.planets || []
  const houses = payload.houses || []

  // Ensure planets have precise degrees, DMS, and longitudes
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i]
    const sIdx = p.signIndex !== undefined ? p.signIndex : parseSignIndex(p.sign)
    p.signIndex = sIdx
    p.signNumber = sIdx + 1

    if (p.degreeInSign == null || isNaN(p.degreeInSign)) {
      if (p.degree) {
        const clean = String(p.degree).trim()
        const parts = clean.split(/[-:°'"]+/).filter(Boolean).map(Number)
        if (parts.length >= 1 && !isNaN(parts[0])) {
          const d = parts[0]
          const m = parts[1] || 0
          const s = parts[2] || 0
          p.degreeInSign = d + m / 60 + s / 3600
          p.dms = `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
        } else {
          p.degreeInSign = 0
          p.dms = '0°00\'00"'
        }
      } else {
        p.degreeInSign = p.degrees_in_rasi ?? 0
        p.dms = formatDms(p.degreeInSign)
      }
    } else if (typeof p.dms === 'string' && p.dms.includes('-') && !p.dms.includes('°')) {
      const parts = p.dms.split('-')
      if (parts.length >= 3) {
        p.dms = `${parts[0]}°${parts[1].padStart(2, '0')}'${parts[2].padStart(2, '0')}"`
      }
    } else if (!p.dms) {
      p.dms = formatDms(p.degreeInSign)
    }

    if (p.longitude == null || isNaN(p.longitude)) {
      p.longitude = sIdx * 30 + p.degreeInSign
    }
  }

  // Ensure houses have sign index and ordinal
  for (let h = 0; h < houses.length; h++) {
    const house = houses[h]
    if (house.signIndex === undefined && house.sign) {
      house.signIndex = parseSignIndex(house.sign)
    }
  }

  // Ensure full 16 Shodasavarga charts exist as a dictionary
  const lagnaSignIndex = houses[0]?.signIndex ?? parseSignIndex(payload.lagna || houses[0]?.sign)
  const lagnaDms = payload.lagnaDms || houses[0]?.dms || '0°00\'00"'
  const lagnaLon = payload.rawRasi?.lagna?.longitude ?? payload.shodasavarga?.D1?.lagna?.longitude ?? (lagnaSignIndex * 30 + 15)

  if (!payload.vargas || Array.isArray(payload.vargas) || !payload.vargas['D1'] || !payload.vargas['D9']?.grahas || !payload.vargas['D9']?.lagnaDms) {
    payload.vargas = buildShodasavargaCharts(payload.shodasavarga || payload.raw?.shodasavarga || payload.shodasavargaRaw || null, lagnaSignIndex, planets, lagnaDms, lagnaLon)
  }

  if (!payload.vargaComparison || payload.vargaComparison.length === 0) {
    if (payload.vargas?.['D1'] && payload.vargas?.['D9']) {
      payload.vargaComparison = buildVargaComparison(payload.vargas['D1'], payload.vargas['D9'], planets)
    }
  }

  // Ensure Special Lagnas & Upagrahas exist
  if ((!payload.specialLagnas || !payload.upagrahas) && planets.length > 0) {
    const sp = computeAllSpecialPoints(payload.raw?.specialLagnas, payload.raw?.upagrahas, lagnaSignIndex, planets, payload.birthData || {})
    if (!payload.specialLagnas) payload.specialLagnas = sp.specialLagnas
    if (!payload.upagrahas) payload.upagrahas = sp.upagrahas
    if (!payload.specialPoints) payload.specialPoints = sp
  }

  // Ensure Shadbala exists
  if (!payload.shadbala && planets.length > 0) {
    payload.shadbala = computeShadbala(planets, payload.vargas || {}, payload.birthData || {})
    planets.forEach((p) => {
      const pShad = payload.shadbala.planets.find((x) => x.name === p.name)
      if (pShad) p.shadbala = pShad
    })
  }

  // Ensure purusharthaBalance exists
  if (!payload.purusharthaBalance && planets.length > 0) {
    payload.purusharthaBalance = computePurusharthaBalance(planets)
  }

  // Ensure arudhas exists
  if (!payload.arudhas && houses.length > 0 && planets.length > 0) {
    payload.arudhas = computeArudhaPadas(houses, planets)
  }

  // Ensure baadhakas & marakas exist
  if ((!payload.baadhakas || !payload.marakas) && houses.length > 0 && planets.length > 0) {
    if (!payload.baadhakas) payload.baadhakas = computeBaadhakas(lagnaSignIndex, houses, planets)
    if (!payload.marakas) payload.marakas = computeMarakas(lagnaSignIndex, houses, planets)
  }

  // Ensure ashtakavarga exists
  if (!payload.ashtakavarga) {
    payload.ashtakavarga = normalizeAshtakavarga(payload.rawAshtakavarga || payload.raw?.ashtakavarga, houses, planets)
  }

  // Ensure dashaTree exists, has valid lords, and has expanded subperiods
  const rawDashas = payload.dashaTree || payload.dashas || []
  if (Array.isArray(rawDashas) && rawDashas.length > 0) {
    const normalizedDashas = rawDashas.map((d) => {
      const node = normalizeDashaTreeNode(d, 1)
      if (node && (!node.children || node.children.length === 0)) {
        node.children = expandDashaSubPeriodsBackend(node, 2)
      }
      return node
    })
    payload.dashaTree = normalizedDashas
    payload.dashas = normalizedDashas
    if (!payload.activeDashaChain || payload.activeDashaChain.length === 0) {
      payload.activeDashaChain = computeActiveDashaChainBackend(normalizedDashas, new Date(), planets)
    }
  }

  return payload
}

/**
 * Automatically upgrades existing charts in database that have missing degrees or legacy vargas arrays
 */
async function autoUpgradeSavedCharts() {
  try {
    const rows = db.prepare('SELECT id, name, birth_data, payload FROM charts').all()
    for (const row of rows) {
      if (!row.birth_data) continue
      let bdata = null
      let payload = null
      try { bdata = JSON.parse(row.birth_data) } catch {}
      try { payload = JSON.parse(row.payload) } catch {}

      const needsUpgrade =
        !payload ||
        !payload.planets ||
        payload.planets[0]?.degreeInSign == null ||
        Array.isArray(payload.vargas) ||
        !payload.vargas?.['D9']?.grahas ||
        !payload.vargas?.['D9']?.lagnaDms ||
        !payload.yogas ||
        !payload.allYogasCatalog || !payload.shadbala || !payload.specialLagnas || !payload.upagrahas

      if (bdata && bdata.year && needsUpgrade) {
        try {
          const fresh = await computeChart(row.name, bdata)
          db.prepare('UPDATE charts SET payload = ? WHERE id = ?').run(JSON.stringify(fresh), row.id)
          console.log(`[AutoUpgrade] Chart ${row.id} ("${row.name}") successfully upgraded with live astronomical data and 16 Shodasavargas.`)
        } catch (e) {
          console.warn(`[AutoUpgrade] Could not recompute chart ${row.id}:`, e.message)
        }
      }
    }
  } catch (err) {
    console.warn('[AutoUpgrade] Error:', err.message)
  }
}

// ---------------------------------------------------------------------------
// Chart Store Routes
// ---------------------------------------------------------------------------

app.get('/api/charts', (_req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, birth_data, payload FROM charts ORDER BY created_at DESC').all()
    const charts = rows.map((row) => {
      let payload = {}
      let birthData = null
      try { if (row.payload) payload = JSON.parse(row.payload) } catch {}
      try { if (row.birth_data) birthData = JSON.parse(row.birth_data) } catch {}
      const enriched = enrichLegacyPayload(payload)
      return {
        ...enriched,
        id: row.id,
        name: row.name,
        birthData: birthData || payload.birthData || null,
      }
    })
    res.json(charts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/charts/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT id, name, birth_data, payload FROM charts WHERE id = ?').get(req.params.id)
    if (!row) {
      return res.status(404).json({ error: 'Chart not found' })
    }
    let payload = {}
    let birthData = null
    try { if (row.payload) payload = JSON.parse(row.payload) } catch {}
    try { if (row.birth_data) birthData = JSON.parse(row.birth_data) } catch {}
    const enriched = enrichLegacyPayload(payload)
    return res.json({
      ...enriched,
      id: row.id,
      name: row.name,
      birthData: birthData || payload.birthData || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/charts', async (req, res) => {
  try {
    const { name, birthData } = req.body
    if (!name || !birthData) {
      return res.status(400).json({ error: 'name and birthData are required' })
    }

    let payload = null
    try {
      payload = await computeChart(name, birthData)
    } catch (err) {
      console.warn('Chart computation failed, saving birth data only:', err.message)
    }

    const stmt = db.prepare('INSERT INTO charts (name, birth_data, payload) VALUES (?, ?, ?)')
    const result = stmt.run(name, JSON.stringify(birthData), payload ? JSON.stringify(payload) : null)

    return res.status(201).json({
      ...(payload || {}),
      id: result.lastInsertRowid,
      name,
      birthData,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.delete('/api/charts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM charts WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Chart not found' })
  }
  return res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Static frontend serving (production / standalone)
// ---------------------------------------------------------------------------

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'))
    }
    next()
  })
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Kundli Workbench API running on http://localhost:${port}`)
  setTimeout(autoUpgradeSavedCharts, 1000)
})
