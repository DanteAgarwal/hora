/**
 * Master Chart Assembly & Enrichment Service
 * Kundli Workbench Server Core
 * 
 * Computes and unites all astrological calculations into a complete AstroChart domain object
 */


const {
  SIGN_NAMES,
  SIGN_LORDS,
  PLANET_META,
  NAKSHATRA_LORDS,
  PLANET_NATURAL_KARAKAS,
  getOrdinal,
  formatDms,
  parseSignIndex,
} = require('./astroConstants')

const {
  deriveDignity,
  computeDignityOverview,
} = require('./dignityService')

const {
  calculateAspectsForChart,
} = require('./aspectsService')

const {
  deriveHouseCategories,
  enrichHouses,
} = require('./housesService')

const {
  computeCharaKarakas,
  computeFunctionalRoles,
} = require('./karakasService')

const {
  computePurusharthaBalance,
} = require('./purusharthaService')

const {
  buildShodasavargaCharts,
  buildVargaComparison,
} = require('./vargasService')

const {
  normalizeDashaTreeNode,
  expandDashaSubPeriodsBackend,
  computeActiveDashaChainBackend,
  calculateSambhandhaBackend,
} = require('./dashaService')

const {
  computeArudhaPadas,
} = require('./arudhasService')

const {
  computeBaadhakas,
  computeMarakas,
} = require('./longevityService')

const {
  normalizeAshtakavarga,
} = require('./ashtakavargaService')

const {
  computeShadbala,
} = require('./shadbalaService')

/**
 * Normalizes classical planetary yogas from the Hora API
 */
function normalizePlanetaryYogas(rawYogas, lagnaSignIndex = 0) {
  if (!rawYogas) return []

  const list = Array.isArray(rawYogas)
    ? rawYogas
    : Array.isArray(rawYogas.yogas)
      ? rawYogas.yogas
      : []

  const killedSet = new Set(
    Array.isArray(rawYogas?.results_killed_by_kemadruma) ? rawYogas.results_killed_by_kemadruma : []
  )

  return list.map((y) => {
    const rawGroup = (y.group || 'General').toLowerCase()
    let group = 'Other'
    if (rawGroup.includes('raja')) group = 'Raja'
    else if (rawGroup.includes('dhana')) group = 'Dhana'
    else if (rawGroup.includes('mahapurusha')) group = 'Mahapurusha'
    else if (rawGroup.includes('chandra') || rawGroup.includes('lunar')) group = 'Chandra'
    else if (rawGroup.includes('ravi') || rawGroup.includes('solar')) group = 'Ravi'
    else if (rawGroup.includes('naabhasa') || rawGroup.includes('nabhasa')) group = 'Nabhasa'
    else if (rawGroup.includes('vipareeta')) group = 'Vipareeta'
    else if (rawGroup.includes('popular') || rawGroup.includes('general')) group = 'General'

    const participants = Array.isArray(y.participants)
      ? y.participants.map((p) => (typeof p === 'string' ? p : p.graha_name || p.name || ''))
      : []

    // Derive houses involved from participants and lagna if not explicitly provided
    let housesInvolved = y.houses_involved || y.housesInvolved
    if ((!housesInvolved || housesInvolved.length === 0) && Array.isArray(y.participants)) {
      const houseSet = new Set()
      for (const p of y.participants) {
        if (p && typeof p.sign === 'number') {
          houseSet.add(((p.sign - lagnaSignIndex + 12) % 12) + 1)
        }
      }
      if (houseSet.size > 0) {
        housesInvolved = Array.from(houseSet).sort((a, b) => a - b)
      }
    }

    const isKilled = killedSet.has(y.key)
    const strength = isKilled ? 'Killed by Kemadruma' : y.weakened ? 'Low' : 'High'
    let effects = y.effects || (Array.isArray(y.qualifiers) && y.qualifiers.length > 0 ? y.qualifiers.join(', ') : undefined)
    if (isKilled && (!effects || !effects.includes('Kemadruma'))) {
      effects = effects ? `${effects} (Fruits cancelled by Kemadruma Yoga)` : 'Fruits cancelled by Kemadruma Yoga'
    }

    return {
      key: y.key || (y.name ? y.name.toLowerCase().replace(/\s+/g, '_') : 'yoga'),
      name: y.name || 'Planetary Yoga',
      sanskritName: y.sanskrit_name || y.sanskritName || y.name,
      group,
      definition: y.definition || y.reason || '',
      effects,
      present: Boolean(y.present),
      strength,
      participants,
      housesInvolved: housesInvolved || undefined,
      reason: y.reason || undefined,
    }
  })
}

/**
 * Builds the complete, fully enriched AstroChart payload
 */
function buildEnrichedChart(
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
  rawArudhas = null,
  rawBaadhakas = null,
  rawMarakas = null,
  rawAshtakavarga = null,
  rawArgalas = null,
  rawFunctional = null,
  vakriAnalysis = null,
  rawSpecialLagnas = null,
  rawUpagrahas = null
) {
  const lagnaRasi = rasi?.lagna
  let lagnaSignIndex = 0
  let lagnaDms = '0°00\'00"'

  if (lagnaRasi) {
    lagnaSignIndex = lagnaRasi.rasi ?? parseSignIndex(lagnaRasi.rasi_name)
    const lDeg = lagnaRasi.degrees_in_rasi !== undefined ? lagnaRasi.degrees_in_rasi : (lagnaRasi.longitude != null ? lagnaRasi.longitude % 30 : 0)
    lagnaDms = formatDms(lDeg)
  }

  // 1. Process Planets
  const rawGrahas = rasi?.grahas || []
  const planets = []

  for (let i = 0; i < rawGrahas.length; i++) {
    const p = rawGrahas[i]
    const pName = p.name || 'Unknown'
    const signIndex = p.rasi !== undefined ? p.rasi : parseSignIndex(p.rasi_name || p.sign)
    const signName = SIGN_NAMES[signIndex] || p.rasi_name || 'Aries'
    const degreeInSign = p.degrees_in_rasi !== undefined ? p.degrees_in_rasi : (p.longitude != null ? p.longitude % 30 : 0)
    let dms = formatDms(degreeInSign)
    if (typeof p.dms === 'string' && p.dms.includes('°')) {
      dms = p.dms
    } else if (typeof p.dms === 'string' && p.dms.includes('-')) {
      const parts = p.dms.split('-')
      if (parts.length >= 3) {
        dms = `${parts[0]}°${parts[1].padStart(2, '0')}'${parts[2].padStart(2, '0')}"`
      }
    }
    const longitude = p.longitude !== undefined ? p.longitude : signIndex * 30 + degreeInSign
    const houseNumber = p.house || (((signIndex - lagnaSignIndex + 12) % 12) + 1)
    const meta = PLANET_META[pName] || { sanskrit: pName, symbol: '✦', short: pName.slice(0, 2) }
    const dignity = deriveDignity(pName, signIndex, p.dignity)
    const dispositor = SIGN_LORDS[signName] || '—'

    // Nakshatra and Pada
    const nakNum = typeof p.nakshatra === 'number' ? p.nakshatra : (parseInt(p.nakshatra, 10) || 1)
    const nakLord = NAKSHATRA_LORDS[(nakNum - 1) % 9] || '—'
    const nakName = p.nakshatra_name || 'Ashwini'
    const pada = p.pada || 1

    // Parashari Lord of Houses
    let lordOfHouses = []
    if (Array.isArray(p.lord_of_houses) && p.lord_of_houses.length > 0) {
      lordOfHouses = [...p.lord_of_houses]
    } else {
      for (let h = 1; h <= 12; h++) {
        const hSignIdx = (lagnaSignIndex + (h - 1)) % 12
        if (SIGN_LORDS[SIGN_NAMES[hSignIdx]] === pName) {
          lordOfHouses.push(h)
        }
      }
    }

    planets.push({
      id: p.id !== undefined ? p.id : i,
      name: pName,
      sanskritName: meta.sanskrit,
      symbol: meta.symbol,
      short: meta.short,
      sign: signName,
      signNumber: signIndex + 1,
      signIndex,
      degreeInSign,
      dms,
      longitude,
      latitude: p.latitude,
      speed: p.speed,
      retrograde: Boolean(p.retrograde),
      combust: Boolean(p.combust),
      houseNumber,
      houseOrdinal: getOrdinal(houseNumber),
      houseLabels: p.house_labels || deriveHouseCategories(houseNumber),
      nakshatra: nakName,
      nakshatraNumber: nakNum,
      nakshatraLord: nakLord,
      pada,
      dignity,
      lordOfHouses,
      dispositor,
      sunSeparation: p.sun_separation,
      naturalKaraka: PLANET_NATURAL_KARAKAS[pName] || '—',
      aspectsCast: [],
      aspectsReceived: [],
      vakri: vakriAnalysis?.planets?.[pName] || null,
    })
  }

  // 2. Compute Chara Karakas & Functional Roles
  computeCharaKarakas(planets)
  computeFunctionalRoles(planets)

  // 3. Process Houses
  const houses = enrichHouses(rasi?.bhavas, lagnaSignIndex, planets)

  // 4. Parashari Drishti (Aspects Cast, Received, and Aspects Matrix)
  const aspectsMatrix = calculateAspectsForChart(planets, houses, lagnaSignIndex)

  // 5. Dignity & Strength Overview (Digbala, Combustion, Neecha Bhanga)
  const dignityOverview = computeDignityOverview(planets)

  dignityOverview.forEach((d) => {
    const pl = planets.find((p) => p.name === d.name)
    if (pl) {
      pl.digbalaScore = d.digbalaScore
      pl.digbalaPeakHouse = d.digbalaPeakHouse
      pl.digbalaStatus = d.digbalaStatus
      pl.combustionDegrees = d.combustionDegrees
      pl.combustionStatus = d.combustionStatus
      pl.isNeechaBhanga = d.isNeechaBhanga
      pl.neechaBhangaReason = d.neechaBhangaReason
    }
  })

  // 6. Arudhas (A1-A12, AL, UL)
  const arudhaResult = computeArudhaPadas(lagnaSignIndex, planets, rawArudhas)

  // 7. Baadhakas & Marakas
  const baadhakaResult = computeBaadhakas(lagnaSignIndex, planets, rawBaadhakas)
  const marakaResult = computeMarakas(lagnaSignIndex, planets, rawMarakas)

  // 8. Ashtakavarga (SAV & BAV)
  const ashtakavargaResult = normalizeAshtakavarga(rawAshtakavarga, lagnaSignIndex, planets)

  // 9. Enrich Houses with Arudhas, Baadhaka sthana, SAV, and Argalas
  houses.forEach((h) => {
    const pada = arudhaResult.padas.find((p) => p.house === h.number)
    h.arudhaPada = pada ? pada.symbol : `A${h.number}`
    h.arudhaPadaName = pada ? pada.name : `Arudha Pada ${h.number}`
    h.arudhasHere = arudhaResult.arudhasByHouse[h.number] || []
    h.isBaadhakaSthana = h.number === baadhakaResult.baadhakaHouse
    h.isMarakaHouse = [2, 7].includes(h.number)

    const savEntry = ashtakavargaResult.savByHouse[h.number]
    if (savEntry) {
      h.savPoints = savEntry.rekhas
      h.savGrade = savEntry.grade
    }

    if (rawArgalas && Array.isArray(rawArgalas.houses)) {
      const arg = rawArgalas.houses.find((a) => a.house === h.number)
      if (arg) h.argalas = arg
    }
  })

  // 10. Enrich Planets with Baadhaka, Maraka, Ashtakavarga BAV, and Functional details
  planets.forEach((pl) => {
    // Baadhaka status
    const isB = baadhakaResult.lords.includes(pl.name) || baadhakaResult.occupants.includes(pl.name)
    pl.isBaadhaka = isB
    if (isB) {
      pl.baadhakaReason = baadhakaResult.lords.includes(pl.name)
        ? `Lord of Baadhaka Sthana (${baadhakaResult.baadhakaSignName})`
        : `Occupies Baadhaka Sthana (${baadhakaResult.baadhakaSignName})`
    }

    // Maraka status
    const mg = marakaResult.marakaGrahas.find((m) => m.grahaName === pl.name)
    pl.isMaraka = Boolean(mg)
    if (mg) {
      pl.marakaKind = mg.kind
      pl.marakaReasons = mg.reasons || []
    }

    // Ashtakavarga BAV points in occupied sign
    const bav = ashtakavargaResult.bavByPlanet[pl.name]
    if (bav) {
      pl.bavPoints = bav.rekhas
      pl.bavGrade = bav.grade
    }

    // Authoritative Functional classification from Hora API Table 30
    if (rawFunctional && Array.isArray(rawFunctional.planets)) {
      const fnP = rawFunctional.planets.find((f) => f.planet === pl.name)
      if (fnP) {
        pl.functionalNature = fnP.nature
        pl.functionalWhy = fnP.why
        if (fnP.yogakaraka) {
          pl.functionalType = 'Yogakaraka'
          pl.isYogakaraka = true
        }
      }
    }
  })

  // 11. Purushartha & Stanza Balance
  const purusharthaBalance = computePurusharthaBalance(planets)

  // 12. Shodasavarga Divisional Charts & Comparison
  const lagnaLon = rasi?.lagna?.longitude != null ? rasi.lagna.longitude : (lagnaSignIndex * 30 + 15)
  const vargas = buildShodasavargaCharts(shodasavarga?.charts || shodasavarga, lagnaSignIndex, planets, lagnaDms, lagnaLon)
  const vargaComparison = buildVargaComparison(vargas['D1'], vargas['D9'], planets)

  // 12b. Special Lagnas & Upagrahas
  const specialPoints = computeAllSpecialPoints(rawSpecialLagnas, rawUpagrahas, lagnaSignIndex, planets, birthData)

  // 12c. Classical Parashari Shadbala (Six-Fold Strength)
  const shadbala = computeShadbala(planets, vargas, birthData)
  planets.forEach((p) => {
    const pShad = shadbala.planets.find((x) => x.name === p.name)
    if (pShad) {
      p.shadbala = pShad
    }
  })

  // 13. Dashas & Running Chain
  const rawPeriods = dasha?.periods || dasha?.dashas || []
  const dashas = rawPeriods.slice(0, 9).map((d, i) => {
    const norm = normalizeDashaTreeNode(d, 1)
    if (norm) {
      norm.color = ['#c9a66b', '#7ec8c9', '#ed9e7a', '#a67ec9', '#c97e93', '#7ec98a', '#d4b483', '#5a9bc9', '#c9917e'][i % 9]
      norm.label = 'Mahadasha'
      if (!norm.children || norm.children.length === 0) {
        norm.children = expandDashaSubPeriodsBackend(norm, 2)
      }
    }
    return norm
  }).filter(Boolean)

  const activeDashaChain = computeActiveDashaChainBackend(dashas, new Date(), planets)
  const runningDasha = activeDashaChain.map((c) => c.lord || c.lord_name)

  // 14. Classical Sambhandha Matrix for all pairs of planets
  const sambhandhaMatrix = {}
  const grahaNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
  for (const lA of grahaNames) {
    sambhandhaMatrix[lA] = {}
    for (const lB of grahaNames) {
      sambhandhaMatrix[lA][lB] = calculateSambhandhaBackend(lA, lB, { planets })
    }
  }

  const moon = planets.find((p) => p.name === 'Moon')
  const sun = planets.find((p) => p.name === 'Sun')

  const dateFormatted = rasi?.input?.local_time
    ? String(rasi.input.local_time).slice(0, 10)
    : `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`
  const timeFormatted = rasi?.input?.local_time
    ? String(rasi.input.local_time).slice(11, 16)
    : `${String(birthData.hour).padStart(2, '0')}:${String(birthData.minute).padStart(2, '0')}`

  const location = rasi?.input?.place?.name || birthData.place?.name || ''
  const latitude = `${rasi?.input?.place?.latitude ?? birthData.place?.latitude ?? ''}°`
  const longitude = `${rasi?.input?.place?.longitude ?? birthData.place?.longitude ?? ''}°`
  const timezone = rasi?.input?.timezone || birthData.tz_name || ''
  const ayanamsaName = rasi?.settings?.ayanamsa || 'Lahiri'
  const ayanamsaDms = rasi?.ayanamsa?.dms || 'Unavailable'
  const calculationSettings = `${ayanamsaName} ayanamsha • ${rasi?.settings?.house_system || 'Whole Sign'} houses`

  const allYogasCatalog = normalizePlanetaryYogas(yogas, lagnaSignIndex)
  const activeYogas = allYogasCatalog.filter((y) => y.present)

  return {
    name,
    date: dateFormatted,
    time: timeFormatted,
    location,
    latitude,
    longitude,
    timezone,
    lagna: `${SIGN_NAMES[lagnaSignIndex]} ${lagnaDms}`,
    moon: moon ? `${moon.sign} ${moon.dms}` : 'Unavailable',
    moonNakshatra: moon ? `${moon.nakshatra} • Pada ${moon.pada}` : 'Unavailable',
    sunSign: sun ? sun.sign : 'Unavailable',
    currentMahadasha: runningDasha.length ? runningDasha.join(' / ') : 'Unavailable',
    ayanamsa: ayanamsaDms,
    calculationSettings,
    birthData,
    metadata: {
      dateFormatted,
      timeFormatted,
      location,
      latitude,
      longitude,
      timezone,
      ayanamsaName,
      ayanamsaDms,
      calculationSettings,
      source: `${panchanga?.date_local || 'Hora Engine (FastAPI 8000)'} • ${panchanga?.tithi?.[0]?.name || 'Panchanga'}`,
    },
    quickFacts: {
      lagna: SIGN_NAMES[lagnaSignIndex],
      lagnaDms,
      sunSign: sun ? sun.sign : 'Unavailable',
      moonSign: moon ? moon.sign : 'Unavailable',
      moonDms: moon ? moon.dms : 'Unavailable',
      moonNakshatra: moon ? moon.nakshatra : 'Unavailable',
      moonPada: moon ? moon.pada : 1,
      currentMahadasha: runningDasha[0] || 'Unavailable',
      currentAntardasha: runningDasha[1] || 'Unavailable',
      currentPratyantardasha: runningDasha[2] || undefined,
    },
    planets,
    houses,
    vargas,
    vargaComparison,
    shadbala,
    specialLagnas: specialPoints.specialLagnas,
    upagrahas: specialPoints.upagrahas,
    specialPoints,
    dashas,
    dashaTree: dashas,
    activeDashaChain,
    runningDasha,
    sambhandhaMatrix,
    aspectsMatrix,
    dignityOverview,
    purusharthaBalance,
    arudhas: arudhaResult,
    baadhakas: baadhakaResult,
    marakas: marakaResult,
    ashtakavarga: ashtakavargaResult,
    argalas: rawArgalas || null,
    functional: rawFunctional || null,
    vakriAnalysis: vakriAnalysis || null,
    yogas: activeYogas,
    allYogasCatalog,
    panchanga,
    aspects,
    relationships: relationships || null,
    // Preserved raw calculation outputs
    raw: {
      rasi,
      panchanga,
      dasha,
      shodasavarga: shodasavarga?.charts || shodasavarga,
      vargaCatalog,
      yogas,
      relationships,
      arudhas: rawArudhas,
      baadhakas: rawBaadhakas,
      marakas: rawMarakas,
      ashtakavarga: rawAshtakavarga,
      argalas: rawArgalas,
      functional: rawFunctional,
      specialLagnas: rawSpecialLagnas,
      upagrahas: rawUpagrahas,
    },
    rawRasi: rasi,
    rawPanchanga: panchanga,
    rawDasha: dasha,
    shodasavarga: shodasavarga?.charts || shodasavarga,
  }
}

module.exports = {
  buildEnrichedChart,
}
