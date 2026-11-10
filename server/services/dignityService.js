/**
 * Dignity, Strength, Combustion & Neecha Bhanga Service
 * Kundli Workbench Server Core
 */

const {
  EXALTATION_SIGNS,
  DEBILITATION_SIGNS,
  OWN_SIGNS,
  MOOLATRIKONA_SIGNS,
  DIGBALA_PEAK,
  COMBUSTION_ORBS,
} = require('./astroConstants')

/**
 * Derives the classical dignity of a planet
 */
function deriveDignity(planetName, signIndex, rawDignity) {
  if (rawDignity && rawDignity !== 'Calculated') {
    const dLower = String(rawDignity).toLowerCase()
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
  if (MOOLATRIKONA_SIGNS[planetName] === signIndex) return 'Moolatrikona'
  if (OWN_SIGNS[planetName]?.includes(signIndex)) return 'Own Sign'
  return 'Calculated'
}

/**
 * Calculates Digbala (Directional Strength) percentage (0% to 100%) and status
 */
function calculateDigbala(planetName, houseNumber) {
  const peak = DIGBALA_PEAK[planetName]
  if (!peak) {
    return {
      digbalaScore: 50,
      digbalaPeakHouse: 1,
      digbalaStatus: 'Moderate',
    }
  }

  const h = houseNumber || 1
  // Circular distance across 12 houses (0 to 6)
  const rawDist = Math.abs(h - peak)
  const distFromPeak = Math.min(rawDist, 12 - rawDist)
  // 0 distance = 100%, 6 distance = 0%
  const score = Math.round(((6 - distFromPeak) / 6) * 100)

  let status = 'Moderate'
  if (score >= 90) status = 'Full Digbala'
  else if (score >= 65) status = 'High Digbala'
  else if (score <= 20) status = 'Zero Digbala'

  return {
    digbalaScore: score,
    digbalaPeakHouse: peak,
    digbalaStatus: status,
  }
}

/**
 * Calculates Astrological Combustion status relative to Sun
 */
function calculateCombustion(planetName, sunSeparation, isRetrograde) {
  if (['Sun', 'Rahu', 'Ketu'].includes(planetName)) {
    return {
      combustionDegrees: sunSeparation,
      combustionStatus: 'Exempt',
    }
  }

  let orb = COMBUSTION_ORBS[planetName] || 12
  if (isRetrograde) {
    if (planetName === 'Mercury') orb = 12
    if (planetName === 'Venus') orb = 8
  }

  const sep = sunSeparation != null ? Math.abs(sunSeparation) : 999

  let status = 'Safe'
  if (sep <= orb * 0.35) status = 'Deeply Combust'
  else if (sep <= orb) status = 'Combust'
  else if (sep <= orb * 1.25) status = 'Mildly Combust'

  return {
    combustionDegrees: Number(sep.toFixed(2)),
    combustionStatus: status,
  }
}

/**
 * Evaluates Neecha Bhanga Raja Yoga (Cancellation of Debilitation)
 */
function checkNeechaBhanga(planet, planetsMap, moon) {
  if (planet.dignity !== 'Debilitated') {
    return { isNeechaBhanga: false, neechaBhangaReason: '' }
  }

  const hNum = planet.houseNumber || 1
  const dispositor = planetsMap.get(planet.dispositor)

  // Rule 1: Dispositor of debilitated planet is in a Kendra (1, 4, 7, 10) from Lagna or Moon
  if (dispositor && [1, 4, 7, 10].includes(dispositor.houseNumber)) {
    return {
      isNeechaBhanga: true,
      neechaBhangaReason: `Dispositor ${dispositor.name} occupies Kendra (H${dispositor.houseNumber}) from Lagna.`,
    }
  }

  if (dispositor && moon) {
    const diffFromMoon = ((dispositor.houseNumber - moon.houseNumber + 12) % 12) + 1
    if ([1, 4, 7, 10].includes(diffFromMoon)) {
      return {
        isNeechaBhanga: true,
        neechaBhangaReason: `Dispositor ${dispositor.name} occupies Kendra (H${diffFromMoon}) from Moon.`,
      }
    }
  }

  // Rule 2: Planet itself is in a Kendra (1, 4, 7, 10) from Lagna or Moon
  if ([1, 4, 7, 10].includes(hNum)) {
    return {
      isNeechaBhanga: true,
      neechaBhangaReason: `Planet itself is in a Kendra (H${hNum}), providing institutional strength.`,
    }
  }

  if (moon) {
    const diffFromMoon = ((hNum - moon.houseNumber + 12) % 12) + 1
    if ([1, 4, 7, 10].includes(diffFromMoon)) {
      return {
        isNeechaBhanga: true,
        neechaBhangaReason: `Planet occupies Kendra (H${diffFromMoon}) from Moon.`,
      }
    }
  }

  // Rule 3: Exaltation lord of the debilitated sign is in Kendra
  const exaltLordName = {
    Sun: 'Mars',      // Aries exalt
    Moon: 'Venus',    // Taurus exalt
    Mars: 'Saturn',   // Capricorn exalt
    Mercury: 'Mercury',
    Jupiter: 'Moon',  // Cancer exalt
    Venus: 'Jupiter', // Pisces exalt
    Saturn: 'Venus',  // Libra exalt
  }[planet.name]

  if (exaltLordName) {
    const exaltLord = planetsMap.get(exaltLordName)
    if (exaltLord && [1, 4, 7, 10].includes(exaltLord.houseNumber)) {
      return {
        isNeechaBhanga: true,
        neechaBhangaReason: `Exaltation lord ${exaltLordName} occupies Kendra (H${exaltLord.houseNumber}) from Lagna.`,
      }
    }
  }

  return { isNeechaBhanga: false, neechaBhangaReason: '' }
}

/**
 * Computes complete dignity and strength overview for all planets
 */
function computeDignityOverview(planets) {
  const planetsMap = new Map()
  planets.forEach((p) => planetsMap.set(p.name, p))
  const moon = planetsMap.get('Moon')

  return planets.map((p) => {
    const isExalted = p.dignity === 'Exalted'
    const isMoolatrikona = p.dignity === 'Moolatrikona'
    const isOwnSign = p.dignity === 'Own Sign'
    const isDebilitated = p.dignity === 'Debilitated'

    const { isNeechaBhanga, neechaBhangaReason } = checkNeechaBhanga(p, planetsMap, moon)
    const digbala = calculateDigbala(p.name, p.houseNumber)
    const combustion = calculateCombustion(p.name, p.sunSeparation, p.retrograde)
    const dispositorPlanet = planetsMap.get(p.dispositor)

    return {
      planet: p,
      name: p.name,
      dignity: p.dignity,
      isExalted,
      isMoolatrikona,
      isOwnSign,
      isDebilitated,
      isNeechaBhanga,
      neechaBhangaReason,
      isRetrograde: Boolean(p.retrograde),
      isCombust: Boolean(p.combust),
      combustionDegrees: combustion.combustionDegrees,
      combustionStatus: combustion.combustionStatus,
      digbalaScore: digbala.digbalaScore,
      digbalaPeakHouse: digbala.digbalaPeakHouse,
      digbalaStatus: digbala.digbalaStatus,
      dispositor: p.dispositor,
      dispositorPlanet: dispositorPlanet || null,
    }
  })
}

module.exports = {
  deriveDignity,
  calculateDigbala,
  calculateCombustion,
  checkNeechaBhanga,
  computeDignityOverview,
}

