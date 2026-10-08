import type {
  AstroChart,
  BirthData,
  DashaPeriod,
  DignityType,
  HousePosition,
  PlanetPosition,
  PlanetaryYoga,
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

export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
]

export const PLANET_NATURAL_KARAKAS: Record<string, string> = {
  Sun: 'Soul (Atma), Father (Pitri), Vitality, Royalty, Government, Willpower',
  Moon: 'Mind (Manas), Mother (Matri), Emotions, Peace, Memory, Nourishment',
  Mars: 'Courage (Parakrama), Siblings (Bhratri), Real Estate, Energy, Technical Skill',
  Mercury: 'Intellect (Buddhi), Speech (Vak), Commerce, Analysis, Education, Trade',
  Jupiter: 'Wisdom (Guru), Wealth (Dhana), Children (Santana), Dharma, Divine Grace',
  Venus: 'Spouse & Love (Kalatra), Arts, Vehicles, Refinement, Sensual Harmony',
  Saturn: 'Longevity (Ayush), Discipline, Hard Work, Grief/Endurance, Service, Detachment',
  Rahu: 'Worldly Ambition, Foreign Connections, Innovation, Unconventionality, Maya',
  Ketu: 'Liberation (Moksha), Spiritual Detachment, Occult Knowledge, Renunciation',
}

export const HOUSE_METADATA: Record<number, {
  sanskrit: string
  karaka: string
  bhavatBhavam: string
  purushartha: 'Dharma' | 'Artha' | 'Kama' | 'Moksha'
  significations: string[]
}> = {
  1: {
    sanskrit: 'Tanu Bhava (Body / Self / Lagna)',
    karaka: 'Sun (Vitality, Soul, Physical Constitution)',
    bhavatBhavam: '1st from 1st — Foundation of all 12 bhavas',
    purushartha: 'Dharma',
    significations: ['Physical constitution', 'Personality & self-image', 'Vitality & health', 'Life path & fame', 'Head & brain'],
  },
  2: {
    sanskrit: 'Dhana Bhava (Wealth / Family / Speech)',
    karaka: 'Jupiter (Wealth, Family, Speech)',
    bhavatBhavam: '8th from 7th (Spouse longevity & partner resources)',
    purushartha: 'Artha',
    significations: ['Accumulated wealth & savings', 'Lineage & early family', 'Vak (Speech & eloquence)', 'Dietary habits', 'Right eye & face'],
  },
  3: {
    sanskrit: 'Sahaja Bhava (Siblings / Courage / Effort)',
    karaka: 'Mars (Courage, Siblings, Enterprise)',
    bhavatBhavam: '8th from 8th (Secondary longevity & vitality)',
    purushartha: 'Kama',
    significations: ['Valor & enterprise (Parakrama)', 'Younger siblings', 'Hands, arms & manual skill', 'Short journeys & communications', 'Desires & hobbies'],
  },
  4: {
    sanskrit: 'Sukha Bhava (Happiness / Mother / Home)',
    karaka: 'Moon & Venus (Mother, Peace, Vehicles)',
    bhavatBhavam: '4th from 1st (Heart & inner emotional core)',
    purushartha: 'Moksha',
    significations: ['Mother (Matri) & maternal lineage', 'Inner peace & mental contentment', 'Real estate, land & fixed home', 'Vehicles (Vahana)', 'Chest, heart & lungs'],
  },
  5: {
    sanskrit: 'Putra Bhava (Children / Intellect / Purva Punya)',
    karaka: 'Jupiter (Children, Wisdom, Higher intellect)',
    bhavatBhavam: '9th from 9th (Highest dharma & divine grace)',
    purushartha: 'Dharma',
    significations: ['Children & lineage continuity', 'Purva Punya (Past life merits)', 'Creative intelligence & discernment (Dhi)', 'Mantras, devotion & speculation', 'Stomach & spine'],
  },
  6: {
    sanskrit: 'Ari / Shatru Bhava (Enemies / Health / Service)',
    karaka: 'Mars & Saturn (Overcoming debts, disease & adversaries)',
    bhavatBhavam: '12th from 7th (Losses/challenges to competitors)',
    purushartha: 'Artha',
    significations: ['Overcoming obstacles & rivals', 'Daily work, service & employees', 'Debts (Rina) & litigations', 'Physical ailments (Roga)', 'Intestines & digestive fire'],
  },
  7: {
    sanskrit: 'Yuvati / Kalatra Bhava (Spouse / Union / Partnerships)',
    karaka: 'Venus (Spouse, Love, Marital harmony)',
    bhavatBhavam: '10th from 10th (Secondary career, trade & public action)',
    purushartha: 'Kama',
    significations: ['Spouse & marriage (Kalatra)', 'Business partnerships & contracts', 'Foreign travel & trade', 'Public interactions', 'Kidneys & lower abdomen'],
  },
  8: {
    sanskrit: 'Randhra Bhava (Transformation / Longevity / Occult)',
    karaka: 'Saturn (Longevity, Grief, Hidden endurance)',
    bhavatBhavam: '2nd from 7th (Partner assets & joint finances)',
    purushartha: 'Moksha',
    significations: ['Ayush (Longevity & life-span)', 'Sudden transformations & crises', 'Inheritance & unearned wealth', 'Occult studies & deep research', 'Reproductive organs'],
  },
  9: {
    sanskrit: 'Dharma Bhava (Fortune / Guru / Divine Law)',
    karaka: 'Jupiter & Sun (Guru, Dharma, Father, Divine grace)',
    bhavatBhavam: '5th from 5th (Purva punya of knowledge & grandchildren)',
    purushartha: 'Dharma',
    significations: ['Bhagya (Good fortune & divine grace)', 'Guru & spiritual preceptors', 'Father & righteousness (Dharma)', 'Higher philosophical learning', 'Hips & thighs'],
  },
  10: {
    sanskrit: 'Karma Bhava (Profession / Action / Status)',
    karaka: 'Mercury, Sun, Jupiter, Saturn (Career, Karma, Authority)',
    bhavatBhavam: '7th from 4th (External world vs home)',
    purushartha: 'Artha',
    significations: ['Career, profession & vocation', 'Public standing, prestige & honors', 'Government authority & leadership', 'Worldly duty & achievements', 'Knees & joints'],
  },
  11: {
    sanskrit: 'Labha Bhava (Gains / Aspirations / Networks)',
    karaka: 'Jupiter (Gains, Inflow of wealth, Fulfillment)',
    bhavatBhavam: '6th from 6th (Secondary overcoming of difficulties)',
    purushartha: 'Kama',
    significations: ['Material gains & steady profits', 'Elder siblings & mentors', 'Social networks & large associations', 'Fulfillment of long-term desires', 'Calves, ankles & left ear'],
  },
  12: {
    sanskrit: 'Vyaya Bhava (Expenditure / Isolation / Moksha)',
    karaka: 'Saturn & Ketu (Moksha, Release, Spiritual solitude)',
    bhavatBhavam: '4th from 9th (Spiritual shelter); Final culmination',
    purushartha: 'Moksha',
    significations: ['Expenditure & charitable giving', 'Foreign lands & distant settlements', 'Spiritual liberation (Moksha)', 'Subconscious mind & dreams', 'Feet & left eye'],
  },
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

    const finalNakNum = typeof nakshatraNum === 'number' ? nakshatraNum : parseInt(nakshatraNum) || 1
    const nakshatraLord = NAKSHATRA_LORDS[(finalNakNum - 1) % 9] || '—'

    // Robust Parashari Lord of Houses calculation
    let lordOfHouses: number[] = []
    if (Array.isArray(p.lord_of_houses) && p.lord_of_houses.length > 0) {
      lordOfHouses = [...p.lord_of_houses]
    } else {
      for (let h = 1; h <= 12; h++) {
        const hSignIdx = (lagnaSignIndex + (h - 1)) % 12
        const hSignName = SIGN_NAMES[hSignIdx]
        if (SIGN_LORDS[hSignName] === pName) {
          lordOfHouses.push(h)
        }
      }
    }

    const naturalKaraka = PLANET_NATURAL_KARAKAS[pName] || '—'

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
      nakshatraNumber: finalNakNum,
      nakshatraLord,
      pada: pada || 1,
      dignity,
      lordOfHouses,
      dispositor,
      sunSeparation: p.sun_separation,
      naturalKaraka,
      aspectsCast: [],
      aspectsReceived: [],
    })
  }

  // 1b. Compute Jaimini 7-Karaka Chara Karakas
  const classicalGrahas = planets.filter((pl) =>
    ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(pl.name)
  )
  classicalGrahas.sort((a, b) => b.degreeInSign - a.degreeInSign)
  const charaRoles = [
    { code: 'AK', name: 'Atmakaraka (AK)' },
    { code: 'AmK', name: 'Amatyakaraka (AmK)' },
    { code: 'BK', name: 'Bhratrikaraka (BK)' },
    { code: 'MK', name: 'Matrikaraka (MK)' },
    { code: 'PK', name: 'Putrakaraka (PK)' },
    { code: 'GK', name: 'Gnatikaraka (GK)' },
    { code: 'DK', name: 'Darakaraka (DK)' },
  ]
  classicalGrahas.forEach((pl, idx) => {
    if (charaRoles[idx]) {
      pl.charaKarakaCode = charaRoles[idx].code
      pl.charaKaraka = charaRoles[idx].name
    }
  })

  // 1c. Compute Functional Role by Lagna
  for (const pl of planets) {
    const rKendra = pl.lordOfHouses.some((h) => [1, 4, 7, 10].includes(h))
    const rTrikona = pl.lordOfHouses.some((h) => [5, 9].includes(h))
    const rDusthana = pl.lordOfHouses.some((h) => [6, 8, 12].includes(h))
    const rMaraka = pl.lordOfHouses.some((h) => [2, 7].includes(h))
    const rLagna = pl.lordOfHouses.includes(1)

    if (rKendra && rTrikona) {
      pl.functionalType = 'Yogakaraka'
      pl.functionalRole = `Yogakaraka (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord) • Auspicious Raja Yoga producer for this Ascendant`
    } else if (rLagna) {
      pl.functionalType = 'Lagna Lord'
      pl.functionalRole = `Lagna Lord (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord) • Prime guardian of life force, constitution, and self`
    } else if (rTrikona) {
      pl.functionalType = 'Functional Benefic'
      pl.functionalRole = `Functional Benefic (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord) • Auspicious Trikona lord blessing fortune and merit`
    } else if (rDusthana && !rLagna) {
      pl.functionalType = 'Functional Malefic'
      pl.functionalRole = `Functional Malefic (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord) • Dusthana lord bringing karmic tests and growth through effort`
    } else if (rMaraka) {
      pl.functionalType = 'Maraka'
      pl.functionalRole = `Maraka Lord (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord) • Signifies alliances, worldly resources, and major life transitions`
    } else if (pl.name === 'Rahu' || pl.name === 'Ketu') {
      pl.functionalType = 'Neutral'
      pl.functionalRole = `Karmic Node (in ${pl.houseOrdinal} House) • Operates through dispositor ${pl.dispositor}`
    } else {
      pl.functionalType = 'Neutral'
      pl.functionalRole = `Functional Neutral (${pl.lordOfHouses.map(getOrdinal).join(' & ')} Lord)`
    }
  }

  // 1d. Compute Parashari Drishti (Aspects Cast & Received)
  for (const pl of planets) {
    const aspectsList: { targetH: number; type: string }[] = []
    // 7th full aspect for all planets
    aspectsList.push({ targetH: ((pl.houseNumber + 6 - 1) % 12) + 1, type: '7th Aspect (Full Opposition)' })

    if (pl.name === 'Mars') {
      aspectsList.push({ targetH: ((pl.houseNumber + 3 - 1) % 12) + 1, type: '4th Special Aspect (Square)' })
      aspectsList.push({ targetH: ((pl.houseNumber + 7 - 1) % 12) + 1, type: '8th Special Aspect' })
    } else if (pl.name === 'Jupiter' || pl.name === 'Rahu' || pl.name === 'Ketu') {
      aspectsList.push({ targetH: ((pl.houseNumber + 4 - 1) % 12) + 1, type: '5th Special Aspect (Trine)' })
      aspectsList.push({ targetH: ((pl.houseNumber + 8 - 1) % 12) + 1, type: '9th Special Aspect (Trine)' })
    } else if (pl.name === 'Saturn') {
      aspectsList.push({ targetH: ((pl.houseNumber + 2 - 1) % 12) + 1, type: '3rd Special Aspect (Sextile)' })
      aspectsList.push({ targetH: ((pl.houseNumber + 9 - 1) % 12) + 1, type: '10th Special Aspect (Square)' })
    }

    for (const asp of aspectsList) {
      const targetSignIdx = (lagnaSignIndex + (asp.targetH - 1)) % 12
      const targetSignName = SIGN_NAMES[targetSignIdx]
      const residentPlanets = planets.filter((o) => o.houseNumber === asp.targetH).map((o) => o.name)

      pl.aspectsCast?.push({
        house: asp.targetH,
        houseOrdinal: getOrdinal(asp.targetH),
        sign: targetSignName,
        type: asp.type,
        aspectedPlanets: residentPlanets,
      })

      // Add to aspectsReceived of resident planets
      for (const resPl of planets.filter((o) => o.houseNumber === asp.targetH)) {
        resPl.aspectsReceived?.push({
          planet: pl.name,
          type: asp.type,
        })
      }
    }
  }

  // 2. Process Houses
  const houses: HousePosition[] = []
  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + (h - 1)) % 12
    const signName = SIGN_NAMES[signIndex]
    const lord = SIGN_LORDS[signName] || '—'
    const occupants = planets.filter((p) => p.houseNumber === h).map((p) => p.name)
    const rawBhava = (rawRasi?.bhavas || []).find((b: any) => b.house === h)
    const lordPlanet = planets.find((p) => p.name === lord)

    const houseAspectsReceived: { planet: string; type: string }[] = []
    for (const pl of planets) {
      const match = pl.aspectsCast?.find((a) => a.house === h)
      if (match) {
        houseAspectsReceived.push({ planet: pl.name, type: match.type })
      }
    }

    const meta = HOUSE_METADATA[h]

    houses.push({
      number: h,
      name: `${getOrdinal(h)} House${h === 1 ? ' (Lagna)' : ''}`,
      sanskritName: meta?.sanskrit,
      sign: signName,
      signNumber: signIndex + 1,
      signIndex,
      lord,
      lordHouseNumber: lordPlanet?.houseNumber,
      lordHouseOrdinal: lordPlanet?.houseOrdinal,
      lordSign: lordPlanet?.sign,
      lordDignity: lordPlanet?.dignity,
      naturalKaraka: meta?.karaka,
      occupants,
      aspectsReceived: houseAspectsReceived,
      bhavatBhavam: meta?.bhavatBhavam,
      significations: meta?.significations,
      purushartha: meta?.purushartha,
      classificationTags: deriveHouseCategories(h),
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
    yogas: detectClassicalYogas(planets, houses, computed.yogas),
    raw: {
      rasi: rawRasi,
      dasha: rawDasha,
      panchanga: computed.rawPanchanga,
      shodasavarga: computed.shodasavarga,
    },
  }
}

// ---------------------------------------------------------------------------
// Classical Yogas Detection (BPHS & Classical Jyotish Literature)
// ---------------------------------------------------------------------------

export function detectClassicalYogas(
  planets: PlanetPosition[],
  houses: HousePosition[],
  rawYogas?: any
): PlanetaryYoga[] {
  const yogas: PlanetaryYoga[] = []
  const pMap: Record<string, PlanetPosition> = {}
  planets.forEach((p) => {
    pMap[p.name] = p
  })

  const hMap: Record<number, HousePosition> = {}
  houses.forEach((h) => {
    hMap[h.number] = h
  })

  const getLordOfHouse = (hNum: number): PlanetPosition | undefined => {
    const house = hMap[hNum]
    if (!house) return undefined
    return pMap[house.lord]
  }

  const sun = pMap['Sun']
  const moon = pMap['Moon']
  const mars = pMap['Mars']
  const mercury = pMap['Mercury']
  const jupiter = pMap['Jupiter']
  const venus = pMap['Venus']
  const saturn = pMap['Saturn']

  // 1. Pancha Mahapurusha Yogas
  if (mars && [1, 4, 7, 10].includes(mars.houseNumber) && (mars.dignity === 'Own Sign' || mars.dignity === 'Exalted')) {
    yogas.push({
      key: 'ruchaka',
      name: 'Ruchaka Yoga',
      sanskritName: 'रुचक योग',
      group: 'Mahapurusha',
      present: true,
      definition: 'Mars placed in a Kendra (1st, 4th, 7th, or 10th house) in its own sign (Aries, Scorpio) or exaltation sign (Capricorn).',
      effects: 'Bestows heroic valor, commanding military or executive authority, immense physical stamina, victory over adversaries, and lasting fame.',
      participants: ['Mars'],
      housesInvolved: [mars.houseNumber],
      strength: 'High',
      reason: `Mars occupies ${mars.houseOrdinal} house in ${mars.sign} (${mars.dignity}).`,
    })
  }

  if (mercury && [1, 4, 7, 10].includes(mercury.houseNumber) && (mercury.dignity === 'Own Sign' || mercury.dignity === 'Exalted')) {
    yogas.push({
      key: 'bhadra',
      name: 'Bhadra Yoga',
      sanskritName: 'भद्र योग',
      group: 'Mahapurusha',
      present: true,
      definition: 'Mercury placed in a Kendra (1st, 4th, 7th, or 10th house) in its own sign (Gemini) or exaltation sign (Virgo).',
      effects: 'Endows extraordinary intellect, mathematical acumen, eloquence, mastery in trade and commerce, scholarly renown, and gracious longevity.',
      participants: ['Mercury'],
      housesInvolved: [mercury.houseNumber],
      strength: 'High',
      reason: `Mercury occupies ${mercury.houseOrdinal} house in ${mercury.sign} (${mercury.dignity}).`,
    })
  }

  if (jupiter && [1, 4, 7, 10].includes(jupiter.houseNumber) && (jupiter.dignity === 'Own Sign' || jupiter.dignity === 'Exalted')) {
    yogas.push({
      key: 'hamsa',
      name: 'Hamsa Yoga',
      sanskritName: 'हंस योग',
      group: 'Mahapurusha',
      present: true,
      definition: 'Jupiter placed in a Kendra (1st, 4th, 7th, or 10th house) in its own sign (Sagittarius, Pisces) or exaltation sign (Cancer).',
      effects: 'Creates a revered spiritual guide, noble character, unshakeable virtue, profound wisdom, state honor, and benevolence towards all beings.',
      participants: ['Jupiter'],
      housesInvolved: [jupiter.houseNumber],
      strength: 'High',
      reason: `Jupiter occupies ${jupiter.houseOrdinal} house in ${jupiter.sign} (${jupiter.dignity}).`,
    })
  }

  if (venus && [1, 4, 7, 10].includes(venus.houseNumber) && (venus.dignity === 'Own Sign' || venus.dignity === 'Exalted')) {
    yogas.push({
      key: 'malavya',
      name: 'Malavya Yoga',
      sanskritName: 'मालव्य योग',
      group: 'Mahapurusha',
      present: true,
      definition: 'Venus placed in a Kendra (1st, 4th, 7th, or 10th house) in its own sign (Taurus, Libra) or exaltation sign (Pisces).',
      effects: 'Grants refined aesthetic senses, wealth, exquisite residences, luxurious vehicles, happy conjugal bond, artistic genius, and magnetic charisma.',
      participants: ['Venus'],
      housesInvolved: [venus.houseNumber],
      strength: 'High',
      reason: `Venus occupies ${venus.houseOrdinal} house in ${venus.sign} (${venus.dignity}).`,
    })
  }

  if (saturn && [1, 4, 7, 10].includes(saturn.houseNumber) && (saturn.dignity === 'Own Sign' || saturn.dignity === 'Exalted')) {
    yogas.push({
      key: 'sasa',
      name: 'Sasa Yoga',
      sanskritName: 'शश योग',
      group: 'Mahapurusha',
      present: true,
      definition: 'Saturn placed in a Kendra (1st, 4th, 7th, or 10th house) in its own sign (Capricorn, Aquarius) or exaltation sign (Libra).',
      effects: 'Confers commanding leadership over large organizations or masses, disciplined stamina, political authority, wealth through land and industry.',
      participants: ['Saturn'],
      housesInvolved: [saturn.houseNumber],
      strength: 'High',
      reason: `Saturn occupies ${saturn.houseOrdinal} house in ${saturn.sign} (${saturn.dignity}).`,
    })
  }

  // 2. Gaja Kesari Yoga (Jupiter in Kendra from Moon)
  if (moon && jupiter) {
    const jupFromMoon = ((jupiter.houseNumber - moon.houseNumber + 12) % 12) + 1
    if ([1, 4, 7, 10].includes(jupFromMoon)) {
      yogas.push({
        key: 'gaja_kesari',
        name: 'Gaja Kesari Yoga',
        sanskritName: 'गजकेसरी योग',
        group: 'Raja',
        present: true,
        definition: 'Jupiter occupies a Kendra (1st, 4th, 7th, or 10th house) from the Moon.',
        effects: 'Endows lion-like courage, unshakeable royal dignity, noble reputation, lasting prosperity, scholarly wisdom, and victory over adversaries.',
        participants: ['Jupiter', 'Moon'],
        housesInvolved: [moon.houseNumber, jupiter.houseNumber],
        strength: 'High',
        reason: `Jupiter is in the ${jupFromMoon}${jupFromMoon === 1 ? 'st' : jupFromMoon === 4 ? 'th' : jupFromMoon === 7 ? 'th' : 'th'} house from the Moon (Kendra).`,
      })
    }
  }

  // 3. Budhaditya Yoga (Sun + Mercury Conjunction)
  if (sun && mercury && sun.houseNumber === mercury.houseNumber) {
    const combust = mercury.combust
    yogas.push({
      key: 'budhaditya',
      name: 'Budhaditya Yoga',
      sanskritName: 'बुधादित्य योग',
      group: 'Raja',
      present: true,
      definition: 'Sun and Mercury conjunct in the same house and rashi.',
      effects: 'Confers high intelligence, administrative competence, analytical prowess, eloquence, and reputation in public service or commerce.',
      participants: ['Sun', 'Mercury'],
      housesInvolved: [sun.houseNumber],
      strength: combust ? 'Medium' : 'High',
      reason: `Sun and Mercury are together in the ${sun.houseOrdinal} house (${sun.sign})${combust ? ', Mercury within combustion orb' : ''}.`,
    })
  }

  // 4. Chandra-Mangala Yoga (Moon + Mars)
  if (moon && mars) {
    const isConjunct = moon.houseNumber === mars.houseNumber
    const isMutualAspect = ((mars.houseNumber - moon.houseNumber + 12) % 12) + 1 === 7
    if (isConjunct || isMutualAspect) {
      yogas.push({
        key: 'chandra_mangala',
        name: 'Chandra-Mangala Yoga',
        sanskritName: 'चन्द्र-मङ्गल योग',
        group: 'Dhana',
        present: true,
        definition: 'Moon and Mars in conjunction or in mutual 7th aspect.',
        effects: 'Sharp commercial enterprise, capacity to accumulate wealth through property, land, metals, and resolute determination.',
        participants: ['Moon', 'Mars'],
        housesInvolved: isConjunct ? [moon.houseNumber] : [moon.houseNumber, mars.houseNumber],
        strength: 'High',
        reason: isConjunct
          ? `Moon and Mars are conjunct in the ${moon.houseOrdinal} house (${moon.sign}).`
          : `Moon in ${moon.houseOrdinal} house and Mars in ${mars.houseOrdinal} house form mutual 7th aspect.`,
      })
    }
  }

  // 5. Lunar Yogas: Sunaphaa, Anaphaa, Dhurdhura, Kemadruma
  if (moon) {
    const h2FromMoon = (moon.houseNumber % 12) + 1
    const h12FromMoon = ((moon.houseNumber - 2 + 12) % 12) + 1

    const planetsIn2 = planets.filter(
      (p) => p.houseNumber === h2FromMoon && !['Sun', 'Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
    )
    const planetsIn12 = planets.filter(
      (p) => p.houseNumber === h12FromMoon && !['Sun', 'Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
    )

    if (planetsIn2.length > 0 && planetsIn12.length > 0) {
      yogas.push({
        key: 'dhurdhura',
        name: 'Dhurdhura Yoga',
        sanskritName: 'धुरधुरा योग',
        group: 'Chandra',
        present: true,
        definition: 'Planets other than Sun, Rahu, and Ketu occupy both the 2nd and 12th houses from the Moon.',
        effects: 'Ensures immense wealth, luxurious vehicles, generous disposition, faithful allies, and lasting comfort throughout life.',
        participants: [...planetsIn2.map((p) => p.name), ...planetsIn12.map((p) => p.name)],
        housesInvolved: [h2FromMoon, h12FromMoon],
        strength: 'High',
        reason: `${planetsIn2.map((p) => p.name).join(', ')} in 2nd from Moon, and ${planetsIn12.map((p) => p.name).join(', ')} in 12th from Moon.`,
      })
    } else if (planetsIn2.length > 0) {
      yogas.push({
        key: 'sunaphaa',
        name: 'Sunaphaa Yoga',
        sanskritName: 'सुनफा योग',
        group: 'Chandra',
        present: true,
        definition: 'Planets other than Sun, Rahu, and Ketu occupy the 2nd house from the Moon.',
        effects: 'Self-earned wealth, intellectual sharp focus, good reputation, contented family life, and righteous deeds.',
        participants: planetsIn2.map((p) => p.name),
        housesInvolved: [h2FromMoon],
        strength: 'High',
        reason: `${planetsIn2.map((p) => p.name).join(', ')} in the 2nd house from the Moon.`,
      })
    } else if (planetsIn12.length > 0) {
      yogas.push({
        key: 'anaphaa',
        name: 'Anaphaa Yoga',
        sanskritName: 'अनफा योग',
        group: 'Chandra',
        present: true,
        definition: 'Planets other than Sun, Rahu, and Ketu occupy the 12th house from the Moon.',
        effects: 'Well-formed physical constitution, self-restraint, freedom from chronic diseases, generosity, and peace of mind.',
        participants: planetsIn12.map((p) => p.name),
        housesInvolved: [h12FromMoon],
        strength: 'High',
        reason: `${planetsIn12.map((p) => p.name).join(', ')} in the 12th house from the Moon.`,
      })
    } else {
      const planetsInKendraFromMoon = planets.filter(
        (p) => [1, 4, 7, 10].includes(((p.houseNumber - moon.houseNumber + 12) % 12) + 1) &&
          !['Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
      )
      const planetsInKendraFromLagna = planets.filter(
        (p) => [1, 4, 7, 10].includes(p.houseNumber) && !['Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
      )
      const hasBhanga = planetsInKendraFromMoon.length > 0 || planetsInKendraFromLagna.length > 0

      yogas.push({
        key: 'kemadruma',
        name: hasBhanga ? 'Kemadruma Bhanga' : 'Kemadruma Yoga',
        sanskritName: hasBhanga ? 'केमद्रुम भङ्ग' : 'केमद्रुम योग',
        group: 'Chandra',
        present: true,
        definition: hasBhanga
          ? 'Kemadruma cancelled: Although no planets flank the Moon, planets occupy Kendras from Moon or Lagna, transforming adversity into resilience.'
          : 'No planets occupy the 2nd or 12th houses from the Moon (excluding Sun, Rahu, Ketu), nor are Kendras occupied.',
        effects: hasBhanga
          ? 'Early struggles turn into profound self-reliance, strategic wisdom, and enduring financial stability.'
          : 'Fluctuating fortunes, emotional isolation, financial instability unless alleviated by dasha support.',
        participants: ['Moon'],
        housesInvolved: [moon.houseNumber],
        strength: hasBhanga ? 'Low' : 'High',
        reason: hasBhanga
          ? `No planets in 2nd/12th from Moon, but cancelled by ${[...planetsInKendraFromMoon, ...planetsInKendraFromLagna].map((p) => p.name).slice(0, 3).join(', ')} in Kendras.`
          : 'No planets in 2nd or 12th from Moon and no planets in Kendras.',
      })
    }
  }

  // 6. Solar Yogas: Vesi, Vosi, Ubhayachari
  if (sun) {
    const h2FromSun = (sun.houseNumber % 12) + 1
    const h12FromSun = ((sun.houseNumber - 2 + 12) % 12) + 1

    const planetsIn2 = planets.filter(
      (p) => p.houseNumber === h2FromSun && !['Sun', 'Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
    )
    const planetsIn12 = planets.filter(
      (p) => p.houseNumber === h12FromSun && !['Sun', 'Moon', 'Rahu', 'Ketu', 'Lagna'].includes(p.name)
    )

    if (planetsIn2.length > 0 && planetsIn12.length > 0) {
      yogas.push({
        key: 'ubhayachari',
        name: 'Ubhayachari Yoga',
        sanskritName: 'उभयचरी योग',
        group: 'Ravi',
        present: true,
        definition: 'Planets other than Moon, Rahu, and Ketu occupy both the 2nd and 12th houses from the Sun.',
        effects: 'Symmetrical grace, royal or executive favor, broad renown, balanced fortune, and high social respect.',
        participants: [...planetsIn2.map((p) => p.name), ...planetsIn12.map((p) => p.name)],
        housesInvolved: [h2FromSun, h12FromSun],
        strength: 'High',
        reason: `${planetsIn2.map((p) => p.name).join(', ')} in 2nd from Sun, and ${planetsIn12.map((p) => p.name).join(', ')} in 12th from Sun.`,
      })
    } else if (planetsIn2.length > 0) {
      yogas.push({
        key: 'vesi',
        name: 'Vesi Yoga',
        sanskritName: 'वेशि योग',
        group: 'Ravi',
        present: true,
        definition: 'Planets other than Moon, Rahu, and Ketu occupy the 2nd house from the Sun.',
        effects: 'Truthful speech, steady wealth, happy disposition, balanced life, and renown.',
        participants: planetsIn2.map((p) => p.name),
        housesInvolved: [h2FromSun],
        strength: 'High',
        reason: `${planetsIn2.map((p) => p.name).join(', ')} in the 2nd house from the Sun.`,
      })
    } else if (planetsIn12.length > 0) {
      yogas.push({
        key: 'vosi',
        name: 'Vosi Yoga',
        sanskritName: 'वोशि योग',
        group: 'Ravi',
        present: true,
        definition: 'Planets other than Moon, Rahu, and Ketu occupy the 12th house from the Sun.',
        effects: 'Learned mind, charitable tendencies, strong memory, practical skill, and independent nature.',
        participants: planetsIn12.map((p) => p.name),
        housesInvolved: [h12FromSun],
        strength: 'High',
        reason: `${planetsIn12.map((p) => p.name).join(', ')} in the 12th house from the Sun.`,
      })
    }
  }

  // 7. Dharma-Karmadhipati Yoga (9th & 10th lords)
  const lord9 = getLordOfHouse(9)
  const lord10 = getLordOfHouse(10)
  if (lord9 && lord10 && lord9.name !== lord10.name) {
    const isConjunct = lord9.houseNumber === lord10.houseNumber
    const isMutual = ((lord10.houseNumber - lord9.houseNumber + 12) % 12) + 1 === 7
    if (isConjunct || isMutual) {
      yogas.push({
        key: 'dharma_karmadhipati',
        name: 'Dharma-Karmadhipati Yoga',
        sanskritName: 'धर्म-कर्माधिपति योग',
        group: 'Raja',
        present: true,
        definition: 'Lords of the 9th house (Dharma) and 10th house (Karma) in conjunction or mutual aspect.',
        effects: 'Foremost Raja Yoga conferring leadership, executive authority, high ethical purpose, supreme career achievement, and lasting legacy.',
        participants: [lord9.name, lord10.name],
        housesInvolved: isConjunct ? [lord9.houseNumber] : [lord9.houseNumber, lord10.houseNumber],
        strength: 'High',
        reason: isConjunct
          ? `9th lord (${lord9.name}) and 10th lord (${lord10.name}) are conjunct in the ${lord9.houseOrdinal} house.`
          : `9th lord (${lord9.name}) and 10th lord (${lord10.name}) are in mutual aspect.`,
      })
    }
  }

  // 8. Other Kendra-Trikona Raja Yogas
  const kendraHouses = [1, 4, 7, 10]
  const trikonaHouses = [1, 5, 9]
  const rajaPairsFound = new Set<string>()

  for (const k of kendraHouses) {
    for (const t of trikonaHouses) {
      if (k === t) continue
      const lk = getLordOfHouse(k)
      const lt = getLordOfHouse(t)
      if (!lk || !lt || lk.name === lt.name) continue

      const pairKey = [lk.name, lt.name].sort().join('-')
      if (rajaPairsFound.has(pairKey)) continue

      const isConjunct = lk.houseNumber === lt.houseNumber
      const isMutual = ((lt.houseNumber - lk.houseNumber + 12) % 12) + 1 === 7

      if (isConjunct || isMutual) {
        rajaPairsFound.add(pairKey)
        if ((k === 10 && t === 9) || (k === 9 && t === 10)) continue

        yogas.push({
          key: `raja_${k}_${t}`,
          name: `Kendra-Trikona Raja Yoga (${k}th & ${t}th Lords)`,
          sanskritName: 'केन्द्र-त्रिकोण राजयोग',
          group: 'Raja',
          present: true,
          definition: `Lord of Kendra (${k}th house) and Lord of Trikona (${t}th house) are in ${isConjunct ? 'conjunction' : 'mutual aspect'}.`,
          effects: 'Elevates status, unlocks executive recognition, provides institutional favor, and ensures success in endeavors.',
          participants: [lk.name, lt.name],
          housesInvolved: isConjunct ? [lk.houseNumber] : [lk.houseNumber, lt.houseNumber],
          strength: 'High',
          reason: `${k}th lord (${lk.name}) and ${t}th lord (${lt.name}) are ${isConjunct ? `conjunct in ${lk.houseOrdinal} house` : 'in mutual aspect'}.`,
        })
      }
    }
  }

  // 9. Yogakaraka Planet Yoga
  for (const p of planets) {
    if (!p.lordOfHouses || p.lordOfHouses.length < 2) continue
    const hasKendra = p.lordOfHouses.some((h) => [4, 7, 10].includes(h))
    const hasTrikona = p.lordOfHouses.some((h) => [5, 9].includes(h))
    if (hasKendra && hasTrikona) {
      yogas.push({
        key: `yogakaraka_${p.name.toLowerCase()}`,
        name: `${p.name} Yogakaraka`,
        sanskritName: 'योगकारक',
        group: 'Raja',
        present: true,
        definition: `${p.name} rules both a Kendra (${p.lordOfHouses.filter((h) => [4, 7, 10].includes(h)).join(', ')}th) and a Trikona (${p.lordOfHouses.filter((h) => [5, 9].includes(h)).join(', ')}th) house for this Lagna.`,
        effects: 'Acts as the single most auspicious planet for the chart, producing extraordinary growth, honor, and prosperity during its dashas.',
        participants: [p.name],
        housesInvolved: [p.houseNumber, ...p.lordOfHouses],
        strength: 'High',
        reason: `${p.name} simultaneously owns the ${p.lordOfHouses.join('th & ')}th houses.`,
      })
    }
  }

  // 10. Dhana Yogas
  const lord1 = getLordOfHouse(1)
  const lord2 = getLordOfHouse(2)
  const lord5 = getLordOfHouse(5)
  const lord11 = getLordOfHouse(11)

  if (lord2 && lord11 && lord2.name !== lord11.name) {
    if (lord2.houseNumber === lord11.houseNumber || ((lord11.houseNumber - lord2.houseNumber + 12) % 12) + 1 === 7) {
      yogas.push({
        key: 'dhana_2_11',
        name: 'Mahadhana Yoga (2nd & 11th Lords)',
        sanskritName: 'महाधन योग',
        group: 'Dhana',
        present: true,
        definition: '2nd lord (accumulated wealth) and 11th lord (gains and cash flow) in conjunction or mutual aspect.',
        effects: 'Exceptional financial capacity, multiple streams of income, compounding savings, and commercial success.',
        participants: [lord2.name, lord11.name],
        housesInvolved: [lord2.houseNumber, lord11.houseNumber],
        strength: 'High',
        reason: `2nd lord (${lord2.name}) and 11th lord (${lord11.name}) form a sambandha.`,
      })
    }
  }

  if (lord1 && lord2 && lord1.name !== lord2.name && lord1.houseNumber === lord2.houseNumber) {
    yogas.push({
      key: 'dhana_1_2',
      name: 'Dhana Yoga (1st & 2nd Lords)',
      sanskritName: 'धन योग',
      group: 'Dhana',
      present: true,
      definition: 'Lagna lord and 2nd lord conjunct in the same house.',
      effects: 'Direct personal mastery over wealth creation, dignified financial independence, and prosperous voice.',
      participants: [lord1.name, lord2.name],
      housesInvolved: [lord1.houseNumber],
      strength: 'High',
      reason: `Lagna lord (${lord1.name}) and 2nd lord (${lord2.name}) are conjunct in ${lord1.houseOrdinal} house.`,
    })
  }

  if (lord5 && lord9 && lord5.name !== lord9.name && lord5.houseNumber === lord9.houseNumber) {
    yogas.push({
      key: 'dhana_5_9',
      name: 'Lakshmi-Bhagya Dhana Yoga (5th & 9th Lords)',
      sanskritName: 'भाग्य-धन योग',
      group: 'Dhana',
      present: true,
      definition: '5th lord (Purva Punya, intelligence) and 9th lord (Fortune, divine grace) conjunct in the same house.',
      effects: 'Extraordinary good fortune, effortless windfall, intuitive financial intelligence, and divine blessings.',
      participants: [lord5.name, lord9.name],
      housesInvolved: [lord5.houseNumber],
      strength: 'High',
      reason: `5th lord (${lord5.name}) and 9th lord (${lord9.name}) are conjunct in ${lord5.houseOrdinal} house.`,
    })
  }

  // 11. Vipareeta Raja Yogas
  const lord6 = getLordOfHouse(6)
  const lord8 = getLordOfHouse(8)
  const lord12 = getLordOfHouse(12)
  const dusthanas = [6, 8, 12]

  if (lord6 && dusthanas.includes(lord6.houseNumber)) {
    yogas.push({
      key: 'harsha',
      name: 'Harsha Yoga',
      sanskritName: 'हर्ष योग',
      group: 'Vipareeta',
      present: true,
      definition: '6th lord placed in the 6th, 8th, or 12th house (Vipareeta Raja Yoga).',
      effects: 'Overcomes opponents effortlessly, robust health, immunities from conspiracies, and rise through crisis.',
      participants: [lord6.name],
      housesInvolved: [lord6.houseNumber],
      strength: 'High',
      reason: `6th lord (${lord6.name}) is positioned in ${lord6.houseOrdinal} house (Dusthana).`,
    })
  }

  if (lord8 && dusthanas.includes(lord8.houseNumber)) {
    yogas.push({
      key: 'sarala',
      name: 'Sarala Yoga',
      sanskritName: 'सरल योग',
      group: 'Vipareeta',
      present: true,
      definition: '8th lord placed in the 6th, 8th, or 12th house (Vipareeta Raja Yoga).',
      effects: 'Fearless character, longevity, strategic acumen, triumph over setbacks, sudden financial windfalls.',
      participants: [lord8.name],
      housesInvolved: [lord8.houseNumber],
      strength: 'High',
      reason: `8th lord (${lord8.name}) is positioned in ${lord8.houseOrdinal} house (Dusthana).`,
    })
  }

  if (lord12 && dusthanas.includes(lord12.houseNumber)) {
    yogas.push({
      key: 'vimala',
      name: 'Vimala Yoga',
      sanskritName: 'विमल योग',
      group: 'Vipareeta',
      present: true,
      definition: '12th lord placed in the 6th, 8th, or 12th house (Vipareeta Raja Yoga).',
      effects: 'Frugal independence, noble character, spiritual peace, accumulation of wealth, shielded from major losses.',
      participants: [lord12.name],
      housesInvolved: [lord12.houseNumber],
      strength: 'High',
      reason: `12th lord (${lord12.name}) is positioned in ${lord12.houseOrdinal} house (Dusthana).`,
    })
  }

  // 12. Amala Yoga
  const benefics = ['Jupiter', 'Venus', 'Mercury']
  const h10Occupants = planets.filter((p) => p.houseNumber === 10 && benefics.includes(p.name))
  if (h10Occupants.length > 0) {
    yogas.push({
      key: 'amala',
      name: 'Amala Yoga',
      sanskritName: 'अमल योग',
      group: 'Raja',
      present: true,
      definition: 'Natural benefic planet (Jupiter, Venus, or Mercury) occupies the 10th house from Lagna.',
      effects: 'Stainless character, spotless public reputation, humanitarian achievements, lasting professional honor.',
      participants: h10Occupants.map((p) => p.name),
      housesInvolved: [10],
      strength: 'High',
      reason: `${h10Occupants.map((p) => p.name).join(', ')} occupies the 10th house.`,
    })
  }

  // 13. Parivartana Yoga
  const parivartanaDone = new Set<string>()
  for (let hA = 1; hA <= 12; hA++) {
    for (let hB = hA + 1; hB <= 12; hB++) {
      const lordA = getLordOfHouse(hA)
      const lordB = getLordOfHouse(hB)
      if (!lordA || !lordB || lordA.name === lordB.name) continue

      if (lordA.houseNumber === hB && lordB.houseNumber === hA) {
        const pairKey = [hA, hB].join('-')
        if (parivartanaDone.has(pairKey)) continue
        parivartanaDone.add(pairKey)

        const involvesDusthana = [6, 8, 12].includes(hA) || [6, 8, 12].includes(hB)
        const involves3rd = hA === 3 || hB === 3
        const yType = involvesDusthana ? 'Dainya' : involves3rd ? 'Khala' : 'Maha'

        yogas.push({
          key: `parivartana_${hA}_${hB}`,
          name: `${yType} Parivartana Yoga (${hA}th & ${hB}th Houses)`,
          sanskritName: 'परिवर्तन योग',
          group: yType === 'Maha' ? 'Raja' : 'General',
          present: true,
          definition: `Mutual exchange of signs between ${hA}th lord (${lordA.name}) and ${hB}th lord (${lordB.name}). Classified as ${yType} Parivartana.`,
          effects: yType === 'Maha'
            ? 'Bestows exceptional wealth, prosperity, high social authority, and protective influence.'
            : yType === 'Khala'
            ? 'Yields fluctuations between struggle and success, requiring patience and grit.'
            : 'Transforms crises into catalysts for spiritual or psychological breakthrough.',
          participants: [lordA.name, lordB.name],
          housesInvolved: [hA, hB],
          strength: 'High',
          reason: `${lordA.name} occupies ${hB}th house, and ${lordB.name} occupies ${hA}th house.`,
        })
      }
    }
  }

  // Merge any backend yogas if present
  if (rawYogas?.yogas && Array.isArray(rawYogas.yogas)) {
    for (const by of rawYogas.yogas) {
      if (!by.present) continue
      const existing = yogas.find((y) => y.key === by.key || y.name.toLowerCase() === by.name?.toLowerCase())
      if (!existing) {
        yogas.push({
          key: by.key,
          name: by.name || by.key,
          group: by.group === 'raja' ? 'Raja' : by.group === 'dhana' ? 'Dhana' : by.group === 'mahapurusha' ? 'Mahapurusha' : 'General',
          definition: by.definition || by.description || 'Classical planetary combination from BPHS.',
          effects: by.effects || 'Auspicious classical planetary combination.',
          present: true,
          strength: by.strength || 'Medium',
          participants: (by.participants || []).map((p: any) => typeof p === 'string' ? p : p.graha_name || String(p)),
          reason: by.reason || 'Calculated by Hora engine.',
        })
      }
    }
  }

  return yogas
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
      // Chaturthamsha (7°30'): Parashari BPHS counts 4 kendras (1st, 4th, 7th, 10th from natal rasi)
      const part = Math.floor(degreeInSign / 7.5) // 0..3
      return (signIndex + part * 3) % 12
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
      // Trimshamsha: Unequal division (BPHS / Jagannatha Hora)
      // Odd signs: 0-5° Mars (0 Aries), 5-10° Saturn (10 Aquarius), 10-18° Jupiter (8 Sagittarius), 18-25° Mercury (2 Gemini), 25-30° Venus (6 Libra)
      // Even signs: 0-5° Venus (1 Taurus), 5-12° Mercury (5 Virgo), 12-20° Jupiter (11 Pisces), 20-25° Saturn (9 Capricorn), 25-30° Mars (7 Scorpio)
      if (isOdd) {
        if (degreeInSign < 5) return 0 // Aries (Mars)
        if (degreeInSign < 10) return 10 // Aquarius (Saturn)
        if (degreeInSign < 18) return 8 // Sagittarius (Jupiter)
        if (degreeInSign < 25) return 2 // Gemini (Mercury)
        return 6 // Libra (Venus)
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

/**
 * Dynamically expands any dasha period into its 9 sub-periods down to Level 6:
 * Level 1: Mahadasha (MD)
 * Level 2: Antardasha (AD / Bhukti)
 * Level 3: Pratyantardasha (PD)
 * Level 4: Sookshma Dasha (SD)
 * Level 5: Prana Dasha (PrD)
 * Level 6: Deha Dasha (DD / Sub-Sookshma)
 */
export function expandDashaSubPeriods(parent: DashaPeriod, targetLevel: number = parent.level + 1): DashaPeriod[] {
  if (targetLevel <= parent.level) return []

  if (parent.children && parent.children.length === 9 && targetLevel === parent.level + 1) {
    return parent.children
  }

  const startMs = new Date(parent.start).getTime()
  const endMs = new Date(parent.end).getTime()
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return []

  const spanMs = endMs - startMs
  const parentLordClean = parent.lord.trim().toLowerCase()
  let parentLordIdx = VIMSHOTTARI_CYCLE.findIndex(
    (v) => v.name.toLowerCase() === parentLordClean
  )
  if (parentLordIdx < 0) parentLordIdx = 0

  const nextLevel = parent.level + 1
  const children: DashaPeriod[] = []
  let cursor = startMs

  for (let k = 0; k < 9; k++) {
    const subIdx = (parentLordIdx + k) % 9
    const subMeta = VIMSHOTTARI_CYCLE[subIdx]
    const subFraction = subMeta.years / 120
    const subSpanMs = spanMs * subFraction
    const subStart = new Date(cursor)
    const subEnd = new Date(cursor + subSpanMs)

    const childNode: DashaPeriod = {
      lord: subMeta.name,
      level: nextLevel,
      start: subStart.toISOString().replace('T', ' ').slice(0, nextLevel >= 5 ? 19 : nextLevel >= 4 ? 16 : 10),
      end: subEnd.toISOString().replace('T', ' ').slice(0, nextLevel >= 5 ? 19 : nextLevel >= 4 ? 16 : 10),
      durationDays: subSpanMs / (24 * 3600 * 1000),
      children: [],
    }

    if (nextLevel < targetLevel) {
      childNode.children = expandDashaSubPeriods(childNode, targetLevel)
    }

    children.push(childNode)
    cursor += subSpanMs
  }

  return children
}

