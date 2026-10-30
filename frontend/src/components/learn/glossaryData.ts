import type { AstroChart } from '../../types/astro'

export type GlossaryCategory =
  | 'All'
  | 'Planets & Dignity'
  | 'Houses (Bhavas)'
  | 'Nakshatras & Stars'
  | 'Vargas & Divisions'
  | 'Dashas & Timing'
  | 'Aspects & Relations'
  | 'Jaimini & Karakas'
  | 'Yogas'
  | 'Astronomical & Ephemeris'
  | 'Panchanga'

export interface GlossaryTerm {
  id: string
  name: string
  sanskrit: string
  devanagari?: string
  category: GlossaryCategory
  shortDef: string
  whatIsIt: string
  whyUsed: string
  howCalculated: string
  tags: string[]
  // Dynamic resolver for "Your result in this chart"
  resolveChartResult?: (chart: AstroChart) => {
    label: string
    value: string
    details?: string
  }
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // --- PLANETARY DIGNITY & STRENGTH ---
  {
    id: 'digbala',
    name: 'Digbala (Directional Strength)',
    sanskrit: 'Digbala',
    devanagari: 'दिग्बल',
    category: 'Planets & Dignity',
    shortDef: 'Strength gained by a planet when positioned in its ideal compass direction or cardinal house.',
    whatIsIt: 'Digbala is directional strength. Certain planets gain exceptional capacity to act effectively when situated in specific cardinal houses: Jupiter and Mercury in the 1st (East), Sun and Mars in the 10th (South), Saturn in the 7th (West), and Moon and Venus in the 4th (North).',
    whyUsed: 'A planet with high Digbala possesses the clarity and natural power to deliver its agenda smoothly, regardless of its sign dignity.',
    howCalculated: 'Measured in Shashtiamshas (0 to 60 virupas). Maximum Digbala (60 virupas) is achieved when the planet exactly conjoins the cusp of its favored cardinal house; minimum (0 virupas) occurs at the opposite house.',
    tags: ['Shadbala', 'Strength', 'Kendras', 'Direction'],
    resolveChartResult: (chart) => {
      const candidates: string[] = []
      chart.planets.forEach((p) => {
        if ((p.name === 'Jupiter' || p.name === 'Mercury') && p.houseNumber === 1) candidates.push(`${p.name} in H1`)
        if ((p.name === 'Sun' || p.name === 'Mars') && p.houseNumber === 10) candidates.push(`${p.name} in H10`)
        if (p.name === 'Saturn' && p.houseNumber === 7) candidates.push(`${p.name} in H7`)
        if ((p.name === 'Moon' || p.name === 'Venus') && p.houseNumber === 4) candidates.push(`${p.name} in H4`)
      })
      return {
        label: 'Planets with Full Digbala in this chart',
        value: candidates.length > 0 ? candidates.join(', ') : 'None in cardinal peak (Partial Digbala calculated across houses)',
      }
    },
  },
  {
    id: 'uchcha',
    name: 'Uchcha (Exaltation)',
    sanskrit: 'Uchcha',
    devanagari: 'उच्च',
    category: 'Planets & Dignity',
    shortDef: 'The highest state of planetary dignity where a planet expresses its purest, most noble potential.',
    whatIsIt: 'Exaltation is the sign where a planet functions with maximum confidence and authority: Sun in Aries (peak 10°), Moon in Taurus (3°), Mars in Capricorn (28°), Mercury in Virgo (15°), Jupiter in Cancer (5°), Venus in Pisces (27°), and Saturn in Libra (20°).',
    whyUsed: 'Signifies inherent royalty, high caliber, and unobstructed manifestation of natural and functional karakatwas.',
    howCalculated: 'Calculated by measuring the angular distance from the planet\'s exact deep debilitation point (Neecha Parama) up to its deep exaltation point (Uchcha Parama). Maximum dignity = 60 virupas.',
    tags: ['Dignity', 'Exaltation', 'Strength'],
    resolveChartResult: (chart) => {
      const exalted = chart.planets.filter((p) => p.dignity === 'Exalted').map((p) => p.name)
      return {
        label: 'Exalted Planets in this chart',
        value: exalted.length > 0 ? exalted.join(', ') : 'None exalted in D1',
      }
    },
  },
  {
    id: 'neecha',
    name: 'Neecha (Debilitation)',
    sanskrit: 'Neecha',
    devanagari: 'नीच',
    category: 'Planets & Dignity',
    shortDef: 'The sign where a planet feels constrained, troubled, or struggles to express its natural qualities comfortably.',
    whatIsIt: 'Debilitation occurs in the sign exactly 180° opposite exaltation: Sun in Libra, Moon in Scorpio, Mars in Cancer, Mercury in Pisces, Jupiter in Capricorn, Venus in Virgo, and Saturn in Aries.',
    whyUsed: 'Indicates areas of vulnerability, self-doubt, or internal friction that require conscious maturity, unless cancelled by Neecha Bhanga.',
    howCalculated: 'Calculated as the minimum point on the Uccha-Bala arc (0 virupas at exact deep debilitation degree).',
    tags: ['Dignity', 'Debilitation', 'Weakness'],
    resolveChartResult: (chart) => {
      const debilitated = chart.planets.filter((p) => p.dignity === 'Debilitated').map((p) => p.name)
      return {
        label: 'Debilitated Planets in this chart',
        value: debilitated.length > 0 ? debilitated.join(', ') : 'None debilitated in D1',
      }
    },
  },
  {
    id: 'neecha-bhanga',
    name: 'Neecha Bhanga (Cancellation of Debilitation)',
    sanskrit: 'Neecha Bhanga',
    devanagari: 'नीचभङ्ग',
    category: 'Planets & Dignity',
    shortDef: 'Classical conditions that cancel the weakness of a debilitated planet, converting struggle into formidable strength.',
    whatIsIt: 'Neecha Bhanga occurs when the ruler of the debilitation sign, or the planet exalted in that sign, is placed in a Kendra from Lagna or Moon; or when the planet is exalted in Navamsha (D9).',
    whyUsed: 'Produces Neecha Bhanga Raja Yoga — intense perseverance through early adversity leading to lasting mastery and success.',
    howCalculated: 'Evaluated against the 5 primary BPHS criteria checking Kendra occupancy of dispositors from Lagna and Chandra.',
    tags: ['Raja Yoga', 'Dignity', 'Cancellation'],
    resolveChartResult: (chart) => {
      const deb = chart.planets.filter((p) => p.dignity === 'Debilitated')
      if (deb.length === 0) return { label: 'Status', value: 'Not applicable (No debilitated planets)' }
      return {
        label: 'Debilitated Planet Analysis',
        value: deb.map((p) => `${p.name} in ${p.sign}`).join(', '),
      }
    },
  },
  {
    id: 'moolatrikona',
    name: 'Moolatrikona (Root Trine)',
    sanskrit: 'Moolatrikona',
    devanagari: 'मूलत्रिकोण',
    category: 'Planets & Dignity',
    shortDef: 'A planet\'s most functional, purposeful office space inside its primary home sign.',
    whatIsIt: 'Second only to exaltation, Moolatrikona represents where a planet actively executes its cosmic duties: Sun in Leo 0°–20°, Moon in Taurus 3°–30°, Mars in Aries 0°–12°, Mercury in Virgo 15°–20°, Jupiter in Sagittarius 0°–10°, Venus in Libra 0°–15°, and Saturn in Aquarius 0°–20°.',
    whyUsed: 'Provides 45 virupas of Sthana Bala and reliable, sustained positive manifestations.',
    howCalculated: 'Derived by checking if the planet\'s degree within its home sign falls inside the classical Moolatrikona degree range.',
    tags: ['Dignity', 'Strength', 'Sthana Bala'],
    resolveChartResult: (chart) => {
      const mool = chart.planets.filter((p) => p.dignity === 'Moolatrikona').map((p) => `${p.name} (${p.sign})`)
      return {
        label: 'Moolatrikona Planets in this chart',
        value: mool.length > 0 ? mool.join(', ') : 'None in Moolatrikona degree range',
      }
    },
  },
  {
    id: 'swakshetra',
    name: 'Swakshetra (Own Sign)',
    sanskrit: 'Swakshetra',
    devanagari: 'स्वक्षेत्र',
    category: 'Planets & Dignity',
    shortDef: 'A planet placed in its own ruling sign, functioning like a king in his own palace.',
    whatIsIt: 'When a planet occupies the sign it rules outside its Moolatrikona degrees (e.g. Jupiter in Pisces or remaining Sagittarius).',
    whyUsed: 'Provides inherent security, stability, and protection to the houses it rules.',
    howCalculated: 'Determined when `planet.signIndex` matches one of the sign indices owned by `planet.name`.',
    tags: ['Dignity', 'Own Sign', 'Strength'],
    resolveChartResult: (chart) => {
      const own = chart.planets.filter((p) => p.dignity === 'Own Sign').map((p) => `${p.name} in ${p.sign}`)
      return {
        label: 'Own Sign Placements',
        value: own.length > 0 ? own.join(', ') : 'None in own sign outside Moolatrikona',
      }
    },
  },
  {
    id: 'vakri',
    name: 'Vakri (Retrograde Motion)',
    sanskrit: 'Vakri',
    devanagari: 'वक्री',
    category: 'Planets & Dignity',
    shortDef: 'Apparent backward motion of a planet against the background stars as viewed from Earth.',
    whatIsIt: 'Outer planets (Mars, Jupiter, Saturn) retrograde when opposite the Sun; inner planets (Mercury, Venus) retrograde during interior conjunction. Sun and Moon never retrograde; Rahu and Ketu are always retrograde.',
    whyUsed: 'Classical texts confer very high Chesta Bala (motional strength) to retrograde planets, making their effects intense, introspective, and non-linear.',
    howCalculated: 'When apparent daily longitudinal speed is negative ($d\\lambda/dt < 0$).',
    tags: ['Motion', 'Strength', 'Chesta Bala'],
    resolveChartResult: (chart) => {
      const retros = chart.planets.filter((p) => p.retrograde && p.name !== 'Rahu' && p.name !== 'Ketu').map((p) => p.name)
      return {
        label: 'Retrograde [R] Grahas in this chart',
        value: retros.length > 0 ? retros.join(', ') : 'All physical planets moving direct',
      }
    },
  },
  {
    id: 'asta',
    name: 'Asta (Combustion)',
    sanskrit: 'Asta / Moudhya',
    devanagari: 'अस्त',
    category: 'Planets & Dignity',
    shortDef: 'Occurs when a planet draws too close to the blazing disc of the Sun, obscuring its outward rays.',
    whatIsIt: 'A planet within specific angular proximity of the Sun loses its external brilliance (Moon ~12°, Mars ~17°, Mercury ~14°, Jupiter ~11°, Venus ~10°, Saturn ~15°).',
    whyUsed: 'Internalizes the planet\'s significations; the planet burns with the Sun\'s agenda, causing external friction in its worldly affairs.',
    howCalculated: 'Calculated by $|\\lambda_{\\text{Planet}} - \\lambda_{\\text{Sun}}| < \\text{Orb}$.',
    tags: ['Combustion', 'Sun', 'Dignity'],
    resolveChartResult: (chart) => {
      const combust = chart.planets.filter((p) => p.combust).map((p) => `${p.name} (${p.sunSeparation?.toFixed(1) || ''}° from Sun)`)
      return {
        label: 'Combust Planets in this chart',
        value: combust.length > 0 ? combust.join(', ') : 'No planets combust',
      }
    },
  },
  {
    id: 'vargottama',
    name: 'Vargottama',
    sanskrit: 'Vargottama',
    devanagari: 'वर्गोत्तम',
    category: 'Vargas & Divisions',
    shortDef: 'A planet occupying the exact same zodiac sign in both the D1 Rashi chart and the D9 Navamsha chart.',
    whatIsIt: 'One of the most praised dignities in Jyotish. A Vargottama planet has structural alignment between its outer reality (D1) and internal dharmic soul direction (D9).',
    whyUsed: 'Grants resilient strength akin to being in one\'s own sign, fortifying the planet against debility or affliction.',
    howCalculated: 'Occurs when sign index in D1 equals sign index in D9: for Movable signs (pada 1), Fixed signs (pada 5), and Dual signs (pada 9).',
    tags: ['Navamsha', 'Vargas', 'Strength'],
    resolveChartResult: (chart) => {
      const vargottamas: string[] = []
      chart.planets.forEach((p) => {
        const d9Sign = chart.vargas?.['D9']?.grahas?.find((g) => g.name === p.name)?.signName
        if (d9Sign && d9Sign === p.sign) vargottamas.push(`${p.name} in ${p.sign}`)
      })
      return {
        label: 'Vargottama Planets in this chart',
        value: vargottamas.length > 0 ? vargottamas.join(', ') : 'None Vargottama across D1 & D9',
      }
    },
  },
  {
    id: 'shadbala',
    name: 'Shadbala (Six-Fold Strength)',
    sanskrit: 'Shadbala',
    devanagari: 'षड्बल',
    category: 'Planets & Dignity',
    shortDef: 'Comprehensive mathematical assessment of planetary power across six distinct astronomical dimensions.',
    whatIsIt: 'Shadbala combines: Sthana Bala (positional), Digbala (directional), Kala Bala (temporal), Chesta Bala (motional), Naisargika Bala (natural), and Drik Bala (aspectual). Measured in Rupas.',
    whyUsed: 'Reveals whether a planet has the sheer horsepower to fulfill its promises during its Dasha periods.',
    howCalculated: 'Sum of the six constituent balas in virupas divided by 60 to yield Rupas.',
    tags: ['Shadbala', 'Strength', 'Mathematics'],
    resolveChartResult: () => ({
      label: 'Benchmark Parity',
      value: 'Computed per Parashari virupa standards across all 7 non-nodal Grahas',
    }),
  },

  // --- HOUSES (BHAVAS) & CLASSIFICATIONS ---
  {
    id: 'lagna',
    name: 'Lagna (Ascendant / 1st House)',
    sanskrit: 'Tanu Lagna',
    devanagari: 'लग्न',
    category: 'Houses (Bhavas)',
    shortDef: 'The exact zodiac degree rising on the eastern horizon at the precise moment of birth.',
    whatIsIt: 'The fundamental anchor of the entire birth chart. Governs physical body, vitality, character, orientation toward life, and baseline destiny.',
    whyUsed: 'Everything in the horoscope is measured relative to Lagna. It establishes house boundaries and planetary functional roles.',
    howCalculated: 'Intersection of the eastern local horizon with the ecliptic plane for the birth coordinates and time.',
    tags: ['Lagna', 'Ascendant', 'Bhavas', '1st House'],
    resolveChartResult: (chart) => ({
      label: 'Your Ascendant (Lagna)',
      value: `${chart.quickFacts.lagna} at ${chart.quickFacts.lagnaDms}`,
      details: `Lord: ${chart.houses[0]?.lord}`,
    }),
  },
  {
    id: 'kendra',
    name: 'Kendra (Angular Houses: 1, 4, 7, 10)',
    sanskrit: 'Kendra / Chatusthaya',
    devanagari: 'केन्द्र',
    category: 'Houses (Bhavas)',
    shortDef: 'The four pillar houses of the chart representing Lord Vishnu and active material manifestation.',
    whatIsIt: 'Houses 1 (Self), 4 (Home/Mother/Heart), 7 (Relationships/Partner), and 10 (Career/Karma/Public standing).',
    whyUsed: 'Planets in Kendras have supreme power to act and shape concrete worldly circumstances.',
    howCalculated: 'Quadrants separated by 90° intervals from the rising sign.',
    tags: ['Houses', 'Vishnu Sthana', 'Angles'],
    resolveChartResult: (chart) => {
      const occupants: string[] = []
      ;[1, 4, 7, 10].forEach((h) => {
        const occ = chart.houses[h - 1]?.occupants || []
        if (occ.length > 0) occupants.push(`H${h}: ${occ.join(', ')}`)
      })
      return {
        label: 'Kendra Occupancy in this chart',
        value: occupants.length > 0 ? occupants.join(' | ') : 'All Kendra houses vacant',
      }
    },
  },
  {
    id: 'trikona',
    name: 'Trikona (Trinal Houses: 1, 5, 9)',
    sanskrit: 'Trikona',
    devanagari: 'त्रिकोण',
    category: 'Houses (Bhavas)',
    shortDef: 'The sacred dharma trines representing Goddess Lakshmi, past merit (Purva Punya), and divine grace.',
    whatIsIt: 'Houses 1 (Lagna), 5 (Intellect/Children/Purva Punya), and 9 (Dharma/Guru/Fortune/Father).',
    whyUsed: 'Trikona houses are uniformly auspicious. Their lords act as functional benefics regardless of their natural disposition.',
    howCalculated: 'Houses positioned at 120° intervals (trine) from the Ascendant.',
    tags: ['Houses', 'Lakshmi Sthana', 'Trines', 'Dharma'],
    resolveChartResult: (chart) => {
      const occupants: string[] = []
      ;[1, 5, 9].forEach((h) => {
        const occ = chart.houses[h - 1]?.occupants || []
        if (occ.length > 0) occupants.push(`H${h}: ${occ.join(', ')}`)
      })
      return {
        label: 'Trikona Occupancy in this chart',
        value: occupants.length > 0 ? occupants.join(' | ') : 'All Trikona houses vacant',
      }
    },
  },
  {
    id: 'upachaya',
    name: 'Upachaya (Houses of Growth: 3, 6, 10, 11)',
    sanskrit: 'Upachaya',
    devanagari: 'उपचय',
    category: 'Houses (Bhavas)',
    shortDef: 'Houses where planets improve and produce increasing yields over time through deliberate human effort.',
    whatIsIt: 'Houses 3 (Courage), 6 (Overcoming obstacles), 10 (Career), and 11 (Gains/Aspirations). Natural malefics (Mars, Saturn, Sun, Rahu) excel here because they fight and overcome.',
    whyUsed: 'Signifies freewill, perseverance, and worldly expansion with age.',
    howCalculated: 'Houses 3, 6, 10, 11 from the Ascendant.',
    tags: ['Houses', 'Growth', 'Upachaya'],
    resolveChartResult: (chart) => {
      const occupants: string[] = []
      ;[3, 6, 10, 11].forEach((h) => {
        const occ = chart.houses[h - 1]?.occupants || []
        if (occ.length > 0) occupants.push(`H${h}: ${occ.join(', ')}`)
      })
      return {
        label: 'Upachaya Occupancy in this chart',
        value: occupants.length > 0 ? occupants.join(' | ') : 'None occupied',
      }
    },
  },
  {
    id: 'dusthana',
    name: 'Dusthana (Difficult Houses: 6, 8, 12)',
    sanskrit: 'Dusthana / Trik',
    devanagari: 'दुस्थान',
    category: 'Houses (Bhavas)',
    shortDef: 'Houses representing adversity, acute transformation, debt, illness, and spiritual transcendence.',
    whatIsIt: 'Houses 6 (Disease, debts, litigation), 8 (Sudden transformations, longevity, occult, chronic trials), and 12 (Loss, expenditure, isolation, moksha).',
    whyUsed: 'They highlight life\'s karmic tests and purification pathways.',
    howCalculated: 'Houses 6, 8, and 12 from Lagna.',
    tags: ['Houses', 'Dusthana', 'Obstacles'],
    resolveChartResult: (chart) => {
      const occupants: string[] = []
      ;[6, 8, 12].forEach((h) => {
        const occ = chart.houses[h - 1]?.occupants || []
        if (occ.length > 0) occupants.push(`H${h}: ${occ.join(', ')}`)
      })
      return {
        label: 'Dusthana Occupancy in this chart',
        value: occupants.length > 0 ? occupants.join(' | ') : 'Dusthana houses vacant',
      }
    },
  },
  {
    id: 'maraka',
    name: 'Maraka (Death-Inflicting Houses: 2 and 7)',
    sanskrit: 'Maraka',
    devanagari: 'मारक',
    category: 'Houses (Bhavas)',
    shortDef: 'Houses capable of ending a life cycle or creating acute vulnerability during their timing.',
    whatIsIt: 'House 8 governs longevity; house 12 from 8 is the 7th house (loss of longevity). House 3 is secondary longevity (8th from 8th); house 12 from 3 is the 2nd house. Hence, 2nd and 7th houses and their lords are designated Marakas.',
    whyUsed: 'Critical for evaluating health crises and Ayu (lifespan) during Dasha/Antardasha transitions.',
    howCalculated: 'Lords of the 2nd and 7th houses from Lagna, plus planets placed therein.',
    tags: ['Houses', 'Maraka', 'Longevity'],
    resolveChartResult: (chart) => {
      const h2Lord = chart.houses[1]?.lord
      const h7Lord = chart.houses[6]?.lord
      return {
        label: 'Maraka Lords for this chart',
        value: `2nd Lord: ${h2Lord} | 7th Lord: ${h7Lord}`,
      }
    },
  },
  {
    id: 'bhavat-bhavam',
    name: 'Bhavat Bhavam (House from House Principle)',
    sanskrit: 'Bhavat Bhavam',
    devanagari: 'भावाद्भावम्',
    category: 'Houses (Bhavas)',
    shortDef: 'The profound recursive principle where a house\'s secondary reflection lies at an identical distance from itself.',
    whatIsIt: 'E.g., 3rd is courage, 3rd from 3rd is the 5th house; 5th is children/intellect, 5th from 5th is the 9th house (grandchildren/wisdom); 8th is longevity/occult, 8th from 8th is the 3rd house.',
    whyUsed: 'Provides multidimensional depth to house significations, confirming indications through recursive cross-checks.',
    howCalculated: 'Derived by counting $N$ houses forward from house $N$ ($2N - 1$).',
    tags: ['Technique', 'Interpretation', 'Bhavas'],
    resolveChartResult: () => ({
      label: 'Core Examples in this chart',
      value: 'H5 (5th from 5th is H9) | H8 (8th from 8th is H3) | H7 (7th from 7th is Lagna)',
    }),
  },
  {
    id: 'purushartha',
    name: 'Purushartha (Four Goals of Human Life)',
    sanskrit: 'Purushartha',
    devanagari: 'पुरुषार्थ',
    category: 'Houses (Bhavas)',
    shortDef: 'The classical quadruplicity dividing the 12 houses into Dharma, Artha, Kama, and Moksha.',
    whatIsIt: 'Dharma (Houses 1, 5, 9: Duty, righteousness); Artha (Houses 2, 6, 10: Wealth, resources, work); Kama (Houses 3, 7, 11: Desire, relationships, ambitions); Moksha (Houses 4, 8, 12: Inner peace, surrender, liberation).',
    whyUsed: 'Reveals the soul\'s primary orientation and where human energy is naturally concentrated.',
    howCalculated: 'Grouped by triplicities starting with Fire (Dharma), Earth (Artha), Air (Kama), Water (Moksha).',
    tags: ['Philosophy', 'Purushartha', 'Bhavas'],
    resolveChartResult: (chart) => {
      const counts = { Dharma: 0, Artha: 0, Kama: 0, Moksha: 0 }
      chart.planets.forEach((p) => {
        if ([1, 5, 9].includes(p.houseNumber)) counts.Dharma++
        if ([2, 6, 10].includes(p.houseNumber)) counts.Artha++
        if ([3, 7, 11].includes(p.houseNumber)) counts.Kama++
        if ([4, 8, 12].includes(p.houseNumber)) counts.Moksha++
      })
      return {
        label: 'Planetary Balance in your chart',
        value: `Dharma: ${counts.Dharma} | Artha: ${counts.Artha} | Kama: ${counts.Kama} | Moksha: ${counts.Moksha}`,
      }
    },
  },

  // --- NAKSHATRAS & STARS ---
  {
    id: 'nakshatra',
    name: 'Nakshatra (Lunar Mansion)',
    sanskrit: 'Nakshatra',
    devanagari: 'नक्षत्र',
    category: 'Nakshatras & Stars',
    shortDef: 'One of the 27 stellar asterisms through which the Moon travels around the ecliptic.',
    whatIsIt: 'Each Nakshatra spans exactly 13°20\' (800 arcminutes) of the zodiac. Each carries a presiding Vedic deity, a planetary Vimshottari ruler, and 4 Padas of 3°20\' each.',
    whyUsed: 'Nakshatras provide psychological nuance, divine archetype, and seed the Vimshottari Dasha planetary timing cycle.',
    howCalculated: '$\\lfloor \\lambda_{\\text{Sidereal}} / 13^\\circ 20\' \\rfloor + 1$.',
    tags: ['Nakshatra', 'Asterism', 'Moon'],
    resolveChartResult: (chart) => ({
      label: 'Your Janma Nakshatra (Birth Star)',
      value: `${chart.quickFacts.moonNakshatra} (Pada ${chart.quickFacts.moonPada})`,
    }),
  },
  {
    id: 'pada',
    name: 'Pada (Nakshatra Quarter)',
    sanskrit: 'Pada / Charana',
    devanagari: 'पाद',
    category: 'Nakshatras & Stars',
    shortDef: 'One-fourth of a Nakshatra spanning exactly 3°20\' of arc, directly corresponding to one Navamsha.',
    whatIsIt: 'There are 108 Padas across the entire zodiac (27 × 4 = 108). Each Pada corresponds to a sacred sound syllable (Nama Nakshatra) and maps directly to one sign of the D-9 Navamsha chart.',
    whyUsed: 'Provides high-precision divisional positioning and is used in naming ceremonies, matchmaking, and soul alignment.',
    howCalculated: '$\\lfloor (\\lambda \\pmod{13^\\circ 20\ rendition}) / 3^\\circ 20\' \\rfloor + 1$.',
    tags: ['Nakshatra', 'Pada', 'Navamsha'],
    resolveChartResult: (chart) => ({
      label: 'Moon Pada in this chart',
      value: `Pada ${chart.quickFacts.moonPada}`,
    }),
  },
  {
    id: 'gandanta',
    name: 'Gandanta (Karmic Knot / Junction)',
    sanskrit: 'Gandanta',
    devanagari: 'गण्डान्त',
    category: 'Nakshatras & Stars',
    shortDef: 'Inauspicious boundary zone where water and fire signs meet simultaneously with Nakshatra endings.',
    whatIsIt: 'Occurs at the junctions between Cancer/Leo (Ashlesha/Magha), Scorpio/Sagittarius (Jyeshtha/Mula), and Pisces/Aries (Revati/Ashwini). Specifically the last 3°20\' of water signs and first 3°20\' of fire signs.',
    whyUsed: 'Represents a severe transformation or dissolution where material reality shifts abruptly into spiritual fire.',
    howCalculated: 'Within ~48 arcminutes to 3°20\' of 120°, 240°, or 360° sidereal longitude.',
    tags: ['Gandanta', 'Junction', 'Karmic Knot'],
    resolveChartResult: (chart) => {
      const gandantaPlanets = chart.planets.filter((p) => {
        const long = p.longitude ?? p.signIndex * 30 + p.degreeInSign
        return (long >= 116.66 && long <= 123.33) || (long >= 236.66 && long <= 243.33) || (long >= 356.66 || long <= 3.33)
      }).map((p) => p.name)
      return {
        label: 'Planets in Gandanta zones',
        value: gandantaPlanets.length > 0 ? gandantaPlanets.join(', ') : 'No planets in Gandanta',
      }
    },
  },

  // --- VARGAS (DIVISIONAL CHARTS) ---
  {
    id: 'varga',
    name: 'Varga (Divisional Harmonic Chart)',
    sanskrit: 'Varga',
    devanagari: 'वर्ग',
    category: 'Vargas & Divisions',
    shortDef: 'Mathematical harmonic division of the 360° zodiac into sub-charts for analyzing specific life domains.',
    whatIsIt: 'Parashara details 16 primary harmonic charts (Shodasavarga), including D1 (Physical), D2 (Wealth), D3 (Siblings/Courage), D9 (Dharma/Marriage), D10 (Profession/Status), D12 (Parents), and D60 (Past-life karma).',
    whyUsed: 'Prevents superficial judgments based only on D1. A planet strong in D1 but ruined in D9 will not deliver noble results.',
    howCalculated: 'Ecliptic degrees mapped into fractional segments ($30^\\circ / N$) and assigned to signs via specific algorithmic sequences.',
    tags: ['Vargas', 'Shodasavarga', 'Harmonics'],
    resolveChartResult: () => ({
      label: 'Supported Shodasavarga charts',
      value: 'All 16 classical divisional charts available in the Vargas tab',
    }),
  },
  {
    id: 'navamsha',
    name: 'Navamsha (D-9 Harmonic Chart)',
    sanskrit: 'Navamsha',
    devanagari: 'नवांश',
    category: 'Vargas & Divisions',
    shortDef: 'The 9th harmonic division, revered as the spiritual soul-chart and ultimate validator of planetary strength.',
    whatIsIt: 'Each 30° sign is divided into 9 segments of 3°20\'. D9 reveals internal fulfillment, marriage/partnerships, dharma, and the second half of life.',
    whyUsed: 'Regarded as the fruit (phala) of the tree (D1). Planetary strength is deemed incomplete without cross-referencing D9 dignity.',
    howCalculated: 'Fire signs start at Aries, Earth at Capricorn, Air at Libra, Water at Cancer; sequenced sequentially by 9 padas.',
    tags: ['Navamsha', 'D9', 'Marriage', 'Dharma'],
    resolveChartResult: (chart) => {
      const d9Lagna = chart.vargas?.['D9']?.lagnaSignName || 'Calculated'
      return {
        label: 'Navamsha (D-9) Lagna in your chart',
        value: d9Lagna,
      }
    },
  },

  // --- TIMING & DASHAS ---
  {
    id: 'vimshottari',
    name: 'Vimshottari Dasha (120-Year Cycle)',
    sanskrit: 'Vimshottari Dasha',
    devanagari: 'विंशोत्तरी दशा',
    category: 'Dashas & Timing',
    shortDef: 'The supreme unconditional timing system of Parashari Jyotish based on a 120-year human lifespan.',
    whatIsIt: 'Cycles through 9 planetary periods in fixed sequence: Ketu (7y), Venus (20y), Sun (6y), Moon (10y), Mars (7y), Rahu (18y), Jupiter (16y), Saturn (19y), Mercury (17y). Total = 120 years.',
    whyUsed: 'Reveals *when* potential promised in the birth chart awakens and bears fruit in time.',
    howCalculated: 'Seeded by the exact longitude of the Moon at birth inside its Nakshatra. The traversed fraction determines the balance of the opening Mahadasha.',
    tags: ['Timing', 'Dasha', 'Vimshottari', 'Predictions'],
    resolveChartResult: (chart) => ({
      label: 'Current Planetary Phase',
      value: `Mahadasha: ${chart.quickFacts.currentMahadasha} | Antardasha: ${chart.quickFacts.currentAntardasha || 'Active'}`,
    }),
  },
  {
    id: 'gochara',
    name: 'Gochara (Transits of Planets)',
    sanskrit: 'Gochara',
    devanagari: 'गोचर',
    category: 'Dashas & Timing',
    shortDef: 'The continuous real-time movement of planets through the sky relative to the natal birth chart.',
    whatIsIt: 'While Dashas determine the internal psychological season, transits (Gochara) provide the external catalytic triggers. Most importantly reckoned from the Natal Moon (Chandra Lagna).',
    whyUsed: 'Pinpoints precise timing windows when Dasha promises are triggered into concrete physical events.',
    howCalculated: 'Ephemeris positions of planets right now projected onto the houses counted from Natal Chandra or Lagna.',
    tags: ['Transits', 'Gochara', 'Timing'],
    resolveChartResult: (chart) => ({
      label: 'Natal Reference Points for Transits',
      value: `Moon at ${chart.quickFacts.moonSign} | Lagna at ${chart.quickFacts.lagna}`,
    }),
  },
  {
    id: 'sade-sati',
    name: 'Sade Sati (7.5-Year Saturn Transit)',
    sanskrit: 'Sade Sati',
    devanagari: 'साढ़े साती',
    category: 'Dashas & Timing',
    shortDef: 'The 7.5-year period when transiting Saturn passes through the 12th, 1st, and 2nd houses from the Natal Moon.',
    whatIsIt: 'Each sign transit takes ~2.5 years (2.5 × 3 = 7.5 years). Comprises Rising (12th from Moon), Peak (over Natal Moon), and Setting (2nd from Moon) phases.',
    whyUsed: 'A profound karmic restructuring period focused on maturity, eliminating illusions, and cultivating discipline.',
    howCalculated: 'Checked by comparing transiting Saturn\'s current sign with the natal Moon sign.',
    tags: ['Saturn', 'Sade Sati', 'Transits'],
    resolveChartResult: (chart) => ({
      label: 'Natal Moon Sign for Sade Sati check',
      value: chart.quickFacts.moonSign,
    }),
  },

  // --- JAIMINI & CHARA KARAKAS ---
  {
    id: 'atmakaraka',
    name: 'Atmakaraka (AK - Soul Significator)',
    sanskrit: 'Atmakaraka (AK)',
    devanagari: 'आत्मकारक',
    category: 'Jaimini & Karakas',
    shortDef: 'The planet with the highest longitude in any zodiac sign, representing the soul\'s deepest journey.',
    whatIsIt: 'In the Jaimini Upadesha Sutras, the planet with the highest traversed degrees (0° to 30°) becomes the king of the chart, embodying the soul\'s primary lessons, tests, and spiritual evolution.',
    whyUsed: 'Points directly to the soul\'s ultimate purpose and central life struggle (Karakamsha).',
    howCalculated: 'Rank 1 among the 7 physical planets sorted in descending order of degrees traversed in their respective signs.',
    tags: ['Jaimini', 'Atmakaraka', 'Soul'],
    resolveChartResult: (chart) => {
      const ak = chart.planets.find((p) => p.charaKarakaCode === 'AK')
      return {
        label: 'Your Atmakaraka (AK)',
        value: ak ? `${ak.name} (${ak.sign} ${ak.dms})` : 'Calculated in Planet Inspector',
      }
    },
  },
  {
    id: 'amatyakaraka',
    name: 'Amatyakaraka (AmK - Intellect & Career)',
    sanskrit: 'Amatyakaraka (AmK)',
    devanagari: 'अमात्यकारक',
    category: 'Jaimini & Karakas',
    shortDef: 'The planet with the second highest degree in sign, governing mind, advisory roles, and professional karma.',
    whatIsIt: 'Signifies the chief minister / counselor to the soul. Governs intellectual capacity, career pursuit, and financial sustenance.',
    whyUsed: 'Crucial for vocational analysis and Jaimini Raja Yogas (when AK and AmK connect).',
    howCalculated: 'Rank 2 in the descending degree order of physical Grahas.',
    tags: ['Jaimini', 'Amatyakaraka', 'Career'],
    resolveChartResult: (chart) => {
      const amk = chart.planets.find((p) => p.charaKarakaCode === 'AmK')
      return {
        label: 'Your Amatyakaraka (AmK)',
        value: amk ? `${amk.name} (${amk.sign} ${amk.dms})` : 'Calculated in Planet Inspector',
      }
    },
  },

  // --- ASPECTS & RELATIONS ---
  {
    id: 'graha-drishti',
    name: 'Graha Drishti (Planetary Aspects)',
    sanskrit: 'Graha Drishti',
    devanagari: 'ग्रहदृष्टि',
    category: 'Aspects & Relations',
    shortDef: 'The conscious planetary gaze through which a planet influences houses and other planets from afar.',
    whatIsIt: 'All planets cast full 100% aspect onto the 7th house from their location. Additionally, Mars has special full aspects on the 4th and 8th; Jupiter on the 5th and 9th; Saturn on the 3rd and 10th.',
    whyUsed: 'Drishti modifies the nature of the aspected house or planet, infusing it with the aspecting planet\'s qualities.',
    howCalculated: 'Counted inclusively starting with the planet\'s occupied house as 1.',
    tags: ['Aspects', 'Drishti', 'Parashari'],
    resolveChartResult: () => ({
      label: 'Aspects Matrix',
      value: 'Complete 9x12 Parashari aspect grid available in the Analysis tab',
    }),
  },
  {
    id: 'yogakaraka',
    name: 'Yoga Karaka (Single-Handed Benefic)',
    sanskrit: 'Yoga Karaka',
    devanagari: 'योगकारक',
    category: 'Planets & Dignity',
    shortDef: 'A single planet that simultaneously rules a Kendra (Vishnu) and a Trikona (Lakshmi) house.',
    whatIsIt: 'The supreme functional benefic for a chart. Mars is Yoga Karaka for Cancer and Leo Lagnas; Saturn is Yoga Karaka for Taurus and Libra Lagnas; Venus is Yoga Karaka for Capricorn and Aquarius Lagnas.',
    whyUsed: 'Produces immense prosperity, ethical success, and elevation during its Dasha without requiring a secondary partner.',
    howCalculated: 'Assessed by identifying if one planet rules both a Kendra (1, 4, 7, 10) and a Trikona (1, 5, 9).',
    tags: ['Raja Yoga', 'Benefic', 'Lordship'],
    resolveChartResult: (chart) => {
      const yk = chart.planets.find((p) => p.functionalType === 'Yogakaraka')
      return {
        label: 'Yoga Karaka for this Ascendant',
        value: yk ? `${yk.name} (Ruling H${yk.lordOfHouses.join(' & H')})` : 'No single Yoga Karaka for this Lagna',
      }
    },
  },

  // --- ASTRONOMICAL & EPHEMERIS ---
  {
    id: 'ayanamsha',
    name: 'Ayanamsha (Precession Value)',
    sanskrit: 'Ayanamsha',
    devanagari: 'अयनांश',
    category: 'Astronomical & Ephemeris',
    shortDef: 'The longitudinal angular difference between the Tropical (Sayana) and Sidereal (Nirayana) zodiacs.',
    whatIsIt: 'Due to the wobble of the Earth\'s axis (precession of the equinoxes at ~50.29 arcseconds/year), the vernal equinox drifts westward. Ayanamsha measures this offset ($~23^\\circ$ to $24^\\circ$ in modern times).',
    whyUsed: 'Crucial for fixing the starting point (0° Aries) of the fixed sidereal stars in Vedic astrology.',
    howCalculated: '$\\lambda_{\\text{Nirayana}} = (\\lambda_{\\text{Sayana}} - \\text{Ayanamsha}) \\pmod{360^\\circ}$.',
    tags: ['Ayanamsha', 'Lahiri', 'Precession', 'Astronomy'],
    resolveChartResult: (chart) => ({
      label: 'Active Chart Ayanamsha',
      value: `${chart.metadata.ayanamsaName}: ${chart.metadata.ayanamsaDms}`,
    }),
  },
  {
    id: 'julian-day',
    name: 'Julian Day (Astronomical Day Number)',
    sanskrit: 'Julian Day UT',
    devanagari: 'जूलियन दिवस',
    category: 'Astronomical & Ephemeris',
    shortDef: 'Continuous count of days elapsed since the beginning of the Julian Period on January 1, 4713 BC.',
    whatIsIt: 'The international standard uniform time scale used by professional astronomers and ephemeris libraries to avoid civil calendar irregularities, leap seconds, and timezone shifts.',
    whyUsed: 'Guarantees absolute mathematical reproducibility for all planetary coordinates.',
    howCalculated: 'Derived by converting civil year, month, day, hour, minute, second into Universal Time (UT) continuous days.',
    tags: ['Astronomy', 'Julian Day', 'Time'],
    resolveChartResult: (chart) => ({
      label: 'Julian Day UT for this chart',
      value: String(chart.raw?.rasi?.input?.julian_day_ut || chart.raw?.panchanga?.julian_day || 'Calculated'),
    }),
  },
]
