/**
 * Normalized AstroChart domain model for Kundli Workbench.
 * Decouples the frontend from specific backend astrology calculation engines (PRD §28, §29, §30).
 */

export type ChartStyle = 'north' | 'south'

export interface BirthPlace {
  name: string
  latitude: number
  longitude: number
  altitude?: number
}

export interface BirthData {
  name?: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
  tz_name: string
  utc_offset_hours?: number
  place: BirthPlace
}

export type DignityType =
  | 'Exalted'
  | 'Moolatrikona'
  | 'Own Sign'
  | 'Great Friend'
  | 'Friend'
  | 'Neutral'
  | 'Enemy'
  | 'Great Enemy'
  | 'Debilitated'
  | 'Calculated'

export interface PlanetPosition {
  id: number
  name: string
  sanskritName: string
  symbol: string
  short: string
  sign: string
  signNumber: number // 1 to 12
  signIndex: number // 0 to 11
  degreeInSign: number // 0 to 30 decimal degrees
  dms: string // e.g. "6°50'12\""
  longitude: number // 0 to 360 absolute decimal degrees
  latitude?: number
  speed?: number
  retrograde: boolean
  combust: boolean
  houseNumber: number // 1 to 12
  houseOrdinal: string // e.g. "1st", "11th"
  houseLabels: string[] // e.g. ['kendra', 'trikona', 'upachaya']
  nakshatra: string
  nakshatraNumber: number // 1 to 27
  nakshatraLord: string
  pada: number // 1 to 4
  dignity: DignityType
  lordOfHouses: number[] // e.g. [4, 9]
  dispositor: string
  sunSeparation?: number
  charaKaraka?: string // e.g. "Atmakaraka (AK)"
  charaKarakaCode?: string // "AK", "AmK", "BK", "MK", "PK", "GK", "DK"
  naturalKaraka?: string // e.g. "Soul (Atma), Vitality, Father (Pitri)"
  functionalRole?: string // e.g. "Yogakaraka (4th & 9th Lord)"
  functionalType?: 'Yogakaraka' | 'Lagna Lord' | 'Functional Benefic' | 'Functional Malefic' | 'Maraka' | 'Neutral'
  aspectsCast?: {
    house: number
    houseOrdinal: string
    sign: string
    type: string
    aspectedPlanets: string[]
  }[]
  aspectsReceived?: {
    planet: string
    type: string
  }[]
  temporalRelation?: 'Friend' | 'Enemy'
  compoundRelation?: string
  digbalaScore?: number
  digbalaPeakHouse?: number
  digbalaStatus?: string
  combustionDegrees?: number
  combustionStatus?: string
  isNeechaBhanga?: boolean
  neechaBhangaReason?: string
  isBaadhaka?: boolean
  baadhakaReason?: string
  isMaraka?: boolean
  marakaKind?: string
  marakaReasons?: string[]
  functionalNature?: string
  isYogakaraka?: boolean
  functionalWhy?: string
  bavPoints?: number
  bavGrade?: 'favorable' | 'neutral' | 'unfavorable'
  vakri?: VakriPlanetAnalysis | null
}

export interface HousePosition {
  number: number // 1 to 12
  name: string // e.g. "1st House (Lagna)"
  sanskritName?: string // e.g. "Tanu Bhava"
  sign: string // e.g. "Leo"
  signNumber: number // 1 to 12
  signIndex: number // 0 to 11
  lord: string // e.g. "Sun"
  lordHouseNumber?: number
  lordHouseOrdinal?: string
  lordSign?: string
  lordDignity?: DignityType
  lordPlacementInsight?: string
  naturalKaraka?: string
  occupants: string[] // Planet names
  aspectsReceived: {
    planet: string
    type: string
  }[]
  bhavatBhavam?: string
  significations?: string[]
  purushartha?: 'Dharma' | 'Artha' | 'Kama' | 'Moksha'
  classificationTags?: string[]
  startLongitude?: number
  cuspLongitude?: number
  endLongitude?: number
  categories: string[] // ['kendra', 'dharma', 'tanu bhava']
  arudhaPada?: string
  arudhaPadaName?: string
  arudhasHere?: string[]
  isBaadhakaSthana?: boolean
  isMarakaHouse?: boolean
  savPoints?: number
  savGrade?: 'strong' | 'average' | 'weak'
  argalas?: any
}

export interface VargaGrahaPlacement {
  id: number
  name: string
  short: string
  signIndex: number // 0 to 11
  signName: string
  houseNumber: number // 1 to 12
  retrograde: boolean
  longitude?: number
  degreeInSign?: number
  dms?: string
  dignity?: DignityType
  dispositor?: string
  isVargottama?: boolean
}

export interface VargaChartData {
  code: string // 'D1', 'D9', etc.
  name: string // 'Rashi', 'Navamsha', etc.
  divisions: number // 1, 9, 10, etc.
  purpose: string
  lagnaSignIndex: number // 0 to 11
  lagnaSignName: string
  lagnaLongitude?: number
  lagnaDegreeInSign?: number
  lagnaDms?: string
  grahas: VargaGrahaPlacement[]
}

export interface DashaPeriod {
  lord: string
  level: number // 1 = Mahadasha, 2 = Antardasha, 3 = Pratyantardasha, 4 = Sookshma, 5 = Prana, 6 = Deha (Sub-Sookshma)
  start: string // ISO string or human formatted
  end: string
  startJd?: number
  endJd?: number
  durationDays?: number
  children?: DashaPeriod[]
}

export interface PanchangaData {
  tithi?: { name: string; endsLocal?: string }
  nakshatra?: { name: string; endsLocal?: string }
  yoga?: { name: string; endsLocal?: string }
  karana?: { name: string; endsLocal?: string }
  vaara?: string
  sunrise?: string
  sunset?: string
}

export interface ChartMetadata {
  dateFormatted: string
  timeFormatted: string
  location: string
  latitude: string
  longitude: string
  timezone: string
  ayanamsaName: string
  ayanamsaDms: string
  calculationSettings: string
  source: string
}

export interface QuickFacts {
  lagna: string
  lagnaDms: string
  moonSign: string
  moonDms: string
  sunSign: string
  moonNakshatra: string
  moonPada: number
  currentMahadasha: string
  currentAntardasha: string
  currentPratyantardasha?: string
}

export interface PlanetaryYoga {
  key: string
  name: string
  sanskritName?: string
  group: 'Raja' | 'Dhana' | 'Mahapurusha' | 'Chandra' | 'Ravi' | 'Nabhasa' | 'Vipareeta' | 'General' | 'Other'
  definition: string
  effects?: string
  present: boolean
  strength?: 'High' | 'Medium' | 'Low' | 'Killed by Kemadruma'
  participants: string[]
  housesInvolved?: number[]
  reason?: string
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

export interface AspectDetail {
  houseDistance: number
  virupas: number // 0 - 60
  strengthLabel: string
  isSpecial: boolean
  isFull: boolean
  casterType: 'benefic' | 'malefic'
  casterFunctional?: string
  description: string
}

export interface AspectsMatrixData {
  bhavaAspects: Record<string, Record<number, AspectDetail | null>>
  mutualAspects: Record<string, Record<string, {
    aToB: AspectDetail | null
    bToA: AspectDetail | null
    isMutual: boolean
    isConjunction: boolean
  } | null>>
}

export interface PlanetDignityData {
  planet: PlanetPosition
  name: string
  dignity: DignityType
  isExalted: boolean
  isMoolatrikona: boolean
  isOwnSign: boolean
  isDebilitated: boolean
  isNeechaBhanga: boolean
  neechaBhangaReason?: string
  isRetrograde: boolean
  isCombust: boolean
  combustionDegrees?: number
  combustionStatus: 'Deeply Combust' | 'Combust' | 'Mildly Combust' | 'Safe' | 'Exempt'
  digbalaScore: number // 0 to 100%
  digbalaPeakHouse: number
  digbalaStatus: 'Full Digbala' | 'High Digbala' | 'Moderate' | 'Zero Digbala'
  dispositor: string
  dispositorPlanet?: PlanetPosition | null
}

export interface PurusharthaGroup {
  name: 'Dharma' | 'Artha' | 'Kama' | 'Moksha'
  sanskrit: string
  houses: number[]
  theme: string
  color: string
  bgGradient: string
  planets: PlanetPosition[]
  percentage: number
  count?: number
}

export interface StanzaGroup {
  name: string
  sanskrit: string
  houses: number[]
  description: string
  planets: PlanetPosition[]
  count: number
}

export interface PurusharthaBalanceData {
  purusharthas: PurusharthaGroup[]
  dominantPurushartha: string
  dominantTheme: string
  stanzas: StanzaGroup[]
}

export interface PlanetComparisonRow {
  name: string
  sanskrit: string
  symbol: string
  retrograde: boolean
  combust: boolean
  d1Sign: string
  d1SignIndex: number
  d1House: number
  d1Dms: string
  d1Dignity: DignityType
  targetVargaCode?: string
  targetSign?: string
  targetSignIndex?: number
  targetHouse?: number
  targetDms?: string
  targetDignity?: DignityType
  d9Sign: string
  d9SignIndex: number
  d9House: number
  d9Dignity: DignityType
  isVargottama: boolean
  dignityShift: string
  shiftTone: 'elevated' | 'reduced' | 'stable' | 'neutral'
}

export interface AstroChart {
  id: number
  name: string
  birthData: BirthData
  metadata: ChartMetadata
  quickFacts: QuickFacts
  planets: PlanetPosition[]
  houses: HousePosition[]
  vargas: Record<string, VargaChartData>
  vargaComparison?: PlanetComparisonRow[]
  dashaTree: DashaPeriod[]
  dashas?: DashaPeriod[]
  runningDasha: string[]
  activeDashaChain?: any[]
  sambhandhaMatrix?: Record<string, Record<string, SambhandhaResult | null>>
  aspectsMatrix?: AspectsMatrixData
  dignityOverview?: PlanetDignityData[]
  purusharthaBalance?: PurusharthaBalanceData
  arudhas?: any
  baadhakas?: any
  marakas?: any
  ashtakavarga?: any
  argalas?: any
  functional?: any
  panchanga?: PanchangaData
  aspects?: any
  relationships?: any
  yogas?: PlanetaryYoga[]
  allYogasCatalog?: PlanetaryYoga[]
  vakriAnalysis?: VakriChartAnalysis | null
  raw?: any
}

export interface SignInfo {
  index: number // 0 to 11
  number: number // 1 to 12
  name: string
  sanskrit: string
  symbol: string
  lord: string
  element: 'Fire' | 'Earth' | 'Air' | 'Water'
  modality: 'Chara (Movable)' | 'Sthira (Fixed)' | 'Dwiswabhava (Dual)'
}

export const ZODIAC_SIGNS: SignInfo[] = [
  { index: 0, number: 1, name: 'Aries', sanskrit: 'Mesha', symbol: '♈', lord: 'Mars', element: 'Fire', modality: 'Chara (Movable)' },
  { index: 1, number: 2, name: 'Taurus', sanskrit: 'Vrishabha', symbol: '♉', lord: 'Venus', element: 'Earth', modality: 'Sthira (Fixed)' },
  { index: 2, number: 3, name: 'Gemini', sanskrit: 'Mithuna', symbol: '♊', lord: 'Mercury', element: 'Air', modality: 'Dwiswabhava (Dual)' },
  { index: 3, number: 4, name: 'Cancer', sanskrit: 'Karka', symbol: '♋', lord: 'Moon', element: 'Water', modality: 'Chara (Movable)' },
  { index: 4, number: 5, name: 'Leo', sanskrit: 'Simha', symbol: '♌', lord: 'Sun', element: 'Fire', modality: 'Sthira (Fixed)' },
  { index: 5, number: 6, name: 'Virgo', sanskrit: 'Kanya', symbol: '♍', lord: 'Mercury', element: 'Earth', modality: 'Dwiswabhava (Dual)' },
  { index: 6, number: 7, name: 'Libra', sanskrit: 'Tula', symbol: '♎', lord: 'Venus', element: 'Air', modality: 'Chara (Movable)' },
  { index: 7, number: 8, name: 'Scorpio', sanskrit: 'Vrishchika', symbol: '♏', lord: 'Mars', element: 'Water', modality: 'Sthira (Fixed)' },
  { index: 8, number: 9, name: 'Sagittarius', sanskrit: 'Dhanu', symbol: '♐', lord: 'Jupiter', element: 'Fire', modality: 'Dwiswabhava (Dual)' },
  { index: 9, number: 10, name: 'Capricorn', sanskrit: 'Makara', symbol: '♑', lord: 'Saturn', element: 'Earth', modality: 'Chara (Movable)' },
  { index: 10, number: 11, name: 'Aquarius', sanskrit: 'Kumbha', symbol: '♒', lord: 'Saturn', element: 'Air', modality: 'Sthira (Fixed)' },
  { index: 11, number: 12, name: 'Pisces', sanskrit: 'Meena', symbol: '♓', lord: 'Jupiter', element: 'Water', modality: 'Dwiswabhava (Dual)' },
]

export const PLANET_META: Record<string, { sanskrit: string; symbol: string; short: string }> = {
  Sun: { sanskrit: 'Surya', symbol: '☉', short: 'Su' },
  Moon: { sanskrit: 'Chandra', symbol: '☽', short: 'Mo' },
  Mars: { sanskrit: 'Mangala', symbol: '♂', short: 'Ma' },
  Mercury: { sanskrit: 'Budha', symbol: '☿', short: 'Me' },
  Jupiter: { sanskrit: 'Guru', symbol: '♃', short: 'Ju' },
  Venus: { sanskrit: 'Shukra', symbol: '♀', short: 'Ve' },
  Saturn: { sanskrit: 'Shani', symbol: '♄', short: 'Sa' },
  Rahu: { sanskrit: 'Rahu', symbol: '☊', short: 'Ra' },
  Ketu: { sanskrit: 'Ketu', symbol: '☋', short: 'Ke' },
  Lagna: { sanskrit: 'Lagna', symbol: 'Asc', short: 'Asc' },
  Ascendant: { sanskrit: 'Lagna', symbol: 'Asc', short: 'Asc' },
}

export const SIGN_NAMES: string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

export const EXALTATION_SIGNS: Record<string, number> = {
  Sun: 0, // Aries
  Moon: 1, // Taurus
  Mars: 9, // Capricorn
  Mercury: 5, // Virgo
  Jupiter: 3, // Cancer
  Venus: 11, // Pisces
  Saturn: 6, // Libra
  Rahu: 1, // Taurus
  Ketu: 7, // Scorpio
}

export const DEBILITATION_SIGNS: Record<string, number> = {
  Sun: 6, // Libra
  Moon: 7, // Scorpio
  Mars: 3, // Cancer
  Mercury: 11, // Pisces
  Jupiter: 9, // Capricorn
  Venus: 5, // Virgo
  Saturn: 0, // Aries
  Rahu: 7, // Scorpio
  Ketu: 1, // Taurus
}

export const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
  Rahu: [10],
  Ketu: [7],
}



// ---------------------------------------------------------------------------
// Vakri Graha Intelligence Engine Domain Models (Specification v1.0)
// ---------------------------------------------------------------------------

export interface VakriMotion {
  motion: 'retrograde' | 'direct' | 'stationary' | 'not_applicable'
  daily_speed: number
  is_retrograde: boolean
  is_stationary: boolean
  motion_category: string // Vakra, Anuvakra, Vikala, Sama, etc.
  chesta_virupas: number
  tolerance: number
  is_node: boolean
  node_convention?: string | null
}

export interface VakriDignity {
  actual: string // strictly astronomical sign dignity
  is_exalted: boolean
  is_debilitated: boolean
  is_own_sign: boolean
  retrograde_classical_effect?: string | null // e.g. 'exaltation_like_results'
  interpretive_source?: string | null
  explanation?: string | null
}

export interface VakriChestaBala {
  motion_category: string
  traditional_chesta_value: number
  chesta_rupas: number
  source: string
  status: string
  details: string
}

export interface VakriShadbala {
  sthana_bala_virupas: number
  dig_bala_virupas: number
  kala_bala_virupas: number
  chesta_bala_virupas: number
  naisargika_bala_virupas: number
  drik_bala_virupas: number
  total_shadbala_virupas: number
  total_shadbala_rupas: number
  required_shadbala_virupas: number
  required_shadbala_rupas: number
  strength_ratio: number
  strength_status: 'meets_reference_threshold' | 'below_reference_threshold'
  reference_standard: string
  units: string
}

export interface VakriHouseAnalysis {
  occupied_house: number
  owned_houses: number[]
  lordship_classes: string[]
  functional_nature: string
  dispositor: string
  dispositor_sign: string
  dispositor_house: number
  dispositor_dignity: string
  functional_explanation: string
  house_offset_influence?: {
    planet: string
    offset_count: number
    target_house: number
    source: string
    confidence: string
    description: string
  } | null
}

export interface VakriVargaAnalysis {
  D1_sign: string
  D1_dignity: string
  D1_house: number
  D9_sign: string
  D9_dignity: string
  D9_house: number
  D10_sign: string
  D10_dignity: string
  D10_house: number
  is_vargottama: boolean
  natal_retrograde_accompanies_varga: boolean
  varga_interpretation: string
}

export interface VakriDashaAnalysis {
  is_active_mahadasha: boolean
  is_active_antardasha: boolean
  active_dasha_level?: number | null
  classical_dasha_effect: string
  source_reference: string
  edition_specific_reversal_caveat?: string | null
}

export interface VakriClassicalRule {
  rule_id: string
  rule_name: string
  category: string
  text_title: string
  chapter_verse: string
  sanskrit: string
  iast: string
  translation: string
  effect: string
  confidence: 'A' | 'B' | 'C' | 'D' | 'U'
  witness: string
}

export interface VakriConflict {
  conflict_id: string
  topic: string
  explanation: string
  resolution: string
  diverging_rules: {
    source: string
    interpretation: string
    status: string
  }[]
}

export interface VakriInterpretation {
  summary: string
  astronomical_factor: string
  motional_strength_factor: string
  dignity_factor: string
  house_lordship_factor: string
  functional_impact_factor: string
  timing_factor: string
  certainty: string
}

export interface VakriSource {
  text: string
  author: string
  chapter: string
  verse: string
  witness: string
  confidence: string
}

export interface VakriPlanetAnalysis {
  status?: string
  planet: string
  retrograde: boolean
  is_stationary: boolean
  is_node: boolean
  motion: VakriMotion
  dignity: VakriDignity
  chesta_bala?: VakriChestaBala | null
  shadbala?: VakriShadbala | null
  house_analysis: VakriHouseAnalysis
  aspects_conjunctions: {
    conjunctions: string[]
    benefic_aspects_received: any[]
    malefic_aspects_received: any[]
    special_aspects_cast: any[]
    is_combust: boolean
    combustion_orb: number
    angular_separation_from_sun: number
    planetary_war?: any | null
  }
  varga_analysis: VakriVargaAnalysis
  dasha_analysis: VakriDashaAnalysis
  classical_rules: VakriClassicalRule[]
  textual_conflicts: VakriConflict[]
  interpretation: VakriInterpretation
  sources: VakriSource[]
}

export interface VakriChartAnalysis {
  status?: string
  chart_id?: string | null
  calculation_settings: Record<string, any>
  analysis_settings: Record<string, any>
  retrograde_count: number
  retrograde_planets: string[]
  planets: Record<string, VakriPlanetAnalysis>
  chart_level_synthesis: string
}
