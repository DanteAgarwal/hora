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
function buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog) {
  const ordinal = (n) => {
    const r = n % 100
    if (r >= 11 && r <= 13) return `${n}th`
    return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
  }

  const planets = (rasi?.grahas || []).map((p) => ({
    name: p.name,
    sign: p.rasi_name,
    degree: p.dms || `${p.degrees_in_rasi.toFixed(0)}°`,
    nakshatra: `${p.nakshatra_name} • Pada ${p.pada}`,
    house: ordinal(p.house),
    houseNumber: p.house,
    retrograde: Boolean(p.retrograde),
    combust: Boolean(p.combust),
    status: p.dignity || 'Calculated',
  }))

  const houses = (rasi?.bhavas || []).map((b) => ({
    number: b.house,
    name: `${ordinal(b.house)} House`,
    sign: b.rasi_name,
    lord: '—',
    occupants: planets.filter((p) => p.houseNumber === b.house).map((p) => p.name),
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
    vargas: (vargaCatalog?.named || []).slice(0, 5).map((v) => ({
      code: v.code,
      title: v.name,
      purpose: `${v.divisions} divisions`,
      status: 'Available',
    })),
    dashas: (dasha?.periods || []).slice(0, 3).map((d, i) => ({
      period: d.lord_name,
      label: ['Mahadasha', 'Antardasha', 'Pratyantardasha'][i] || 'Period',
      start: d.start,
      end: d.end,
      color: ['#c9a66b', '#7ec8c9', '#ed9e7a'][i % 3],
    })),
    source: `${panchanga?.date_local || 'Hora'} • ${panchanga?.tithi?.[0]?.name || 'Panchanga'}`,
    birthData,
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
  const [rasiResult, panchangaResult, dashaResult, vargaResult] = await Promise.allSettled([
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
  ])

  if (rasiResult.status !== 'fulfilled') {
    throw rasiResult.reason
  }

  const rasi = rasiResult.value
  const panchanga = panchangaResult.status === 'fulfilled' ? panchangaResult.value : null
  const dasha = dashaResult.status === 'fulfilled' ? dashaResult.value : null
  const vargaCatalog = vargaResult.status === 'fulfilled' ? vargaResult.value : null

  return buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog)
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
