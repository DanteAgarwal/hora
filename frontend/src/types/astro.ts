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
  dms?: string
}

export interface VargaChartData {
  code: string // 'D1', 'D9', etc.
  name: string // 'Rashi', 'Navamsha', etc.
  divisions: number // 1, 9, 10, etc.
  purpose: string
  lagnaSignIndex: number // 0 to 11
  lagnaSignName: string
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

export interface AstroChart {
  id: number
  name: string
  birthData: BirthData
  metadata: ChartMetadata
  quickFacts: QuickFacts
  planets: PlanetPosition[]
  houses: HousePosition[]
  vargas: Record<string, VargaChartData>
  dashaTree: DashaPeriod[]
  runningDasha: string[]
  panchanga?: PanchangaData
  aspects?: any
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
