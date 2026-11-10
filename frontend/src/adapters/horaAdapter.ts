/**
 * Clean Frontend Chart Adapter
 * 
 * Maps backend-enriched chart responses into the UI AstroChart domain model.
 * All astronomical and astrological calculations are performed strictly on the backend.
 */

import type {
  AstroChart,
  BirthData,
  DashaPeriod,
  PlanetaryYoga,
} from '../types/astro'
import {
  SIGN_NAMES,
  PLANET_META,
} from '../types/astro'

export function parseSignIndex(signStr: string): number {
  if (!signStr) return 0
  const clean = signStr.trim().toLowerCase()
  const idx = SIGN_NAMES.findIndex(
    (s) => s.toLowerCase() === clean || clean.startsWith(s.toLowerCase().slice(0, 3))
  )
  return idx >= 0 ? idx : 0
}

export function formatDms(deg: number): string {
  if (deg == null || isNaN(deg)) return '0°00\'00"'
  const d = Math.floor(deg)
  const minFloat = (deg - d) * 60
  const m = Math.floor(minFloat)
  const s = Math.round((minFloat - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
}

export function getOrdinal(n: number): string {
  const r = n % 100
  if (r >= 11 && r <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
}

function calculateNavamshaSign(signIndex: number, degreeInSign: number): number {
  const deg = degreeInSign || 0
  const pada = Math.min(8, Math.max(0, Math.floor(deg / (30 / 9))))
  const signType = signIndex % 4 // 0: Fire, 1: Earth, 2: Air, 3: Water
  let startSign = 0
  if (signType === 0) startSign = 0 // Aries
  else if (signType === 1) startSign = 9 // Capricorn
  else if (signType === 2) startSign = 6 // Libra
  else if (signType === 3) startSign = 3 // Cancer

  return (startSign + pada) % 12
}

/**
 * Normalizes backend chart payload into the client AstroChart domain model.
 * All rich astrological properties (dignity, chara karakas, aspects,
 * purushartha, vargas, dashas) are already computed by the backend.
 */
export function normalizeChartPayload(computed: any): AstroChart {
  const birthData: BirthData = computed.birthData || {
    name: computed.name || 'Sample Chart',
    year: 1995,
    month: 8,
    day: 24,
    hour: 10,
    minute: 30,
    second: 0,
    tz_name: computed.timezone || 'Asia/Kolkata',
    place: {
      name: computed.location || 'Agra',
      latitude: parseFloat(computed.latitude) || 27.1767,
      longitude: parseFloat(computed.longitude) || 78.0081,
    },
  }

  const rawRasi = computed.rawRasi || computed.raw?.rasi
  const rawDasha = computed.rawDasha || computed.raw?.dasha

  const metadata = computed.metadata || {
    dateFormatted: computed.date || `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`,
    timeFormatted: computed.time || `${String(birthData.hour).padStart(2, '0')}:${String(birthData.minute).padStart(2, '0')}`,
    location: computed.location || birthData.place.name,
    latitude: computed.latitude || `${birthData.place.latitude.toFixed(4)}°`,
    longitude: computed.longitude || `${birthData.place.longitude.toFixed(4)}°`,
    timezone: computed.timezone || birthData.tz_name,
    ayanamsaName: rawRasi?.settings?.ayanamsa || 'Lahiri',
    ayanamsaDms: rawRasi?.ayanamsa?.dms || computed.ayanamsa || 'Unavailable',
    calculationSettings: computed.calculationSettings || 'Lahiri ayanamsha • Whole Sign houses',
    source: computed.source || 'Hora Engine (FastAPI 8000)',
  }

  // Planets: Backend already enriched with dignities, chara karakas, aspects, and lordships
  const planets = (computed.planets || []).map((p: any, idx: number) => {
    const meta = PLANET_META[p.name] || { sanskrit: p.name, symbol: '✦', short: p.name?.slice(0, 2) || 'Pl' }
    const signIndex = p.signIndex !== undefined ? p.signIndex : 0
    let degreeInSign = p.degreeInSign
    let dms = p.dms
    let longitude = p.longitude

    if ((degreeInSign == null || isNaN(degreeInSign) || degreeInSign === 0) && p.degree) {
      const clean = String(p.degree).trim()
      const parts = clean.split(/[-:°'"]+/).filter(Boolean).map(Number)
      if (parts.length >= 1 && !isNaN(parts[0])) {
        const d = parts[0]
        const m = parts[1] || 0
        const s = parts[2] || 0
        degreeInSign = d + m / 60 + s / 3600
        dms = `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
      }
    }

    if (degreeInSign == null || isNaN(degreeInSign)) {
      degreeInSign = p.degrees_in_rasi || 0
    }

    if (typeof dms === 'string' && dms.includes('-') && !dms.includes('°')) {
      const parts = dms.split('-')
      if (parts.length >= 3) {
        dms = `${parts[0]}°${parts[1].padStart(2, '0')}'${parts[2].padStart(2, '0')}"`
      }
    }

    if (!dms) {
      dms = formatDms(degreeInSign)
    }

    if (longitude == null || isNaN(longitude) || longitude === 0) {
      longitude = signIndex * 30 + degreeInSign
    }

    return {
      id: p.id !== undefined ? p.id : idx,
      name: p.name || 'Unknown',
      sanskritName: p.sanskritName || meta.sanskrit,
      symbol: p.symbol || meta.symbol,
      short: p.short || meta.short,
      sign: p.sign || 'Aries',
      signNumber: p.signNumber || (p.signIndex !== undefined ? p.signIndex + 1 : 1),
      signIndex,
      degreeInSign,
      dms,
      longitude,
      latitude: p.latitude,
      speed: p.speed,
      retrograde: Boolean(p.retrograde),
      combust: Boolean(p.combust),
      houseNumber: p.houseNumber || 1,
      houseOrdinal: p.houseOrdinal || getOrdinal(p.houseNumber || 1),
      houseLabels: p.houseLabels || [],
      nakshatra: p.nakshatra || 'Ashwini',
      nakshatraNumber: p.nakshatraNumber || 1,
      nakshatraLord: p.nakshatraLord || 'Ketu',
      pada: p.pada || 1,
      dignity: p.dignity || 'Neutral',
      lordOfHouses: p.lordOfHouses || [],
      dispositor: p.dispositor || '—',
      sunSeparation: p.sunSeparation,
      charaKaraka: p.charaKaraka,
      charaKarakaCode: p.charaKarakaCode,
      naturalKaraka: p.naturalKaraka,
      functionalRole: p.functionalRole,
      functionalType: p.functionalType || 'Neutral',
      aspectsCast: p.aspectsCast || [],
      aspectsReceived: p.aspectsReceived || [],
      vakri: p.vakri || computed.vakriAnalysis?.planets?.[p.name] || null,
      digbalaScore: p.digbalaScore,
      digbalaPeakHouse: p.digbalaPeakHouse,
      digbalaStatus: p.digbalaStatus,
      combustionDegrees: p.combustionDegrees,
      combustionStatus: p.combustionStatus,
      isNeechaBhanga: p.isNeechaBhanga,
      neechaBhangaReason: p.neechaBhangaReason,
      isBaadhaka: Boolean(p.isBaadhaka),
      baadhakaReason: p.baadhakaReason,
      isMaraka: Boolean(p.isMaraka),
      marakaKind: p.marakaKind,
      marakaReasons: p.marakaReasons || [],
      functionalNature: p.functionalNature,
      isYogakaraka: Boolean(p.isYogakaraka),
      functionalWhy: p.functionalWhy,
      bavPoints: p.bavPoints,
      bavGrade: p.bavGrade,
      shadbala: p.shadbala || null,
    }
  })

  // Houses: Backend already enriched with lord placements, aspects, and classifications
  const houses = (computed.houses || []).map((h: any) => ({
    number: h.number || 1,
    name: h.name || `${getOrdinal(h.number || 1)} House`,
    sanskritName: h.sanskritName,
    sign: h.sign || 'Aries',
    signNumber: h.signNumber || (h.signIndex !== undefined ? h.signIndex + 1 : 1),
    signIndex: h.signIndex !== undefined ? h.signIndex : 0,
    lord: h.lord || '—',
    lordHouseNumber: h.lordHouseNumber,
    lordHouseOrdinal: h.lordHouseOrdinal,
    lordSign: h.lordSign,
    lordDignity: h.lordDignity,
    lordPlacementInsight: h.lordPlacementInsight,
    naturalKaraka: h.naturalKaraka,
    occupants: h.occupants || [],
    aspectsReceived: h.aspectsReceived || [],
    bhavatBhavam: h.bhavatBhavam,
    significations: h.significations || [],
    purushartha: h.purushartha || 'Dharma',
    classificationTags: h.classificationTags || h.categories || [],
    startLongitude: h.startLongitude,
    cuspLongitude: h.cuspLongitude,
    endLongitude: h.endLongitude,
    categories: h.categories || h.classificationTags || [],
    arudhaPada: h.arudhaPada || 'A' + (h.number || 1),
    arudhaPadaName: h.arudhaPadaName,
    arudhasHere: h.arudhasHere || [],
    isBaadhakaSthana: Boolean(h.isBaadhakaSthana),
    isMarakaHouse: Boolean(h.isMarakaHouse),
    savPoints: h.savPoints,
    savGrade: h.savGrade,
    argalas: h.argalas,
  }))

  const sun = planets.find((p: any) => p.name === 'Sun')
  const moon = planets.find((p: any) => p.name === 'Moon')

  const quickFacts = computed.quickFacts || {
    lagna: computed.lagna?.split(' ')[0] || 'Aries',
    lagnaDms: computed.lagna?.split(' ').slice(1).join(' ') || '0°00\'00"',
    sunSign: sun ? sun.sign : 'Unavailable',
    moonSign: moon ? moon.sign : 'Unavailable',
    moonDms: moon ? moon.dms : 'Unavailable',
    moonNakshatra: moon ? moon.nakshatra : 'Unavailable',
    moonPada: moon ? moon.pada : 1,
    currentMahadasha: computed.runningDasha?.[0] || computed.currentMahadasha?.split(' / ')[0] || 'Unavailable',
    currentAntardasha: computed.runningDasha?.[1] || computed.currentMahadasha?.split(' / ')[1] || 'Unavailable',
    currentPratyantardasha: computed.runningDasha?.[2],
  }

  const rawDashas = computed.dashaTree || computed.dashas || []
  const dashaTree: DashaPeriod[] = Array.isArray(rawDashas)
    ? rawDashas.map((d: any) => normalizeDashaNode(d, 1))
    : []

  const runningDasha = computed.runningDasha || (computed.currentMahadasha ? computed.currentMahadasha.split(' / ') : [])

  // Normalize vargas into a dictionary mapping code -> VargaChart
  let vargas = computed.vargas
  if (Array.isArray(vargas)) {
    const vMap: Record<string, any> = {}
    vargas.forEach((v: any) => {
      if (v && v.code) vMap[v.code] = v
    })
    vargas = vMap
  }
  if (!vargas || typeof vargas !== 'object') {
    vargas = {}
  }

  const SIGN_NAMES_FALLBACK = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ]

  // Ensure D1 exists in vargas
  if (!vargas['D1'] || !vargas['D1'].grahas || vargas['D1'].grahas.length === 0) {
    const lagnaSignIndex = houses[0]?.signIndex ?? planets[0]?.signIndex ?? 0
    const lagnaDeg = houses[0]?.degreeInSign ?? 15
    const lagnaDmsStr = houses[0]?.dms || formatDms(lagnaDeg)
    vargas['D1'] = {
      code: 'D1',
      name: 'Rashi',
      divisions: 1,
      purpose: 'Core life, physical body, general vitality, baseline existence',
      lagnaSignIndex,
      lagnaSignName: houses[0]?.sign || SIGN_NAMES_FALLBACK[lagnaSignIndex],
      lagnaLongitude: lagnaSignIndex * 30 + lagnaDeg,
      lagnaDegreeInSign: lagnaDeg,
      lagnaDms: lagnaDmsStr,
      grahas: planets.map((p: any) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        signIndex: p.signIndex,
        signName: p.sign,
        houseNumber: p.houseNumber,
        retrograde: p.retrograde,
        longitude: p.longitude,
        degreeInSign: p.degreeInSign,
        dms: p.dms,
        dignity: p.dignity,
        dispositor: p.dispositor,
        isVargottama: true,
      })),
    }
  }

  // Ensure D9 exists in vargas with fully computed Navamsha grahas
  if (!vargas['D9'] || !vargas['D9'].grahas || vargas['D9'].grahas.length === 0) {
    const lagnaSignIdx = houses[0]?.signIndex ?? 0
    const lagnaDeg = houses[0]?.degreeInSign ?? 15
    const lagnaNavSign = calculateNavamshaSign(lagnaSignIdx, lagnaDeg)
    const lagnaNavDeg = (lagnaDeg * 9) % 30
    vargas['D9'] = {
      code: 'D9',
      name: 'Navamsha',
      divisions: 9,
      purpose: 'Dharma, spouse, marriage, true inner strength, late life',
      lagnaSignIndex: lagnaNavSign,
      lagnaSignName: SIGN_NAMES_FALLBACK[lagnaNavSign],
      lagnaLongitude: lagnaNavSign * 30 + lagnaNavDeg,
      lagnaDegreeInSign: lagnaNavDeg,
      lagnaDms: formatDms(lagnaNavDeg),
      grahas: planets.map((p: any) => {
        const navSignIdx = calculateNavamshaSign(p.signIndex, p.degreeInSign || 0)
        const vHouse = ((navSignIdx - lagnaNavSign + 12) % 12) + 1
        const navDeg = ((p.degreeInSign || 0) * 9) % 30
        return {
          id: p.id,
          name: p.name,
          short: p.short,
          signIndex: navSignIdx,
          signName: SIGN_NAMES_FALLBACK[navSignIdx],
          houseNumber: vHouse,
          retrograde: p.retrograde,
          longitude: navSignIdx * 30 + navDeg,
          degreeInSign: navDeg,
          dms: formatDms(navDeg),
          dignity: p.dignity,
          dispositor: '—',
          isVargottama: p.signIndex === navSignIdx,
        }
      }),
    }
  }

  const rawPanchangaInput = computed.panchanga || computed.rawPanchanga
  const normalizedPanchanga = rawPanchangaInput ? {
    ...rawPanchangaInput,
    vaara: typeof rawPanchangaInput.vaara === 'object' && rawPanchangaInput.vaara !== null
      ? rawPanchangaInput.vaara.name || rawPanchangaInput.vaara.lord || 'Solar Day'
      : (rawPanchangaInput.vaara || 'Solar Day'),
    tithi: Array.isArray(rawPanchangaInput.tithi) ? rawPanchangaInput.tithi[0] : rawPanchangaInput.tithi,
    nakshatra: Array.isArray(rawPanchangaInput.nakshatra) ? rawPanchangaInput.nakshatra[0] : rawPanchangaInput.nakshatra,
    yoga: Array.isArray(rawPanchangaInput.yoga) ? rawPanchangaInput.yoga[0] : rawPanchangaInput.yoga,
    karana: Array.isArray(rawPanchangaInput.karana) ? rawPanchangaInput.karana[0] : rawPanchangaInput.karana,
  } : undefined

  return {
    id: computed.id ?? 0,
    name: computed.name ?? 'Live chart',
    birthData,
    metadata,
    quickFacts,
    planets,
    houses,
    vargas,
    vargaComparison: computed.vargaComparison,
    dashaTree,
    dashas: dashaTree,
    activeDashaChain: computed.activeDashaChain || null,
    runningDasha,
    sambhandhaMatrix: computed.sambhandhaMatrix,
    aspectsMatrix: computed.aspectsMatrix,
    dignityOverview: computed.dignityOverview,
    purusharthaBalance: computed.purusharthaBalance,
    arudhas: computed.arudhas,
    baadhakas: computed.baadhakas,
    marakas: computed.marakas,
    ashtakavarga: computed.ashtakavarga,
    argalas: computed.argalas,
    functional: computed.functional,
    panchanga: normalizedPanchanga,
    aspects: computed.aspects,
    relationships: computed.relationships || null,
    yogas: normalizePlanetaryYogas(computed.yogas || computed.raw?.yogas, houses[0]?.signIndex || 0).filter((y) => y.present),
    allYogasCatalog: normalizePlanetaryYogas(computed.allYogasCatalog || computed.yogas || computed.raw?.yogas, houses[0]?.signIndex || 0),
    vakriAnalysis: computed.vakriAnalysis || null,
    shadbala: computed.shadbala || null,
    specialLagnas: computed.specialLagnas || [],
    upagrahas: computed.upagrahas || null,
    specialPoints: computed.specialPoints || null,
    raw: computed.raw || {
      rasi: rawRasi,
      dasha: rawDasha,
      panchanga: computed.rawPanchanga,
      shodasavarga: computed.shodasavarga,
    },
  }
}

export function normalizePlanetaryYogas(rawYogas: any, lagnaSignIndex = 0): PlanetaryYoga[] {
  if (!rawYogas) return []
  const list = Array.isArray(rawYogas) ? rawYogas : (rawYogas.yogas || [])
  const killedSet = new Set(
    Array.isArray(rawYogas?.results_killed_by_kemadruma) ? rawYogas.results_killed_by_kemadruma : []
  )

  return list.map((y: any) => {
    const rawGroup = String(y.group || 'General').toLowerCase()
    let group: PlanetaryYoga['group'] = 'Other'
    if (rawGroup.includes('raja')) group = 'Raja'
    else if (rawGroup.includes('dhana')) group = 'Dhana'
    else if (rawGroup.includes('mahapurusha')) group = 'Mahapurusha'
    else if (rawGroup.includes('chandra') || rawGroup.includes('lunar')) group = 'Chandra'
    else if (rawGroup.includes('ravi') || rawGroup.includes('solar')) group = 'Ravi'
    else if (rawGroup.includes('naabhasa') || rawGroup.includes('nabhasa')) group = 'Nabhasa'
    else if (rawGroup.includes('vipareeta')) group = 'Vipareeta'
    else if (rawGroup.includes('popular') || rawGroup.includes('general')) group = 'General'

    const participants = Array.isArray(y.participants)
      ? y.participants.map((p: any) => (typeof p === 'string' ? p : p.graha_name || p.name || ''))
      : []

    let housesInvolved = y.houses_involved || y.housesInvolved
    if ((!housesInvolved || housesInvolved.length === 0) && Array.isArray(y.participants)) {
      const houseSet = new Set<number>()
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
    const strength: PlanetaryYoga['strength'] = isKilled
      ? 'Killed by Kemadruma'
      : y.weakened
      ? 'Low'
      : (y.strength || 'High')

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

export function normalizeDashaNode(node: any, level = 1): DashaPeriod {
  if (!node) {
    return {
      lord: 'Sun',
      level,
      start: '',
      end: '',
      children: [],
    }
  }
  const lord = node.lord_name || (typeof node.lord === 'string' ? node.lord : undefined) || node.period || node.name || 'Sun'
  return {
    lord,
    level: node.level || level,
    start: node.start ? String(node.start).slice(0, 19).replace('T', ' ') : '',
    end: node.end ? String(node.end).slice(0, 19).replace('T', ' ') : '',
    startJd: node.start_jd ?? node.startJd,
    endJd: node.end_jd ?? node.endJd,
    durationDays: node.duration_days ?? node.durationDays,
    children: Array.isArray(node.children)
      ? node.children.map((c: any) => normalizeDashaNode(c, level + 1))
      : [],
  }
}
