/**
 * Master Chart Assembly & Adaptation Service
 * Kundli Workbench Server Core
 * 
 * Maps Python's authoritative single-pass master calculation into the
 * frontend AstroChart domain model. All astrological and astronomical mathematics
 * are computed strictly by Python Swiss Ephemeris kernel.
 */

const {
  SIGN_NAMES,
  SIGN_LORDS,
  PLANET_META,
  NAKSHATRA_LORDS,
  PLANET_NATURAL_KARAKAS,
  HOUSE_METADATA,
  getOrdinal,
  formatDms,
  parseSignIndex,
} = require('./astroConstants')

/**
 * Normalizes classical planetary yogas from Python
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
 * Normalizes Dasha tree node recursively
 */
function normalizeDashaTreeNode(node, level = 1) {
  if (!node) return null
  const lord = node.lord_name || node.lord || 'Sun'
  const rawChildren = node.children || node.subperiods || []
  const children = rawChildren.map((c) => normalizeDashaTreeNode(c, level + 1)).filter(Boolean)
  const colors = ['#c9a66b', '#7ec8c9', '#ed9e7a', '#a67ec9', '#c97e93', '#7ec98a', '#d4b483', '#5a9bc9', '#c9917e']
  const labels = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Praana']

  return {
    lord,
    lord_name: lord,
    period: lord,
    level,
    start: node.start,
    end: node.end,
    durationDays: node.duration_days ?? node.durationDays ?? 0,
    duration_days: node.duration_days ?? node.durationDays ?? 0,
    color: colors[(level - 1) % colors.length],
    label: labels[level - 1] || `Level ${level}`,
    children,
  }
}

/**
 * Maps Python 6-Fold Parashari Shadbala into frontend domain model
 */
function mapPlanetShadbala(pName, pVakri, pPos) {
  const s = pVakri?.shadbala
  if (!s) return null
  const totalV = s.total_shadbala_virupas || 0
  const reqV = s.required_shadbala_virupas || 390
  const ratio = s.strength_ratio || (reqV > 0 ? totalV / reqV : 1)
  const isStrong = ratio >= 1.0

  return {
    name: pName,
    sanskritName: pPos?.sanskritName,
    symbol: pPos?.symbol,
    sign: pPos?.sign,
    houseNumber: pPos?.houseNumber,
    houseOrdinal: pPos?.houseOrdinal,
    retrograde: pPos?.retrograde,
    combust: pPos?.combust,
    sthanaBala: {
      totalVirupas: s.sthana_bala_virupas || 0,
      totalRupas: Math.round(((s.sthana_bala_virupas || 0) / 60) * 100) / 100,
      uchchaBala: 0,
      saptavargajaBala: 0,
      ojhayugmaBala: 0,
      kendraBala: 0,
      drekkanaBala: 0,
    },
    digBala: {
      virupas: s.dig_bala_virupas || 0,
      rupas: Math.round(((s.dig_bala_virupas || 0) / 60) * 100) / 100,
      peakHouse: 10,
    },
    kaalaBala: {
      totalVirupas: s.kala_bala_virupas || 0,
      totalRupas: Math.round(((s.kala_bala_virupas || 0) / 60) * 100) / 100,
      nathonatha: 0,
      paksha: 0,
      tribhaga: 0,
      varshaMasaDinaHora: 0,
      ayana: 0,
      yuddha: 0,
    },
    chestaBala: {
      virupas: s.chesta_bala_virupas || 0,
      rupas: Math.round(((s.chesta_bala_virupas || 0) / 60) * 100) / 100,
      status: pVakri.motion?.category || 'direct',
    },
    naisargikaBala: {
      virupas: s.naisargika_bala_virupas || 0,
      rupas: Math.round(((s.naisargika_bala_virupas || 0) / 60) * 100) / 100,
    },
    drikBala: {
      virupas: s.drik_bala_virupas || 0,
      rupas: Math.round(((s.drik_bala_virupas || 0) / 60) * 100) / 100,
    },
    totalVirupas: totalV,
    totalRupas: s.total_shadbala_rupas || Math.round((totalV / 60) * 100) / 100,
    requiredVirupas: reqV,
    requiredRupas: s.required_shadbala_rupas || Math.round((reqV / 60) * 100) / 100,
    strengthRatio: Math.round(ratio * 1000) / 1000,
    percentage: Math.round(ratio * 100),
    isStrong,
    status: ratio >= 1.3 ? 'Exceptionally Strong' : ratio >= 1.0 ? 'Strong' : ratio >= 0.85 ? 'Moderate' : 'Deficient',
  }
}

/**
 * Builds D1 vs D9 Varga comparison
 */
function buildVargaComparisonFromMaster(d1Chart, d9Chart, planets) {
  if (!d1Chart?.grahas || !d9Chart?.grahas) return []
  return (planets || []).map((pl) => {
    const d1G = d1Chart.grahas.find((g) => g.name === pl.name)
    const d9G = d9Chart.grahas.find((g) => g.name === pl.name)
    const d1SignIdx = d1G?.rasi ?? pl.signIndex
    const d9SignIdx = d9G?.rasi ?? 0
    const isVargottama = d1SignIdx === d9SignIdx
    const d9House = d9G?.house || (((d9SignIdx - (d9Chart.lagna?.rasi || 0) + 12) % 12) + 1)
    return {
      name: pl.name,
      sanskrit: pl.sanskritName,
      symbol: pl.symbol,
      retrograde: pl.retrograde,
      combust: pl.combust,
      d1Sign: SIGN_NAMES[d1SignIdx],
      d1SignIndex: d1SignIdx,
      d1Dms: d1G?.dms || pl.dms,
      targetVargaCode: 'D9',
      targetSign: SIGN_NAMES[d9SignIdx],
      targetSignIndex: d9SignIdx,
      targetHouse: d9House,
      targetDms: d9G?.dms || '0°00\'00"',
      targetDignity: d9G?.dignity || 'Neutral',
      d9Sign: SIGN_NAMES[d9SignIdx],
      d9SignIndex: d9SignIdx,
      d9House,
      d9Dignity: d9G?.dignity || 'Neutral',
      isVargottama,
      dignityShift: isVargottama ? 'Vargottama (Auspicious)' : 'Consistent',
      shiftTone: isVargottama ? 'favorable' : 'neutral',
    }
  })
}

/**
 * Derives house categories for label chips
 */
function deriveHouseCategories(h) {
  const labels = []
  if ([1, 4, 7, 10].includes(h)) labels.push('kendra')
  if ([1, 5, 9].includes(h)) labels.push('trikona')
  if ([3, 6, 10, 11].includes(h)) labels.push('upachaya')
  if ([6, 8, 12].includes(h)) labels.push('dusthana')
  if ([2, 7].includes(h)) labels.push('maraka')
  if ([2, 5, 8, 11].includes(h)) labels.push('panaphara')
  if ([3, 6, 9, 12].includes(h)) labels.push('apoklima')
  return labels
}

/**
 * Builds the complete AstroChart domain model directly from Python's master calculation
 */
function buildChartFromMaster(name, birthData, master) {
  if (!master || !master.chart) {
    throw new Error('Invalid master chart payload returned by Python Hora engine')
  }

  const rasi = master.chart
  const lagnaRasi = rasi.lagna || {}
  const lagnaSignIndex = lagnaRasi.rasi ?? parseSignIndex(lagnaRasi.rasi_name || 'Aries')
  const lagnaDeg = lagnaRasi.degrees_in_rasi !== undefined ? lagnaRasi.degrees_in_rasi : ((lagnaRasi.longitude || 0) % 30)
  const lagnaDms = lagnaRasi.dms || formatDms(lagnaDeg)

  // 1. Planets
  const rawGrahas = rasi.grahas || []
  const planets = []

  for (let i = 0; i < rawGrahas.length; i++) {
    const p = rawGrahas[i]
    const pName = p.name || 'Unknown'
    const signIndex = p.rasi !== undefined ? p.rasi : parseSignIndex(p.rasi_name || p.sign)
    const signName = SIGN_NAMES[signIndex] || p.rasi_name || 'Aries'
    const degreeInSign = p.degrees_in_rasi !== undefined ? p.degrees_in_rasi : ((p.longitude || 0) % 30)
    const dms = p.dms ? (typeof p.dms === 'string' && p.dms.includes('°') ? p.dms : formatDms(degreeInSign)) : formatDms(degreeInSign)
    const longitude = p.longitude !== undefined ? p.longitude : signIndex * 30 + degreeInSign
    const houseNumber = p.house || (((signIndex - lagnaSignIndex + 12) % 12) + 1)
    const meta = PLANET_META[pName] || { sanskrit: pName, symbol: '✦', short: pName.slice(0, 2) }
    const dispositor = SIGN_LORDS[signName] || '—'
    const nakNum = typeof p.nakshatra === 'number' ? p.nakshatra : (parseInt(p.nakshatra, 10) || 1)
    const nakLord = NAKSHATRA_LORDS[(nakNum - 1) % 9] || '—'
    const nakName = p.nakshatra_name || 'Ashwini'
    const pada = p.pada || 1

    let lordOfHouses = []
    if (Array.isArray(p.lord_of_houses) && p.lord_of_houses.length > 0) {
      lordOfHouses = [...p.lord_of_houses]
    } else {
      for (let h = 1; h <= 12; h++) {
        const hSignIdx = (lagnaSignIndex + (h - 1)) % 12
        if (SIGN_LORDS[SIGN_NAMES[hSignIdx]] === pName) lordOfHouses.push(h)
      }
    }

    const pPos = {
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
      dignity: p.dignity || 'Neutral',
      lordOfHouses,
      dispositor,
      sunSeparation: p.sun_separation,
      naturalKaraka: PLANET_NATURAL_KARAKAS[pName] || '—',
      aspectsCast: [],
      aspectsReceived: [],
      vakri: master.vakri_analysis?.planets?.[pName] || null,
    }

    // Chara Karakas directly from Python
    if (Array.isArray(master.chara_karakas)) {
      const ck = master.chara_karakas.find((c) => c.graha_name === pName || c.graha === p.id)
      if (ck) {
        pPos.charaKaraka = `${ck.name} (${ck.symbol})`
        pPos.charaKarakaCode = ck.symbol
        pPos.charaKarakaRank = ck.order
        pPos.isAtmakaraka = ck.symbol === 'AK'
      }
    }

    // Authoritative Functional nature from Python
    if (master.functional_nature?.planets?.[pName]) {
      const fn = master.functional_nature.planets[pName]
      pPos.functionalNature = fn.nature
      pPos.isYogakaraka = Boolean(fn.yogakaraka)
      pPos.functionalType = fn.yogakaraka ? 'Yogakaraka' : fn.nature === 'benefic' ? 'Functional Benefic' : fn.nature === 'malefic' ? 'Functional Malefic' : 'Neutral'
      pPos.functionalWhy = fn.houses ? `Lord of houses ${fn.houses.join(', ')}` : undefined
    }

    // Ashtakavarga BAV points
    if (master.ashtakavarga?.bhinnashtakavarga) {
      const bavItem = master.ashtakavarga.bhinnashtakavarga.find((b) => b.owner === pName)
      if (bavItem && Array.isArray(bavItem.rekhas)) {
        const pts = bavItem.rekhas[signIndex] || 0
        pPos.bavPoints = pts
        pPos.bavGrade = pts >= 5 ? 'favorable' : pts === 4 ? 'neutral' : 'unfavorable'
      }
    }

    // Baadhaka status
    if (master.baadhakas?.houses?.[0]) {
      const bH = master.baadhakas.houses[0]
      const isB = (bH.lords || []).includes(pName) || (bH.occupants || []).includes(pName)
      pPos.isBaadhaka = isB
      if (isB) {
        pPos.baadhakaReason = (bH.lords || []).includes(pName)
          ? `Lord of Baadhaka Sthana (${bH.sthaana_name || 'Baadhaka'})`
          : `Occupies Baadhaka Sthana (${bH.sthaana_name || 'Baadhaka'})`
      }
    }

    // Maraka status
    if (master.marakas?.maraka_grahas) {
      const mg = master.marakas.maraka_grahas.find((m) => m.graha_name === pName || m.graha === pName)
      pPos.isMaraka = Boolean(mg)
      if (mg) {
        pPos.marakaKind = mg.kind || 'Maraka'
        pPos.marakaReasons = mg.reasons || []
      }
    }

    // 6-Fold Parashari Shadbala from Python
    const shad = mapPlanetShadbala(pName, pPos.vakri, pPos)
    if (shad) {
      pPos.shadbala = shad
    }

    planets.push(pPos)
  }

  // 2. Houses
  const bhavas = rasi.bhavas || []
  const houses = []
  const savArray = master.ashtakavarga?.sarvashtakavarga || []

  for (let h = 1; h <= 12; h++) {
    const bhava = bhavas[h - 1]
    const signIndex = (lagnaSignIndex + (h - 1)) % 12
    const sign = SIGN_NAMES[signIndex]
    const lord = SIGN_LORDS[sign]
    const occupants = planets.filter((pl) => pl.houseNumber === h).map((pl) => pl.name)
    const savPts = savArray[signIndex] || 28
    const savGrade = savPts >= 30 ? 'favorable' : savPts >= 25 ? 'neutral' : 'unfavorable'

    let arudhaPada = `A${h}`
    let arudhaPadaName = `Arudha Pada ${h}`
    if (master.arudhas?.padas) {
      const pada = master.arudhas.padas.find((p) => p.house === h)
      if (pada) {
        arudhaPada = pada.symbol || `A${h}`
        arudhaPadaName = pada.name || `Arudha Pada ${h}`
      }
    }

    const houseObj = {
      id: h,
      number: h,
      ordinal: getOrdinal(h),
      name: HOUSE_METADATA[h]?.sanskrit || `Bhava ${h}`,
      sign,
      signNumber: signIndex + 1,
      signIndex,
      degreeInSign: bhava?.middle ? (bhava.middle % 30) : 0,
      dms: formatDms(bhava?.middle ? (bhava.middle % 30) : 0),
      longitude: bhava?.middle || (signIndex * 30 + 15),
      startDegree: bhava?.start,
      endDegree: bhava?.end,
      lord,
      occupants,
      labels: deriveHouseCategories(h),
      karaka: HOUSE_METADATA[h]?.karaka || '—',
      purushartha: HOUSE_METADATA[h]?.purushartha || '—',
      bhavatBhavam: HOUSE_METADATA[h]?.bhavatBhavam || '',
      significations: HOUSE_METADATA[h]?.significations || [],
      arudhaPada,
      arudhaPadaName,
      arudhasHere: [],
      isBaadhakaSthana: h === master.baadhakas?.houses?.[0]?.house,
      isMarakaHouse: [2, 7].includes(h),
      savPoints: savPts,
      savGrade,
    }

    if (master.argala?.houses) {
      const arg = master.argala.houses.find((a) => a.house === h)
      if (arg) houseObj.argalas = arg
    }

    houses.push(houseObj)
  }

  // 3. Aggregate Shadbala Result
  const shadbalaPlanets = planets.map((p) => p.shadbala).filter(Boolean)
  const sortedShad = [...shadbalaPlanets].sort((a, b) => (b.strengthRatio || 0) - (a.strengthRatio || 0))
  const strongest = sortedShad[0]?.name || 'Mars'
  const weakest = sortedShad[sortedShad.length - 1]?.name || 'Sun'
  const strongCount = shadbalaPlanets.filter((p) => p.isStrong).length
  const totalCount = shadbalaPlanets.length || 7
  const avgRatio = shadbalaPlanets.reduce((acc, p) => acc + (p.strengthRatio || 1), 0) / (totalCount || 1)
  const overallHealthScore = Math.round(avgRatio * 100)

  const shadbalaResult = {
    planets: shadbalaPlanets,
    strongestPlanet: strongest,
    weakestPlanet: weakest,
    strongCount,
    totalCount,
    overallHealthScore,
  }

  // 4. Dashas & Running Chain
  const rawPeriods = master.dashas?.periods || []
  const dashas = rawPeriods.slice(0, 9).map((d, i) => normalizeDashaTreeNode(d, 1)).filter(Boolean)
  const levelLabels = { 1: 'MD', 2: 'AD', 3: 'PD', 4: 'SD', 5: 'PAD' }
  const activeDashaChain = (master.dashas?.running || []).map((r) => ({
    level: r.level,
    levelLabel: levelLabels[r.level] || `L${r.level}`,
    lord: r.lord_name || r.lord,
  }))
  const runningDasha = activeDashaChain.map((c) => c.lord)

  // 5. Vargas & Varga Comparison
  const vargas = master.vargas || {}
  const vargaComparison = buildVargaComparisonFromMaster(vargas['D1'], vargas['D9'], planets)

  // 6. Yogas
  const allYogasCatalog = normalizePlanetaryYogas(master.yogas, lagnaSignIndex)
  const activeYogas = allYogasCatalog.filter((y) => y.present)

  // 7. Special Lagnas & Upagrahas
  const specialLagnas = master.special_lagnas?.special_lagnas || []
  const upagrahas = master.upagrahas?.upagrahas || []
  const specialPoints = {
    specialLagnas,
    upagrahas,
    pointsByHouse: {},
  }

  const moon = planets.find((p) => p.name === 'Moon')
  const sun = planets.find((p) => p.name === 'Sun')

  const dateFormatted = rasi.input?.local_time
    ? String(rasi.input.local_time).slice(0, 10)
    : `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`
  const timeFormatted = rasi.input?.local_time
    ? String(rasi.input.local_time).slice(11, 16)
    : `${String(birthData.hour).padStart(2, '0')}:${String(birthData.minute).padStart(2, '0')}`

  const location = rasi.input?.place?.name || birthData.place?.name || ''
  const latitude = `${rasi.input?.place?.latitude ?? birthData.place?.latitude ?? ''}°`
  const longitude = `${rasi.input?.place?.longitude ?? birthData.place?.longitude ?? ''}°`
  const timezone = rasi.input?.timezone || birthData.tz_name || ''
  const ayanamsaName = rasi.settings?.ayanamsa || 'Lahiri'
  const ayanamsaDms = rasi.ayanamsa?.dms || 'Unavailable'
  const calculationSettings = `${ayanamsaName} ayanamsha • ${rasi.settings?.house_system || 'Whole Sign'} houses`

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
      source: `${master.panchanga?.date_local || 'Hora Engine (FastAPI 8000)'} • ${master.panchanga?.tithi?.[0]?.name || 'Panchanga'}`,
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
    shadbala: shadbalaResult,
    specialLagnas,
    upagrahas,
    specialPoints,
    dashas,
    dashaTree: dashas,
    activeDashaChain,
    runningDasha,
    aspectsMatrix: master.aspects || {},
    purusharthaBalance: master.purushartha || null,
    arudhas: master.arudhas || null,
    baadhakas: master.baadhakas || null,
    marakas: master.marakas || null,
    ashtakavarga: master.ashtakavarga || null,
    argalas: master.argala || null,
    functional: master.functional_nature || null,
    vakriAnalysis: master.vakri_analysis || null,
    yogas: activeYogas,
    allYogasCatalog,
    panchanga: master.panchanga,
    aspects: master.aspects,
    relationships: null,
    raw: {
      rasi: master.chart,
      panchanga: master.panchanga,
      dashas: master.dashas,
      vargas: master.vargas,
      specialLagnas: master.special_lagnas,
      upagrahas: master.upagrahas,
      vakri: master.vakri_analysis,
      charaKarakas: master.chara_karakas,
      functional: master.functional_nature,
      aspects: master.aspects,
      arudhas: master.arudhas,
      baadhakas: master.baadhakas,
      marakas: master.marakas,
      ashtakavarga: master.ashtakavarga,
      argala: master.argala,
      yogas: master.yogas,
      purushartha: master.purushartha,
    },
    rawRasi: master.chart,
    rawPanchanga: master.panchanga,
    rawDasha: master.dashas,
    shodasavarga: master.vargas,
  }
}

module.exports = {
  buildChartFromMaster,
  buildEnrichedChart: buildChartFromMaster, // alias for backwards compatibility
  normalizeDashaTreeNode,
}
