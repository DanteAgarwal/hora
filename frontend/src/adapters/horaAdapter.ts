import type {
  AstroChart,
  BirthData,
  DashaPeriod,
  DignityType,
  HousePosition,
  PlanetPosition,
  VargaChartData,
  VargaGrahaPlacement,
} from '../types/astro'
import { PLANET_META } from '../types/astro'

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

const EXALTATION_SIGNS: Record<string, number> = {
  Sun: 0, // Aries
  Moon: 1, // Taurus
  Mars: 9, // Capricorn
  Mercury: 5, // Virgo
  Jupiter: 3, // Cancer
  Venus: 11, // Pisces
  Saturn: 6, // Libra
  Rahu: 1, // Taurus
  Ketu: 7, // Scorpio
}

const DEBILITATION_SIGNS: Record<string, number> = {
  Sun: 6, // Libra
  Moon: 7, // Scorpio
  Mars: 3, // Cancer
  Mercury: 11, // Pisces
  Jupiter: 9, // Capricorn
  Venus: 5, // Virgo
  Saturn: 0, // Aries
  Rahu: 7, // Scorpio
  Ketu: 1, // Taurus
}

const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [10],
  Ketu: [7],
}

export function parseSignIndex(signStr: string): number {
  if (!signStr) return 0
  const clean = signStr.trim().toLowerCase()
  const idx = SIGN_NAMES.findIndex(
    (s) => s.toLowerCase() === clean || clean.startsWith(s.toLowerCase().slice(0, 3))
  )
  return idx >= 0 ? idx : 0
}

export function formatDms(deg: number): string {
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

function deriveDignity(planetName: string, signIndex: number, rawDignity?: string): DignityType {
  if (rawDignity && rawDignity !== 'Calculated') {
    const dLower = rawDignity.toLowerCase()
    if (dLower.includes('exalt')) return 'Exalted'
    if (dLower.includes('debilitat')) return 'Debilitated'
    if (dLower.includes('moolatrikona') || dLower.includes('mula')) return 'Moolatrikona'
    if (dLower.includes('own')) return 'Own Sign'
    if (dLower.includes('great friend')) return 'Great Friend'
    if (dLower.includes('friend')) return 'Friend'
    if (dLower.includes('great enemy')) return 'Great Enemy'
    if (dLower.includes('enemy')) return 'Enemy'
    if (dLower.includes('neutral')) return 'Neutral'
  }

  if (EXALTATION_SIGNS[planetName] === signIndex) return 'Exalted'
  if (DEBILITATION_SIGNS[planetName] === signIndex) return 'Debilitated'
  if (OWN_SIGNS[planetName]?.includes(signIndex)) return 'Own Sign'
  return 'Calculated'
}

function deriveHouseCategories(houseNumber: number): string[] {
  const cats: string[] = []
  if ([1, 4, 7, 10].includes(houseNumber)) cats.push('Kendra (Angle)')
  if ([1, 5, 9].includes(houseNumber)) cats.push('Trikona (Trine)')
  if ([3, 6, 10, 11].includes(houseNumber)) cats.push('Upachaya (Growth)')
  if ([6, 8, 12].includes(houseNumber)) cats.push('Dusthana (Difficult)')
  if ([2, 7].includes(houseNumber)) cats.push('Maraka (Killer)')
  if ([1, 5, 9].includes(houseNumber)) cats.push('Dharma')
  if ([2, 6, 10].includes(houseNumber)) cats.push('Artha')
  if ([3, 7, 11].includes(houseNumber)) cats.push('Kama')
  if ([4, 8, 12].includes(houseNumber)) cats.push('Moksha')
  return cats
}

/**
 * Derives D9 Navamsha sign index from tropical/sidereal longitude.
 * Formula: Each sign has 9 padas of 3°20' (3.333333°).
 */
export function calculateNavamshaSign(signIndex: number, degreeInSign: number): number {
  const pada = Math.floor(degreeInSign / (30 / 9)) // 0 to 8
  const signType = signIndex % 4 // 0: Fire, 1: Earth, 2: Air, 3: Water
  let startSign = 0
  if (signType === 0) startSign = 0 // Aries
  else if (signType === 1) startSign = 9 // Capricorn
  else if (signType === 2) startSign = 6 // Libra
  else if (signType === 3) startSign = 3 // Cancer

  return (startSign + pada) % 12
}

/**
 * Normalizes raw Hora API / backend payload into a clean AstroChart domain object.
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

  const rawRasi = computed.rawRasi
  const rawGrahas = rawRasi?.grahas || []
  const lagnaRasi = rawRasi?.lagna

  // Resolve Lagna sign index
  let lagnaSignIndex = 0
  let lagnaDms = '0°00\'00"'
  if (lagnaRasi) {
    lagnaSignIndex = lagnaRasi.rasi ?? parseSignIndex(lagnaRasi.rasi_name)
    lagnaDms = lagnaRasi.dms || formatDms(lagnaRasi.degrees_in_rasi || 0)
  } else if (computed.lagna && computed.lagna !== 'Unavailable') {
    const parts = computed.lagna.split(' ')
    lagnaSignIndex = parseSignIndex(parts[0])
    lagnaDms = parts.slice(1).join(' ') || lagnaDms
  }

  // 1. Process Planets
  const planets: PlanetPosition[] = []
  const inputPlanets = rawGrahas.length > 0 ? rawGrahas : computed.planets || []

  for (let i = 0; i < inputPlanets.length; i++) {
    const p = inputPlanets[i]
    const pName = p.name || 'Unknown'
    const signIndex = p.rasi !== undefined ? p.rasi : parseSignIndex(p.sign || p.rasi_name)
    const signName = SIGN_NAMES[signIndex] || p.sign || 'Aries'
    const degreeInSign = p.degrees_in_rasi !== undefined ? p.degrees_in_rasi : parseFloat(p.degree) || 0
    const dms = p.dms || p.degree || formatDms(degreeInSign)
    const longitude = p.longitude !== undefined ? p.longitude : signIndex * 30 + degreeInSign
    const houseNumber = p.houseNumber || (p.house !== undefined ? (typeof p.house === 'number' ? p.house : parseInt(p.house) || 1) : ((signIndex - lagnaSignIndex + 12) % 12) + 1)
    const meta = PLANET_META[pName] || { sanskrit: pName, symbol: '✦', short: pName.slice(0, 2) }
    const dignity = deriveDignity(pName, signIndex, p.dignity || p.status)
    const dispositor = SIGN_LORDS[signName] || '—'

    // Nakshatra and pada derivation if missing
    let nakshatraName = p.nakshatra_name
    let nakshatraNum = p.nakshatra_number ?? p.nakshatra
    let pada = p.pada
    if (!nakshatraName && p.nakshatra) {
      const parts = String(p.nakshatra).split('•')
      nakshatraName = parts[0]?.trim() || 'Ashwini'
      if (parts[1]) {
        const padaMatch = parts[1].match(/\d+/)
        if (padaMatch) pada = parseInt(padaMatch[0], 10)
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
      nakshatra: nakshatraName || 'Ashwini',
      nakshatraNumber: nakshatraNum || 1,
      nakshatraLord: '—',
      pada: pada || 1,
      dignity,
      lordOfHouses: p.lord_of_houses || [],
      dispositor,
      sunSeparation: p.sun_separation,
    })
  }

  // 2. Process Houses
  const houses: HousePosition[] = []
  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + (h - 1)) % 12
    const signName = SIGN_NAMES[signIndex]
    const lord = SIGN_LORDS[signName]
    const occupants = planets.filter((p) => p.houseNumber === h).map((p) => p.name)
    const rawBhava = (rawRasi?.bhavas || []).find((b: any) => b.house === h)

    houses.push({
      number: h,
      name: `${getOrdinal(h)} House${h === 1 ? ' (Lagna)' : ''}`,
      sign: signName,
      signNumber: signIndex + 1,
      signIndex,
      lord,
      occupants,
      aspectsReceived: [],
      startLongitude: rawBhava?.start,
      cuspLongitude: rawBhava?.middle,
      endLongitude: rawBhava?.end,
      categories: deriveHouseCategories(h),
    })
  }

  // 3. Process Divisional Charts (Vargas)
  const vargas: Record<string, VargaChartData> = {}

  // D1 Rashi
  vargas['D1'] = {
    code: 'D1',
    name: 'Rashi',
    divisions: 1,
    purpose: 'Core life, physical body, general vitality, baseline existence',
    lagnaSignIndex,
    lagnaSignName: SIGN_NAMES[lagnaSignIndex],
    lagnaDms,
    grahas: planets.map((p) => ({
      id: p.id,
      name: p.name,
      short: p.short,
      signIndex: p.signIndex,
      signName: p.sign,
      houseNumber: p.houseNumber,
      retrograde: p.retrograde,
      longitude: p.longitude,
      dms: p.dms,
    })),
  }

  // Check backend shodasavarga
  const shodasavarga = computed.shodasavarga || {}
  const vargaMetadataList = [
    { code: 'D2', name: 'Hora', div: 2, purpose: 'Wealth, financial capacity, solar/lunar balance' },
    { code: 'D3', name: 'Drekkana', div: 3, purpose: 'Siblings, courage, motivation, third-house themes' },
    { code: 'D4', name: 'Chaturthamsha', div: 4, purpose: 'Fixed assets, fortune, residence, inner contentment' },
    { code: 'D7', name: 'Saptamsha', div: 7, purpose: 'Children, progeny, creative lineage, partners' },
    { code: 'D9', name: 'Navamsha', div: 9, purpose: 'Dharma, spouse, marriage, true inner strength, late life' },
    { code: 'D10', name: 'Dashamsha', div: 10, purpose: 'Career, status, public impact, worldly achievements' },
    { code: 'D12', name: 'Dvadashamsha', div: 12, purpose: 'Parents, heritage, past-life momentum, lineage karma' },
    { code: 'D16', name: 'Shodashamsha', div: 16, purpose: 'Vehicles, luxuries, happiness, pleasures, mental ease' },
    { code: 'D20', name: 'Vimshamsha', div: 20, purpose: 'Spiritual inclination, upasana, devotional life' },
    { code: 'D24', name: 'Chaturvimshamsha', div: 24, purpose: 'Higher learning, intellect, academic achievement' },
    { code: 'D27', name: 'Saptavimshamsha', div: 27, purpose: 'Subconscious strengths, weaknesses, stamina' },
    { code: 'D30', name: 'Trimshamsha', div: 30, purpose: 'Misfortune, misfortunes, afflictions, arishta' },
    { code: 'D40', name: 'Khavedamsha', div: 40, purpose: 'Auspicious and inauspicious karmic effects' },
    { code: 'D45', name: 'Akshavedamsha', div: 45, purpose: 'Overall moral character, purity, refinement' },
    { code: 'D60', name: 'Shashtiamsha', div: 60, purpose: 'Past-life karma, root causality, ultimate verification' },
  ]

  for (const meta of vargaMetadataList) {
    const rawVarga = shodasavarga[meta.code]
    if (rawVarga) {
      const vLagnaIdx = rawVarga.lagna?.rasi ?? parseSignIndex(rawVarga.lagna?.rasi_name)
      const vGrahas: VargaGrahaPlacement[] = (rawVarga.grahas || []).map((vg: any) => {
        const vSignIdx = vg.rasi ?? parseSignIndex(vg.rasi_name)
        const vHouse = vg.house || ((vSignIdx - vLagnaIdx + 12) % 12) + 1
        const pMeta = PLANET_META[vg.name] || { short: vg.name.slice(0, 2) }
        return {
          id: vg.id,
          name: vg.name,
          short: pMeta.short,
          signIndex: vSignIdx,
          signName: SIGN_NAMES[vSignIdx] || vg.rasi_name,
          houseNumber: vHouse,
          retrograde: Boolean(vg.retrograde),
          longitude: vg.longitude,
          dms: vg.dms,
        }
      })

      vargas[meta.code] = {
        code: meta.code,
        name: meta.name,
        divisions: meta.div,
        purpose: meta.purpose,
        lagnaSignIndex: vLagnaIdx,
        lagnaSignName: SIGN_NAMES[vLagnaIdx],
        grahas: vGrahas,
      }
    } else {
      // Calculate missing Shodasavarga division mathematically using classical BPHS rules
      const lagnaDeg = parseFloat(lagnaDms) || 0
      const vLagnaSign = calculateVargaSign(meta.code, lagnaSignIndex, lagnaDeg)
      const vGrahas: VargaGrahaPlacement[] = planets.map((p) => {
        const vSign = calculateVargaSign(meta.code, p.signIndex, p.degreeInSign)
        const vHouse = ((vSign - vLagnaSign + 12) % 12) + 1
        return {
          id: p.id,
          name: p.name,
          short: p.short,
          signIndex: vSign,
          signName: SIGN_NAMES[vSign],
          houseNumber: vHouse,
          retrograde: p.retrograde,
        }
      })

      vargas[meta.code] = {
        code: meta.code,
        name: meta.name,
        divisions: meta.div,
        purpose: meta.purpose,
        lagnaSignIndex: vLagnaSign,
        lagnaSignName: SIGN_NAMES[vLagnaSign],
        grahas: vGrahas,
      }
    }
  }

  // 4. Process Dashas (3-level Vimshottari normalization)
  const moon = planets.find((p) => p.name === 'Moon')
  const sun = planets.find((p) => p.name === 'Sun')
  const rawDasha = computed.rawDasha

  let dashaTree: DashaPeriod[] = []
  if (rawDasha?.periods && Array.isArray(rawDasha.periods) && rawDasha.periods.length > 0) {
    dashaTree = rawDasha.periods.map((p: any) => normalizeDashaNode(p, 1))
  } else if (computed.dashas && Array.isArray(computed.dashas) && computed.dashas.length > 0) {
    dashaTree = computed.dashas.map((p: any) => normalizeDashaNode(p, 1))
  } else {
    // Generate full classical 3-level Vimshottari tree from Moon position & birth date
    const moonLong = moon?.longitude ?? (moon ? moon.signIndex * 30 + moon.degreeInSign : 0)
    dashaTree = calculateFallbackVimshottariTree(birthData, moonLong)
  }

  // Determine running periods (MD, AD, PD)
  let runningDasha: string[] = []
  if (rawDasha?.running && Array.isArray(rawDasha.running) && rawDasha.running.length > 0) {
    runningDasha = rawDasha.running.map((r: any) => r.lord_name || r.name)
  } else {
    runningDasha = resolveCurrentRunningDasha(dashaTree)
  }

  return {
    id: computed.id ?? 0,
    name: computed.name ?? 'Live chart',
    birthData,
    metadata: {
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
    },
    quickFacts: {
      lagna: SIGN_NAMES[lagnaSignIndex],
      lagnaDms,
      sunSign: sun ? sun.sign : 'Unavailable',
      moonSign: moon ? moon.sign : 'Unavailable',
      moonDms: moon ? moon.dms : 'Unavailable',
      moonNakshatra: moon ? moon.nakshatra : 'Unavailable',
      moonPada: moon ? moon.pada : 1,
      currentMahadasha: runningDasha[0] || (computed.currentMahadasha?.split(' / ')[0] ?? 'Unavailable'),
      currentAntardasha: runningDasha[1] || (computed.currentMahadasha?.split(' / ')[1] ?? 'Unavailable'),
      currentPratyantardasha: runningDasha[2],
    },
    planets,
    houses,
    vargas,
    dashaTree,
    runningDasha: runningDasha.length ? runningDasha : (computed.currentMahadasha?.split(' / ') || []),
    panchanga: computed.rawPanchanga,
    aspects: computed.aspects,
    raw: {
      rasi: rawRasi,
      dasha: rawDasha,
      panchanga: computed.rawPanchanga,
      shodasavarga: computed.shodasavarga,
    },
  }
}

// ---------------------------------------------------------------------------
// Classical Varga Calculation Rules (BPHS)
// ---------------------------------------------------------------------------

export function calculateVargaSign(code: string, signIndex: number, degreeInSign: number): number {
  const isOdd = signIndex % 2 === 0 // 0=Aries (odd), 1=Taurus (even)

  switch (code) {
    case 'D1':
      return signIndex

    case 'D2': {
      // Hora (15°): Odd signs: 1st half Sun (Leo 4), 2nd half Moon (Cancer 3).
      // Even signs: 1st half Moon (Cancer 3), 2nd half Sun (Leo 4).
      const half = Math.floor(degreeInSign / 15) // 0 or 1
      if (isOdd) {
        return half === 0 ? 4 : 3
      }
      return half === 0 ? 3 : 4
    }

    case 'D3': {
      // Drekkana (10°): 1st decanate same sign, 2nd 5th sign, 3rd 9th sign
      const dec = Math.floor(degreeInSign / 10) // 0, 1, 2
      return (signIndex + dec * 4) % 12
    }

    case 'D4': {
      // Chaturthamsha (7°30'): Odd signs start from self; Even from 4th
      const part = Math.floor(degreeInSign / 7.5) // 0..3
      const start = isOdd ? signIndex : (signIndex + 3) % 12
      return (start + part * 3) % 12
    }

    case 'D7': {
      // Saptamsha (4°17'08.57"): Odd from self; Even from 7th
      const part = Math.floor(degreeInSign / (30 / 7)) // 0..6
      const start = isOdd ? signIndex : (signIndex + 6) % 12
      return (start + part) % 12
    }

    case 'D9':
      return calculateNavamshaSign(signIndex, degreeInSign)

    case 'D10': {
      // Dashamsha (3°): Odd from self; Even from 9th
      const part = Math.floor(degreeInSign / 3) // 0..9
      const start = isOdd ? signIndex : (signIndex + 8) % 12
      return (start + part) % 12
    }

    case 'D12': {
      // Dvadashamsha (2°30'): Starts from self
      const part = Math.floor(degreeInSign / 2.5) // 0..11
      return (signIndex + part) % 12
    }

    case 'D16': {
      // Shodashamsha (1°52'30"): Moveable from Aries(0), Fixed from Leo(4), Dual from Sagittarius(8)
      const part = Math.floor(degreeInSign / 1.875) // 0..15
      const signType = signIndex % 3 // 0=Movable, 1=Fixed, 2=Dual
      const start = signType === 0 ? 0 : signType === 1 ? 4 : 8
      return (start + part) % 12
    }

    case 'D20': {
      // Vimshamsha (1°30'): Moveable from Aries(0), Fixed from Sagittarius(8), Dual from Leo(4)
      const part = Math.floor(degreeInSign / 1.5) // 0..19
      const signType = signIndex % 3
      const start = signType === 0 ? 0 : signType === 1 ? 8 : 4
      return (start + part) % 12
    }

    case 'D24': {
      // Chaturvimshamsha (1°15'): Odd from Leo(4); Even from Cancer(3)
      const part = Math.floor(degreeInSign / 1.25) // 0..23
      const start = isOdd ? 4 : 3
      return (start + part) % 12
    }

    case 'D27': {
      // Saptavimshamsha (1°06'40"): Fire from Aries(0), Earth from Cancer(3), Air from Libra(6), Water from Capricorn(9)
      const part = Math.floor(degreeInSign / (30 / 27)) // 0..26
      const signElem = signIndex % 4 // 0=Fire, 1=Earth, 2=Air, 3=Water
      const start = signElem === 0 ? 0 : signElem === 1 ? 3 : signElem === 2 ? 6 : 9
      return (start + part) % 12
    }

    case 'D30': {
      // Trimshamsha: Unequal division
      // Odd signs: 0-5° Mars (0), 5-10° Saturn (10), 10-18° Jupiter (8), 18-25° Mercury (2), 25-30° Venus (1)
      // Even signs: 0-5° Venus (1), 5-12° Mercury (5), 12-20° Jupiter (11), 20-25° Saturn (9), 25-30° Mars (7)
      if (isOdd) {
        if (degreeInSign < 5) return 0 // Aries (Mars)
        if (degreeInSign < 10) return 10 // Aquarius (Saturn)
        if (degreeInSign < 18) return 8 // Sagittarius (Jupiter)
        if (degreeInSign < 25) return 2 // Gemini (Mercury)
        return 1 // Taurus (Venus)
      } else {
        if (degreeInSign < 5) return 1 // Taurus (Venus)
        if (degreeInSign < 12) return 5 // Virgo (Mercury)
        if (degreeInSign < 20) return 11 // Pisces (Jupiter)
        if (degreeInSign < 25) return 9 // Capricorn (Saturn)
        return 7 // Scorpio (Mars)
      }
    }

    case 'D40': {
      // Khavedamsha (0°45'): Odd from Aries(0); Even from Libra(6)
      const part = Math.floor(degreeInSign / 0.75) // 0..39
      const start = isOdd ? 0 : 6
      return (start + part) % 12
    }

    case 'D45': {
      // Akshavedamsha (0°40'): Moveable from Aries(0), Fixed from Leo(4), Dual from Sagittarius(8)
      const part = Math.floor(degreeInSign / (2 / 3)) // 0..44
      const signType = signIndex % 3
      const start = signType === 0 ? 0 : signType === 1 ? 4 : 8
      return (start + part) % 12
    }

    case 'D60': {
      // Shashtiamsha (0°30'): Starts from sign itself
      const part = Math.floor(degreeInSign / 0.5) // 0..59
      return (signIndex + part) % 12
    }

    default:
      return signIndex
  }
}

// ---------------------------------------------------------------------------
// Vimshottari Dasha Normalization & 3-Level Calculation Helpers
// ---------------------------------------------------------------------------

export const VIMSHOTTARI_CYCLE: { name: string; years: number }[] = [
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

function normalizeDashaNode(node: any, level = 1): DashaPeriod {
  let lordName = node.lord_name || (typeof node.lord === 'string' ? node.lord : '') || node.period || ''
  if (!lordName && typeof node.lord === 'number') {
    lordName = VIMSHOTTARI_CYCLE[node.lord % 9]?.name || 'Unknown'
  }
  if (!lordName) lordName = 'Unknown'

  const children = Array.isArray(node.children)
    ? node.children.map((c: any) => normalizeDashaNode(c, level + 1))
    : []

  return {
    lord: lordName,
    level: node.level || level,
    start: node.start ? String(node.start).slice(0, 19).replace('T', ' ') : '',
    end: node.end ? String(node.end).slice(0, 19).replace('T', ' ') : '',
    startJd: node.start_jd ?? node.startJd,
    endJd: node.end_jd ?? node.endJd,
    durationDays: node.duration_days ?? node.durationDays,
    children,
  }
}

function calculateFallbackVimshottariTree(birthData: BirthData, moonLongitude: number): DashaPeriod[] {
  const nakshatraSpan = 360 / 27 // 13.333333°
  const nakIndex = Math.floor(moonLongitude / nakshatraSpan)
  const degInNak = moonLongitude - nakIndex * nakshatraSpan
  const fracElapsed = degInNak / nakshatraSpan

  const startLordIndex = nakIndex % 9
  const birthDate = new Date(Date.UTC(birthData.year, birthData.month - 1, birthData.day, birthData.hour, birthData.minute, birthData.second || 0))
  const msPerYear = 365.2425 * 24 * 60 * 60 * 1000

  const periods: DashaPeriod[] = []
  let currentDate = new Date(birthDate.getTime() - fracElapsed * VIMSHOTTARI_CYCLE[startLordIndex].years * msPerYear)

  for (let i = 0; i < 9; i++) {
    const lordIdx = (startLordIndex + i) % 9
    const lordMeta = VIMSHOTTARI_CYCLE[lordIdx]
    const mdYears = lordMeta.years
    const mdDurationMs = mdYears * msPerYear
    const mdStart = new Date(currentDate.getTime())
    const mdEnd = new Date(mdStart.getTime() + mdDurationMs)

    // Build 9 Antardashas
    const adChildren: DashaPeriod[] = []
    let adCurrentDate = new Date(mdStart.getTime())

    for (let j = 0; j < 9; j++) {
      const adLordIdx = (lordIdx + j) % 9
      const adLordMeta = VIMSHOTTARI_CYCLE[adLordIdx]
      const adFraction = adLordMeta.years / 120
      const adDurationMs = mdDurationMs * adFraction
      const adStart = new Date(adCurrentDate.getTime())
      const adEnd = new Date(adStart.getTime() + adDurationMs)

      // Build 9 Pratyantardashas
      const pdChildren: DashaPeriod[] = []
      let pdCurrentDate = new Date(adStart.getTime())

      for (let k = 0; k < 9; k++) {
        const pdLordIdx = (adLordIdx + k) % 9
        const pdLordMeta = VIMSHOTTARI_CYCLE[pdLordIdx]
        const pdFraction = pdLordMeta.years / 120
        const pdDurationMs = adDurationMs * pdFraction
        const pdStart = new Date(pdCurrentDate.getTime())
        const pdEnd = new Date(pdStart.getTime() + pdDurationMs)

        pdChildren.push({
          lord: pdLordMeta.name,
          level: 3,
          start: pdStart.toISOString().slice(0, 10),
          end: pdEnd.toISOString().slice(0, 10),
          durationDays: Math.round(pdDurationMs / (24 * 3600 * 1000)),
        })

        pdCurrentDate = pdEnd
      }

      adChildren.push({
        lord: adLordMeta.name,
        level: 2,
        start: adStart.toISOString().slice(0, 10),
        end: adEnd.toISOString().slice(0, 10),
        durationDays: Math.round(adDurationMs / (24 * 3600 * 1000)),
        children: pdChildren,
      })

      adCurrentDate = adEnd
    }

    periods.push({
      lord: lordMeta.name,
      level: 1,
      start: mdStart.toISOString().slice(0, 10),
      end: mdEnd.toISOString().slice(0, 10),
      durationDays: Math.round(mdDurationMs / (24 * 3600 * 1000)),
      children: adChildren,
    })

    currentDate = mdEnd
  }

  return periods
}

function resolveCurrentRunningDasha(dashaTree: DashaPeriod[]): string[] {
  const now = new Date().toISOString().slice(0, 10)
  for (const md of dashaTree) {
    if (md.start <= now && now <= md.end) {
      const running = [md.lord]
      if (md.children && md.children.length > 0) {
        for (const ad of md.children) {
          if (ad.start <= now && now <= ad.end) {
            running.push(ad.lord)
            if (ad.children && ad.children.length > 0) {
              for (const pd of ad.children) {
                if (pd.start <= now && now <= pd.end) {
                  running.push(pd.lord)
                  break
                }
              }
            }
            break
          }
        }
      }
      return running
    }
  }
  return dashaTree[0] ? [dashaTree[0].lord] : []
}

