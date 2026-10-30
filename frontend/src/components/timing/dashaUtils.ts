import type { AstroChart, DashaPeriod } from '../../types/astro'

/**
 * @deprecated Client-side dasha mathematical expansion has been removed.
 * Subperiods are calculated strictly on the backend engine via fetchExpandedSubPeriods().
 */
export function expandDashaSubPeriods(parent: DashaPeriod, _targetLevel?: number): DashaPeriod[] {
  return parent?.children || []
}

export interface DashaChainItem {
  level: number
  levelLabel: string
  lord: string
  period?: DashaPeriod
}

export const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b',
  Moon: '#94a3b8',
  Mars: '#ef4444',
  Mercury: '#10b981',
  Jupiter: '#eab308',
  Venus: '#ec4899',
  Saturn: '#6366f1',
  Rahu: '#8b5cf6',
  Ketu: '#a855f7',
}

export const LEVEL_METADATA: Record<number, { name: string; short: string; spanDesc: string; manifestationRole: string }> = {
  1: {
    name: 'Mahadasha',
    short: 'MD',
    spanDesc: 'Major life chapter (6 to 20 years)',
    manifestationRole: 'Determines the baseline life theme, psychological mindset, and karmic background.',
  },
  2: {
    name: 'Antardasha (Bhukti)',
    short: 'AD',
    spanDesc: 'Sub-period (several months to 3 years)',
    manifestationRole: 'Channels the Mahadasha potential toward specific life departments and directed actions.',
  },
  3: {
    name: 'Pratyantardasha',
    short: 'PD',
    spanDesc: 'Sub-sub-period (days to months)',
    manifestationRole: 'Sets the concrete temporal window and environmental catalyst for events.',
  },
  4: {
    name: 'Sookshma Dasha',
    short: 'SD',
    spanDesc: 'Micro-period (hours to several days)',
    manifestationRole: 'Controls subtle psychological shifts, state of mind, and immediate interpersonal encounters.',
  },
  5: {
    name: 'Prana Dasha',
    short: 'PrD',
    spanDesc: 'Breath-level period (1 to 50 hours)',
    manifestationRole: 'Governs vital breath (prana), energy vitality, emotional impulse, and minute-level focus.',
  },
  6: {
    name: 'Deha Dasha (Sub-Sookshma)',
    short: 'DD',
    spanDesc: 'Somatic micro-period (10 to 300 minutes)',
    manifestationRole: 'The physical body (deha) directly receives the sensation and physical manifestation of karma.',
  },
}

// Classical Parashari Naisargika (Natural) Maitri Table
export const NATURAL_FRIENDSHIP: Record<string, { friends: string[]; enemies: string[]; neutrals: string[] }> = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    enemies: ['Venus', 'Saturn'],
    neutrals: ['Mercury'],
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    enemies: [],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    enemies: ['Mercury'],
    neutrals: ['Venus', 'Saturn'],
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    enemies: ['Moon'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    enemies: ['Mercury', 'Venus'],
    neutrals: ['Saturn'],
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    enemies: ['Sun', 'Moon'],
    neutrals: ['Mars', 'Jupiter'],
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
  },
  Rahu: {
    friends: ['Venus', 'Saturn', 'Mercury'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
  },
  Ketu: {
    friends: ['Mars', 'Venus', 'Saturn'],
    enemies: ['Sun', 'Moon'],
    neutrals: ['Mercury', 'Jupiter'],
  },
}

export type CompoundFriendship = 'Adhi-Mitra' | 'Mitra' | 'Sama' | 'Shatru' | 'Adhi-Shatru'

export interface SambhandhaResult {
  distFromAtoB: number // 1 to 12
  distFromBtoA: number // 1 to 12
  axisLabel: string // e.g. '5/9 (Nava-Panchama)', '6/8 (Shadashtaka)'
  category: 'Auspicious' | 'Favorable Growth' | 'Dynamic Action' | 'Challenging Friction' | 'Expenditure & Shift' | 'Conjunction' | 'Mutual Aspect'
  naturalMaitri: 'Friend' | 'Neutral' | 'Enemy'
  temporalMaitri: 'Friend' | 'Enemy'
  compoundMaitri: CompoundFriendship
  synthesis: string
  bphsGuidance: string
}

/**
 * Calculates classical Vedic Sambhandha (relationship & mutual placement)
 * between two Grahas in a birth chart (e.g. Mahadasha Lord & Antardasha Lord).
 */
export function calculateSambhandha(
  lordA: string,
  lordB: string,
  chart: AstroChart
): SambhandhaResult | null {
  if (!lordA || !lordB) return null
  const cleanA = lordA.trim().toLowerCase()
  const cleanB = lordB.trim().toLowerCase()

  const pA = chart.planets.find((p) => p.name.toLowerCase() === cleanA)
  const pB = chart.planets.find((p) => p.name.toLowerCase() === cleanB)

  if (!pA || !pB) return null

  const houseA = pA.houseNumber || 1
  const houseB = pB.houseNumber || 1

  // Distance from A to B: 1-indexed
  const distFromAtoB = ((houseB - houseA + 12) % 12) + 1
  const distFromBtoA = ((houseA - houseB + 12) % 12) + 1

  // Axis determination
  let axisLabel = `${distFromAtoB}/${distFromBtoA}`
  let category: SambhandhaResult['category'] = 'Dynamic Action'
  let synthesis = ''
  let bphsGuidance = ''

  if (distFromAtoB === 1) {
    axisLabel = '1/1 (Yuti / Conjunction)'
    category = 'Conjunction'
    synthesis = `Intense energy fusion in the ${pA.houseOrdinal} House (${pA.sign}). The portfolios of both ${pA.name} and ${pB.name} manifest simultaneously.`
    bphsGuidance = 'Combined results of both planets manifest directly in the occupied bhava. Auspicious if both are natural benefics or functional friends; requires remedies if afflicted.'
  } else if (distFromAtoB === 7) {
    axisLabel = '1/7 (Samasaptaka / Direct Aspect)'
    category = 'Mutual Aspect'
    synthesis = `Direct polar mutual aspect across the ${pA.houseOrdinal} and ${pB.houseOrdinal} houses. Creates dynamic awareness, interpersonal developments, and external encounters.`
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

  // Natural Friendship (Naisargika)
  const normA = pA.name in NATURAL_FRIENDSHIP ? pA.name : 'Sun'
  const naturalObj = NATURAL_FRIENDSHIP[normA] || { friends: [], enemies: [], neutrals: [] }
  let natScore = 0
  let naturalMaitri: SambhandhaResult['naturalMaitri'] = 'Neutral'
  if (naturalObj.friends.some((f) => f.toLowerCase() === cleanB)) {
    natScore = 1
    naturalMaitri = 'Friend'
  } else if (naturalObj.enemies.some((e) => e.toLowerCase() === cleanB)) {
    natScore = -1
    naturalMaitri = 'Enemy'
  }

  // Temporal Friendship (Tatkalika)
  // Planets in 2, 3, 4, 10, 11, 12 from each other are temporal friends (+1); others are enemies (-1)
  const isTemporalFriend = [2, 3, 4, 10, 11, 12].includes(distFromAtoB)
  const tempScore = isTemporalFriend ? 1 : -1
  const temporalMaitri: SambhandhaResult['temporalMaitri'] = isTemporalFriend ? 'Friend' : 'Enemy'

  // Compound 5-Fold Maitri (Panchadha)
  const totalScore = natScore + tempScore
  let compoundMaitri: CompoundFriendship = 'Sama'
  if (totalScore === 2) compoundMaitri = 'Adhi-Mitra'
  else if (totalScore === 1) compoundMaitri = 'Mitra'
  else if (totalScore === 0) compoundMaitri = 'Sama'
  else if (totalScore === -1) compoundMaitri = 'Shatru'
  else if (totalScore === -2) compoundMaitri = 'Adhi-Shatru'

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

/**
 * Finds the running dasha hierarchy chain (MD, AD, PD, SD, PrD, DD) for a given timestamp.
 * Prefers the 6-level active running chain computed directly by the backend engine.
 */
export function findRunningDashaHierarchy(
  dashaTree: DashaPeriod[],
  targetMs: number = Date.now(),
  activeChainFromBackend?: DashaChainItem[]
): {
  md: DashaPeriod | null
  ad: DashaPeriod | null
  pd: DashaPeriod | null
  sd: DashaPeriod | null
  prd: DashaPeriod | null
  dd: DashaPeriod | null
  chain: DashaChainItem[]
} {
  if (activeChainFromBackend && Array.isArray(activeChainFromBackend) && activeChainFromBackend.length > 0) {
    const mdItem = activeChainFromBackend.find((c) => c.level === 1)
    const adItem = activeChainFromBackend.find((c) => c.level === 2)
    const pdItem = activeChainFromBackend.find((c) => c.level === 3)
    const sdItem = activeChainFromBackend.find((c) => c.level === 4)
    const prdItem = activeChainFromBackend.find((c) => c.level === 5)
    const ddItem = activeChainFromBackend.find((c) => c.level === 6)
    return {
      md: mdItem?.period || null,
      ad: adItem?.period || null,
      pd: pdItem?.period || null,
      sd: sdItem?.period || null,
      prd: prdItem?.period || null,
      dd: ddItem?.period || null,
      chain: activeChainFromBackend,
    }
  }

  const findIn = (list: DashaPeriod[]): DashaPeriod | null => {
    return list.find((p) => {
      const start = new Date(p.start).getTime()
      const end = new Date(p.end).getTime()

      return (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        start <= targetMs &&
        targetMs < end
      )
    }) ?? null
  }

  const md = findIn(dashaTree)
  if (!md) return { md: null, ad: null, pd: null, sd: null, prd: null, dd: null, chain: [] }

  const ad = md.children && md.children.length > 0 ? findIn(md.children) : null
  const pd = ad && ad.children && ad.children.length > 0 ? findIn(ad.children) : null
  const sd = pd && pd.children && pd.children.length > 0 ? findIn(pd.children) : null
  const prd = sd && sd.children && sd.children.length > 0 ? findIn(sd.children) : null
  const dd = prd && prd.children && prd.children.length > 0 ? findIn(prd.children) : null

  const chain: DashaChainItem[] = [
    { level: 1, levelLabel: 'MD', lord: md.lord, period: md },
  ]
  if (ad) chain.push({ level: 2, levelLabel: 'AD', lord: ad.lord, period: ad })
  if (pd) chain.push({ level: 3, levelLabel: 'PD', lord: pd.lord, period: pd })
  if (sd) chain.push({ level: 4, levelLabel: 'SD', lord: sd.lord, period: sd })
  if (prd) chain.push({ level: 5, levelLabel: 'PrD', lord: prd.lord, period: prd })
  if (dd) chain.push({ level: 6, levelLabel: 'DD', lord: dd.lord, period: dd })

  return { md, ad, pd, sd, prd, dd, chain }
}

/**
 * Checks if a period is in "Dasha Sandhi" (the transitional twilight phase).
 * In classical astrology, the final 10% (or last 6 months of a Mahadasha) marks a turbulent shift.
 */
export function checkDashaSandhi(period: DashaPeriod, targetMs: number = Date.now()): {
  isSandhi: boolean
  remainingDays: number
  remainingFormatted: string
  message: string
} {
  const startMs = new Date(period.start).getTime()
  const endMs = new Date(period.end).getTime()
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

  // Dasha Sandhi condition: within last 10% of total duration or <= 180 days for Mahadasha
  const isSandhi = (remainingFraction <= 0.10 && remainingDays <= 180) || (period.level === 1 && remainingDays <= 180 && remainingDays > 0)

  let message = ''
  if (isSandhi) {
    message = `Dasha Sandhi Alert: ${period.lord} ${LEVEL_METADATA[period.level]?.name || 'Period'} concluding in ${remainingFormatted}. Significant karmic shifts and transitions underway.`
  }

  return { isSandhi, remainingDays, remainingFormatted, message }
}

/**
 * Extracts and aggregates all houses activated (occupied and ruled) by a set of planetary lords.
 */
export function getActivatedHouses(lords: string[], chart: AstroChart): {
  houseNumbers: number[]
  details: { lord: string; occupiedHouse: number; ruledHouses: number[] }[]
} {
  const houseSet = new Set<number>()
  const details: { lord: string; occupiedHouse: number; ruledHouses: number[] }[] = []

  lords.forEach((lordName) => {
    const p = chart.planets.find((pl) => pl.name.toLowerCase() === lordName.toLowerCase())
    if (!p) return
    if (p.houseNumber) houseSet.add(p.houseNumber)
    if (p.lordOfHouses) {
      p.lordOfHouses.forEach((h) => houseSet.add(h))
    }
    details.push({
      lord: p.name,
      occupiedHouse: p.houseNumber || 1,
      ruledHouses: p.lordOfHouses || [],
    })
  })

  return {
    houseNumbers: Array.from(houseSet).sort((a, b) => a - b),
    details,
  }
}

export interface MahadashaKarmicProfile {
  totalYears: number
  lifespanPct: number // out of 120 years
  sanskritTitle: string
  archetype: string
  coreTheme: string
  psychologicalShift: string
  keyManifestations: string[]
  growthChallenges: string
  classicalRemedy: string
}

export const MAHADASHA_PROFILES: Record<string, MahadashaKarmicProfile> = {
  Sun: {
    totalYears: 6,
    lifespanPct: 5.0,
    sanskritTitle: 'Surya Mahadasha',
    archetype: 'The Sovereign Soul & Authority',
    coreTheme: 'Awakening of inner light, leadership, self-worth, vital health, father figures, and professional visibility.',
    psychologicalShift: 'Transitions from external dependence into personal sovereignty, self-respect, and creative expression.',
    keyManifestations: [
      'Elevation in administrative status, government connections, or authoritative recognition',
      'Vitality, heart health, and bone strength highlighted in physiology',
      'Father or mentor life events and spiritual self-realization',
    ],
    growthChallenges: 'Ego friction, arrogance, resistance to compromise, and strained subordinate relationships.',
    classicalRemedy: 'Surya Namaskar at sunrise, offering water (Arghya) in copper vessel with Gayatri Mantra.',
  },
  Moon: {
    totalYears: 10,
    lifespanPct: 8.3,
    sanskritTitle: 'Chandra Mahadasha',
    archetype: 'The Cosmic Mind & Nourishment',
    coreTheme: 'Emotional depth, public popularity, domestic peace, maternal bonds, home comfort, and psychological sensitivity.',
    psychologicalShift: 'Deepening receptivity, empathy, intuitive attunement, and need for emotional security and shelter.',
    keyManifestations: [
      'Frequent travels, changes of residence, or public-facing community engagement',
      'Fluctuations in financial liquidity, mental peace, and emotional clarity',
      'Maternal life developments and focus on residential tranquility',
    ],
    growthChallenges: 'Anxiety, mood swings, oversensitivity, and vulnerability to external atmospheric conditions.',
    classicalRemedy: 'Honoring maternal figures, wearing pearl/moonstone after consultation, Shiva worship on Mondays.',
  },
  Mars: {
    totalYears: 7,
    lifespanPct: 5.8,
    sanskritTitle: 'Mangala Mahadasha',
    archetype: 'The Warrior of Action & Enterprise',
    coreTheme: 'Decisive action, physical stamina, engineering/technical endeavors, property acquisition, and competitive drive.',
    psychologicalShift: 'Dynamic urgency to initiate, conquer obstacles, assert boundaries, and lead independent ventures.',
    keyManifestations: [
      'Acquisition of real estate, machinery, athletic training, or military/legal victories',
      'Surge in ambition, entrepreneurship, and physical vitality',
      'Sibling dynamics and pioneering ventures requiring courage',
    ],
    growthChallenges: 'Impulsiveness, temper flare-ups, risk of muscular strain or cuts, and interpersonal conflicts.',
    classicalRemedy: 'Hanuman Chalisa recitation, blood donation, charity to athletes/veterans, keeping sweet cordiality.',
  },
  Rahu: {
    totalYears: 18,
    lifespanPct: 15.0,
    sanskritTitle: 'Rahu Mahadasha',
    archetype: 'The Unconventional Seeker & Global Ambition',
    coreTheme: 'Unprecedented worldly ambition, material leaps, foreign travels, technological innovation, and unconventional boundaries.',
    psychologicalShift: 'Intense desire to experience what is foreign, taboo, innovative, and outside conventional traditional boundaries.',
    keyManifestations: [
      'Sudden quantum leaps in social status, foreign relocations, or unorthodox career paths',
      'Engagement with digital technologies, international networks, or mass media',
      'Breaking familial patterns and discovering unconventional avenues of wealth',
    ],
    growthChallenges: 'Psychological restlessness, illusions, obsessive desires, burnout, and sensory overload.',
    classicalRemedy: 'Maha Mrityunjaya Japa, serving marginalized persons, avoiding intoxicants, maintaining grounding routines.',
  },
  Jupiter: {
    totalYears: 16,
    lifespanPct: 13.3,
    sanskritTitle: 'Guru Mahadasha',
    archetype: 'The Divine Preceptor & Expander of Fortune',
    coreTheme: 'Higher wisdom, ethical expansion, wealth accrual, spiritual guidance, children, and philosophical maturity.',
    psychologicalShift: 'Inner optimism, philosophical clarity, benevolence, faith in universal order, and thirst for truth.',
    keyManifestations: [
      'Arrival of children, joyful family expansion, marriage, or scholarly publications',
      'Advisory, legal, managerial, or spiritual prominence and broad social honor',
      'Spiritual pilgrimages, benevolent philanthropy, and dharmic lifestyle alignment',
    ],
    growthChallenges: 'Complacency, over-optimism, liver/metabolic sluggishness, and dogmatic assumptions.',
    classicalRemedy: 'Respecting teachers and gurus, Dakshinamurthy Stotram, yellow dietary offerings on Thursdays.',
  },
  Saturn: {
    totalYears: 19,
    lifespanPct: 15.8,
    sanskritTitle: 'Shani Mahadasha',
    archetype: 'The Lord of Karma & Enduring Mastery',
    coreTheme: 'Structural reorganization, humble perseverance, enduring discipline, karmic balancing, and lasting legacy.',
    psychologicalShift: 'Sober realism, profound patience, detachment from superficial applause, and respect for natural time.',
    keyManifestations: [
      'Systematic professional building through painstaking effort and persistent labor',
      'Longevity developments, health discipline, joint/dental care, and simplifying life foundations',
      'Removal of illusions leading to unshakable maturity, resilience, and earned leadership',
    ],
    growthChallenges: 'Pessimism, delay-induced fatigue, isolation, and stiffness in bones or joints.',
    classicalRemedy: 'Hanuman Chalisa, serving elderly and underprivileged laborers, lighting mustard oil lamp under Peepal tree on Saturdays.',
  },
  Mercury: {
    totalYears: 17,
    lifespanPct: 14.2,
    sanskritTitle: 'Budha Mahadasha',
    archetype: 'The Cosmic Messenger & Analytical Mind',
    coreTheme: 'Intellectual brilliance, commerce, writing, communications, networking, trade, and youthfulness.',
    psychologicalShift: 'Mental curiosity, agile problem solving, analytical dexterity, and desire to learn and communicate.',
    keyManifestations: [
      'Success in business contracts, digital media, publication, mathematics, or accounting',
      'Expanding professional networks, multilateral agreements, and trade profits',
      'Intellectual education, languages, and rapid communication flows',
    ],
    growthChallenges: 'Nervous system strain, analysis paralysis, superficial restlessness, and information fatigue.',
    classicalRemedy: 'Vishnu Sahasranama chanting, feeding green fodder to cows on Wednesdays, green emerald or peridot.',
  },
  Ketu: {
    totalYears: 7,
    lifespanPct: 5.8,
    sanskritTitle: 'Ketu Mahadasha',
    archetype: 'The Liberator of Moksha & Intuitive Visionary',
    coreTheme: 'Spiritual liberation (Moksha), detachment from material vanity, esoteric intuition, and inward transcendence.',
    psychologicalShift: 'Disillusionment with superficial worldly facades, awakening of deep meditative intuition and spiritual insight.',
    keyManifestations: [
      'Spiritual awakening, interest in astrology, meditation, healing, and occult research',
      'Sudden unexpected turns, stripping away outdated attachments, and inward pilgrimage',
      'Heightened sixth sense, karmic debt settlement, and psychic discernment',
    ],
    growthChallenges: 'Alienation, vague physical symptoms, confusion regarding material goals, and sudden detachment.',
    classicalRemedy: 'Ganesha worship (Atharvashirsha), meditation, caring for stray dogs, spiritual contemplation.',
  },
  Venus: {
    totalYears: 20,
    lifespanPct: 16.7,
    sanskritTitle: 'Shukra Mahadasha',
    archetype: 'The Cosmic Artist & Bestower of Luxuries',
    coreTheme: 'Harmonious relationships, romantic fulfillment, artistic creation, vehicles, luxury, and aesthetic refinement.',
    psychologicalShift: 'Desire for beauty, devotion (Bhakti), sensual comfort, diplomacy, and elegant life harmony.',
    keyManifestations: [
      'Marriage, romantic partnership, artistic breakthrough, luxury acquisitions, and vehicles',
      'Diplomatic success, social charisma, pleasant surroundings, and material prosperity',
      'Cultivation of high culinary, musical, or visual arts and refined self-care',
    ],
    growthChallenges: 'Overindulgence, financial extravagance, boundary issues in romance, and loss of discipline.',
    classicalRemedy: 'Lakshmi Ashtakam, honoring female partners and artists, white floral offerings on Fridays.',
  },
}

export function getMahadashaProfile(lord: string): MahadashaKarmicProfile | null {
  if (!lord) return null
  const clean = lord.trim().toLowerCase()
  const key = Object.keys(MAHADASHA_PROFILES).find(
    (k) => k.toLowerCase() === clean
  )
  return key ? MAHADASHA_PROFILES[key] : null
}

/**
 * Uniquely identifies a DashaPeriod across hierarchies and cycles.
 * Avoids duplicate keys when the same planet lord repeats at different times or levels.
 */
export function getPeriodKey(period: DashaPeriod, index?: number): string {
  const startMs = new Date(period.start).getTime()
  const timeKey = !isNaN(startMs) ? startMs : period.start || index || 0
  const levelKey = period.level || 1
  return `dasha-${levelKey}-${period.lord}-${timeKey}`
}

/**
 * Robustly checks if two DashaPeriod references represent the same astrological period.
 * Uses level, case-insensitive lord matching, and millisecond-accurate timestamps
 * rather than fragile exact-string comparisons.
 */
export function isSamePeriod(
  a: DashaPeriod | null | undefined,
  b: DashaPeriod | null | undefined
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  if ((a.level || 1) !== (b.level || 1)) return false
  if (a.lord.trim().toLowerCase() !== b.lord.trim().toLowerCase()) return false

  const aStart = new Date(a.start).getTime()
  const bStart = new Date(b.start).getTime()
  if (!isNaN(aStart) && !isNaN(bStart)) {
    // Within 2 seconds (covers slight ISO vs UTC rounding discrepancies)
    if (Math.abs(aStart - bStart) < 2000) return true
  }

  if (a.startJd != null && b.startJd != null) {
    if (Math.abs(a.startJd - b.startJd) < 0.001) return true
  }

  return a.start === b.start
}

/**
 * Resolves the full ancestor chain [MD, AD, PD, SD, PrD]
 * for any given DashaPeriod from the root dashaTree.
 */
export function findDashaAncestors(
  dashaTree: DashaPeriod[] | undefined,
  target: DashaPeriod | null | undefined
): DashaPeriod[] {
  if (!dashaTree || !target || (target.level || 1) <= 1) return []

  const targetLevel = target.level || 1
  const tStart = new Date(target.start).getTime()
  const tEnd = new Date(target.end).getTime()
  if (isNaN(tStart) || isNaN(tEnd)) return []

  const ancestors: DashaPeriod[] = []

  // Helper to test if parent interval envelops child (with small millisecond margin)
  const contains = (parent: DashaPeriod): boolean => {
    const pStart = new Date(parent.start).getTime()
    const pEnd = new Date(parent.end).getTime()
    if (isNaN(pStart) || isNaN(pEnd)) return false
    return pStart <= tStart + 2000 && tEnd - 2000 <= pEnd
  }

  // Level 1: Find MD in dashaTree
  const md = dashaTree.find(contains)
  if (!md) return ancestors
  ancestors.push(md)
  if (targetLevel === 2) return ancestors

  // Level 2: Find AD in MD
  const adList = md.children || []
  const ad = adList.find(contains)
  if (!ad) return ancestors
  ancestors.push(ad)
  if (targetLevel === 3) return ancestors

  // Level 3: Find PD in AD
  const pdList = ad.children || []
  const pd = pdList.find(contains)
  if (!pd) return ancestors
  ancestors.push(pd)
  if (targetLevel === 4) return ancestors

  // Level 4: Find SD in PD
  const sdList = pd.children || []
  const sd = sdList.find(contains)
  if (!sd) return ancestors
  ancestors.push(sd)
  if (targetLevel === 5) return ancestors

  // Level 5: Find PrD in SD
  const prdList = sd.children || []
  const prd = prdList.find(contains)
  if (!prd) return ancestors
  ancestors.push(prd)

  return ancestors
}

