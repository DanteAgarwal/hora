/**
 * Vimshottari Dasha, Timing Calculations & Sambhandha Service
 * Kundli Workbench Server Core
 */

const {
  VIMSHOTTARI_CYCLE,
  NATURAL_FRIENDSHIP,
  LEVEL_METADATA,
  getOrdinal,
} = require('./astroConstants')

function parseDateMsServer(dateInput) {
  if (!dateInput) return NaN
  if (typeof dateInput === 'number') return dateInput
  if (dateInput instanceof Date) return dateInput.getTime()
  const str = String(dateInput).trim()
  if (!str) return NaN
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    return new Date(str).getTime()
  }
  const iso = str.replace(' ', 'T') + (str.length > 10 ? 'Z' : 'T00:00:00Z')
  const parsed = new Date(iso).getTime()
  return isNaN(parsed) ? new Date(str).getTime() : parsed
}

/**
 * Normalizes dasha periods recursively
 */
function normalizeDashaTreeNode(p, level = 1) {
  if (!p) return null
  const lordName =
    p.lord_name ||
    (typeof p.lord === 'string' ? p.lord : (typeof p.lord === 'number' && VIMSHOTTARI_CYCLE[p.lord] ? VIMSHOTTARI_CYCLE[p.lord].name : undefined)) ||
    p.period ||
    p.name ||
    'Sun'
  const nodeLevel = p.level || level
  const nodeStart = p.start || ''
  const nodeEnd = p.end || ''
  const startMs = parseDateMsServer(nodeStart)
  const endMs = parseDateMsServer(nodeEnd)
  const durationDays = p.duration_days ?? p.durationDays ?? (isNaN(startMs) || isNaN(endMs) ? 0 : Math.round((endMs - startMs) / (24 * 3600 * 1000)))

  return {
    lord: lordName,
    lord_name: lordName,
    period: lordName,
    level: nodeLevel,
    start: nodeStart,
    end: nodeEnd,
    start_jd: p.start_jd,
    end_jd: p.end_jd,
    durationDays,
    duration_days: durationDays,
    children: Array.isArray(p.children)
      ? p.children.map((c) => normalizeDashaTreeNode(c, nodeLevel + 1)).filter(Boolean)
      : [],
  }
}

/**
 * Expands dasha sub-periods down to targetLevel (Level 1..6)
 */
function expandDashaSubPeriodsBackend(parent, targetLevel = (parent?.level || 1) + 1) {
  if (!parent) return []
  const currentLevel = parent.level || 1
  if (targetLevel <= currentLevel) return []

  const parentLordClean = (parent.lord_name || parent.lord || parent.period || '').trim().toLowerCase()
  let parentLordIdx = VIMSHOTTARI_CYCLE.findIndex(
    (v) => v.name.toLowerCase() === parentLordClean
  )
  if (parentLordIdx < 0) parentLordIdx = 0
  const parentYears = VIMSHOTTARI_CYCLE[parentLordIdx].years

  let startMs = parent.start ? parseDateMsServer(parent.start) : NaN
  let endMs = parent.end ? parseDateMsServer(parent.end) : NaN
  if (isNaN(startMs)) {
    startMs = Date.now()
  }
  if (isNaN(endMs) || endMs <= startMs) {
    const fraction = currentLevel === 1 ? parentYears : parentYears / 120
    const durationMs = fraction * 365.25 * 24 * 3600 * 1000
    endMs = startMs + durationMs
  }

  const spanMs = endMs - startMs
  const nextLevel = currentLevel + 1
  const children = []
  let cursor = startMs

  for (let k = 0; k < 9; k++) {
    const subIdx = (parentLordIdx + k) % 9
    const subMeta = VIMSHOTTARI_CYCLE[subIdx]
    const subFraction = subMeta.years / 120
    const subSpanMs = spanMs * subFraction
    const subStart = new Date(cursor)
    const subEnd = new Date(cursor + subSpanMs)

    const childNode = {
      lord: subMeta.name,
      lord_name: subMeta.name,
      period: subMeta.name,
      level: nextLevel,
      start: subStart.toISOString(),
      end: subEnd.toISOString(),
      startMs: subStart.getTime(),
      endMs: subEnd.getTime(),
      durationDays: subSpanMs / (24 * 3600 * 1000),
      duration_days: subSpanMs / (24 * 3600 * 1000),
      children: [],
    }

    if (nextLevel < targetLevel) {
      childNode.children = expandDashaSubPeriodsBackend(childNode, targetLevel)
    }

    children.push(childNode)
    cursor += subSpanMs
  }

  return children
}

/**
 * Computes active 6-level running dasha chain (MD, AD, PD, SD, PrD, DD) enriched with Vakri intelligence
 */
function computeActiveDashaChainBackend(dashas, targetDate = new Date(), planets = []) {
  const targetMs = typeof targetDate === 'number' ? targetDate : parseDateMsServer(targetDate)
  const chain = []
  if (!Array.isArray(dashas) || dashas.length === 0) return chain

  const enrichItem = (item) => {
    if (!item || !item.lord) return item
    const p = (planets || []).find((pl) => pl.name && pl.name.toLowerCase() === String(item.lord).toLowerCase())
    if (p) {
      item.isRetrograde = Boolean(p.retrograde)
      item.dignity = p.dignity
      item.chestaBalaVirupas = p.vakri?.chesta_bala?.traditional_chesta_value ?? (p.retrograde ? 60.0 : 30.0)
      item.retrogradeEffect = p.vakri?.dignity?.retrograde_classical_effect || null
      if (p.retrograde) {
        item.classicalDashaNote = 'Phaladeepika 20.14: During its Dasha, this retrograde planet stimulates heightened enterprise, prominent capacity, or concentrated karmic labor.'
      }
    }
    return item
  }

  // 1. Mahadasha
  const md = dashas.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || dashas[0]
  if (!md) return chain

  chain.push(enrichItem({ level: 1, levelLabel: 'MD', lord: md.lord || md.period, period: md }))

  // 2. Antardasha (AD)
  const adList = (md.children && md.children.length > 0) ? md.children : expandDashaSubPeriodsBackend(md, 2)
  const ad = adList.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || adList[0]
  if (!ad) return chain

  chain.push(enrichItem({ level: 2, levelLabel: 'AD', lord: ad.lord, period: ad }))

  // 3. Pratyantardasha (PD)
  const pdList = (ad.children && ad.children.length > 0) ? ad.children : expandDashaSubPeriodsBackend(ad, 3)
  const pd = pdList.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || pdList[0]
  if (!pd) return chain

  chain.push(enrichItem({ level: 3, levelLabel: 'PD', lord: pd.lord, period: pd }))

  // 4. Sookshma (SD)
  const sdList = (pd.children && pd.children.length > 0) ? pd.children : expandDashaSubPeriodsBackend(pd, 4)
  const sd = sdList.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || sdList[0]
  if (!sd) return chain

  chain.push(enrichItem({ level: 4, levelLabel: 'SD', lord: sd.lord, period: sd }))

  // 5. Prana (PrD)
  const prdList = (sd.children && sd.children.length > 0) ? sd.children : expandDashaSubPeriodsBackend(sd, 5)
  const prd = prdList.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || prdList[0]
  if (!prd) return chain

  chain.push(enrichItem({ level: 5, levelLabel: 'PrD', lord: prd.lord, period: prd }))

  // 6. Deha (DD)
  const ddList = (prd.children && prd.children.length > 0) ? prd.children : expandDashaSubPeriodsBackend(prd, 6)
  const dd = ddList.find((d) => {
    const s = parseDateMsServer(d.start)
    const e = parseDateMsServer(d.end)
    return targetMs >= s && targetMs <= e
  }) || ddList[0]
  if (dd) {
    chain.push(enrichItem({ level: 6, levelLabel: 'DD', lord: dd.lord, period: dd }))
  }

  return chain
}

/**
 * Checks if a period is in Dasha Sandhi (transitional twilight phase)
 */
function checkDashaSandhiBackend(period, targetDate = new Date()) {
  if (!period) return { isSandhi: false, remainingDays: 0, remainingFormatted: '—', message: '' }
  const targetMs = typeof targetDate === 'number' ? targetDate : parseDateMsServer(targetDate)
  const startMs = parseDateMsServer(period.start)
  const endMs = parseDateMsServer(period.end)
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return { isSandhi: false, remainingDays: 0, remainingFormatted: '—', message: '' }
  }

  const totalMs = endMs - startMs
  const remainingMs = Math.max(0, endMs - targetMs)
  const remainingDays = Math.round(remainingMs / (24 * 3600 * 1000))
  const remainingFraction = remainingMs / totalMs

  let remainingFormatted = `${remainingDays}d`
  if (remainingDays >= 365) {
    remainingFormatted = `${(remainingDays / 365.25).toFixed(1)} yrs`
  } else if (remainingDays >= 30) {
    remainingFormatted = `${(remainingDays / 30.4375).toFixed(1)} mos`
  }

  const isSandhi = (remainingFraction <= 0.10 && remainingDays <= 180) || (period.level === 1 && remainingDays <= 180 && remainingDays > 0)

  let message = ''
  if (isSandhi) {
    const lvlName = LEVEL_METADATA[period.level]?.name || 'Period'
    message = `Dasha Sandhi Alert: ${period.lord} ${lvlName} concluding in ${remainingFormatted}. Significant karmic shifts and transitions underway.`
  }

  return { isSandhi, remainingDays, remainingFormatted, message }
}

/**
 * Extracts all houses activated (occupied and ruled) by a set of planetary lords
 */
function getActivatedHousesBackend(lords, planets) {
  const houseSet = new Set()
  const details = []

  const cleanLords = (lords || []).map((l) => String(l).trim().toLowerCase())

  cleanLords.forEach((lordName) => {
    const p = (planets || []).find((pl) => pl.name.toLowerCase() === lordName)
    if (!p) return
    if (p.houseNumber) houseSet.add(p.houseNumber)
    if (Array.isArray(p.lordOfHouses)) {
      p.lordOfHouses.forEach((h) => houseSet.add(h))
    }
    details.push({
      lord: p.name,
      occupiedHouse: p.houseNumber || 1,
      ruledHouses: p.lordOfHouses || [],
      isRetrograde: Boolean(p.retrograde),
      chestaBalaVirupas: p.vakri?.chesta_bala?.traditional_chesta_value ?? (p.retrograde ? 60.0 : 30.0),
    })
  })

  return {
    houseNumbers: Array.from(houseSet).sort((a, b) => a - b),
    details,
  }
}

/**
 * Classical Vedic Sambhandha & 5-fold Maitri calculation
 */
function calculateSambhandhaBackend(lordA, lordB, chart) {
  if (!lordA || !lordB || !chart) return null
  const cleanA = String(lordA).trim().toLowerCase()
  const cleanB = String(lordB).trim().toLowerCase()

  const planets = chart.planets || []
  const pA = planets.find((p) => p.name.toLowerCase() === cleanA)
  const pB = planets.find((p) => p.name.toLowerCase() === cleanB)

  if (!pA || !pB) return null

  const houseA = pA.houseNumber || pA.house || 1
  const houseB = pB.houseNumber || pB.house || 1

  const distFromAtoB = ((houseB - houseA + 12) % 12) + 1
  const distFromBtoA = ((houseA - houseB + 12) % 12) + 1

  let axisLabel = `${distFromAtoB}/${distFromBtoA}`
  let category = 'Dynamic Action'
  let synthesis = ''
  let bphsGuidance = ''

  if (distFromAtoB === 1) {
    axisLabel = '1/1 (Yuti / Conjunction)'
    category = 'Conjunction'
    synthesis = `Intense energy fusion in the ${getOrdinal(houseA)} House (${pA.sign}). The portfolios of both ${pA.name} and ${pB.name} manifest simultaneously.`
    bphsGuidance = 'Combined results of both planets manifest directly in the occupied bhava. Auspicious if both are natural benefics or functional friends; requires remedies if afflicted.'
  } else if (distFromAtoB === 7) {
    axisLabel = '1/7 (Samasaptaka / Direct Aspect)'
    category = 'Mutual Aspect'
    synthesis = `Direct polar mutual aspect across the ${getOrdinal(houseA)} and ${getOrdinal(houseB)} houses. Creates dynamic awareness, interpersonal developments, and external encounters.`
    bphsGuidance = 'Mutual activation of opposite houses. Promotes public visibility, relationship negotiations, and balancing opposing life polarities.'
  } else if (distFromAtoB === 5 || distFromAtoB === 9) {
    axisLabel = '5/9 (Nava-Panchama / Trikona)'
    category = 'Auspicious'
    synthesis = `Harmonious 5/9 Trikona axis (Lakshmi Sthana). The lords support each other naturally, bestowing divine grace, intelligence, and fortune.`
    bphsGuidance = 'Classical Brihat Parashara Hora Shastra confirms high auspiciousness. Favorable for wealth accrual, spiritual advancement, higher education, and joy from progeny.'
  } else if (distFromAtoB === 3 || distFromAtoB === 11) {
    axisLabel = '3/11 (Trishad-Aya / Upachaya)'
    category = 'Favorable Growth'
    synthesis = `Favorable 3/11 growth axis (Upachaya). Facilitates networking, enterprise, courage, friendship, and steady realization of long-held desires.`
    bphsGuidance = 'Progressive improvement over time. The sub-period rewards strategic initiative, commercial enterprise, and assistance from elder siblings or mentors.'
  } else if (distFromAtoB === 4 || distFromAtoB === 10) {
    axisLabel = '4/10 (Kendra / Quadrant)'
    category = 'Dynamic Action'
    synthesis = `Dynamic 4/10 angular alignment (Vishnu Sthana). Stimulates active public karma, career responsibilities, domestic changes, and worldly standing.`
    bphsGuidance = 'Period of visible work and decisive worldly action. Balanced effort between domestic foundations (4th) and professional leadership (10th) brings elevation.'
  } else if (distFromAtoB === 6 || distFromAtoB === 8) {
    axisLabel = '6/8 (Shadashtaka / Friction)'
    category = 'Challenging Friction'
    synthesis = `Challenging 6/8 Shadashtak axis. Brings sudden transformations, latent vulnerabilities to the surface, and tests stamina through opposition or disputes.`
    bphsGuidance = 'Classical texts advise prudence, health vigilance, and avoiding unnecessary conflicts or speculative gambles. Remedial propitiation strongly recommended.'
  } else if (distFromAtoB === 2 || distFromAtoB === 12) {
    axisLabel = '2/12 (Dwirdwadasa / Expenditure)'
    category = 'Expenditure & Shift'
    synthesis = `2/12 Dwirdwadasa axis. Points toward reallocation of resources, major financial investments, foreign travels, or inward spiritual introspection.`
    bphsGuidance = 'Funds and energy are directed toward expenses, relocations, or charitable/spiritual avenues. Focus on conserving resources and avoiding impulsive outlays.'
  }

  const normA = pA.name in NATURAL_FRIENDSHIP ? pA.name : 'Sun'
  const naturalObj = NATURAL_FRIENDSHIP[normA] || { friends: [], enemies: [], neutrals: [] }
  let natScore = 0
  let naturalMaitri = 'Neutral'
  if (naturalObj.friends.some((f) => f.toLowerCase() === cleanB)) {
    natScore = 1
    naturalMaitri = 'Friend'
  } else if (naturalObj.enemies.some((e) => e.toLowerCase() === cleanB)) {
    natScore = -1
    naturalMaitri = 'Enemy'
  }

  const isTemporalFriend = [2, 3, 4, 10, 11, 12].includes(distFromAtoB)
  const tempScore = isTemporalFriend ? 1 : -1
  const temporalMaitri = isTemporalFriend ? 'Friend' : 'Enemy'

  const totalScore = natScore + tempScore
  let compoundMaitri = 'Sama'
  if (totalScore === 2) compoundMaitri = 'Adhi-Mitra'
  else if (totalScore === 1) compoundMaitri = 'Mitra'
  else if (totalScore === 0) compoundMaitri = 'Sama'
  else if (totalScore === -1) compoundMaitri = 'Shatru'
  else if (totalScore === -2) compoundMaitri = 'Adhi-Shatru'

  if (pA.retrograde || pB.retrograde) {
    if (pA.retrograde && pB.retrograde) {
      synthesis += ` Both ${pA.name} and ${pB.name} are Vakri (Retrograde with 60 Virupas Chesta Bala each), imparting heightened motional intensity and internal karmic deliberation to this period.`
    } else {
      const vLord = pA.retrograde ? pA.name : pB.name
      synthesis += ` ${vLord} is Vakri (Retrograde with 60 Virupas Chesta Bala), bestowing heightened motional drive and unconventional persistence to this mutual interaction.`
    }
  }

  return {
    distFromAtoB,
    distFromBtoA,
    axisLabel,
    category,
    naturalMaitri,
    temporalMaitri,
    compoundMaitri,
    synthesis,
    bphsGuidance,
  }
}

module.exports = {
  parseDateMsServer,
  normalizeDashaTreeNode,
  expandDashaSubPeriodsBackend,
  computeActiveDashaChainBackend,
  checkDashaSandhiBackend,
  getActivatedHousesBackend,
  calculateSambhandhaBackend,
}

