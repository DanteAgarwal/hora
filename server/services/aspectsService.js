/**
 * Classical Parashari Drishti (Aspects & Virupas) Service
 * Kundli Workbench Server Core
 */

const { SIGN_NAMES, getOrdinal } = require('./astroConstants')

/**
 * Determines whether a planet casts benefic or malefic aspect influence
 */
function getCasterNature(planetName, planetsMap) {
  if (['Jupiter', 'Venus'].includes(planetName)) return 'benefic'
  if (['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'].includes(planetName)) return 'malefic'
  if (planetName === 'Mercury') {
    const merc = planetsMap ? planetsMap.get('Mercury') : null
    if (merc && planetsMap) {
      for (const p of planetsMap.values()) {
        if (p.houseNumber === merc.houseNumber && ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'].includes(p.name)) {
          return 'malefic'
        }
      }
    }
    return 'benefic'
  }
  return 'benefic' // Moon is treated as benefic
}

/**
 * Calculates Parashari Drishti virupas (0 to 60) and metadata from a planet to a house
 */
function calculateAspectVirupas(caster, targetHouseNum, casterNature) {
  const hNum = caster.houseNumber || 1
  const distance = ((targetHouseNum - hNum + 12) % 12) + 1

  // 1st House: Occupies
  if (distance === 1) {
    return {
      houseDistance: 1,
      virupas: 60,
      strengthLabel: 'Occupies',
      isSpecial: false,
      isFull: true,
      casterType: casterNature,
      description: `Occupies ${getOrdinal(hNum)} house directly`,
    }
  }

  // 7th House: Full 60v aspect for all planets
  if (distance === 7) {
    return {
      houseDistance: 7,
      virupas: 60,
      strengthLabel: '7th Full (60v)',
      isSpecial: false,
      isFull: true,
      casterType: casterNature,
      description: 'Universal 7th House Full Drishti (100% influence)',
    }
  }

  // Mars special aspects: 4th and 8th (Full 60v)
  if (caster.name === 'Mars' && (distance === 4 || distance === 8)) {
    return {
      houseDistance: distance,
      virupas: 60,
      strengthLabel: `${distance}th Special (60v)`,
      isSpecial: true,
      isFull: true,
      casterType: 'malefic',
      description: `Mars Special Full Drishti on ${distance}th house`,
    }
  }

  // Jupiter & Nodes special aspects: 5th and 9th (Full 60v)
  if (['Jupiter', 'Rahu', 'Ketu'].includes(caster.name) && (distance === 5 || distance === 9)) {
    return {
      houseDistance: distance,
      virupas: 60,
      strengthLabel: `${distance}th Special (60v)`,
      isSpecial: true,
      isFull: true,
      casterType: casterNature,
      description: `${caster.name} Special Full Drishti on ${distance}th house`,
    }
  }

  // Saturn special aspects: 3rd and 10th (Full 60v)
  if (caster.name === 'Saturn' && (distance === 3 || distance === 10)) {
    return {
      houseDistance: distance,
      virupas: 60,
      strengthLabel: `${distance}th Special (60v)`,
      isSpecial: true,
      isFull: true,
      casterType: 'malefic',
      description: `Saturn Special Full Drishti on ${distance}th house`,
    }
  }

  // Secondary partial aspects (classical virupa ratings):
  if (distance === 3 || distance === 10) {
    return {
      houseDistance: distance,
      virupas: 30,
      strengthLabel: `${distance}th Partial (30v)`,
      isSpecial: false,
      isFull: false,
      casterType: casterNature,
      description: `Partial Drishti (50% strength) on ${distance}th house`,
    }
  }

  if (distance === 5 || distance === 9) {
    return {
      houseDistance: distance,
      virupas: 30,
      strengthLabel: `${distance}th Partial (30v)`,
      isSpecial: false,
      isFull: false,
      casterType: casterNature,
      description: `Partial Drishti (50% strength) on ${distance}th house`,
    }
  }

  if (distance === 4 || distance === 8) {
    return {
      houseDistance: distance,
      virupas: 15,
      strengthLabel: `${distance}th Quarter (15v)`,
      isSpecial: false,
      isFull: false,
      casterType: casterNature,
      description: `Quarter Drishti (25% strength) on ${distance}th house`,
    }
  }

  return null
}

/**
 * Enriches planets and houses with full Parashari Drishti
 */
function calculateAspectsForChart(planets, houses, lagnaSignIndex = 0) {
  const planetsMap = new Map()
  planets.forEach((p) => planetsMap.set(p.name, p))

  // Clear or initialize aspect arrays
  planets.forEach((p) => {
    p.aspectsCast = []
    p.aspectsReceived = []
  })
  houses.forEach((h) => {
    h.aspectsReceived = []
  })

  // 1. Calculate aspects cast by each planet
  for (const pl of planets) {
    const casterNature = getCasterNature(pl.name, planetsMap)

    for (let targetH = 1; targetH <= 12; targetH++) {
      const asp = calculateAspectVirupas(pl, targetH, casterNature)
      if (!asp || asp.houseDistance === 1) continue // Skip direct occupation for aspectsCast

      const targetSignIdx = (lagnaSignIndex + (targetH - 1)) % 12
      const targetSignName = SIGN_NAMES[targetSignIdx]
      const residentPlanets = planets.filter((o) => o.houseNumber === targetH).map((o) => o.name)

      // Add to planet's aspectsCast
      pl.aspectsCast.push({
        house: targetH,
        houseOrdinal: getOrdinal(targetH),
        sign: targetSignName,
        type: asp.strengthLabel,
        virupas: asp.virupas,
        isSpecial: asp.isSpecial,
        isFull: asp.isFull,
        casterType: asp.casterType,
        description: asp.description,
        aspectedPlanets: residentPlanets,
      })

      // Add to house's aspectsReceived
      const targetHouse = houses.find((h) => h.number === targetH)
      if (targetHouse) {
        targetHouse.aspectsReceived.push({
          planet: pl.name,
          type: asp.strengthLabel,
          virupas: asp.virupas,
          isSpecial: asp.isSpecial,
          isFull: asp.isFull,
          casterType: asp.casterType,
          description: asp.description,
        })
      }

      // Add to resident planets' aspectsReceived
      for (const resPl of planets.filter((o) => o.houseNumber === targetH)) {
        resPl.aspectsReceived.push({
          planet: pl.name,
          type: asp.strengthLabel,
          virupas: asp.virupas,
          isSpecial: asp.isSpecial,
          isFull: asp.isFull,
          casterType: asp.casterType,
          description: asp.description,
        })
      }
    }
  }

  // 2. Pre-compute complete AspectsMatrixData
  const bhavaAspects = {}
  for (const pl of planets) {
    bhavaAspects[pl.name] = {}
    const casterNature = getCasterNature(pl.name, planetsMap)
    for (let h = 1; h <= 12; h++) {
      bhavaAspects[pl.name][h] = calculateAspectVirupas(pl, h, casterNature)
    }
  }

  const mutualAspects = {}
  for (let i = 0; i < planets.length; i++) {
    const pA = planets[i]
    mutualAspects[pA.name] = {}
    const casterNatureA = getCasterNature(pA.name, planetsMap)

    for (let j = 0; j < planets.length; j++) {
      const pB = planets[j]
      if (pA.name === pB.name) {
        mutualAspects[pA.name][pB.name] = null
        continue
      }
      const casterNatureB = getCasterNature(pB.name, planetsMap)
      const aToB = calculateAspectVirupas(pA, pB.houseNumber, casterNatureA)
      const bToA = calculateAspectVirupas(pB, pA.houseNumber, casterNatureB)

      mutualAspects[pA.name][pB.name] = {
        aToB,
        bToA,
        isMutual: Boolean(aToB && bToA && aToB.isFull && bToA.isFull),
        isConjunction: pA.houseNumber === pB.houseNumber,
      }
    }
  }

  return {
    bhavaAspects,
    mutualAspects,
  }
}

module.exports = {
  getCasterNature,
  calculateAspectVirupas,
  calculateAspectsForChart,
}

