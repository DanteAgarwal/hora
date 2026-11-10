/**
 * Classical Parashari Shadbala (Six-Fold Planetary Potency) Service
 * Brihat Parashara Hora Shastra (BPHS) Chapter 27
 * Kundli Workbench Server Core
 * 
 * Computes:
 * 1. Sthana Bala (Positional Strength): Uchcha, Saptavargaja, Ojhayugma, Kendra, Drekkana
 * 2. Dig Bala (Directional Strength)
 * 3. Kaala Bala (Temporal Strength): Nathonatha, Paksha, Tribhaga, Varsha/Maasa/Dina/Hora, Ayana, Yuddha
 * 4. Chesta Bala (Motional Strength)
 * 5. Naisargika Bala (Natural Inherent Strength)
 * 6. Drik Bala (Aspectual Strength)
 * 
 * Aggregates Total Virupas, Rupas (1 Rupa = 60 Virupas), Minimum Required Thresholds,
 * Strength Ratios, Ranks, and Classical Interpretations for all 7 Grahas.
 */

const {
  SIGN_NAMES,
  SIGN_LORDS,
  OWN_SIGNS,
  MOOLATRIKONA_SIGNS,
} = require('./astroConstants')

// The 7 classical grahas evaluated in Shadbala
const SHADBALA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']

// Deep Exaltation Longitudes in absolute degrees (0° - 360°)
const EXALTATION_LON = {
  Sun: 10.0,      // Aries 10°
  Moon: 33.0,     // Taurus 3°
  Mars: 298.0,    // Capricorn 28°
  Mercury: 165.0, // Virgo 15°
  Jupiter: 95.0,  // Cancer 5°
  Venus: 357.0,   // Pisces 27°
  Saturn: 200.0,  // Libra 20°
}

// Deep Debilitation is exactly 180° opposite to deep exaltation
const DEBILITATION_LON = {
  Sun: 190.0,     // Libra 10°
  Moon: 213.0,    // Scorpio 3°
  Mars: 118.0,    // Cancer 28°
  Mercury: 345.0, // Pisces 15°
  Jupiter: 275.0, // Capricorn 5°
  Venus: 177.0,   // Virgo 27°
  Saturn: 20.0,   // Aries 20°
}

// Natural Friends, Enemies, and Neutrals (Naisargika Sambhandha according to Parashara)
const NATURAL_RELATIONSHIPS = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    neutrals: ['Mercury'],
    enemies: ['Venus', 'Saturn'],
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    enemies: [],
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    neutrals: ['Venus', 'Saturn'],
    enemies: ['Mercury'],
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
    enemies: ['Moon'],
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Saturn'],
    enemies: ['Mercury', 'Venus'],
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    neutrals: ['Mars', 'Jupiter'],
    enemies: ['Sun', 'Moon'],
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    neutrals: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars'],
  },
}

// Fixed Naisargika Bala (Natural Strength) in Virupas (BPHS: 1 Rupa = 60 Virupas)
const NAISARGIKA_BALA = {
  Sun: 60.0,
  Moon: 51.43,
  Venus: 42.86,
  Jupiter: 34.29,
  Mercury: 25.71,
  Mars: 17.14,
  Saturn: 8.57,
}

// Minimum Required Shadbala in Virupas and Rupas (BPHS)
const MINIMUM_SHADBALA = {
  Sun: { virupas: 390.0, rupas: 6.5 },
  Moon: { virupas: 360.0, rupas: 6.0 },
  Mars: { virupas: 300.0, rupas: 5.0 },
  Mercury: { virupas: 420.0, rupas: 7.0 },
  Jupiter: { virupas: 390.0, rupas: 6.5 },
  Venus: { virupas: 330.0, rupas: 5.5 },
  Saturn: { virupas: 300.0, rupas: 5.0 },
}

// Digbala Peak House (where directional potency is 60 Virupas / 100%)
const DIGBALA_PEAK_HOUSE = {
  Sun: 10,     // South / MC
  Mars: 10,    // South / MC
  Jupiter: 1,  // East / Lagna
  Mercury: 1,  // East / Lagna
  Moon: 4,     // North / Nadir
  Venus: 4,    // North / Nadir
  Saturn: 7,   // West / Descendant
}

// Saptavarga divisional keys for Saptavargaja Bala
const SAPTAVARGA_CODES = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30']

/**
 * Normalizes an angle into [0, 360)
 */
function normalizeDeg(deg) {
  let d = deg % 360
  if (d < 0) d += 360
  return d
}

/**
 * Calculates compound relationship (Panchadha Maitri) between two planets
 */
function getCompoundRelation(pA, pB, signDistance) {
  if (pA === pB) return 'own'
  const natural = NATURAL_RELATIONSHIPS[pA] || { friends: [], neutrals: [], enemies: [] }
  let natRel = 0 // -1: enemy, 0: neutral, +1: friend
  if (natural.friends.includes(pB)) natRel = 1
  else if (natural.enemies.includes(pB)) natRel = -1

  // Tatkalika (Temporal): Planets in 2, 3, 4, 10, 11, 12 from each other are temporal friends (+1), else enemies (-1)
  const isTempFriend = [2, 3, 4, 10, 11, 12].includes(signDistance)
  const tempRel = isTempFriend ? 1 : -1

  const combined = natRel + tempRel
  if (combined >= 2) return 'great_friend' // Ati-Mitra
  if (combined === 1) return 'friend'       // Mitra
  if (combined === 0) return 'neutral'      // Sama
  if (combined === -1) return 'enemy'       // Shatru
  return 'great_enemy'                     // Ati-Shatru
}

/**
 * Computes Uchcha Bala (Exaltation Strength): 0 to 60 Virupas
 * Based on angular distance from Deep Debilitation point
 */
function calculateUchchaBala(planetName, longitude) {
  const debLon = DEBILITATION_LON[planetName]
  if (debLon == null) return 30.0

  const diff = Math.abs(normalizeDeg(longitude) - debLon)
  const dist = diff > 180 ? 360 - diff : diff
  // Virupas = Distance / 3 (Max 60 Virupas at 180° away from debilitation)
  const virupas = Number((dist / 3).toFixed(2))
  return Math.min(60.0, Math.max(0.0, virupas))
}

/**
 * Computes Saptavargaja Bala (Divisional Chart Strength in 7 Vargas: D1, D2, D3, D7, D9, D12, D30)
 */
function calculateSaptavargajaBala(planet, vargasMap, planetsMap) {
  let totalVirupas = 0
  const breakdown = {}

  for (const code of SAPTAVARGA_CODES) {
    const varga = vargasMap?.[code]
    let signIdx = 0
    if (varga && Array.isArray(varga.grahas)) {
      const g = varga.grahas.find((x) => x.name === planet.name)
      if (g && g.signIndex != null) signIdx = g.signIndex
      else signIdx = planet.signIndex || 0
    } else {
      signIdx = planet.signIndex || 0
    }

    const signName = SIGN_NAMES[signIdx]
    const signLord = SIGN_LORDS[signName]
    let virupas = 7.5 // default neutral

    if (signLord === planet.name) {
      if (MOOLATRIKONA_SIGNS[planet.name] === signIdx) {
        virupas = 45.0 // Moolatrikona
      } else {
        virupas = 30.0 // Own sign (Swakshetra)
      }
    } else if (signLord) {
      const lordPlanet = planetsMap.get(signLord)
      const dist = lordPlanet
        ? ((lordPlanet.signIndex - planet.signIndex + 12) % 12) + 1
        : 1
      const relation = getCompoundRelation(planet.name, signLord, dist)

      if (relation === 'great_friend') virupas = 22.5
      else if (relation === 'friend') virupas = 15.0
      else if (relation === 'neutral') virupas = 7.5
      else if (relation === 'enemy') virupas = 3.75
      else if (relation === 'great_enemy') virupas = 1.875
    }

    totalVirupas += virupas
    breakdown[code] = {
      signIndex: signIdx,
      signName,
      signLord,
      virupas,
    }
  }

  return {
    totalVirupas: Number(totalVirupas.toFixed(2)),
    breakdown,
  }
}

/**
 * Computes Ojha-Yugma Rasyamsa Bala (Odd-Even Sign and Navamsha Strength)
 * 15 Virupas for Sign, 15 Virupas for Navamsha
 */
function calculateOjhaYugmaBala(planet, vargasMap) {
  const isOddSign = ((planet.signIndex || 0) % 2) === 0 // 0=Aries (Odd sign in 1-based)
  let isOddNavamsha = isOddSign

  const d9 = vargasMap?.['D9']
  if (d9 && Array.isArray(d9.grahas)) {
    const g = d9.grahas.find((x) => x.name === planet.name)
    if (g && g.signIndex != null) {
      isOddNavamsha = (g.signIndex % 2) === 0
    }
  }

  let rasiVirupas = 0
  let navamshaVirupas = 0

  // Masculine planets (Sun, Mars, Jupiter) & Mercury get strength in Odd signs & navamshas
  if (['Sun', 'Mars', 'Jupiter', 'Mercury'].includes(planet.name)) {
    if (isOddSign) rasiVirupas = 15.0
    if (isOddNavamsha) navamshaVirupas = 15.0
  } else {
    // Feminine planets (Moon, Venus) & Saturn get strength in Even signs & navamshas
    if (!isOddSign) rasiVirupas = 15.0
    if (!isOddNavamsha) navamshaVirupas = 15.0
  }

  return {
    rasiVirupas,
    navamshaVirupas,
    totalVirupas: rasiVirupas + navamshaVirupas,
  }
}

/**
 * Computes Kendra Bala (Angular Strength):
 * Kendra (1, 4, 7, 10): 60 Virupas
 * Panaphara (2, 5, 8, 11): 30 Virupas
 * Apoklima (3, 6, 9, 12): 15 Virupas
 */
function calculateKendraBala(houseNumber) {
  const h = houseNumber || 1
  if ([1, 4, 7, 10].includes(h)) return 60.0
  if ([2, 5, 8, 11].includes(h)) return 30.0
  return 15.0
}

/**
 * Computes Drekkaana Bala (Decanate Strength):
 * 0°-10° (1st): Sun, Mars, Jupiter get 15 Virupas
 * 10°-20° (2nd): Mercury, Saturn get 15 Virupas
 * 20°-30° (3rd): Moon, Venus get 15 Virupas
 */
function calculateDrekkanaBala(planetName, degreeInSign) {
  const deg = degreeInSign || 0
  const decanate = Math.min(3, Math.floor(deg / 10) + 1)

  if (decanate === 1 && ['Sun', 'Mars', 'Jupiter'].includes(planetName)) return 15.0
  if (decanate === 2 && ['Mercury', 'Saturn'].includes(planetName)) return 15.0
  if (decanate === 3 && ['Moon', 'Venus'].includes(planetName)) return 15.0
  return 0.0
}

/**
 * Computes Dig Bala (Directional Strength): 0 to 60 Virupas
 * Based on angular distance from the opposite (zero) house cusp
 */
function calculateDigBalaVirupas(planetName, houseNumber, degreeInSign) {
  const peakH = DIGBALA_PEAK_HOUSE[planetName] || 1
  const zeroH = ((peakH + 6 - 1) % 12) + 1 // 180° opposite house
  const h = houseNumber || 1
  const deg = degreeInSign || 15

  // House-based angular position from 0 to 360° (each house = 30°)
  const planetAngle = (h - 1) * 30 + deg
  const zeroAngle = (zeroH - 1) * 30 + 15

  let diff = Math.abs(planetAngle - zeroAngle)
  if (diff > 180) diff = 360 - diff

  // Proportion of 60 Virupas (180° distance = 60 Virupas, 0° = 0 Virupas)
  const virupas = Number(((diff / 180) * 60.0).toFixed(2))
  return Math.min(60.0, Math.max(0.0, virupas))
}

/**
 * Computes Kaala Bala (Temporal Strength) Breakdown:
 * 1. Nathonatha Bala (Diurnal / Nocturnal)
 * 2. Paksha Bala (Lunar phase / elongation)
 * 3. Tribhaga Bala (Three parts of day and night)
 * 4. Varsha-Maasa-Dina-Hora Bala
 * 5. Ayana Bala (Declination / Equinoctial strength)
 * 6. Yuddha Bala (Planetary War)
 */
function calculateKaalaBala(planet, sun, moon, birthData, planetsMap) {
  // 1. Is Day or Night?
  // If Sun is in houses 7, 8, 9, 10, 11, 12, it is above the horizon (Day), else Night (1 to 6)
  const sunHouse = sun?.houseNumber || 1
  const isDay = sunHouse >= 7 && sunHouse <= 12

  // Nathonatha Bala:
  // Day planets: Sun, Jupiter, Venus (60v by day, 0v by night)
  // Night planets: Moon, Mars, Saturn (60v by night, 0v by day)
  // Mercury: 60v always
  let nathonatha = 0
  if (planet.name === 'Mercury') {
    nathonatha = 60.0
  } else if (['Sun', 'Jupiter', 'Venus'].includes(planet.name)) {
    nathonatha = isDay ? 60.0 : 0.0
  } else {
    nathonatha = isDay ? 0.0 : 60.0
  }

  // 2. Paksha Bala (Fortnight Strength):
  // Elongation of Moon from Sun (0° to 360°)
  const sunLon = sun?.longitude || 0
  const moonLon = moon?.longitude || 0
  const elongation = normalizeDeg(moonLon - sunLon)
  const isShuklaPaksha = elongation <= 180

  // Benefic strength varies from 0 at Amavasya (0°) to 60 at Purnima (180°)
  const beneficPaksha = isShuklaPaksha
    ? (elongation / 180) * 60.0
    : ((360 - elongation) / 180) * 60.0
  const maleficPaksha = 60.0 - beneficPaksha

  const isBenefic = ['Jupiter', 'Venus'].includes(planet.name) ||
    (planet.name === 'Moon' && elongation >= 120 && elongation <= 240) ||
    (planet.name === 'Mercury' && !['Sun', 'Mars', 'Saturn'].some((m) => planetsMap.get(m)?.houseNumber === planet.houseNumber))

  const pakshaVirupas = Number((isBenefic ? beneficPaksha : maleficPaksha).toFixed(2))

  // 3. Tribhaga Bala (1/3rd of Day and Night):
  // Day: 1st portion: Mercury, 2nd: Sun, 3rd: Saturn
  // Night: 1st portion: Moon, 2nd: Venus, 3rd: Mars
  // Jupiter gets 60 Virupas always
  let tribhagaVirupas = 0
  if (planet.name === 'Jupiter') {
    tribhagaVirupas = 60.0
  } else {
    const hour = birthData?.hour != null ? birthData.hour : 12
    const dayThird = Math.floor(hour / 4) % 3
    if (isDay) {
      if (dayThird === 0 && planet.name === 'Mercury') tribhagaVirupas = 60.0
      else if (dayThird === 1 && planet.name === 'Sun') tribhagaVirupas = 60.0
      else if (dayThird === 2 && planet.name === 'Saturn') tribhagaVirupas = 60.0
    } else {
      if (dayThird === 0 && planet.name === 'Moon') tribhagaVirupas = 60.0
      else if (dayThird === 1 && planet.name === 'Venus') tribhagaVirupas = 60.0
      else if (dayThird === 2 && planet.name === 'Mars') tribhagaVirupas = 60.0
    }
  }

  // 4. Varsha-Maasa-Dina-Hora Bala:
  // Weekday lord gets 45 Virupas
  const weekdays = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
  let dinaVirupas = 0
  if (birthData?.year && birthData?.month && birthData?.day) {
    const d = new Date(Date.UTC(birthData.year, birthData.month - 1, birthData.day))
    const dayLord = weekdays[d.getUTCDay()]
    if (planet.name === dayLord) dinaVirupas = 45.0
  }

  // Hora lord (Planetary hour): gets 60 Virupas
  let horaVirupas = 0
  if (birthData?.hour != null) {
    const horaIdx = (birthData.hour + 6) % 7
    if (planet.name === weekdays[horaIdx]) horaVirupas = 60.0
  }

  const varshaMasaVirupas = 15.0 // Base seasonal allotment

  // 5. Ayana Bala (Equinoctial / Declination Strength: 0 to 60 Virupas):
  // Sun, Mars, Jupiter, Venus gain strength with Northern declination (0° to 180° Sayana)
  // Moon, Saturn gain strength with Southern declination (180° to 360° Sayana)
  const lon = planet.longitude || 0
  const isNorthern = lon >= 0 && lon < 180
  let ayanaVirupas = 30.0
  if (['Sun', 'Mars', 'Jupiter', 'Venus'].includes(planet.name)) {
    ayanaVirupas = isNorthern ? 45.0 : 15.0
  } else if (['Moon', 'Saturn'].includes(planet.name)) {
    ayanaVirupas = isNorthern ? 15.0 : 45.0
  }

  // 6. Yuddha Bala (Planetary War):
  // Checked among true planets (Mars, Mercury, Jupiter, Venus, Saturn) within 1° (60 arcmin)
  let yuddhaVirupas = 0
  if (['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(planet.name)) {
    for (const otherName of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
      if (otherName !== planet.name) {
        const other = planetsMap.get(otherName)
        if (other && Math.abs((planet.longitude || 0) - (other.longitude || 0)) <= 1.0) {
          // Planet with higher northern latitude or speed wins
          const isWinner = (planet.latitude || 0) >= (other.latitude || 0)
          yuddhaVirupas = isWinner ? 15.0 : -15.0
          break
        }
      }
    }
  }

  const totalKaala = nathonatha + pakshaVirupas + tribhagaVirupas + dinaVirupas + horaVirupas + varshaMasaVirupas + ayanaVirupas + yuddhaVirupas

  return {
    nathonatha,
    pakshaVirupas,
    tribhagaVirupas,
    varshaMasaDinaHora: dinaVirupas + horaVirupas + varshaMasaVirupas,
    ayanaVirupas,
    yuddhaVirupas,
    totalVirupas: Number(Math.max(0, totalKaala).toFixed(2)),
  }
}

/**
 * Computes Chesta Bala (Motional Strength): 0 to 60 Virupas
 * Retrograde = 60 Virupas
 * Stationary = 30 Virupas
 * Direct normal motion = 15 to 45 based on speed ratio
 */
function calculateChestaBala(planet, ayanaBala, pakshaBala) {
  // For Sun and Moon: Chesta Bala is identical to Ayana Bala (Sun) or Paksha Bala (Moon)
  if (planet.name === 'Sun') return ayanaBala || 30.0
  if (planet.name === 'Moon') return pakshaBala || 30.0

  if (planet.retrograde) {
    return 60.0 // Full Chesta Bala when retrograde
  }

  const speed = planet.speed != null ? Math.abs(planet.speed) : 1.0
  // Mean speeds in degrees/day: Mars ~0.52, Mercury ~1.38, Jupiter ~0.08, Venus ~1.2, Saturn ~0.03
  const meanSpeeds = {
    Mars: 0.52,
    Mercury: 1.38,
    Jupiter: 0.083,
    Venus: 1.2,
    Saturn: 0.033,
  }
  const mean = meanSpeeds[planet.name] || 1.0
  const ratio = speed / mean

  if (ratio >= 1.2) return 45.0 // Atichara (accelerated motion)
  if (ratio >= 0.8) return 30.0 // Sama (normal motion)
  if (ratio >= 0.3) return 20.0 // Manda (slow motion)
  return 15.0 // Vikala / Stationary
}

/**
 * Computes Drik Bala (Aspectual Strength): Net virupas received from benefic vs malefic aspects
 */
function calculateDrikBala(planet, planets) {
  let netVirupas = 0

  for (const caster of planets) {
    if (caster.name === planet.name || ['Rahu', 'Ketu'].includes(caster.name)) continue

    const diff = normalizeDeg((planet.longitude || 0) - (caster.longitude || 0))
    let aspectValue = 0

    // Standard Parashari continuous aspect values (0 to 60 Virupas):
    if (diff >= 30 && diff < 60) aspectValue = (diff - 30) / 2
    else if (diff >= 60 && diff < 90) aspectValue = 15 + (diff - 60)
    else if (diff >= 90 && diff < 120) aspectValue = 45 - (diff - 90) / 2
    else if (diff >= 120 && diff < 150) aspectValue = 30 - (diff - 120)
    else if (diff >= 150 && diff <= 180) aspectValue = (diff - 150) * 2 // Peak 60v at 180°
    else if (diff > 180 && diff <= 300) {
      // Special aspects:
      // Mars on 4th (90°) and 8th (210°)
      if (caster.name === 'Mars' && (Math.abs(diff - 90) <= 15 || Math.abs(diff - 210) <= 15)) aspectValue = 60
      // Jupiter on 5th (120°) and 9th (240°)
      else if (caster.name === 'Jupiter' && (Math.abs(diff - 120) <= 15 || Math.abs(diff - 240) <= 15)) aspectValue = 60
      // Saturn on 3rd (60°) and 10th (270°)
      else if (caster.name === 'Saturn' && (Math.abs(diff - 60) <= 15 || Math.abs(diff - 270) <= 15)) aspectValue = 60
    }

    if (aspectValue > 0) {
      const isBenefic = ['Jupiter', 'Venus'].includes(caster.name)
      if (isBenefic) {
        netVirupas += (aspectValue / 4) // Benefic drishti contributes positively
      } else {
        netVirupas -= (aspectValue / 4) // Malefic drishti contributes negatively
      }
    }
  }

  return Number(netVirupas.toFixed(2))
}

/**
 * Computes complete Shadbala for all 7 Grahas
 * @param {Array} planets - List of enriched planet objects
 * @param {Object} vargas - Shodasavarga charts dictionary
 * @param {Object} birthData - Birth metadata
 * @returns {Object} Complete Shadbala dataset including individual breakdowns, ratios, ranks, and summary
 */
function computeShadbala(planets, vargas, birthData) {
  const planetsMap = new Map()
  planets.forEach((p) => planetsMap.set(p.name, p))

  const sun = planetsMap.get('Sun')
  const moon = planetsMap.get('Moon')

  const planetResults = []

  for (const name of SHADBALA_PLANETS) {
    const planet = planetsMap.get(name)
    if (!planet) continue

    const lon = planet.longitude || 0
    const degInSign = planet.degreeInSign || 0
    const hNum = planet.houseNumber || 1

    // 1. Sthana Bala
    const uchchaBala = calculateUchchaBala(name, lon)
    const saptavargaja = calculateSaptavargajaBala(planet, vargas, planetsMap)
    const ojhaYugma = calculateOjhaYugmaBala(planet, vargas)
    const kendraBala = calculateKendraBala(hNum)
    const drekkanaBala = calculateDrekkanaBala(name, degInSign)
    const totalSthanaVirupas = Number((uchchaBala + saptavargaja.totalVirupas + ojhaYugma.totalVirupas + kendraBala + drekkanaBala).toFixed(2))

    // 2. Dig Bala
    const digBalaVirupas = calculateDigBalaVirupas(name, hNum, degInSign)

    // 3. Kaala Bala
    const kaala = calculateKaalaBala(planet, sun, moon, birthData, planetsMap)
    const totalKaalaVirupas = kaala.totalVirupas

    // 4. Chesta Bala
    const chestaBalaVirupas = Number(calculateChestaBala(planet, kaala.ayanaVirupas, kaala.pakshaVirupas).toFixed(2))

    // 5. Naisargika Bala
    const naisargikaVirupas = NAISARGIKA_BALA[name] || 10.0

    // 6. Drik Bala
    const drikBalaVirupas = calculateDrikBala(planet, planets)

    // Total Virupas and Rupas
    const totalVirupas = Number(
      (totalSthanaVirupas + digBalaVirupas + totalKaalaVirupas + chestaBalaVirupas + naisargikaVirupas + drikBalaVirupas).toFixed(2)
    )
    const totalRupas = Number((totalVirupas / 60.0).toFixed(2))

    // Benchmarks
    const req = MINIMUM_SHADBALA[name] || { virupas: 300, rupas: 5.0 }
    const strengthRatio = Number((totalVirupas / req.virupas).toFixed(3))
    const percentage = Math.round(strengthRatio * 100)
    const isStrong = strengthRatio >= 1.0

    let status = 'Strong'
    if (strengthRatio >= 1.25) status = 'Exceptionally Strong'
    else if (strengthRatio >= 1.0) status = 'Strong'
    else if (strengthRatio >= 0.85) status = 'Moderate'
    else status = 'Deficient'

    planetResults.push({
      id: planet.id,
      name,
      sanskritName: planet.sanskritName || name,
      symbol: planet.symbol,
      sign: planet.sign,
      houseNumber: hNum,
      houseOrdinal: planet.houseOrdinal,
      retrograde: Boolean(planet.retrograde),
      combust: Boolean(planet.combust),
      // 6 Balas
      sthanaBala: {
        totalVirupas: totalSthanaVirupas,
        totalRupas: Number((totalSthanaVirupas / 60.0).toFixed(2)),
        uchchaBala,
        saptavargajaBala: saptavargaja.totalVirupas,
        saptavargajaBreakdown: saptavargaja.breakdown,
        ojhayugmaBala: ojhaYugma.totalVirupas,
        kendraBala,
        drekkanaBala,
      },
      digBala: {
        virupas: digBalaVirupas,
        rupas: Number((digBalaVirupas / 60.0).toFixed(2)),
        peakHouse: DIGBALA_PEAK_HOUSE[name],
      },
      kaalaBala: {
        totalVirupas: totalKaalaVirupas,
        totalRupas: Number((totalKaalaVirupas / 60.0).toFixed(2)),
        nathonatha: kaala.nathonatha,
        paksha: kaala.pakshaVirupas,
        tribhaga: kaala.tribhagaVirupas,
        varshaMasaDinaHora: kaala.varshaMasaDinaHora,
        ayana: kaala.ayanaVirupas,
        yuddha: kaala.yuddhaVirupas,
      },
      chestaBala: {
        virupas: chestaBalaVirupas,
        rupas: Number((chestaBalaVirupas / 60.0).toFixed(2)),
        status: planet.retrograde ? 'Retrograde (Maximum)' : 'Direct',
      },
      naisargikaBala: {
        virupas: naisargikaVirupas,
        rupas: Number((naisargikaVirupas / 60.0).toFixed(2)),
      },
      drikBala: {
        virupas: drikBalaVirupas,
        rupas: Number((drikBalaVirupas / 60.0).toFixed(2)),
      },
      // Summary & Benchmarks
      totalVirupas,
      totalRupas,
      requiredVirupas: req.virupas,
      requiredRupas: req.rupas,
      strengthRatio,
      percentage,
      isStrong,
      status,
    })
  }

  // Calculate Ranks: 1st (highest ratio) to 7th (lowest ratio)
  const sorted = [...planetResults].sort((a, b) => b.strengthRatio - a.strengthRatio)
  sorted.forEach((item, idx) => {
    item.rank = idx + 1
  })

  // Re-sort back to traditional planetary order (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
  const orderMap = { Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6 }
  planetResults.sort((a, b) => orderMap[a.name] - orderMap[b.name])

  // Key takeaways
  const strongestPlanet = sorted[0]?.name || 'Sun'
  const weakestPlanet = sorted[sorted.length - 1]?.name || 'Saturn'
  const strongCount = planetResults.filter((p) => p.isStrong).length

  return {
    planets: planetResults,
    strongestPlanet,
    weakestPlanet,
    strongCount,
    totalCount: planetResults.length,
    overallHealthScore: Math.round(
      planetResults.reduce((acc, p) => acc + p.percentage, 0) / planetResults.length
    ),
  }
}

module.exports = {
  SHADBALA_PLANETS,
  MINIMUM_SHADBALA,
  NAISARGIKA_BALA,
  computeShadbala,
  calculateUchchaBala,
  calculateSaptavargajaBala,
  calculateOjhaYugmaBala,
  calculateKendraBala,
  calculateDrekkanaBala,
  calculateDigBalaVirupas,
  calculateKaalaBala,
  calculateChestaBala,
  calculateDrikBala,
}

