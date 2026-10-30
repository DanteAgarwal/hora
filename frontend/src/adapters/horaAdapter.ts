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
import {
  PLANET_META,
  SIGN_NAMES,
  SIGN_LORDS,
  EXALTATION_SIGNS,
  DEBILITATION_SIGNS,
  OWN_SIGNS,
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
      // Default to rasi graha positions when divisional chart is not calculated by backend
      const vGrahas: VargaGrahaPlacement[] = planets.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        signIndex: p.signIndex,
        signName: p.sign,
        houseNumber: p.houseNumber,
        retrograde: p.retrograde,
      }))

      vargas[meta.code] = {
        code: meta.code,
        name: meta.name,
        divisions: meta.div,
        purpose: meta.purpose,
        lagnaSignIndex,
        lagnaSignName: SIGN_NAMES[lagnaSignIndex],
        grahas: vGrahas,
      }
    }
  }

  // 4. Process Dashas (Backend-calculated Vimshottari normalization)
  const moon = planets.find((p) => p.name === 'Moon')
  const sun = planets.find((p) => p.name === 'Sun')
  const rawDasha = computed.rawDasha

  let dashaTree: DashaPeriod[] = []
  if (computed.dashas && Array.isArray(computed.dashas) && computed.dashas.length > 0) {
    dashaTree = computed.dashas.map((p: any) => normalizeDashaNode(p, 1))
  } else if (rawDasha?.periods && Array.isArray(rawDasha.periods) && rawDasha.periods.length > 0) {
    dashaTree = rawDasha.periods.map((p: any) => normalizeDashaNode(p, 1))
  }

  // Determine running periods from backend
  let runningDasha: string[] = []
  if (computed.activeDashaChain && Array.isArray(computed.activeDashaChain)) {
    runningDasha = computed.activeDashaChain.map((c: any) => c.lord || c.lord_name)
  } else if (rawDasha?.running && Array.isArray(rawDasha.running) && rawDasha.running.length > 0) {
    runningDasha = rawDasha.running.map((r: any) => r.lord_name || r.name)
  } else if (dashaTree.length > 0) {
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
    dashas: dashaTree,
    activeDashaChain: computed.activeDashaChain || null,
    runningDasha: runningDasha.length ? runningDasha : (computed.currentMahadasha?.split(' / ') || []),
    panchanga: computed.rawPanchanga,
    aspects: computed.aspects,
    relationships: computed.relationships || null,
    yogas: normalizePlanetaryYogas(computed.yogas),
    raw: {
      rasi: rawRasi,
      dasha: rawDasha,
      panchanga: computed.rawPanchanga,
      shodasavarga: computed.shodasavarga,
    },
  }
}

// ---------------------------------------------------------------------------
// Classical Planetary Yogas Normalization (Computed by Backend /v1/planetary-yoga)
// ---------------------------------------------------------------------------

export function normalizePlanetaryYogas(rawYogas: any): PlanetaryYoga[] {
  if (!rawYogas) return []

  const list: any[] = Array.isArray(rawYogas)
    ? rawYogas
    : Array.isArray(rawYogas.yogas)
    ? rawYogas.yogas
    : []

  return list.map((y: any): PlanetaryYoga => {
    const rawGroup = (y.group || 'General').toLowerCase()
    let group: PlanetaryYoga['group'] = 'Other'
    if (rawGroup.includes('raja')) group = 'Raja'
    else if (rawGroup.includes('dhana')) group = 'Dhana'
    else if (rawGroup.includes('mahapurusha')) group = 'Mahapurusha'
    else if (rawGroup.includes('chandra') || rawGroup.includes('lunar')) group = 'Chandra'
    else if (rawGroup.includes('ravi') || rawGroup.includes('solar')) group = 'Ravi'
    else if (rawGroup.includes('nabhasa')) group = 'Nabhasa'
    else if (rawGroup.includes('vipareeta')) group = 'Vipareeta'
    else if (rawGroup.includes('general')) group = 'General'

    const participants: string[] = Array.isArray(y.participants)
      ? y.participants.map((p: any) => (typeof p === 'string' ? p : p.graha_name || p.name || ''))
      : []

    return {
      key: y.key || y.name?.toLowerCase().replace(/\s+/g, '_') || 'yoga',
      name: y.name || 'Planetary Yoga',
      sanskritName: y.sanskrit_name || y.sanskritName || y.name,
      group,
      definition: y.definition || y.reason || '',
      effects: y.effects || (Array.isArray(y.qualifiers) ? y.qualifiers.join(', ') : undefined),
      present: Boolean(y.present),
      strength: y.weakened ? 'Low' : 'High',
      participants,
      housesInvolved: y.houses_involved || y.housesInvolved || undefined,
      reason: y.reason || undefined,
    }
  })
}

export function detectClassicalYogas(
  _planets: PlanetPosition[],
  _houses: HousePosition[],
  rawYogas?: any
): PlanetaryYoga[] {
  return normalizePlanetaryYogas(rawYogas)
}

// ---------------------------------------------------------------------------
// Vimshottari Dasha Normalization & Traversal Helpers
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

export function normalizeDashaNode(node: any, level = 1): DashaPeriod {
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

export function resolveCurrentRunningDasha(dashaTree: DashaPeriod[]): string[] {
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
 * @deprecated Client-side dasha mathematical expansion has been removed.
 * Sub-period expansion is computed by the backend engine via fetchExpandedSubPeriods().
 * This function returns pre-existing children without computing client-side math.
 */
export function expandDashaSubPeriods(parent: DashaPeriod, _targetLevel?: number): DashaPeriod[] {
  return parent?.children || []
}
