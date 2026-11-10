/**
 * Ashtakavarga (SAV & BAV) Calculation & Enrichment Service
 * Kundli Workbench Server Core • BPHS Chapter 12
 */

const { SIGN_NAMES } = require('./astroConstants')

/**
 * Normalizes Ashtakavarga charts (Sarvashtakavarga & Bhinnashtakavarga)
 */
function normalizeAshtakavarga(rawAshtakavarga, lagnaSignIndex, planets = []) {
  let savRekhas = [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29] // Fallback 337 total
  let savTotal = 337
  let bhinna = []

  if (rawAshtakavarga) {
    if (rawAshtakavarga.sarvashtakavarga && Array.isArray(rawAshtakavarga.sarvashtakavarga.rekhas)) {
      savRekhas = rawAshtakavarga.sarvashtakavarga.rekhas
      savTotal = rawAshtakavarga.sarvashtakavarga.total || savRekhas.reduce((a, b) => a + b, 0)
    }
    if (Array.isArray(rawAshtakavarga.bhinnashtakavarga)) {
      bhinna = rawAshtakavarga.bhinnashtakavarga
    }
  }

  // Calculate SAV points per house (1 to 12)
  const savByHouse = {}
  for (let h = 1; h <= 12; h++) {
    const signIdx = (lagnaSignIndex + (h - 1)) % 12
    const points = savRekhas[signIdx] ?? 28
    let grade = 'average'
    if (points >= 30) grade = 'strong'
    else if (points <= 25) grade = 'weak'

    savByHouse[h] = {
      house: h,
      signIndex: signIdx,
      signName: SIGN_NAMES[signIdx],
      rekhas: points,
      grade,
    }
  }

  // Calculate BAV points per planet in its occupied sign
  const bavByPlanet = {}
  for (const pl of planets) {
    const bTable = bhinna.find((b) => b.owner === pl.name)
    if (bTable && Array.isArray(bTable.rekhas)) {
      const plSign = pl.signIndex ?? 0
      const rekhas = bTable.rekhas[plSign] ?? 4
      let grade = 'neutral'
      if (rekhas >= 5) grade = 'favorable'
      else if (rekhas <= 3) grade = 'unfavorable'

      bavByPlanet[pl.name] = {
        planet: pl.name,
        occupiedSign: SIGN_NAMES[plSign],
        rekhas,
        grade,
      }
    }
  }

  return {
    sarvashtakavarga: {
      rekhas: savRekhas,
      total: savTotal,
      signs: savRekhas.map((r, idx) => ({
        sign: idx,
        signName: SIGN_NAMES[idx],
        rekhas: r,
        grade: r >= 30 ? 'strong' : r <= 25 ? 'weak' : 'average',
      })),
    },
    savByHouse,
    bhinnashtakavarga: bhinna,
    bavByPlanet,
  }
}

module.exports = {
  normalizeAshtakavarga,
}

