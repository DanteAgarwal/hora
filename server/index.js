const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
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

/** Build a unified chart payload from multiple Hora API responses. */
function buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog, shodasavarga, aspects, yogas) {
  const ordinal = (n) => {
    const r = n % 100
    if (r >= 11 && r <= 13) return `${n}th`
    return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
  }

  const SIGN_LORDS = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  }

  const planets = (rasi?.grahas || []).map((p) => {
    let lordHouses = p.lord_of_houses
    if (!lordHouses || lordHouses.length === 0) {
      lordHouses = (rasi?.bhavas || [])
        .filter((b) => SIGN_LORDS[b.rasi_name] === p.name)
        .map((b) => b.house)
    }
    return {
      name: p.name,
      sign: p.rasi_name,
      degree: p.dms || `${p.degrees_in_rasi.toFixed(0)}°`,
      nakshatra: `${p.nakshatra_name} • Pada ${p.pada}`,
      house: ordinal(p.house),
      houseNumber: p.house,
      retrograde: Boolean(p.retrograde),
      combust: Boolean(p.combust),
      status: p.dignity || 'Calculated',
      // Rich astronomical properties
      id: p.id,
      longitude: p.longitude,
      latitude: p.latitude,
      speed: p.speed,
      degrees_in_rasi: p.degrees_in_rasi,
      dms: p.dms,
      sign_dm: p.sign_dm,
      rasi_dm: p.rasi_dm,
      rasi_index: p.rasi,
      nakshatra_number: p.nakshatra,
      nakshatra_name: p.nakshatra_name,
      pada: p.pada,
      house_labels: p.house_labels || [],
      dignity: p.dignity,
      sun_separation: p.sun_separation,
      lord_of_houses: lordHouses || [],
    }
  })

  const houses = (rasi?.bhavas || []).map((b) => ({
    number: b.house,
    name: `${ordinal(b.house)} House`,
    sign: b.rasi_name,
    lord: SIGN_LORDS[b.rasi_name] || '—',
    occupants: planets.filter((p) => p.houseNumber === b.house).map((p) => p.name),
    start: b.start,
    middle: b.middle,
    end: b.end,
    rasi_index: b.rasi,
  }))

  const lagna = rasi?.lagna
  const moon = (rasi?.grahas || []).find((p) => p.name === 'Moon')
  const sun = (rasi?.grahas || []).find((p) => p.name === 'Sun')

  const runningDasha = (dasha?.running || []).map((d) => d.lord_name)
  const firstDasha = dasha?.periods?.[0]
  const currentDasha = runningDasha.length
    ? runningDasha.join(' / ')
    : firstDasha
      ? `${firstDasha.lord_name} • ${firstDasha.start.slice(0, 4)}–${firstDasha.end.slice(0, 4)}`
      : 'Unavailable'

  return {
    name,
    date: rasi?.input?.local_time || '',
    time: rasi?.input?.local_time || '',
    location: rasi?.input?.place?.name || birthData.place?.name || '',
    latitude: `${rasi?.input?.place?.latitude ?? birthData.place?.latitude ?? ''}°`,
    longitude: `${rasi?.input?.place?.longitude ?? birthData.place?.longitude ?? ''}°`,
    timezone: rasi?.input?.timezone || birthData.tz_name || '',
    lagna: lagna ? `${lagna.rasi_name} ${lagna.dms}` : 'Unavailable',
    moon: moon ? `${moon.rasi_name} ${moon.dms}` : 'Unavailable',
    moonNakshatra: moon ? `${moon.nakshatra_name} • Pada ${moon.pada}` : 'Unavailable',
    sunSign: sun?.rasi_name || 'Unavailable',
    currentMahadasha: currentDasha,
    ayanamsa: rasi?.ayanamsa?.dms || 'Unavailable',
    calculationSettings: `${rasi?.settings?.ayanamsa || 'Unknown'} ayanamsha • ${rasi?.settings?.house_system || 'Unknown'} houses`,
    planets,
    houses,
    vargas: (vargaCatalog?.named || []).map((v) => ({
      code: v.code,
      title: v.name,
      purpose: `${v.divisions} divisions`,
      divisions: v.divisions,
      status: shodasavarga?.charts?.[v.code] ? 'Calculated' : 'Available',
    })),
    dashas: (dasha?.periods || []).slice(0, 9).map((d, i) => ({
      period: d.lord_name,
      label: 'Mahadasha',
      start: d.start,
      end: d.end,
      color: ['#c9a66b', '#7ec8c9', '#ed9e7a', '#a67ec9', '#c97e93', '#7ec98a', '#d4b483', '#5a9bc9', '#c9917e'][i % 9],
      children: d.children || [],
    })),
    source: `${panchanga?.date_local || 'Hora'} • ${panchanga?.tithi?.[0]?.name || 'Panchanga'}`,
    birthData,
    // Deep technical payloads from the Hora Calculation API
    rawRasi: rasi,
    rawPanchanga: panchanga,
    rawDasha: dasha,
    shodasavarga: shodasavarga?.charts || null,
    aspects: aspects || null,
    yogas: yogas || null,
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors())
app.use(express.json({ limit: '1mb' }))

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

/** Compute all chart components with graceful fallbacks for optional sub-calculations. */
async function computeChart(name, birthData) {
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

  // Fetch aspects if rasi succeeded
  let aspects = null
  try {
    const rasisMap = {}
    for (const g of rasi.grahas || []) {
      rasisMap[g.id] = g.rasi
    }
    aspects = await horaFetch('/v1/aspect/chart', {
      rasis: rasisMap,
      lagna_rasi: rasi.lagna?.rasi ?? 0,
      rahu_ketu_aspects: true,
    })
  } catch (err) {
    // Aspects can be calculated client-side in adapter if endpoint fails
  }

  // Fetch yogas if rasi succeeded
  let yogas = null
  try {
    const rasisMap = {}
    for (const g of rasi.grahas || []) {
      rasisMap[g.id] = g.rasi
    }
    yogas = await horaFetch('/v1/planetary-yoga/chart', {
      rasis: rasisMap,
      lagna_rasi: rasi.lagna?.rasi ?? 0,
      include_nodes: true,
    })
  } catch (err) {
    // Yogas can be calculated client-side in adapter if endpoint fails
  }

  return buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog, shodasavarga, aspects, yogas)
}

// ---------------------------------------------------------------------------
// Live chart: Compute a fresh chart via the Python Hora API
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
// Saved charts: CRUD against SQLite
// ---------------------------------------------------------------------------

app.get('/api/charts', (_req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, birth_data, payload FROM charts ORDER BY created_at DESC').all()
    const charts = rows.map((row) => {
      let payload = {}
      let birthData = null
      try { if (row.payload) payload = JSON.parse(row.payload) } catch {}
      try { if (row.birth_data) birthData = JSON.parse(row.birth_data) } catch {}
      return {
        ...payload,
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
    return res.json({
      ...payload,
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
  console.log(`  → Hora engine at ${HORA_API}`)
  console.log(`  → SQLite at ${dbPath}`)
})
