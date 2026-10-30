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

const VIMSHOTTARI_CYCLE = [
  { name: 'Ketu', years: 7 },
  { name: 'Venus', years: 20 },
  { name: 'Sun', years: 6 },
  { name: 'Moon', years: 10 },
  { name: 'Mars', years: 7 },
  { name: 'Rahu', years: 18 },
  { name: 'Jupiter', years: 16 },
  { name: 'Saturn', years: 19 },
  { name: 'Mercury', years: 17 },
]

const NATURAL_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutrals: ['Mercury'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [], neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutrals: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutrals: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutrals: ['Saturn'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutrals: ['Mars', 'Jupiter'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutrals: ['Jupiter'] },
  Rahu: { friends: ['Venus', 'Saturn', 'Mercury'], enemies: ['Sun', 'Moon', 'Mars'], neutrals: ['Jupiter'] },
  Ketu: { friends: ['Mars', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon'], neutrals: ['Mercury', 'Jupiter'] },
}

/** Recursively normalize dasha periods into clean domain objects */
function normalizeDashaTreeNode(p, level = 1) {
  if (!p) return null
  const lordName = p.lord_name || p.lord || p.period || 'Unknown'
  const nodeLevel = p.level || level
  const nodeStart = p.start || ''
  const nodeEnd = p.end || ''
  const startMs = new Date(nodeStart).getTime()
  const endMs = new Date(nodeEnd).getTime()
  const durationDays = p.duration_days ?? p.durationDays ?? (isNaN(startMs) || isNaN(endMs) ? 0 : Math.round((endMs - startMs) / (24 * 3600 * 1000)))

  return {
    lord: lordName,
    lord_name: lordName,
    period: lordName,
    level: nodeLevel,
    start: nodeStart,
    end: nodeEnd,
    start_jd: p.start_jd,
    end_jd: p.end_jd,
    durationDays,
    duration_days: durationDays,
    children: Array.isArray(p.children)
      ? p.children.map((c) => normalizeDashaTreeNode(c, nodeLevel + 1)).filter(Boolean)
      : [],
  }
}

/**
 * Backend dasha sub-period expansion down to any target level (Level 1..6)
 */
function expandDashaSubPeriodsBackend(parent, targetLevel = (parent?.level || 1) + 1) {
  if (!parent) return []
  const currentLevel = parent.level || 1
  if (targetLevel <= currentLevel) return []

  const parentLordClean = (parent.lord_name || parent.lord || parent.period || '').trim().toLowerCase()
  let parentLordIdx = VIMSHOTTARI_CYCLE.findIndex(
    (v) => v.name.toLowerCase() === parentLordClean
  )
  if (parentLordIdx < 0) parentLordIdx = 0
  const parentYears = VIMSHOTTARI_CYCLE[parentLordIdx].years

  let startMs = parent.start ? new Date(parent.start).getTime() : NaN
  let endMs = parent.end ? new Date(parent.end).getTime() : NaN
  if (isNaN(startMs)) {
    startMs = Date.now()
  }
  if (isNaN(endMs) || endMs <= startMs) {
    const fraction = currentLevel === 1 ? parentYears : parentYears / 120
    const durationMs = fraction * 365.25 * 24 * 3600 * 1000
    endMs = startMs + durationMs
  }

  const spanMs = endMs - startMs
  const nextLevel = currentLevel + 1
  const children = []
  let cursor = startMs

  for (let k = 0; k < 9; k++) {
    const subIdx = (parentLordIdx + k) % 9
    const subMeta = VIMSHOTTARI_CYCLE[subIdx]
    const subFraction = subMeta.years / 120
    const subSpanMs = spanMs * subFraction
    const subStart = new Date(cursor)
    const subEnd = new Date(cursor + subSpanMs)

    const childNode = {
      lord: subMeta.name,
      lord_name: subMeta.name,
      period: subMeta.name,
      level: nextLevel,
      start: subStart.toISOString().replace('T', ' ').slice(0, nextLevel >= 5 ? 19 : nextLevel >= 4 ? 16 : 10),
      end: subEnd.toISOString().replace('T', ' ').slice(0, nextLevel >= 5 ? 19 : nextLevel >= 4 ? 16 : 10),
      durationDays: subSpanMs / (24 * 3600 * 1000),
      duration_days: subSpanMs / (24 * 3600 * 1000),
      children: [],
    }

    if (nextLevel < targetLevel) {
      childNode.children = expandDashaSubPeriodsBackend(childNode, targetLevel)
    }

    children.push(childNode)
    cursor += subSpanMs
  }

  return children
}

/**
 * Computes the complete 6-level active running chain (MD, AD, PD, SD, PrD, DD) on the backend
 */
function computeActiveDashaChainBackend(dashas, targetDate = new Date()) {
  const targetMs = typeof targetDate === 'number' ? targetDate : new Date(targetDate).getTime()
  const chain = []
  if (!Array.isArray(dashas) || dashas.length === 0) return chain

  // 1. Mahadasha
  const md = dashas.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || dashas[0]
  if (!md) return chain

  chain.push({ level: 1, levelLabel: 'MD', lord: md.lord || md.period, period: md })

  // 2. Antardasha (AD)
  const adList = (md.children && md.children.length > 0) ? md.children : expandDashaSubPeriodsBackend(md, 2)
  const ad = adList.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || adList[0]
  if (!ad) return chain

  chain.push({ level: 2, levelLabel: 'AD', lord: ad.lord, period: ad })

  // 3. Pratyantardasha (PD)
  const pdList = (ad.children && ad.children.length > 0) ? ad.children : expandDashaSubPeriodsBackend(ad, 3)
  const pd = pdList.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || pdList[0]
  if (!pd) return chain

  chain.push({ level: 3, levelLabel: 'PD', lord: pd.lord, period: pd })

  // 4. Sookshma (SD)
  const sdList = (pd.children && pd.children.length > 0) ? pd.children : expandDashaSubPeriodsBackend(pd, 4)
  const sd = sdList.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || sdList[0]
  if (!sd) return chain

  chain.push({ level: 4, levelLabel: 'SD', lord: sd.lord, period: sd })

  // 5. Prana (PrD)
  const prdList = (sd.children && sd.children.length > 0) ? sd.children : expandDashaSubPeriodsBackend(sd, 5)
  const prd = prdList.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || prdList[0]
  if (!prd) return chain

  chain.push({ level: 5, levelLabel: 'PrD', lord: prd.lord, period: prd })

  // 6. Deha (DD)
  const ddList = (prd.children && prd.children.length > 0) ? prd.children : expandDashaSubPeriodsBackend(prd, 6)
  const dd = ddList.find((d) => {
    const s = new Date(d.start).getTime()
    const e = new Date(d.end).getTime()
    return targetMs >= s && targetMs <= e
  }) || ddList[0]
  if (dd) {
    chain.push({ level: 6, levelLabel: 'DD', lord: dd.lord, period: dd })
  }

  return chain
}

/**
 * Classical Vedic Sambhandha calculated on the backend
 */
function calculateSambhandhaBackend(lordA, lordB, chart) {
  if (!lordA || !lordB || !chart) return null
  const cleanA = lordA.trim().toLowerCase()
  const cleanB = lordB.trim().toLowerCase()

  const pA = (chart.planets || []).find((p) => p.name.toLowerCase() === cleanA)
  const pB = (chart.planets || []).find((p) => p.name.toLowerCase() === cleanB)

  if (!pA || !pB) return null

  const houseA = pA.houseNumber || pA.house || 1
  const houseB = pB.houseNumber || pB.house || 1

  const distFromAtoB = ((houseB - houseA + 12) % 12) + 1
  const distFromBtoA = ((houseA - houseB + 12) % 12) + 1

  let axisLabel = `${distFromAtoB}/${distFromBtoA}`
  let category = 'Dynamic Action'
  let synthesis = ''
  let bphsGuidance = ''

  if (distFromAtoB === 1) {
    axisLabel = '1/1 (Yuti / Conjunction)'
    category = 'Conjunction'
    synthesis = `Intense energy fusion in the ${ordinal(houseA)} House (${pA.sign}). The portfolios of both ${pA.name} and ${pB.name} manifest simultaneously.`
    bphsGuidance = 'Combined results of both planets manifest directly in the occupied bhava. Auspicious if both are natural benefics or functional friends; requires remedies if afflicted.'
  } else if (distFromAtoB === 7) {
    axisLabel = '1/7 (Samasaptaka / Direct Aspect)'
    category = 'Mutual Aspect'
    synthesis = `Direct polar mutual aspect across the ${ordinal(houseA)} and ${ordinal(houseB)} houses. Creates dynamic awareness, interpersonal developments, and external encounters.`
    bphsGuidance = 'Mutual activation of opposite houses. Promotes public visibility, relationship negotiations, and balancing opposing life polarities.'
  } else if (distFromAtoB === 5 || distFromAtoB === 9) {
    axisLabel = '5/9 (Nava-Panchama / Trikona)'
    category = 'Auspicious'
    synthesis = `Harmonious 5/9 Trikona axis (Lakshmi Sthana). The lords support each other naturally, bestowing divine grace, intelligence, and fortune.`
    bphsGuidance = 'Classical Brihat Parashara Hora Shastra confirms high auspiciousness. Favorable for wealth accrual, spiritual advancement, higher education, and joy from progeny.'
  } else if (distFromAtoB === 3 || distFromAtoB === 11) {
    axisLabel = '3/11 (Trishad-Aya / Upachaya)'
    category = 'Favorable Growth'
    synthesis = `Favorable 3/11 growth axis (Upachaya). Facilitates networking, enterprise, courage, friendship, and steady realization of long-held desires.`
    bphsGuidance = 'Progressive improvement over time. The sub-period rewards strategic initiative, commercial enterprise, and assistance from elder siblings or mentors.'
  } else if (distFromAtoB === 4 || distFromAtoB === 10) {
    axisLabel = '4/10 (Kendra / Quadrant)'
    category = 'Dynamic Action'
    synthesis = `Dynamic 4/10 angular alignment (Vishnu Sthana). Stimulates active public karma, career responsibilities, domestic changes, and worldly standing.`
    bphsGuidance = 'Period of visible work and decisive worldly action. Balanced effort between domestic foundations (4th) and professional leadership (10th) brings elevation.'
  } else if (distFromAtoB === 6 || distFromAtoB === 8) {
    axisLabel = '6/8 (Shadashtaka / Friction)'
    category = 'Challenging Friction'
    synthesis = `Challenging 6/8 Shadashtak axis. Brings sudden transformations, latent vulnerabilities to the surface, and tests stamina through opposition or disputes.`
    bphsGuidance = 'Classical texts advise prudence, health vigilance, and avoiding unnecessary conflicts or speculative gambles. Remedial propitiation strongly recommended.'
  } else if (distFromAtoB === 2 || distFromAtoB === 12) {
    axisLabel = '2/12 (Dwirdwadasa / Expenditure)'
    category = 'Expenditure & Shift'
    synthesis = `2/12 Dwirdwadasa axis. Points toward reallocation of resources, major financial investments, foreign travels, or inward spiritual introspection.`
    bphsGuidance = 'Funds and energy are directed toward expenses, relocations, or charitable/spiritual avenues. Focus on conserving resources and avoiding impulsive outlays.'
  }

  const normA = pA.name in NATURAL_FRIENDSHIP ? pA.name : 'Sun'
  const naturalObj = NATURAL_FRIENDSHIP[normA] || { friends: [], enemies: [], neutrals: [] }
  let natScore = 0
  let naturalMaitri = 'Neutral'
  if (naturalObj.friends.some((f) => f.toLowerCase() === cleanB)) {
    natScore = 1
    naturalMaitri = 'Friend'
  } else if (naturalObj.enemies.some((e) => e.toLowerCase() === cleanB)) {
    natScore = -1
    naturalMaitri = 'Enemy'
  }

  const isTemporalFriend = [2, 3, 4, 10, 11, 12].includes(distFromAtoB)
  const tempScore = isTemporalFriend ? 1 : -1
  const temporalMaitri = isTemporalFriend ? 'Friend' : 'Enemy'

  const totalScore = natScore + tempScore
  let compoundMaitri = 'Sama'
  if (totalScore === 2) compoundMaitri = 'Adhi-Mitra'
  else if (totalScore === 1) compoundMaitri = 'Mitra'
  else if (totalScore === 0) compoundMaitri = 'Sama'
  else if (totalScore === -1) compoundMaitri = 'Shatru'
  else if (totalScore === -2) compoundMaitri = 'Adhi-Shatru'

  return {
    distFromAtoB,
    distFromBtoA,
    axisLabel,
    category,
    naturalMaitri,
    temporalMaitri,
    compoundMaitri,
    synthesis,
    bphsGuidance,
  }
}

/** Build a unified chart payload from multiple Hora API responses. */
function buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog, shodasavarga, aspects, yogas, relationships) {

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
    dashas: (() => {
      const normalized = (dasha?.periods || []).slice(0, 9).map((d, i) => {
        const norm = normalizeDashaTreeNode(d, 1)
        norm.color = ['#c9a66b', '#7ec8c9', '#ed9e7a', '#a67ec9', '#c97e93', '#7ec98a', '#d4b483', '#5a9bc9', '#c9917e'][i % 9]
        norm.label = 'Mahadasha'
        return norm
      })
      return normalized
    })(),
    get activeDashaChain() {
      return computeActiveDashaChainBackend(this.dashas, new Date())
    },
    relationships: relationships || null,
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
    // Yogas endpoint optional
  }

  // Fetch classical relationships if rasi succeeded
  let relationships = null
  try {
    const rasisMap = {}
    for (const g of rasi.grahas || []) {
      rasisMap[g.id] = g.rasi
    }
    relationships = await horaFetch('/v1/relationship/chart', {
      rasis: rasisMap,
      include_nodes: true,
    })
  } catch (err) {
    // Relationships can be calculated via backend endpoint
  }

  return buildChartPayload(name, birthData, rasi, panchanga, dasha, vargaCatalog, shodasavarga, aspects, yogas, relationships)
}

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
 * Compute active 6-level running dasha chain (MD, AD, PD, SD, PrD, DD) on the backend
 */
app.post('/api/dasha/running-chain', (req, res) => {
  try {
    const { dashas, targetTime } = req.body || {}
    if (!dashas || !Array.isArray(dashas)) {
      return res.status(400).json({ error: 'dashas array is required' })
    }
    const chain = computeActiveDashaChainBackend(dashas, targetTime ? new Date(targetTime) : new Date())
    return res.json({ chain })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Compute classical Vedic Sambhandha on the backend
 */
app.post(['/api/relationship/sambhandha', '/api/sambhandha'], (req, res) => {
  try {
    const { lordA, lordB, chart } = req.body || {}
    if (!lordA || !lordB || !chart) {
      return res.status(400).json({ error: 'lordA, lordB, and chart are required' })
    }
    const result = calculateSambhandhaBackend(lordA, lordB, chart)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})


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
