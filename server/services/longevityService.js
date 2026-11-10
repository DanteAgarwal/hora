/**
 * Longevity, Baadhakas & Marakas Calculation & Enrichment Service
 * Kundli Workbench Server Core • BPHS Chapters 13 & 14
 */

const { SIGN_NAMES, SIGN_LORDS } = require('./astroConstants')

/**
 * Computes or normalizes Baadhaka Sthana and Baadhaka Grahas (BPHS 13.3)
 */
function computeBaadhakas(lagnaSignIndex, planets = [], rawBaadhakas = null) {
  // If raw response from Python Hora API is available
  if (rawBaadhakas && Array.isArray(rawBaadhakas.houses)) {
    const lagnaData = rawBaadhakas.houses.find((h) => h.sign === lagnaSignIndex) || rawBaadhakas.houses[0]
    if (lagnaData) {
      return {
        lagnaSign: lagnaSignIndex,
        lagnaSignName: SIGN_NAMES[lagnaSignIndex],
        baadhakaHouse: lagnaData.house,
        baadhakaSign: lagnaData.sthaana,
        baadhakaSignName: lagnaData.sthaana_name || SIGN_NAMES[lagnaData.sthaana],
        modality: lagnaData.modality,
        lords: lagnaData.lords || [],
        occupants: lagnaData.occupants || [],
        why: lagnaData.why || '',
      }
    }
  }

  // Pure backend fallback calculation: BPHS 13.3
  const modalityRem = lagnaSignIndex % 3
  let baadhakaHouseOffset = 11 // Movable (Chara) -> 11th house
  let modality = 'movable'

  if (modalityRem === 1) {
    baadhakaHouseOffset = 9 // Fixed (Sthira) -> 9th house
    modality = 'fixed'
  } else if (modalityRem === 2) {
    baadhakaHouseOffset = 7 // Dual (Dwisvabhava) -> 7th house
    modality = 'dual'
  }

  const baadhakaSign = (lagnaSignIndex + (baadhakaHouseOffset - 1)) % 12
  const baadhakaSignName = SIGN_NAMES[baadhakaSign]
  const lordName = SIGN_LORDS[baadhakaSignName]
  const occupants = planets.filter((p) => p.houseNumber === baadhakaHouseOffset).map((p) => p.name)

  const why = `${SIGN_NAMES[lagnaSignIndex]} is ${modality}, so the ${baadhakaHouseOffset}th from it (${baadhakaSignName}) is its baadhaka sthaana, and ${lordName} is its lord.`

  return {
    lagnaSign: lagnaSignIndex,
    lagnaSignName: SIGN_NAMES[lagnaSignIndex],
    baadhakaHouse: baadhakaHouseOffset,
    baadhakaSign,
    baadhakaSignName,
    modality,
    lords: [lordName],
    occupants,
    why,
  }
}

/**
 * Computes or normalizes Maraka Sthanas and Maraka Grahas (BPHS 14.2)
 */
function computeMarakas(lagnaSignIndex, planets = [], rawMarakas = null) {
  // If raw response from Python Hora API is available
  if (rawMarakas && Array.isArray(rawMarakas.maraka_grahas)) {
    return {
      lagna: lagnaSignIndex,
      lagnaName: SIGN_NAMES[lagnaSignIndex],
      marakaHouses: [2, 7],
      marakaGrahas: rawMarakas.maraka_grahas.map((mg) => ({
        graha: mg.graha,
        grahaName: mg.graha_name,
        kind: mg.kind,
        reasons: mg.reasons || [],
      })),
      framing: rawMarakas.framing || 'Section 14.2 Marakas',
    }
  }

  // Pure backend fallback calculation: BPHS 14.2
  const secondSign = (lagnaSignIndex + 1) % 12
  const seventhSign = (lagnaSignIndex + 6) % 12

  const secondLord = SIGN_LORDS[SIGN_NAMES[secondSign]]
  const seventhLord = SIGN_LORDS[SIGN_NAMES[seventhSign]]

  const marakaGrahasMap = {}

  // 1. House lords of 2nd and 7th
  if (secondLord) {
    marakaGrahasMap[secondLord] = {
      grahaName: secondLord,
      kind: 'house lord',
      reasons: [`owns the 2nd house (${SIGN_NAMES[secondSign]})`],
    }
  }
  if (seventhLord) {
    if (marakaGrahasMap[seventhLord]) {
      marakaGrahasMap[seventhLord].reasons.push(`owns the 7th house (${SIGN_NAMES[seventhSign]})`)
    } else {
      marakaGrahasMap[seventhLord] = {
        grahaName: seventhLord,
        kind: 'house lord',
        reasons: [`owns the 7th house (${SIGN_NAMES[seventhSign]})`],
      }
    }
  }

  // 2. Occupants of 2nd and 7th
  for (const pl of planets) {
    if (pl.houseNumber === 2 && !marakaGrahasMap[pl.name]) {
      marakaGrahasMap[pl.name] = {
        grahaName: pl.name,
        kind: 'malefic contact',
        reasons: [`occupies the 2nd house (${SIGN_NAMES[secondSign]})`],
      }
    } else if (pl.houseNumber === 7 && !marakaGrahasMap[pl.name]) {
      marakaGrahasMap[pl.name] = {
        grahaName: pl.name,
        kind: 'malefic contact',
        reasons: [`occupies the 7th house (${SIGN_NAMES[seventhSign]})`],
      }
    }
  }

  return {
    lagna: lagnaSignIndex,
    lagnaName: SIGN_NAMES[lagnaSignIndex],
    marakaHouses: [2, 7],
    marakaGrahas: Object.values(marakaGrahasMap),
    framing: 'Section 14.2 Marakas',
  }
}

module.exports = {
  computeBaadhakas,
  computeMarakas,
}

