/**
 * Special Lagnas & Upagrahas Service
 * Brihat Parashara Hora Shastra (BPHS) Chapters 4 & 5
 * Kundli Workbench Server Core
 * 
 * Provides:
 * 1. Special Lagnas:
 *    - Bhaava Lagna (BL): Physical vitality & baseline self
 *    - Hora Lagna (HL): Wealth, finances, revenue, and material prosperity
 *    - Ghati Lagna (GL): Power, fame, authority, political/administrative eminence
 *    - Sree Lagna (SL): Goddess Lakshmi's blessing, financial fortune from marriage
 *    - Indu Lagna (IL): Dhana/Wealth potential calculated from 9th lords' ray kalas
 *    - Bhrigu Bindu (BB): Fateful karmic trigger midpoint between Moon and Rahu
 *    - Pranapada Lagna (PP): Life breath / vitality point used in birthtime rectification
 * 
 * 2. Sun-Based Upagrahas (Aprakasha Grahas):
 *    - Dhuma (Smoke/Fume): Sun + 133°20'
 *    - Vyatipaata (Calamity): 360° - Dhuma
 *    - Parivesha / Paridhi (Halo): Vyatipaata + 180°
 *    - Indrachaapa / Kodu (Rainbow): 360° - Parivesha
 *    - Upaketu (Sub-comet): Indrachaapa + 16°40' (or Sun - 30°)
 * 
 * 3. Time-Based Upagrahas (Prahara sub-portions):
 *    - Kaala (Sun's portion)
 *    - Mrityu (Mars's portion)
 *    - Artha Praharaka (Mercury's portion)
 *    - Yama Ghantaka (Jupiter's portion)
 *    - Gulika (Saturn's portion, midpoint)
 *    - Maandi (Saturn's portion, beginning)
 */

const {
  SIGN_NAMES,
  SIGN_LORDS,
  formatDms,
  getOrdinal,
} = require('./astroConstants')

// Planetary Ray Kalas for Indu Lagna (BPHS / Jaimini Upadesha)
const RAY_KALAS = {
  Sun: 30,
  Moon: 16,
  Mars: 6,
  Mercury: 8,
  Jupiter: 10,
  Venus: 12,
  Saturn: 1,
}

// Special Lagna metadata and classical significations
const SPECIAL_LAGNA_META = {
  BL: {
    name: 'Bhaava Lagna',
    sanskritName: 'Bhaava Lagna',
    code: 'BL',
    signifies: 'Physical vitality, baseline self, constitution, and health manifestations',
    rate: '15° per hour (1 sign per 2 hours)',
    nature: 'Auspicious Foundation',
  },
  HL: {
    name: 'Hora Lagna',
    sanskritName: 'Hora Lagna',
    code: 'HL',
    signifies: 'Wealth, money, assets, treasury, business prosperity, and financial timing',
    rate: '30° per hour (1 sign per hour)',
    nature: 'Lakshmi Sthana (Wealth)',
  },
  GL: {
    name: 'Ghati Lagna',
    sanskritName: 'Ghatika Lagna',
    code: 'GL',
    signifies: 'Fame, political power, authority, high rank, public eminence, and career leadership',
    rate: '1.25° per minute (1 sign per ghati / 24 mins)',
    nature: 'Rajya Sthana (Power & Fame)',
  },
  SL: {
    name: 'Sree Lagna',
    sanskritName: 'Sree Lagna',
    code: 'SL',
    signifies: 'Divine grace of Goddess Lakshmi, accumulated prosperity, and marital fortune',
    rate: 'Derived from Moon nakshatra traversal',
    nature: 'Prosperity & Divine Grace',
  },
  IL: {
    name: 'Indu Lagna',
    sanskritName: 'Indu Lagna (Chandra Lagna of Wealth)',
    code: 'IL',
    signifies: 'Inherent financial destiny, million-fold wealth potential, and unearned riches',
    rate: 'Derived from 9th lords ray kalas',
    nature: 'Dhana Sthana (Financial Destiny)',
  },
  BB: {
    name: 'Bhrigu Bindu',
    sanskritName: 'Bhrigu Bindu (Karmic Midpoint)',
    code: 'BB',
    signifies: 'Fateful karmic destination, major life turning points, and transit triggers',
    rate: 'Midpoint between Moon and Rahu',
    nature: 'Karmic Catalyst Point',
  },
  PP: {
    name: 'Pranapada Lagna',
    sanskritName: 'Pranapada Lagna',
    code: 'PP',
    signifies: 'Life breath, soul incarnation correctness, and birth rectification validation',
    rate: '1 sign per ghati from sunrise',
    nature: 'Vitality & Life Force',
  },
}

// Upagraha metadata and classical significations
const UPAGRAHA_META = {
  Dhuma: {
    code: 'Dh',
    sanskritName: 'Dhuma (Fume / Smoke)',
    group: 'Sun-Based (Aprakasha)',
    nature: 'Intense Heat, Obstacles & Mental Restlessness',
    ruler: 'Sun',
    description: 'Calculated as Sun + 133°20\'. Causes combustion-like distress and burning desires in its house.',
  },
  Vyatipaata: {
    code: 'Vy',
    sanskritName: 'Vyatipaata (Great Calamity)',
    group: 'Sun-Based (Aprakasha)',
    nature: 'Sudden Upheaval & Shock Events',
    ruler: 'Rahu-like',
    description: 'Calculated as 360° - Dhuma. Highly malefic shadow point causing unexpected reversals.',
  },
  Parivesha: {
    code: 'Pv',
    sanskritName: 'Parivesha / Paridhi (Solar Halo)',
    group: 'Sun-Based (Aprakasha)',
    nature: 'Confinement & Hidden Enmities',
    ruler: 'Moon-like',
    description: 'Calculated as Vyatipaata + 180°. Creates psychological entrapment and secrecy.',
  },
  Indrachaapa: {
    code: 'In',
    sanskritName: 'Indrachaapa / Kodu (Indra\'s Bow)',
    group: 'Sun-Based (Aprakasha)',
    nature: 'Sudden Splendor followed by Conflict',
    ruler: 'Venus/Mars-like',
    description: 'Calculated as 360° - Parivesha. Brings sudden external prominence with internal vulnerability.',
  },
  Upaketu: {
    code: 'Uk',
    sanskritName: 'Upaketu (Sub-Comet)',
    group: 'Sun-Based (Aprakasha)',
    nature: 'Sudden Dissolution & Spiritual Detachment',
    ruler: 'Ketu',
    description: 'Calculated as Indrachaapa + 16°40\' (Sun - 30°). Triggers sudden severing of attachments.',
  },
  Kaala: {
    code: 'Kl',
    sanskritName: 'Kaala (Time Spirit)',
    group: 'Time-Based (Prahara)',
    nature: 'Cruel, Ruthless & Authoritative',
    ruler: 'Sun',
    description: 'Rises during Sun\'s eighth of day or night. Brings unyielding karmic reckoning.',
  },
  Mrityu: {
    code: 'Mr',
    sanskritName: 'Mrityu (Fatal Impact)',
    group: 'Time-Based (Prahara)',
    nature: 'Accidents, Surgery & Blood Afflictions',
    ruler: 'Mars',
    description: 'Rises during Mars\'s eighth of day or night. Threatens physical safety when conjoined with benefics.',
  },
  'Artha Praharaka': {
    code: 'AP',
    sanskritName: 'Artha Praharaka (Commercial Strain)',
    group: 'Time-Based (Prahara)',
    nature: 'Commercial Loss & Analytical Anxiety',
    ruler: 'Mercury',
    description: 'Rises during Mercury\'s eighth of day or night. Creates financial worry and contract disputes.',
  },
  'Yama Ghantaka': {
    code: 'YG',
    sanskritName: 'Yama Ghantaka (Bell of Yama)',
    group: 'Time-Based (Prahara)',
    nature: 'Protective & Auspicious Blessing',
    ruler: 'Jupiter',
    description: 'Rises during Jupiter\'s eighth of day or night. Considered the only benefic time-based upagraha.',
  },
  Gulika: {
    code: 'Gk',
    sanskritName: 'Gulika (Saturn\'s Sensitive Node)',
    group: 'Time-Based (Prahara)',
    nature: 'Poisonous Delays, Chronic Affliction & Death Harbinger',
    ruler: 'Saturn',
    description: 'Rises at the midpoint of Saturn\'s eighth. Crucial in Parashari & Kerala astrology for longevity and afflictions.',
  },
  Maandi: {
    code: 'Md',
    sanskritName: 'Maandi (Saturn\'s Lethargic Node)',
    group: 'Time-Based (Prahara)',
    nature: 'Stagnation, Laziness & Karmic Debt',
    ruler: 'Saturn',
    description: 'Rises at the beginning of Saturn\'s eighth. Similar to Gulika, heavily used in Prashna and Jaimini.',
  },
}

/**
 * Calculates classical Indu Lagna from 9th lords from Lagna and Moon
 */
function calculateInduLagnaPoint(lagnaSignIndex, moon, planetsMap) {
  const moonSignIdx = moon ? moon.signIndex : 0
  const lagna9thSign = (lagnaSignIndex + 8) % 12
  const moon9thSign = (moonSignIdx + 8) % 12

  const lagna9thLord = SIGN_LORDS[SIGN_NAMES[lagna9thSign]] || 'Mars'
  const moon9thLord = SIGN_LORDS[SIGN_NAMES[moon9thSign]] || 'Venus'

  const lagnaKala = RAY_KALAS[lagna9thLord] || 0
  const moonKala = RAY_KALAS[moon9thLord] || 0
  const sumKalas = lagnaKala + moonKala

  let remainder = sumKalas % 12
  if (remainder === 0) remainder = 12

  const induSignIdx = (moonSignIdx + remainder - 1) % 12
  const induSignName = SIGN_NAMES[induSignIdx]
  const houseNumber = ((induSignIdx - lagnaSignIndex + 12) % 12) + 1

  // Degree matches Moon's degree in sign by classical convention
  const degInSign = moon ? (moon.degreeInSign || 15) : 15
  const longitude = induSignIdx * 30 + degInSign

  return {
    id: 4,
    name: SPECIAL_LAGNA_META.IL.name,
    sanskritName: SPECIAL_LAGNA_META.IL.sanskritName,
    code: SPECIAL_LAGNA_META.IL.code,
    abbreviation: 'IL',
    longitude: Number(longitude.toFixed(4)),
    signIndex: induSignIdx,
    sign: induSignName,
    degrees_in_rasi: degInSign,
    degreeInSign: degInSign,
    dms: formatDms(degInSign),
    houseNumber,
    houseOrdinal: getOrdinal(houseNumber),
    signifies: SPECIAL_LAGNA_META.IL.signifies,
    nature: SPECIAL_LAGNA_META.IL.nature,
    calculationDetails: {
      lagna9thLord,
      lagnaKala,
      moon9thLord,
      moonKala,
      sumKalas,
      remainder,
    },
  }
}

/**
 * Calculates Bhrigu Bindu (Karmic Midpoint between Moon and Rahu)
 */
function calculateBhriguBinduPoint(lagnaSignIndex, moon, rahu) {
  const moonLon = moon?.longitude || 0
  const rahuLon = rahu?.longitude || 0

  // Direct shortest forward arc from Moon to Rahu
  let arc = (rahuLon - moonLon + 360) % 360
  let bbLon = (moonLon + arc / 2) % 360

  const signIndex = Math.floor(bbLon / 30)
  const degInSign = bbLon % 30
  const houseNumber = ((signIndex - lagnaSignIndex + 12) % 12) + 1

  return {
    id: 5,
    name: SPECIAL_LAGNA_META.BB.name,
    sanskritName: SPECIAL_LAGNA_META.BB.sanskritName,
    code: SPECIAL_LAGNA_META.BB.code,
    abbreviation: 'BB',
    longitude: Number(bbLon.toFixed(4)),
    signIndex,
    sign: SIGN_NAMES[signIndex],
    degrees_in_rasi: degInSign,
    degreeInSign: degInSign,
    dms: formatDms(degInSign),
    houseNumber,
    houseOrdinal: getOrdinal(houseNumber),
    signifies: SPECIAL_LAGNA_META.BB.signifies,
    nature: SPECIAL_LAGNA_META.BB.nature,
    calculationDetails: {
      moonLongitude: moonLon,
      rahuLongitude: rahuLon,
      arcSpan: Number(arc.toFixed(2)),
    },
  }
}

/**
 * Normalizes and enriches raw special lagnas from Python Hora API with full house placements
 */
function normalizeSpecialLagnas(rawResponse, lagnaSignIndex, planets, birthData) {
  const planetsMap = new Map()
  planets.forEach((p) => planetsMap.set(p.name, p))
  const moon = planetsMap.get('Moon')
  const rahu = planetsMap.get('Rahu')

  const lagnas = []

  const rawList = Array.isArray(rawResponse)
    ? rawResponse
    : Array.isArray(rawResponse?.special_lagnas)
    ? rawResponse.special_lagnas
    : []

  for (const raw of rawList) {
    const code = raw.abbreviation || SPECIAL_LAGNA_META[raw.name]?.code || 'SL'
    const meta = SPECIAL_LAGNA_META[code] || {}
    const lon = raw.longitude || 0
    const signIndex = raw.rasi !== undefined ? raw.rasi : Math.floor(lon / 30)
    const degInSign = raw.degrees_in_rasi != null ? raw.degrees_in_rasi : lon % 30
    const houseNumber = ((signIndex - lagnaSignIndex + 12) % 12) + 1

    // Find occupants sharing this house
    const occupants = planets.filter((p) => p.houseNumber === houseNumber).map((p) => p.name)

    lagnas.push({
      id: raw.id,
      name: meta.name || raw.name,
      sanskritName: meta.sanskritName || raw.name,
      code,
      abbreviation: code,
      longitude: Number(lon.toFixed(4)),
      signIndex,
      sign: SIGN_NAMES[signIndex] || raw.rasi_name,
      degrees_in_rasi: degInSign,
      degreeInSign: degInSign,
      dms: raw.dms ? String(raw.dms).replace(/-/g, '°') + '"' : formatDms(degInSign),
      houseNumber,
      houseOrdinal: getOrdinal(houseNumber),
      signifies: meta.signifies || raw.signifies || 'Special life focal point',
      rate: meta.rate || `${raw.degrees_per_minute || 0}° per minute`,
      nature: meta.nature || 'Auspicious Sthana',
      occupants,
    })
  }

  // Calculate Indu Lagna
  const induLagna = calculateInduLagnaPoint(lagnaSignIndex, moon, planetsMap)
  induLagna.occupants = planets.filter((p) => p.houseNumber === induLagna.houseNumber).map((p) => p.name)
  lagnas.push(induLagna)

  // Calculate Bhrigu Bindu
  const bhriguBindu = calculateBhriguBinduPoint(lagnaSignIndex, moon, rahu)
  bhriguBindu.occupants = planets.filter((p) => p.houseNumber === bhriguBindu.houseNumber).map((p) => p.name)
  lagnas.push(bhriguBindu)

  return lagnas
}

/**
 * Normalizes and enriches raw Upagrahas from Python Hora API with full house placements
 */
function normalizeUpagrahas(rawResponse, lagnaSignIndex, planets) {
  const upagrahas = []

  const rawList = Array.isArray(rawResponse)
    ? rawResponse
    : Array.isArray(rawResponse?.upagrahas)
    ? rawResponse.upagrahas
    : []

  for (const raw of rawList) {
    const meta = UPAGRAHA_META[raw.name] || {}
    const lon = raw.longitude || 0
    const signIndex = raw.rasi !== undefined ? raw.rasi : Math.floor(lon / 30)
    const degInSign = raw.degrees_in_rasi != null ? raw.degrees_in_rasi : lon % 30
    const houseNumber = ((signIndex - lagnaSignIndex + 12) % 12) + 1

    // Occupants sharing this house
    const occupants = planets.filter((p) => p.houseNumber === houseNumber).map((p) => p.name)

    upagrahas.push({
      id: raw.id,
      name: raw.name,
      sanskritName: meta.sanskritName || raw.name,
      code: meta.code || raw.name.slice(0, 2),
      longitude: Number(lon.toFixed(4)),
      signIndex,
      sign: SIGN_NAMES[signIndex] || raw.rasi_name,
      degrees_in_rasi: degInSign,
      degreeInSign: degInSign,
      dms: raw.dms ? String(raw.dms).replace(/-/g, '°') + '"' : formatDms(degInSign),
      houseNumber,
      houseOrdinal: getOrdinal(houseNumber),
      group: meta.group || (raw.group === 'sun_based' ? 'Sun-Based (Aprakasha)' : 'Time-Based (Prahara)'),
      nature: meta.nature || 'Sensitive Malefic Point',
      ruler: meta.ruler || raw.part_lord || 'Saturn',
      partLord: raw.part_lord || null,
      risesAt: raw.rises_at || null,
      description: meta.description || '',
      occupants,
    })
  }

  // Summary groupings
  const sunBased = upagrahas.filter((u) => u.group.includes('Sun-Based'))
  const timeBased = upagrahas.filter((u) => u.group.includes('Time-Based'))
  const gulika = upagrahas.find((u) => u.name === 'Gulika')
  const maandi = upagrahas.find((u) => u.name === 'Maandi')

  return {
    all: upagrahas,
    sunBased,
    timeBased,
    gulika: gulika || null,
    maandi: maandi || null,
    totalCount: upagrahas.length,
  }
}

/**
 * Top-level master function: compute and synthesize all special lagnas and upagrahas
 */
function computeAllSpecialPoints(rawLagnas, rawUpagrahas, lagnaSignIndex, planets, birthData) {
  const lagnas = normalizeSpecialLagnas(rawLagnas, lagnaSignIndex, planets, birthData)
  const upagrahaData = normalizeUpagrahas(rawUpagrahas, lagnaSignIndex, planets)

  // Map by house for instant lookup on chart wheels
  const pointsByHouse = {}
  for (let h = 1; h <= 12; h++) {
    pointsByHouse[h] = {
      house: h,
      lagnas: [],
      upagrahas: [],
    }
  }

  lagnas.forEach((l) => {
    if (pointsByHouse[l.houseNumber]) {
      pointsByHouse[l.houseNumber].lagnas.push(l)
    }
  })

  upagrahaData.all.forEach((u) => {
    if (pointsByHouse[u.houseNumber]) {
      pointsByHouse[u.houseNumber].upagrahas.push(u)
    }
  })

  return {
    specialLagnas: lagnas,
    upagrahas: upagrahaData,
    pointsByHouse,
    horaLagna: lagnas.find((l) => l.code === 'HL') || null,
    ghatiLagna: lagnas.find((l) => l.code === 'GL') || null,
    sreeLagna: lagnas.find((l) => l.code === 'SL') || null,
    bhaavaLagna: lagnas.find((l) => l.code === 'BL') || null,
    induLagna: lagnas.find((l) => l.code === 'IL') || null,
    bhriguBindu: lagnas.find((l) => l.code === 'BB') || null,
    gulika: upagrahaData.gulika,
    maandi: upagrahaData.maandi,
  }
}

module.exports = {
  SPECIAL_LAGNA_META,
  UPAGRAHA_META,
  calculateInduLagnaPoint,
  calculateBhriguBinduPoint,
  normalizeSpecialLagnas,
  normalizeUpagrahas,
  computeAllSpecialPoints,
}

