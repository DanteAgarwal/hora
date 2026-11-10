/**
 * Arudha Padas (A1 to A12, AL, UL) Calculation & Enrichment Service
 * Kundli Workbench Server Core • BPHS Chapter 9
 */

const { SIGN_NAMES, SIGN_LORDS } = require('./astroConstants')

const SPECIAL_ARUDHA_NAMES = {
  1: { symbol: 'AL', name: 'Arudha Lagna (Pada Lagna)' },
  2: { symbol: 'A2', name: 'Dhana Pada (A2)' },
  3: { symbol: 'A3', name: 'Bhratri Pada (A3)' },
  4: { symbol: 'A4', name: 'Matri / Sukha Pada (A4)' },
  5: { symbol: 'A5', name: 'Mantra / Putra Pada (A5)' },
  6: { symbol: 'A6', name: 'Roga / Shatru Pada (A6)' },
  7: { symbol: 'A7', name: 'Dara Pada (A7)' },
  8: { symbol: 'A8', name: 'Mrityu Pada (A8)' },
  9: { symbol: 'A9', name: 'Bhagya / Dharma Pada (A9)' },
  10: { symbol: 'A10', name: 'Rajya / Karma Pada (A10)' },
  11: { symbol: 'A11', name: 'Labha Pada (A11)' },
  12: { symbol: 'UL', name: 'Upapada Lagna (UL / Gaunapada)' },
}

/**
 * Computes or normalizes all 12 Arudha Padas with classical exceptions (BPHS 9.2)
 */
function computeArudhaPadas(lagnaSignIndex, planets = [], rawArudhas = null) {
  const padas = []
  const arudhasBySign = {}
  for (let s = 0; s < 12; s++) {
    arudhasBySign[s] = []
  }

  // If raw response from Python Hora API is available, normalize it directly
  if (rawArudhas && Array.isArray(rawArudhas.padas) && rawArudhas.padas.length === 12) {
    for (const raw of rawArudhas.padas) {
      const h = raw.house
      const meta = SPECIAL_ARUDHA_NAMES[h] || { symbol: `A${h}`, name: `Arudha Pada ${h}` }
      const padaSign = raw.sign
      const symbol = raw.special_symbol || raw.symbol || meta.symbol
      const name = raw.special_name || meta.name

      const entry = {
        house: h,
        symbol,
        name,
        signIndex: padaSign,
        signName: raw.sign_name || SIGN_NAMES[padaSign],
        houseSignIndex: raw.house_sign !== undefined ? raw.house_sign : (lagnaSignIndex + (h - 1)) % 12,
        lordName: raw.lord_name || SIGN_LORDS[SIGN_NAMES[(lagnaSignIndex + (h - 1)) % 12]],
        exceptionApplied: Boolean(raw.exception_applied),
        steps: raw.steps || [],
      }
      padas.push(entry)
      if (arudhasBySign[padaSign]) {
        arudhasBySign[padaSign].push(symbol)
      }
    }
  } else {
    // Pure backend fallback calculation: BPHS 9.2 Six-Step Algorithm
    for (let h = 1; h <= 12; h++) {
      const houseSign = (lagnaSignIndex + (h - 1)) % 12
      const lordName = SIGN_LORDS[SIGN_NAMES[houseSign]]
      const lordPl = planets.find((p) => p.name === lordName)
      const lordSign = lordPl ? lordPl.signIndex : houseSign

      // Step 3: Count from house sign to lord sign zodiacally (1-based)
      let count = (lordSign - houseSign + 12) % 12
      if (count === 0) count = 12

      // Step 4: Advance count signs from lord sign
      const targetBefore = (lordSign + count - 1) % 12

      // Step 5: If target is 1st or 7th from house sign, advance 10 signs (9 in 0-based)
      const distFromHouse = ((targetBefore - houseSign + 12) % 12) + 1
      let finalSign = targetBefore
      let exceptionApplied = false

      if (distFromHouse === 1 || distFromHouse === 7) {
        finalSign = (targetBefore + 9) % 12
        exceptionApplied = true
      }

      const meta = SPECIAL_ARUDHA_NAMES[h] || { symbol: `A${h}`, name: `Arudha Pada ${h}` }
      const symbol = meta.symbol
      const name = meta.name

      const entry = {
        house: h,
        symbol,
        name,
        signIndex: finalSign,
        signName: SIGN_NAMES[finalSign],
        houseSignIndex: houseSign,
        lordName,
        exceptionApplied,
        steps: [],
      }
      padas.push(entry)
      if (arudhasBySign[finalSign]) {
        arudhasBySign[finalSign].push(symbol)
      }
    }
  }

  // Map to house positions relative to lagna
  const arudhasByHouse = {}
  for (let h = 1; h <= 12; h++) {
    const hSign = (lagnaSignIndex + (h - 1)) % 12
    arudhasByHouse[h] = arudhasBySign[hSign] || []
  }

  return {
    padas,
    arudhasBySign,
    arudhasByHouse,
  }
}

module.exports = {
  SPECIAL_ARUDHA_NAMES,
  computeArudhaPadas,
}

