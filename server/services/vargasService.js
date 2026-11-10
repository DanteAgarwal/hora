/**
 * Shodasavarga Divisional Charts & Comparison Service
 * Kundli Workbench Server Core
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
 * Derives D9 Navamsha sign index from sign and degree in sign
 * 9 padas of 3°20' (3.333333°) per sign
 */
function calculateNavamshaSign(signIndex, degreeInSign) {
  const deg = degreeInSign || 0
  const pada = Math.min(8, Math.max(0, Math.floor(deg / (30 / 9))))
  const signType = signIndex % 4 // 0: Fire, 1: Earth, 2: Air, 3: Water
  let startSign = 0
  if (signType === 0) startSign = 0 // Aries
  else if (signType === 1) startSign = 9 // Capricorn
  else if (signType === 2) startSign = 6 // Libra
  else if (signType === 3) startSign = 3 // Cancer

  return (startSign + pada) % 12
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
 * Builds all 16 classical Parashari varga charts with enriched graha properties
 */
function buildShodasavargaCharts(shodasavargaRaw, lagnaSignIndex, planets, lagnaDms = '0°00\'00"') {
  const vargas = {}

  // 1. D1 Rashi Chart
  vargas['D1'] = {
    code: 'D1',
    name: 'Rashi',
    divisions: 1,
    purpose: 'Core life, physical body, general vitality, baseline existence',
    lagnaSignIndex,
    lagnaSignName: SIGN_NAMES[lagnaSignIndex],
    lagnaDms,
    grahas: planets.map((p) => {
      const d1SignIdx = p.signIndex
      let dignity = 'Neutral'
      if (EXALTATION_SIGNS[p.name] === d1SignIdx) dignity = 'Exalted'
      else if (DEBILITATION_SIGNS[p.name] === d1SignIdx) dignity = 'Debilitated'
      else if (OWN_SIGNS[p.name]?.includes(d1SignIdx)) dignity = 'Own Sign'

      return {
        id: p.id,
        name: p.name,
        short: p.short,
        signIndex: d1SignIdx,
        signName: p.sign,
        houseNumber: p.houseNumber,
        retrograde: p.retrograde,
        longitude: p.longitude,
        dms: p.dms,
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
    let vGrahas = []

    if (rawVarga) {
      vLagnaIdx = rawVarga.lagna?.rasi ?? parseSignIndex(rawVarga.lagna?.rasi_name)
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
    } else if (meta.code === 'D9') {
      // High-precision Navamsha fallback if backend shodasavarga is missing D9
      const lagnaNavSign = calculateNavamshaSign(lagnaSignIndex, 15) // default mid-sign if no exact lagna deg
      vLagnaIdx = lagnaNavSign
      vGrahas = planets.map((p) => {
        const navSignIdx = calculateNavamshaSign(p.signIndex, p.degreeInSign || 0)
        const vHouse = ((navSignIdx - vLagnaIdx + 12) % 12) + 1

        let dignity = 'Neutral'
        if (EXALTATION_SIGNS[p.name] === navSignIdx) dignity = 'Exalted'
        else if (DEBILITATION_SIGNS[p.name] === navSignIdx) dignity = 'Debilitated'
        else if (OWN_SIGNS[p.name]?.includes(navSignIdx)) dignity = 'Own Sign'

        const vSignName = SIGN_NAMES[navSignIdx]
        const isVargottama = p.signIndex === navSignIdx
        const navDegInSign = ((p.degreeInSign || 0) * 9) % 30

        return {
          id: p.id,
          name: p.name,
          short: p.short,
          signIndex: navSignIdx,
          signName: vSignName,
          houseNumber: vHouse,
          retrograde: p.retrograde,
          longitude: navSignIdx * 30 + navDegInSign,
          degreeInSign: navDegInSign,
          dms: formatDms(navDegInSign),
          dignity,
          dispositor: SIGN_LORDS[vSignName] || '—',
          isVargottama,
        }
      })
    } else {
      // Default fallback
      vGrahas = planets.map((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        signIndex: p.signIndex,
        signName: p.sign,
        houseNumber: p.houseNumber,
        retrograde: p.retrograde,
        dignity: p.dignity || 'Neutral',
        dispositor: p.dispositor || '—',
        isVargottama: false,
      }))
    }

    vargas[meta.code] = {
      code: meta.code,
      name: meta.name,
      divisions: meta.div,
      purpose: meta.purpose,
      lagnaSignIndex: vLagnaIdx,
      lagnaSignName: SIGN_NAMES[vLagnaIdx],
      grahas: vGrahas,
    }
  }

  return vargas
}

/**
 * Pre-computes D1 vs D9 comparative analysis rows for the Varga comparison workspace
 */
function buildVargaComparison(d1Varga, d9Varga, planets) {
  if (!d9Varga) return []

  return planets.map((p) => {
    const d9Placement = d9Varga.grahas.find((g) => g.name === p.name)
    const d9SignIndex = d9Placement ? d9Placement.signIndex : p.signIndex
    const d9Sign = SIGN_NAMES[d9SignIndex] || 'Unknown'
    const d9House = d9Placement ? d9Placement.houseNumber : p.houseNumber

    const isVargottama = p.signIndex === d9SignIndex

    let d9Dignity = 'Neutral'
    if (EXALTATION_SIGNS[p.name] === d9SignIndex) d9Dignity = 'Exalted'
    else if (DEBILITATION_SIGNS[p.name] === d9SignIndex) d9Dignity = 'Debilitated'
    else if (OWN_SIGNS[p.name]?.includes(d9SignIndex)) d9Dignity = 'Own Sign'

    let dignityShift = 'Consistent'
    let shiftTone = 'neutral'

    if (p.dignity === 'Debilitated' && (d9Dignity === 'Exalted' || d9Dignity === 'Own Sign')) {
      dignityShift = 'Neecha Bhanga (Dharmic Elevation: Outer struggle transforms into deep inner wisdom)'
      shiftTone = 'elevated'
    } else if (p.dignity === 'Exalted' && d9Dignity === 'Debilitated') {
      dignityShift = 'Hollow Exaltation (Promising start but lacks enduring spiritual stability)'
      shiftTone = 'reduced'
    } else if (p.dignity === 'Exalted' && d9Dignity === 'Exalted') {
      dignityShift = 'Param Vargottama (Supreme exaltation across body and soul)'
      shiftTone = 'elevated'
    } else if (isVargottama) {
      dignityShift = 'Vargottama Root (Inner and outer nature completely aligned)'
      shiftTone = 'stable'
    } else if (d9Dignity === 'Exalted') {
      dignityShift = 'Inner Elevation (Gains spiritual strength in Navamsha)'
      shiftTone = 'elevated'
    } else if (d9Dignity === 'Debilitated') {
      dignityShift = 'Inner Friction (Challenges in dharmic application)'
      shiftTone = 'reduced'
    } else if (d9Dignity === 'Own Sign') {
      dignityShift = 'Sthira Grounding (Own sign in Navamsha confers inner confidence)'
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
      d9Sign,
      d9SignIndex,
      d9House,
      d9Dignity,
      isVargottama,
      dignityShift,
      shiftTone,
    }
  })
}

module.exports = {
  calculateNavamshaSign,
  buildShodasavargaCharts,
  buildVargaComparison,
}

