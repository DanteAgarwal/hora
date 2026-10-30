import type { AstroChart } from '../../types/astro'

export interface ConceptSection {
  id: string
  title: string
  sanskrit: string
  icon: string
  summary: string
  corePrinciple: string
  traditionalContext: string
  howToReadInChart: string
  keyElements: {
    label: string
    sanskrit?: string
    description: string
    badge?: string
  }[]
  resolveChartContext?: (chart: AstroChart) => {
    title: string
    description: string
    highlights: { label: string; value: string }[]
  }
}

export const CONCEPTS_DATA: ConceptSection[] = [
  // 1. GRAHAS
  {
    id: 'grahas',
    title: 'The Nine Grahas (Cosmic Seizers)',
    sanskrit: 'Navagraha',
    icon: '🪐',
    summary: 'The word "Graha" comes from the Sanskrit root "Grah", meaning "to grasp, seize, or hold". Rather than mere physical rocks in space, Grahas in Jyotish are conscious cosmic transmitters that seize human consciousness and deliver karmic fruits.',
    corePrinciple: 'Grahas represent the dynamic actors or psychological archetypes within the psyche. Houses represent the stages of life, and Signs represent the environmental coloring or costume.',
    traditionalContext: 'Sage Parashara establishes the planetary cabinet: Sun is the Soul/King; Moon is the Mind/Queen; Mars is the Vitality/Commander; Mercury is the Intellect/Prince; Jupiter and Venus are the Spiritual Preceptors/Ministers; Saturn is Grief & Longevity/Servant; Rahu and Ketu are the Eclipse Nodes/Outliers.',
    howToReadInChart: 'First assess the Graha\'s natural disposition (Naisargika Benefic vs. Malefic), then its functional role derived from its Lagna lordships (Yogakaraka, Kendra/Trikona Lord vs. Dusthana Lord), and finally its dignity (Exalted, Own, Friendly, Debilitated).',
    keyElements: [
      { label: 'Surya (Sun)', sanskrit: 'सूर्य', description: 'Atma (Soul), Ahamkara (Ego/Self-identity), Father, Vitality, Authority, Government, Bone structure.', badge: 'King • Fire' },
      { label: 'Chandra (Moon)', sanskrit: 'चन्द्र', description: 'Manas (Emotive Mind), Mother, Nourishment, Memory, Fluctuating emotions, Public empathy, Blood/Fluids.', badge: 'Queen • Water' },
      { label: 'Mangala (Mars)', sanskrit: 'मङ्गल', description: 'Tejas (Courage), Physical Drive, Siblings, Logic, Property/Land, Blood pressure, Surgery, Warfare.', badge: 'Commander • Fire' },
      { label: 'Budha (Mercury)', sanskrit: 'बुध', description: 'Buddhi (Intellect), Communication, Speech, Trade/Commerce, Mathematics, Adaptability, Skin/Nerves.', badge: 'Prince • Earth' },
      { label: 'Guru (Jupiter)', sanskrit: 'गुरु / बृहस्पति', description: 'Jnana (Divine Wisdom), Guru/Preceptor, Expansion, Dharma, Children, Wealth, Liver, Optimism.', badge: 'Chief Minister • Ether' },
      { label: 'Shukra (Venus)', sanskrit: 'शुक्र', description: 'Sukha (Sensual Pleasure), Love, Arts, Refinement, Conjugal harmony, Vehicles, Semen/Reproductive system.', badge: 'Minister • Water' },
      { label: 'Shani (Saturn)', sanskrit: 'शनि', description: 'Ayush (Longevity), Vairagya (Detachment), Hard Labor, Humility, Karma, Delays, Fear, Nervous system.', badge: 'Servant • Air' },
      { label: 'Rahu (North Node)', sanskrit: 'राहु', description: 'Maya (Illusion), Obsessive Desires, Innovation, Foreign Lands, Outliers, Unconventional Breakthroughs.', badge: 'Shadow • Air' },
      { label: 'Ketu (South Node)', sanskrit: 'केतु', description: 'Moksha (Liberation), Dissolution, Spiritual Insight, Non-attachment, Hidden Occult Knowledge, Surrender.', badge: 'Shadow • Fire' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Graha Status in your chart',
      description: 'Overview of the planetary distribution and dignities in your horoscope.',
      highlights: [
        { label: 'Ascendant Lord', value: chart.houses[0]?.lord || 'Unknown' },
        { label: 'Sun Position', value: `${chart.quickFacts.sunSign}` },
        { label: 'Moon Position', value: `${chart.quickFacts.moonSign} (${chart.quickFacts.moonNakshatra})` },
        { label: 'Retrograde Planets', value: chart.planets.filter((p) => p.retrograde && !['Rahu', 'Ketu'].includes(p.name)).map((p) => p.name).join(', ') || 'None' },
      ],
    }),
  },

  // 2. RASHIS
  {
    id: 'rashis',
    title: 'The Twelve Rashis (Zodiac Signs)',
    sanskrit: 'Dwadasha Rashi',
    icon: '♈',
    summary: 'A Rashi is an ecliptic sector of exactly 30 degrees. The word "Rashi" means "a heap or quantity", denoting a constellation bundle of stars that imprints specific energetic qualities onto whatever planet traverses it.',
    corePrinciple: 'Signs do not cause events directly; rather, they provide the soil, climate, and environmental condition in which planets must operate.',
    traditionalContext: 'Categorized by Four Tattwas (Agni/Fire: 1,5,9; Prithvi/Earth: 2,6,10; Vayu/Air: 3,7,11; Jala/Water: 4,8,12) and Three Modalities (Chara/Movable: 1,4,7,10; Sthira/Fixed: 2,5,8,11; Dwiswabhava/Dual: 3,6,9,12).',
    howToReadInChart: 'Look at which element dominates your chart. Fire signs produce action, vision, and leadership; Earth signs generate tangible results, commerce, and stability; Air signs foster ideas, communication, and networking; Water signs cultivate empathy, intuition, and devotion.',
    keyElements: [
      { label: 'Mesha (Aries)', sanskrit: 'मेष', description: 'Cardinal Fire. Ruled by Mars. Pioneering impulse, initiative, fearless courage, head.', badge: 'Movable • Fire' },
      { label: 'Vrishabha (Taurus)', sanskrit: 'वृषभ', description: 'Fixed Earth. Ruled by Venus. Stability, accumulated wealth, sensory beauty, endurance, face.', badge: 'Fixed • Earth' },
      { label: 'Mithuna (Gemini)', sanskrit: 'मिथुन', description: 'Dual Air. Ruled by Mercury. Inquisitive intellect, versatile communication, writing, arms/shoulders.', badge: 'Dual • Air' },
      { label: 'Karka (Cancer)', sanskrit: 'कर्क', description: 'Cardinal Water. Ruled by Moon. Nurturing devotion, emotional empathy, psychic sensitivity, chest/heart.', badge: 'Movable • Water' },
      { label: 'Simha (Leo)', sanskrit: 'सिंह', description: 'Fixed Fire. Ruled by Sun. Sovereign authority, creative nobility, magnanimity, spine/upper back.', badge: 'Fixed • Fire' },
      { label: 'Kanya (Virgo)', sanskrit: 'कन्या', description: 'Dual Earth. Ruled by Mercury. Discriminating precision, healing service, detailed analysis, digestion.', badge: 'Dual • Earth' },
      { label: 'Tula (Libra)', sanskrit: 'तुला', description: 'Cardinal Air. Ruled by Venus. Harmony, relational equilibrium, justice, trade, kidneys/lumbar.', badge: 'Movable • Air' },
      { label: 'Vrishchika (Scorpio)', sanskrit: 'वृश्चिक', description: 'Fixed Water. Ruled by Mars. Transformative intensity, penetrating research, secrecy, pelvis.', badge: 'Fixed • Water' },
      { label: 'Dhanu (Sagittarius)', sanskrit: 'धनु', description: 'Dual Fire. Ruled by Jupiter. Philosophical exploration, righteous truth, optimism, hips/thighs.', badge: 'Dual • Fire' },
      { label: 'Makara (Capricorn)', sanskrit: 'मकर', description: 'Cardinal Earth. Ruled by Saturn. Structured ambition, relentless patience, social duty, knees.', badge: 'Movable • Earth' },
      { label: 'Kumbha (Aquarius)', sanskrit: 'कुम्भ', description: 'Fixed Air. Ruled by Saturn. Universal humanitarian ideals, scientific innovation, ankles.', badge: 'Fixed • Air' },
      { label: 'Meena (Pisces)', sanskrit: 'मीन', description: 'Dual Water. Ruled by Jupiter. Spiritual transcendence, imaginative empathy, cosmic surrender, feet.', badge: 'Dual • Water' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Elemental Balance in this chart',
      description: 'How the 4 classical elements are distributed across your planetary placements.',
      highlights: [
        { label: 'Lagna Sign', value: chart.quickFacts.lagna },
        { label: 'Moon Sign', value: chart.quickFacts.moonSign },
        { label: 'Sun Sign', value: chart.quickFacts.sunSign },
      ],
    }),
  },

  // 3. BHAVAS
  {
    id: 'bhavas',
    title: 'The Twelve Bhavas (Houses of Existence)',
    sanskrit: 'Dwadasha Bhava',
    icon: '🏛️',
    summary: 'The word "Bhava" signifies "state of being, feeling, or becoming". Houses represent the concrete arenas of human experience through which karma unfolds in physical time and space.',
    corePrinciple: 'Houses are reckoned from the rising degree (Lagna). The 1st house is Self; the opposite 7th is Other; the lower 4th is Inner/Home; the elevated 10th is Outer/World.',
    traditionalContext: 'BPHS classifies houses into Kendras (1,4,7,10 - Vishnu Sthanas, pillars of power), Trikonas (1,5,9 - Lakshmi Sthanas, blessings of grace), Upachayas (3,6,10,11 - Houses of steady improvement), Dusthanas (6,8,12 - Karmic challenges), and Marakas (2,7 - Terminating forces).',
    howToReadInChart: 'To analyze any life department, examine the House itself, its Ruling Lord (Bhavesha), planets occupying it, aspects cast upon it, and its natural significator (Karaka).',
    keyElements: [
      { label: '1st House (Tanu)', sanskrit: 'तनु भाव', description: 'Physical body, constitution, life path, appearance, general fortune, selfhood.', badge: 'Kendra & Trikona • Dharma' },
      { label: '2nd House (Dhana)', sanskrit: 'धन भाव', description: 'Liquid wealth, family lineage, speech, values, nutritional intake, right eye.', badge: 'Maraka • Artha' },
      { label: '3rd House (Sahaja)', sanskrit: 'सहज भाव', description: 'Courage, younger siblings, fine motor skills, short journeys, writing, initiative.', badge: 'Upachaya • Kama' },
      { label: '4th House (Sukha)', sanskrit: 'सुख भाव', description: 'Mother, real estate, vehicles, foundational peace of mind, education, heart.', badge: 'Kendra • Moksha' },
      { label: '5th House (Putra)', sanskrit: 'पुत्र भाव', description: 'Purva Punya (past merit), children, intellect, creative intelligence, mantras.', badge: 'Trikona • Dharma' },
      { label: '6th House (Ripu / Ari)', sanskrit: 'रिपु भाव', description: 'Enemies, debts, diseases, litigation, day-to-day service, overcoming trials.', badge: 'Dusthana & Upachaya • Artha' },
      { label: '7th House (Kalatra)', sanskrit: 'कलत्र भाव', description: 'Spouse, marriage, business partnerships, foreign residence, contracts.', badge: 'Kendra & Maraka • Kama' },
      { label: '8th House (Randhra)', sanskrit: 'रन्ध्र भाव', description: 'Longevity (Ayush), sudden transformations, unearned wealth, occult research.', badge: 'Dusthana • Moksha' },
      { label: '9th House (Dharma / Bhagya)', sanskrit: 'भाग्य भाव', description: 'Fortune, Guru, divine grace, higher philosophy, pilgrimages, father.', badge: 'Trikona • Dharma' },
      { label: '10th House (Karma)', sanskrit: 'कर्म भाव', description: 'Career, vocation, authority, public status, government, social achievements.', badge: 'Kendra & Upachaya • Artha' },
      { label: '11th House (Labha)', sanskrit: 'लाभ भाव', description: 'Gains, liquid cashflow, elder siblings, fulfillment of long-term desires, networks.', badge: 'Upachaya • Kama' },
      { label: '12th House (Vyaya)', sanskrit: 'व्यय भाव', description: 'Expenditure, foreign settlement, sleep/bed pleasures, spiritual liberation (Moksha).', badge: 'Dusthana • Moksha' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Prominent Houses in your chart',
      description: 'Houses with major planetary occupancy and key focus areas.',
      highlights: [
        { label: '1st House (Lagna)', value: `${chart.houses[0]?.sign} (Lord: ${chart.houses[0]?.lord})` },
        { label: '10th House (Career)', value: `${chart.houses[9]?.sign} (Lord: ${chart.houses[9]?.lord})` },
        { label: '9th House (Fortune)', value: `${chart.houses[8]?.sign} (Lord: ${chart.houses[8]?.lord})` },
      ],
    }),
  },

  // 4. NAKSHATRAS
  {
    id: 'nakshatras',
    title: 'The 27 Nakshatras (Lunar Mansions)',
    sanskrit: 'Nakshatra Chakra',
    icon: '✨',
    summary: 'The 27 Nakshatras form the ancient stellar backbone of Indian astronomy. The Moon completes its orbit around the Earth against these fixed asterisms in ~27.3 days, staying roughly one solar day in each Nakshatra.',
    corePrinciple: 'While Rashis (ruled by the Sun\'s journey) represent solar conscious manifestation, Nakshatras (ruled by the Moon\'s journey) reveal the deep subconscious memory, mythic karma, and timing of the soul.',
    traditionalContext: 'Every Nakshatra is presided over by an ancient Vedic deity (e.g. Indra, Agni, Varuna, Mitra, Yama), possesses a planetary ruler for Vimshottari Dasha, and is quartered into 4 Padas of 3°20\' each.',
    howToReadInChart: 'Your Janma Nakshatra (the Moon\'s birth star) is the most critical reference point for understanding your emotional wiring, temperament, and lifetime Dasha trajectory.',
    keyElements: [
      { label: 'Span of Asterism', description: 'Exactly 13°20\' of arc (800 arcminutes). 27 Nakshatras × 13°20\' = 360° total circle.' },
      { label: 'Pada Subdivision', description: 'Each Nakshatra contains 4 Padas of 3°20\' (200 arcminutes) each. 27 × 4 = 108 total sacred Padas.' },
      { label: 'Deity (Devata)', description: 'The cosmic intelligence governing the star\'s internal character and energetic blessings.' },
      { label: 'Vimshottari Ruler', description: 'The planet that rules the Nakshatra and initiates the opening Dasha at birth.' },
      { label: 'Gandanta Zones', description: 'The critical 3 junction points where water signs meet fire signs (Revati/Ashwini, Ashlesha/Magha, Jyeshtha/Mula).' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Your Birth Star Identity',
      description: 'The Nakshatra hosting the Moon at the moment of your birth.',
      highlights: [
        { label: 'Birth Nakshatra', value: chart.quickFacts.moonNakshatra },
        { label: 'Pada', value: `Pada ${chart.quickFacts.moonPada}` },
        { label: 'Initial Dasha Ruler', value: chart.quickFacts.currentMahadasha.split(' ')[0] },
      ],
    }),
  },

  // 5. VARGAS
  {
    id: 'vargas',
    title: 'Vargas (Harmonic Divisional Charts)',
    sanskrit: 'Shodasavarga',
    icon: '📊',
    summary: 'Vedic astrology does not rely on a single flat wheel. It calculates harmonic sub-divisions of each zodiac sign (called Vargas) to evaluate microscopic facets of destiny that remain invisible in the basic D1 chart.',
    corePrinciple: 'D1 Rashi represents the physical body and broad potential (the seed). Vargas represent specific harmonic overtones that demonstrate whether that seed will blossom in specific life domains.',
    traditionalContext: 'Parashara lays out the Shodasavarga (16 divisional charts) as the supreme standard. The most renowned is the D9 Navamsha, followed by D10 (Career), D7 (Children), D3 (Siblings), and D60 (Subtle past-life karma).',
    howToReadInChart: 'Always cross-verify planetary strength in the divisional chart corresponding to the matter under inquiry. A strong 10th lord in D1 that is fallen in D10 will encounter unexpected professional roadblocks.',
    keyElements: [
      { label: 'D1 — Rashi', description: 'Physical body, general existence, foundational baseline of all karma.' },
      { label: 'D2 — Hora', description: 'Wealth, financial sustainability, resource accumulation (Sun & Moon halves).' },
      { label: 'D3 — Drekkana', description: 'Siblings, courage, vitality, warfare, fine-motor skill execution.' },
      { label: 'D7 — Saptamsha', description: 'Progeny, children, creative legacy, and lineage continuity.' },
      { label: 'D9 — Navamsha', description: 'The supreme soul-chart: marriage, dharma, inner potential, second half of life.' },
      { label: 'D10 — Dasamsha', description: 'Professional stature, public leadership, career achievements, and great deeds.' },
      { label: 'D12 — Dwadasamsha', description: 'Ancestral heritage, parents, maternal and paternal lineage karma.' },
      { label: 'D60 — Shashtiamsha', description: 'Microscopic 60th harmonic. Parashara gives it paramount weight for past-life karma.' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Divisional Highlights in this chart',
      description: 'Harmonic correlations across key Vargas.',
      highlights: [
        { label: 'D1 Lagna', value: chart.quickFacts.lagna },
        { label: 'D9 Navamsha Lagna', value: chart.vargas?.['D9']?.lagnaSignName || 'Available in Vargas' },
        { label: 'D10 Dasamsha Lagna', value: chart.vargas?.['D10']?.lagnaSignName || 'Available in Vargas' },
      ],
    }),
  },

  // 6. DASHAS
  {
    id: 'dashas',
    title: 'Dashas (Planetary Timing Architecture)',
    sanskrit: 'Dasha Paddhati',
    icon: '⏱️',
    summary: 'A birth chart is not a static painting; it is a musical score played out across time. Dashas represent the temporal unfolding of planetary influences throughout human life.',
    corePrinciple: 'A planet can only deliver what it promises in the natal chart, but it will only deliver it when its Dasha period arrives.',
    traditionalContext: 'Parashari Jyotish prioritizes the Vimshottari Dasha system, which assigns 120 years across 9 Grahas. The cycle begins with the ruler of the Moon\'s natal Nakshatra and progresses in an unalterable sequence.',
    howToReadInChart: 'Analyze the running Mahadasha Lord (MD), Antardasha Lord (AD), and Pratyantardasha Lord (PD). Check their natural significations, their house lordships, their mutual relationship (e.g. 6/8 or 5/9), and their transits.',
    keyElements: [
      { label: 'Mahadasha (Major Period)', description: 'Broad environmental climate lasting between 6 and 20 years. Sets the grand narrative.' },
      { label: 'Antardasha (Sub-Period)', description: 'Secondary actor executing specific events within the Mahadasha umbrella.' },
      { label: 'Pratyantardasha (Sub-Sub Period)', description: 'Tactical catalyst operating over months/weeks that triggers concrete milestones.' },
      { label: 'Balance of Dasha', description: 'The unexpired portion of the opening Mahadasha calculated from the Moon\'s degree in its star.' },
    ],
    resolveChartContext: (chart) => ({
      title: 'Active Planetary Season',
      description: 'Your current operational Vimshottari Dasha periods.',
      highlights: [
        { label: 'Current Mahadasha', value: chart.quickFacts.currentMahadasha },
        { label: 'Current Antardasha', value: chart.quickFacts.currentAntardasha || 'Active' },
      ],
    }),
  },

  // 7. DRISHTI
  {
    id: 'drishti',
    title: 'Drishti (Planetary & Sign Aspects)',
    sanskrit: 'Graha & Rashi Drishti',
    icon: '👁️',
    summary: 'The word "Drishti" means "sight or gaze". In Jyotish, planets do not merely affect the house they occupy; they consciously gaze across the horoscope and influence distant houses and planets.',
    corePrinciple: 'Aspects transmit energy. A natural benefic gazing upon a house purifies and protects it; a natural malefic gazing upon a house creates friction, discipline, or distress.',
    traditionalContext: 'Parashara defines that all planets aspect the 7th house from their position with full strength (100%). Mars, Jupiter, and Saturn possess additional special full aspects (Vishesha Drishti).',
    howToReadInChart: 'Inspect both Graha Drishti (individual planetary sight) and mutual aspects (planets looking directly at each other across an axis like 1/7).',
    keyElements: [
      { label: 'Universal 7th Aspect', description: 'Every Graha fully aspects the house opposite itself (180° away).' },
      { label: 'Mars Special Aspects', description: 'Full aspects on the 4th house and 8th house from its placement.' },
      { label: 'Jupiter Special Aspects', description: 'Full divine aspects on the 5th house and 9th house (trinal gaze).' },
      { label: 'Saturn Special Aspects', description: 'Full heavy aspects on the 3rd house and 10th house from its placement.' },
    ],
    resolveChartContext: () => ({
      title: 'Aspect Matrix Inspection',
      description: 'Your chart contains full mutual aspects calculated in the Analysis Suite.',
      highlights: [
        { label: 'Mutual Drishti Grid', value: 'Interactive 9x12 and 9x9 matrix available in Analysis' },
      ],
    }),
  },
]
