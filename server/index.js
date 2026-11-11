const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const { buildChartFromMaster, normalizeDashaTreeNode } = require('./services/chartBuilder')
const { parseSignIndex, formatDms } = require('./services/astroConstants')

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

/** Compute all chart components via Python Hora Master Engine. */
async function computeChart(name, birthData) {
  const master = await horaFetch('/v1/chart/master', birthData)
  return buildChartFromMaster(name, birthData, master)
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ---------------------------------------------------------------------------
// Health check: confirms Node server is up and tests Hora Python API
// ---------------------------------------------------------------------------

app.get('/api/health', async (_req, res) => {
  let horaStatus = 'unknown'
  let horaVersion = null

  try {
    const h = await horaFetch('/v1/reference/sources')
    horaStatus = 'ok'
    horaVersion = 'connected'
  } catch (err) {
    horaStatus = 'unreachable'
    horaVersion = err.message
  }

  res.json({
    status: 'ok',
    db: dbPath,
    hora_api: HORA_API,
    hora_status: horaStatus,
    hora_version: horaVersion,
  })
})

// ---------------------------------------------------------------------------
// Live chart: Compute a fresh chart via the Python Hora API Master Engine
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
// Proxy route for direct Python API access
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
// Backend Dasha Expansion & Timing Endpoints (Delegated to Python)
// ---------------------------------------------------------------------------

app.post(['/api/dasha/expand', '/api/dasha/subperiods'], async (req, res) => {
  try {
    const parent = req.body?.parent || req.body
    if (!parent || (!parent.lord && !parent.lord_name && !parent.period)) {
      return res.status(400).json({ error: 'parent dasha period with lord is required' })
    }
    const targetLevel = req.body?.targetLevel || req.body?.target_level || ((parent.level || 1) + 1)

    const pythonRes = await horaFetch('/v1/dasha/expand', {
      parent,
      target_level: targetLevel,
      system: req.body?.system || 'vimshottari',
    })

    return res.json({
      parent,
      targetLevel,
      target_level: targetLevel,
      subperiods: (pythonRes.subperiods || []).map((c) => normalizeDashaTreeNode(c, targetLevel)),
    })
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/dasha/active-chain', async (req, res) => {
  try {
    const result = await horaFetch('/v1/dasha', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Astrological Analysis Endpoints (Delegated directly to Python)
// ---------------------------------------------------------------------------

app.post('/api/analysis/special-lagnas', async (req, res) => {
  try {
    const result = await horaFetch('/v1/special-lagnas', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/upagrahas', async (req, res) => {
  try {
    const result = await horaFetch('/v1/upagrahas', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/shadbala', async (req, res) => {
  try {
    const result = await horaFetch('/v1/strength/graha-balas', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/aspects-matrix', async (req, res) => {
  try {
    const result = await horaFetch('/v1/aspects/chart', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/arudhas', async (req, res) => {
  try {
    const result = await horaFetch('/v1/arudha/table', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/baadhakas', async (req, res) => {
  try {
    const result = await horaFetch('/v1/baadhakas/chart', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/marakas', async (req, res) => {
  try {
    const result = await horaFetch('/v1/marakas', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/analysis/ashtakavarga', async (req, res) => {
  try {
    const result = await horaFetch('/v1/ashtakavarga/chart', req.body)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/analysis/functional/:lagna', async (req, res) => {
  try {
    const lagna = parseInt(req.params.lagna, 10) || 0
    const result = await horaFetch(`/v1/functional/lagna?sign=${lagna}`)
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/book-charts', async (_req, res) => {
  try {
    const result = await horaFetch('/v1/book-charts')
    return res.json(result)
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message })
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

// ---------------------------------------------------------------------------
// Live Gochara (Transits) & Sade Sati Tracker (Delegated to Python)
// ---------------------------------------------------------------------------

app.post('/api/transits/live', async (req, res) => {
  try {
    const { chartId, chart: incomingChart, transitDate, place, tz_name } = req.body

    let natalChart = incomingChart
    if (!natalChart && chartId) {
      const row = db.prepare('SELECT payload, birth_data FROM charts WHERE id = ?').get(chartId)
      if (row) {
        let payload = {}
        try { if (row.payload) payload = JSON.parse(row.payload) } catch {}
        natalChart = payload
      }
    }

    if (!natalChart) {
      return res.status(400).json({ error: 'Natal chart data or valid chartId is required' })
    }

    const tDate = transitDate ? new Date(transitDate) : new Date()
    const targetPlace = place || natalChart.birthData?.place || { name: 'New Delhi', latitude: 28.6139, longitude: 77.2090 }
    const tzName = tz_name || natalChart.birthData?.tz_name || 'Asia/Kolkata'

    const natalMoon = (natalChart.planets || []).find((p) => p.name === 'Moon')
    const natalMoonLon = natalMoon?.longitude ?? 0
    let natalLagnaSignIdx = 0
    if (natalChart.quickFacts?.lagna) {
      natalLagnaSignIdx = parseSignIndex(natalChart.quickFacts.lagna)
    } else if (natalChart.houses?.[0]?.signNumber) {
      natalLagnaSignIdx = natalChart.houses[0].signNumber - 1
    }

    const natalBavMap = {}
    if (natalChart.ashtakavarga?.bav) {
      for (const [pName, bavRow] of Object.entries(natalChart.ashtakavarga.bav)) {
        natalBavMap[pName] = Array.isArray(bavRow) ? bavRow : (bavRow.scores || bavRow.rekhas || [])
      }
    }

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
  } catch (err) {
    console.error('[Transits API Error]', err)
    return res.status(err.status || 500).json({ error: err.message || 'Failed to compute live transits' })
  }
})

// ---------------------------------------------------------------------------
// Saved charts: CRUD against SQLite
// ---------------------------------------------------------------------------

function enrichLegacyPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  return payload
}

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
        !payload.shadbala ||
        !payload.specialLagnas

      if (bdata && bdata.year && needsUpgrade) {
        try {
          const fresh = await computeChart(row.name, bdata)
          db.prepare('UPDATE charts SET payload = ? WHERE id = ?').run(JSON.stringify(fresh), row.id)
          console.log(`[AutoUpgrade] Chart ${row.id} ("${row.name}") successfully upgraded with master engine.`)
        } catch (e) {
          console.warn(`[AutoUpgrade] Could not recompute chart ${row.id}:`, e.message)
        }
      }
    }
  } catch (err) {
    console.warn('[AutoUpgrade] Error:', err.message)
  }
}

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
app.use(express.static(frontendDist))
app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
    const indexPath = path.join(frontendDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
  }
  next()
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Kundli Workbench API running on http://localhost:${port}`)
  setTimeout(autoUpgradeSavedCharts, 1000)
})
