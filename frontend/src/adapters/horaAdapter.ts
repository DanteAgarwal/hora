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
    return {
      id: p.id !== undefined ? p.id : idx,
      name: p.name || 'Unknown',
      sanskritName: p.sanskritName || meta.sanskrit,
      symbol: p.symbol || meta.symbol,
      short: p.short || meta.short,
      sign: p.sign || 'Aries',
      signNumber: p.signNumber || (p.signIndex !== undefined ? p.signIndex + 1 : 1),
      signIndex: p.signIndex !== undefined ? p.signIndex : 0,
      degreeInSign: p.degreeInSign || 0,
      dms: p.dms || formatDms(p.degreeInSign || 0),
      longitude: p.longitude || 0,
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
  let dashaTree: DashaPeriod[] = []

  if (Array.isArray(rawDashas) && rawDashas.length > 0) {
    // If rawDashas is the legacy flat 3-element format [MD, AD, PD]
    if (rawDashas.length <= 3 && rawDashas.some((d: any) => d.label === 'Antardasha' || d.level === 2)) {
      const mdNode = normalizeDashaNode(rawDashas[0], 1)
      const adNode = rawDashas[1] ? normalizeDashaNode(rawDashas[1], 2) : null
      const pdNode = rawDashas[2] ? normalizeDashaNode(rawDashas[2], 3) : null
      if (adNode && pdNode) {
        adNode.children = [pdNode]
      }
      if (mdNode && adNode) {
        mdNode.children = [adNode]
      }
      dashaTree = mdNode ? [mdNode] : []
    } else {
      dashaTree = rawDashas.map((d: any) => normalizeDashaNode(d, 1))
    }
  }

  const runningDasha = computed.runningDasha || (computed.currentMahadasha ? computed.currentMahadasha.split(' / ') : [])

  return {
    id: computed.id ?? 0,
    name: computed.name ?? 'Live chart',
    birthData,
    metadata,
    quickFacts,
    planets,
    houses,
    vargas: computed.vargas || {},
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
    panchanga: computed.panchanga || computed.rawPanchanga,
    aspects: computed.aspects,
    relationships: computed.relationships || null,
    yogas: computed.yogas || [],
    vakriAnalysis: computed.vakriAnalysis || null,
    raw: computed.raw || {
      rasi: rawRasi,
      dasha: rawDasha,
      panchanga: computed.rawPanchanga,
      shodasavarga: computed.shodasavarga,
    },
  }
}

export function normalizePlanetaryYogas(rawYogas: any): PlanetaryYoga[] {
  if (!rawYogas) return []
  return Array.isArray(rawYogas) ? rawYogas : (rawYogas.yogas || [])
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
