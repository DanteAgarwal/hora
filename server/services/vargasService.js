/**
 * Shodasavarga Divisional Charts & Comparison Service
 * Kundli Workbench Server Core
 * Implements all 16 classical Parashari vargas with mathematical parity to BPHS
 */

const {
  SIGN_NAMES,
  SIGN_LORDS,
  EXALTATION_SIGNS,
  DEBILITATION_SIGNS,
  OWN_SIGNS,
  PLANET_META,
  parseSignIndex,
  formatDms,
} = require('./astroConstants')

/**
 * High-precision Parashari calculation of divisional position from sidereal longitude (0° - 360°)
 */
function calculateVargaPosition(code, lon) {
  const normalizedLon = ((lon % 360) + 360) % 360
  const rasi = Math.floor(normalizedLon / 30) % 12
  const deg = normalizedLon - rasi * 30
  const odd = rasi % 2 === 0 // 0-indexed: 0=Aries (odd), 1=Taurus (even), etc.
  const modality = rasi % 3 // 0=Movable, 1=Fixed, 2=Dual
  let sign = 0
  let frac = 0

  switch (code) {
    case 'D1':
      sign = rasi
      frac = deg / 30
      break

    case 'D2': {
      // Hora: 2 divisions of 15°
      const idx = Math.min(1, Math.floor(deg / 15))
      sign = odd ? (idx === 0 ? 4 : 3) : (idx === 0 ? 3 : 4) // Odd: Sun (Leo) / Moon (Cancer); Even reversed
      frac = (deg - idx * 15) / 15
      break
    }

    case 'D3': {
      // Drekkana: 3 divisions of 10° (1st, 5th, 9th)
      const idx = Math.min(2, Math.floor(deg / 10))
      sign = (rasi + idx * 4) % 12
      frac = (deg - idx * 10) / 10
      break
    }

    case 'D4': {
      // Chaturthamsha: 4 divisions of 7°30' (1st, 4th, 7th, 10th)
      const idx = Math.min(3, Math.floor(deg / 7.5))
      sign = (rasi + idx * 3) % 12
      frac = (deg - idx * 7.5) / 7.5
      break
    }

    case 'D7': {
      // Saptamsha: 7 divisions of 4°17'08.57" (Odd: self; Even: 7th)
      const span = 30 / 7
      const idx = Math.min(6, Math.floor(deg / span))
      const start = odd ? rasi : (rasi + 6) % 12
      sign = (start + idx) % 12
      frac = (deg - idx * span) / span
      break
    }

    case 'D9': {
      // Navamsha: 9 divisions of 3°20' (cyclic rasi * 9 + pada)
      const span = 30 / 9
      const idx = Math.min(8, Math.floor(deg / span))
      sign = (rasi * 9 + idx) % 12
      frac = (deg - idx * span) / span
      break
    }

    case 'D10': {
      // Dashamsha: 10 divisions of 3° (Odd: self; Even: 9th)
      const idx = Math.min(9, Math.floor(deg / 3))
      const start = odd ? rasi : (rasi + 8) % 12
      sign = (start + idx) % 12
      frac = (deg - idx * 3) / 3
      break
    }

    case 'D12': {
      // Dvadashamsha: 12 divisions of 2°30' (starts from self)
      const idx = Math.min(11, Math.floor(deg / 2.5))
      sign = (rasi + idx) % 12
      frac = (deg - idx * 2.5) / 2.5
      break
    }

    case 'D16': {
      // Shodashamsha: 16 divisions of 1°52'30" (Movable: Aries, Fixed: Leo, Dual: Sg)
      const span = 30 / 16
      const idx = Math.min(15, Math.floor(deg / span))
      sign = (modality * 4 + idx) % 12
      frac = (deg - idx * span) / span
      break
    }

    case 'D20': {
      // Vimshamsha: 20 divisions of 1°30' (Movable: Aries, Fixed: Sg, Dual: Leo)
      const idx = Math.min(19, Math.floor(deg / 1.5))
      const start = [0, 8, 4][modality]
      sign = (start + idx) % 12
      frac = (deg - idx * 1.5) / 1.5
      break
    }

    case 'D24': {
      // Chaturvimshamsha: 24 divisions of 1°15' (Odd: Leo; Even: Cancer)
      const idx = Math.min(23, Math.floor(deg / 1.25))
      const start = odd ? 4 : 3
      sign = (start + idx) % 12
      frac = (deg - idx * 1.25) / 1.25
      break
    }

    case 'D27': {
      // Saptavimshamsha / Bhamsha: 27 divisions of 1°06'40" (by Element)
      const span = 30 / 27
      const idx = Math.min(26, Math.floor(deg / span))
      const element = rasi % 4 // Fire, Earth, Air, Water
      sign = (element * 3 + idx) % 12
      frac = (deg - idx * span) / span
      break
    }

    case 'D30': {
      // Trimshamsha: 5 unequal divisions
      const table = odd
        ? [[5, 0], [10, 10], [18, 8], [25, 2], [30, 6]]
        : [[5, 1], [12, 5], [20, 11], [25, 9], [30, 7]]
      let lower = 0
      for (const [upper, s] of table) {
        if (deg < upper) {
          sign = s
          frac = (deg - lower) / (upper - lower)
          break
        }
        lower = upper
      }
      break
    }

    case 'D40': {
      // Khavedamsha: 40 divisions of 0°45' (Odd: Aries; Even: Libra)
      const idx = Math.min(39, Math.floor(deg / 0.75))
      const start = odd ? 0 : 6
      sign = (start + idx) % 12
      frac = (deg - idx * 0.75) / 0.75
      break
    }

    case 'D45': {
      // Akshavedamsha: 45 divisions of 0°40' (Movable: Ar, Fixed: Le, Dual: Sg)
      const span = 30 / 45
      const idx = Math.min(44, Math.floor(deg / span))
      sign = (modality * 4 + idx) % 12
      frac = (deg - idx * span) / span
      break
    }

    case 'D60': {
      // Shashtiamsha: 60 divisions of 0°30' (starts from self)
      const idx = Math.min(59, Math.floor(deg / 0.5))
      sign = (rasi + Math.floor(deg * 2.0)) % 12
      frac = (deg - idx * 0.5) / 0.5
      break
    }

    default:
      sign = rasi
      frac = deg / 30
      break
  }

  const clampedFrac = Math.min(Math.max(frac, 0), 0.999999)
  const degInSign = clampedFrac * 30
  const projLon = sign * 30 + degInSign

  return {
    signIndex: sign % 12,
    signName: SIGN_NAMES[sign % 12],
    longitude: projLon,
    degreeInSign: degInSign,
    dms: formatDms(degInSign),
  }
}

/**
 * Derives D9 Navamsha sign index from sign and degree in sign
 */
function calculateNavamshaSign(signIndex, degreeInSign) {
  const deg = degreeInSign || 0
  const pos = calculateVargaPosition('D9', signIndex * 30 + deg)
  return pos.signIndex
}

const VARGA_METADATA_LIST = [
  { code: 'D1', name: 'Rashi', div: 1, purpose: 'Core life, physical body, general vitality, baseline existence' },
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

/**
 * Builds all 16 classical Parashari varga charts with enriched graha properties,
 * accurate lagna degrees, dignities, dispositors, and Vargottama detection
 */
function buildShodasavargaCharts(shodasavargaRaw, lagnaSignIndex, planets, lagnaDms = '0°00\'00"', lagnaLongitude = null) {
  const vargas = {}

  // Determine root natal lagna longitude (0..360)
  let rootLagnaLon = lagnaLongitude
  if (rootLagnaLon == null) {
    const rawD1LagnaLon = shodasavargaRaw?.D1?.lagna?.longitude ?? shodasavargaRaw?.charts?.D1?.lagna?.longitude
    if (rawD1LagnaLon != null) {
      rootLagnaLon = rawD1LagnaLon
    } else {
      // Parse lagnaDms or default to mid-sign
      rootLagnaLon = lagnaSignIndex * 30 + 15
    }
  }

  const rootLagnaDegInSign = rootLagnaLon % 30
  const effectiveD1LagnaDms = (lagnaDms && lagnaDms !== '0°00\'00"') ? lagnaDms : formatDms(rootLagnaDegInSign)

  // 1. D1 Rashi Chart
  vargas['D1'] = {
    code: 'D1',
    name: 'Rashi',
    divisions: 1,
    purpose: 'Core life, physical body, general vitality, baseline existence',
    lagnaSignIndex,
    lagnaSignName: SIGN_NAMES[lagnaSignIndex],
    lagnaLongitude: rootLagnaLon,
    lagnaDegreeInSign: rootLagnaDegInSign,
    lagnaDms: effectiveD1LagnaDms,
    grahas: planets.map((p) => {
      const d1SignIdx = p.signIndex
      let dignity = 'Neutral'
      if (EXALTATION_SIGNS[p.name] === d1SignIdx) dignity = 'Exalted'
      else if (DEBILITATION_SIGNS[p.name] === d1SignIdx) dignity = 'Debilitated'
      else if (OWN_SIGNS[p.name]?.includes(d1SignIdx)) dignity = 'Own Sign'

      const degInSign = p.degreeInSign ?? (p.longitude != null ? p.longitude % 30 : 0)

      return {
        id: p.id,
        name: p.name,
        short: p.short,
        signIndex: d1SignIdx,
        signName: p.sign,
        houseNumber: p.houseNumber,
        retrograde: Boolean(p.retrograde),
        longitude: p.longitude,
        degreeInSign: degInSign,
        dms: p.dms || formatDms(degInSign),
        dignity,
        dispositor: SIGN_LORDS[p.sign] || '—',
        isVargottama: true,
      }
    }),
  }

  // 2. Build D2 through D60
  for (const meta of VARGA_METADATA_LIST) {
    if (meta.code === 'D1') continue

    const rawVarga = shodasavargaRaw ? (shodasavargaRaw.charts?.[meta.code] || shodasavargaRaw[meta.code]) : null

    let vLagnaIdx = lagnaSignIndex
    let vLagnaLon = null
    let vLagnaDegInSign = 0
    let vLagnaDms = '0°00\'00"'
    let vGrahas = []

    if (rawVarga && rawVarga.lagna) {
      vLagnaIdx = rawVarga.lagna?.rasi ?? parseSignIndex(rawVarga.lagna?.rasi_name)
      vLagnaLon = rawVarga.lagna?.longitude != null ? rawVarga.lagna.longitude : null
      vLagnaDegInSign = vLagnaLon != null ? (vLagnaLon % 30) : 0
      vLagnaDms = vLagnaLon != null ? formatDms(vLagnaDegInSign) : '0°00\'00"'

      vGrahas = (rawVarga.grahas || []).map((vg) => {
        const vSignIdx = vg.rasi ?? parseSignIndex(vg.rasi_name)
        const vHouse = vg.house || (((vSignIdx - vLagnaIdx + 12) % 12) + 1)
        const pMeta = PLANET_META[vg.name] || { short: vg.name.slice(0, 2) }

        let dignity = 'Neutral'
        if (EXALTATION_SIGNS[vg.name] === vSignIdx) dignity = 'Exalted'
        else if (DEBILITATION_SIGNS[vg.name] === vSignIdx) dignity = 'Debilitated'
        else if (OWN_SIGNS[vg.name]?.includes(vSignIdx)) dignity = 'Own Sign'

        const vSignName = SIGN_NAMES[vSignIdx] || vg.rasi_name
        const dispositor = SIGN_LORDS[vSignName] || '—'

        const d1Planet = planets.find((p) => p.name === vg.name)
        const isVargottama = d1Planet ? d1Planet.signIndex === vSignIdx : false
        const vDegInSign = vg.longitude != null ? (vg.longitude % 30) : 0
        const vDms = vg.dms || formatDms(vDegInSign)

        return {
          id: vg.id,
          name: vg.name,
          short: pMeta.short,
          signIndex: vSignIdx,
          signName: vSignName,
          houseNumber: vHouse,
          retrograde: Boolean(vg.retrograde),
          longitude: vg.longitude != null ? vg.longitude : (vSignIdx * 30 + vDegInSign),
          degreeInSign: vDegInSign,
          dms: vDms,
          dignity,
          dispositor,
          isVargottama,
        }
      })
    } else {
      // High-precision mathematical fallback for Lagna and all grahas
      const lagnaPos = calculateVargaPosition(meta.code, rootLagnaLon)
      vLagnaIdx = lagnaPos.signIndex
      vLagnaLon = lagnaPos.longitude
      vLagnaDegInSign = lagnaPos.degreeInSign
      vLagnaDms = lagnaPos.dms

      vGrahas = planets.map((p) => {
        const pLon = p.longitude != null ? p.longitude : (p.signIndex * 30 + (p.degreeInSign || 0))
        const pos = calculateVargaPosition(meta.code, pLon)
        const vHouse = ((pos.signIndex - vLagnaIdx + 12) % 12) + 1

        let dignity = 'Neutral'
        if (EXALTATION_SIGNS[p.name] === pos.signIndex) dignity = 'Exalted'
        else if (DEBILITATION_SIGNS[p.name] === pos.signIndex) dignity = 'Debilitated'
        else if (OWN_SIGNS[p.name]?.includes(pos.signIndex)) dignity = 'Own Sign'

        const dispositor = SIGN_LORDS[pos.signName] || '—'
        const isVargottama = p.signIndex === pos.signIndex

        return {
          id: p.id,
          name: p.name,
          short: p.short,
          signIndex: pos.signIndex,
          signName: pos.signName,
          houseNumber: vHouse,
          retrograde: Boolean(p.retrograde),
          longitude: pos.longitude,
          degreeInSign: pos.degreeInSign,
          dms: pos.dms,
          dignity,
          dispositor,
          isVargottama,
        }
      })
    }

    vargas[meta.code] = {
      code: meta.code,
      name: meta.name,
      divisions: meta.div,
      purpose: meta.purpose,
      lagnaSignIndex: vLagnaIdx,
      lagnaSignName: SIGN_NAMES[vLagnaIdx],
      lagnaLongitude: vLagnaLon,
      lagnaDegreeInSign: vLagnaDegInSign,
      lagnaDms: vLagnaDms,
      grahas: vGrahas,
    }
  }

  return vargas
}

/**
 * Pre-computes comparative analysis rows for D1 vs ANY target Varga chart (defaulting to D9)
 */
function buildVargaComparison(d1Varga, targetVarga, planets) {
  if (!targetVarga) return []

  const targetCode = targetVarga.code || 'D9'

  return planets.map((p) => {
    const targetPlacement = targetVarga.grahas?.find((g) => g.name === p.name)
    const targetSignIndex = targetPlacement ? targetPlacement.signIndex : p.signIndex
    const targetSign = SIGN_NAMES[targetSignIndex] || 'Unknown'
    const targetHouse = targetPlacement ? targetPlacement.houseNumber : p.houseNumber
    const targetDms = targetPlacement ? targetPlacement.dms : p.dms

    const isVargottama = p.signIndex === targetSignIndex

    let targetDignity = targetPlacement?.dignity || 'Neutral'
    if (!targetPlacement) {
      if (EXALTATION_SIGNS[p.name] === targetSignIndex) targetDignity = 'Exalted'
      else if (DEBILITATION_SIGNS[p.name] === targetSignIndex) targetDignity = 'Debilitated'
      else if (OWN_SIGNS[p.name]?.includes(targetSignIndex)) targetDignity = 'Own Sign'
    }

    let dignityShift = 'Consistent'
    let shiftTone = 'neutral'

    if (p.dignity === 'Debilitated' && (targetDignity === 'Exalted' || targetDignity === 'Own Sign')) {
      dignityShift = `Neecha Bhanga (Harmonic Elevation: Outer struggle transforms into inner mastery in ${targetCode})`
      shiftTone = 'elevated'
    } else if (p.dignity === 'Exalted' && targetDignity === 'Debilitated') {
      dignityShift = `Hollow Exaltation (Promising start but lacks enduring stability in ${targetCode})`
      shiftTone = 'reduced'
    } else if (p.dignity === 'Exalted' && targetDignity === 'Exalted') {
      dignityShift = `Param Vargottama (Supreme exaltation across both charts)`
      shiftTone = 'elevated'
    } else if (isVargottama) {
      dignityShift = `Vargottama Root (Inner and outer nature completely aligned)`
      shiftTone = 'stable'
    } else if (targetDignity === 'Exalted') {
      dignityShift = `Harmonic Elevation (Gains potent strength in ${targetCode})`
      shiftTone = 'elevated'
    } else if (targetDignity === 'Debilitated') {
      dignityShift = `Harmonic Friction (Challenges in manifestation of ${targetCode} themes)`
      shiftTone = 'reduced'
    } else if (targetDignity === 'Own Sign') {
      dignityShift = `Sthira Grounding (Own sign in ${targetCode} confers inherent confidence)`
      shiftTone = 'stable'
    }

    return {
      name: p.name,
      sanskrit: p.sanskritName || p.name,
      symbol: p.symbol || '✦',
      retrograde: Boolean(p.retrograde),
      combust: Boolean(p.combust),
      d1Sign: p.sign,
      d1SignIndex: p.signIndex,
      d1House: p.houseNumber,
      d1Dms: p.dms,
      d1Dignity: p.dignity,
      targetVargaCode: targetCode,
      targetSign,
      targetSignIndex,
      targetHouse,
      targetDms,
      targetDignity,
      // D9 compatibility aliases for existing consumers
      d9Sign: targetSign,
      d9SignIndex: targetSignIndex,
      d9House: targetHouse,
      d9Dignity: targetDignity,
      isVargottama,
      dignityShift,
      shiftTone,
    }
  })
}

module.exports = {
  calculateVargaPosition,
  calculateNavamshaSign,
  buildShodasavargaCharts,
  buildVargaComparison,
  VARGA_METADATA_LIST,
}
