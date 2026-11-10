/**
 * Classical Vedic Astrology Constants & Reference Data
 * Kundli Workbench Server Core
 */

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const SIGN_LORDS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

const EXALTATION_SIGNS = {
  Sun: 0,      // Aries
  Moon: 1,     // Taurus
  Mars: 9,     // Capricorn
  Mercury: 5,  // Virgo
  Jupiter: 3,  // Cancer
  Venus: 11,   // Pisces
  Saturn: 6,   // Libra
  Rahu: 1,     // Taurus
  Ketu: 7,     // Scorpio
}

const DEBILITATION_SIGNS = {
  Sun: 6,      // Libra
  Moon: 7,     // Scorpio
  Mars: 3,     // Cancer
  Mercury: 11, // Pisces
  Jupiter: 9,  // Capricorn
  Venus: 5,    // Virgo
  Saturn: 0,   // Aries
  Rahu: 7,     // Scorpio
  Ketu: 1,     // Taurus
}

const OWN_SIGNS = {
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

const MOOLATRIKONA_SIGNS = {
  Sun: 4,      // Leo
  Moon: 1,     // Taurus
  Mars: 0,     // Aries
  Mercury: 5,  // Virgo
  Jupiter: 8,  // Sagittarius
  Venus: 6,    // Libra
  Saturn: 10,  // Aquarius
}

const PLANET_META = {
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

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
]

const PLANET_NATURAL_KARAKAS = {
  Sun: 'Soul (Atma), Father (Pitri), Vitality, Royalty, Government, Willpower',
  Moon: 'Mind (Manas), Mother (Matri), Emotions, Peace, Memory, Nourishment',
  Mars: 'Courage (Parakrama), Siblings (Bhratri), Real Estate, Energy, Technical Skill',
  Mercury: 'Intellect (Buddhi), Speech (Vak), Commerce, Analysis, Education, Trade',
  Jupiter: 'Wisdom (Guru), Wealth (Dhana), Children (Santana), Dharma, Divine Grace',
  Venus: 'Spouse & Love (Kalatra), Arts, Vehicles, Refinement, Sensual Harmony',
  Saturn: 'Longevity (Ayush), Discipline, Hard Work, Grief/Endurance, Service, Detachment',
  Rahu: 'Worldly Ambition, Foreign Connections, Innovation, Unconventionality, Maya',
  Ketu: 'Liberation (Moksha), Spiritual Detachment, Occult Knowledge, Renunciation',
}

const HOUSE_METADATA = {
  1: {
    sanskrit: 'Tanu Bhava (Body / Self / Lagna)',
    karaka: 'Sun (Vitality, Soul, Physical Constitution)',
    bhavatBhavam: '1st from 1st — Foundation of all 12 bhavas',
    purushartha: 'Dharma',
    significations: ['Physical constitution', 'Personality & self-image', 'Vitality & health', 'Life path & fame', 'Head & brain'],
  },
  2: {
    sanskrit: 'Dhana Bhava (Wealth / Family / Speech)',
    karaka: 'Jupiter (Wealth, Family, Speech)',
    bhavatBhavam: '8th from 7th (Spouse longevity & partner resources)',
    purushartha: 'Artha',
    significations: ['Accumulated wealth & savings', 'Lineage & early family', 'Vak (Speech & eloquence)', 'Dietary habits', 'Right eye & face'],
  },
  3: {
    sanskrit: 'Sahaja Bhava (Siblings / Courage / Effort)',
    karaka: 'Mars (Courage, Siblings, Enterprise)',
    bhavatBhavam: '8th from 8th (Secondary longevity & vitality)',
    purushartha: 'Kama',
    significations: ['Valor & enterprise (Parakrama)', 'Younger siblings', 'Hands, arms & manual skill', 'Short journeys & communications', 'Desires & hobbies'],
  },
  4: {
    sanskrit: 'Sukha Bhava (Happiness / Mother / Home)',
    karaka: 'Moon & Venus (Mother, Peace, Vehicles)',
    bhavatBhavam: '4th from 1st (Heart & inner emotional core)',
    purushartha: 'Moksha',
    significations: ['Mother (Matri) & maternal lineage', 'Inner peace & mental contentment', 'Real estate, land & fixed home', 'Vehicles (Vahana)', 'Chest, heart & lungs'],
  },
  5: {
    sanskrit: 'Putra Bhava (Children / Intellect / Purva Punya)',
    karaka: 'Jupiter (Children, Wisdom, Higher intellect)',
    bhavatBhavam: '9th from 9th (Highest dharma & divine grace)',
    purushartha: 'Dharma',
    significations: ['Children & lineage continuity', 'Purva Punya (Past life merits)', 'Creative intelligence & discernment (Dhi)', 'Mantras, devotion & speculation', 'Stomach & spine'],
  },
  6: {
    sanskrit: 'Ari / Shatru Bhava (Enemies / Health / Service)',
    karaka: 'Mars & Saturn (Overcoming debts, disease & adversaries)',
    bhavatBhavam: '12th from 7th (Losses/challenges to competitors)',
    purushartha: 'Artha',
    significations: ['Overcoming obstacles & rivals', 'Daily work, service & employees', 'Debts (Rina) & litigations', 'Physical ailments (Roga)', 'Intestines & digestive fire'],
  },
  7: {
    sanskrit: 'Yuvati / Kalatra Bhava (Spouse / Union / Partnerships)',
    karaka: 'Venus (Spouse, Love, Marital harmony)',
    bhavatBhavam: '10th from 10th (Secondary career, trade & public action)',
    purushartha: 'Kama',
    significations: ['Spouse & marriage (Kalatra)', 'Business partnerships & contracts', 'Foreign travel & trade', 'Public interactions', 'Kidneys & lower abdomen'],
  },
  8: {
    sanskrit: 'Randhra Bhava (Transformation / Longevity / Occult)',
    karaka: 'Saturn (Longevity, Grief, Hidden endurance)',
    bhavatBhavam: '2nd from 7th (Partner assets & joint finances)',
    purushartha: 'Moksha',
    significations: ['Ayush (Longevity & life-span)', 'Sudden transformations & crises', 'Inheritance & unearned wealth', 'Occult studies & deep research', 'Reproductive organs'],
  },
  9: {
    sanskrit: 'Dharma Bhava (Fortune / Guru / Divine Law)',
    karaka: 'Jupiter & Sun (Guru, Dharma, Father, Divine grace)',
    bhavatBhavam: '5th from 5th (Purva punya of knowledge & grandchildren)',
    purushartha: 'Dharma',
    significations: ['Bhagya (Good fortune & divine grace)', 'Guru & spiritual preceptors', 'Father & righteousness (Dharma)', 'Higher philosophical learning', 'Hips & thighs'],
  },
  10: {
    sanskrit: 'Karma Bhava (Profession / Action / Status)',
    karaka: 'Mercury, Sun, Jupiter, Saturn (Career, Karma, Authority)',
    bhavatBhavam: '7th from 4th (External world vs home)',
    purushartha: 'Artha',
    significations: ['Career, profession & vocation', 'Public standing, prestige & honors', 'Government authority & leadership', 'Worldly duty & achievements', 'Knees & joints'],
  },
  11: {
    sanskrit: 'Labha Bhava (Gains / Aspirations / Networks)',
    karaka: 'Jupiter (Gains, Inflow of wealth, Fulfillment)',
    bhavatBhavam: '6th from 6th (Secondary overcoming of difficulties)',
    purushartha: 'Kama',
    significations: ['Material gains & steady profits', 'Elder siblings & mentors', 'Social networks & large associations', 'Fulfillment of long-term desires', 'Calves, ankles & left ear'],
  },
  12: {
    sanskrit: 'Vyaya Bhava (Expenditure / Isolation / Moksha)',
    karaka: 'Saturn & Ketu (Moksha, Release, Spiritual solitude)',
    bhavatBhavam: '4th from 9th (Spiritual shelter); Final culmination',
    purushartha: 'Moksha',
    significations: ['Expenditure & charitable giving', 'Foreign lands & distant settlements', 'Spiritual liberation (Moksha)', 'Subconscious mind & dreams', 'Feet & left eye'],
  },
}

const DIGBALA_PEAK = {
  Sun: 10,
  Mars: 10,
  Jupiter: 1,
  Mercury: 1,
  Moon: 4,
  Venus: 4,
  Saturn: 7,
  Rahu: 10,
  Ketu: 4,
}

const COMBUSTION_ORBS = {
  Moon: 12,
  Mars: 17,
  Mercury: 14, // 12 if retrograde
  Jupiter: 11,
  Venus: 10,   // 8 if retrograde
  Saturn: 15,
}

const NATURAL_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutrals: ['Mercury'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [], neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutrals: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutrals: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'], neutrals: ['Saturn'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutrals: ['Mars', 'Jupiter'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutrals: ['Jupiter'] },
  Rahu: { friends: ['Venus', 'Saturn', 'Mercury'], enemies: ['Sun', 'Moon', 'Mars'], neutrals: ['Jupiter'] },
  Ketu: { friends: ['Mars', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon'], neutrals: ['Mercury', 'Jupiter'] },
}

const VIMSHOTTARI_CYCLE = [
  { name: 'Ketu', years: 7 },
  { name: 'Venus', years: 20 },
  { name: 'Sun', years: 6 },
  { name: 'Moon', years: 10 },
  { name: 'Mars', years: 7 },
  { name: 'Rahu', years: 18 },
  { name: 'Jupiter', years: 16 },
  { name: 'Saturn', years: 19 },
  { name: 'Mercury', years: 17 },
]

const LEVEL_METADATA = {
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

function getOrdinal(n) {
  const r = n % 100
  if (r >= 11 && r <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
}

function formatDms(deg) {
  if (deg == null || isNaN(deg)) return '0°00\'00"'
  const d = Math.floor(deg)
  const minFloat = (deg - d) * 60
  const m = Math.floor(minFloat)
  const s = Math.round((minFloat - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
}

function parseSignIndex(signStr) {
  if (!signStr) return 0
  const clean = String(signStr).trim().toLowerCase()
  const idx = SIGN_NAMES.findIndex(
    (s) => s.toLowerCase() === clean || clean.startsWith(s.toLowerCase().slice(0, 3))
  )
  return idx >= 0 ? idx : 0
}

module.exports = {
  SIGN_NAMES,
  SIGN_LORDS,
  EXALTATION_SIGNS,
  DEBILITATION_SIGNS,
  OWN_SIGNS,
  MOOLATRIKONA_SIGNS,
  PLANET_META,
  NAKSHATRA_LORDS,
  PLANET_NATURAL_KARAKAS,
  HOUSE_METADATA,
  DIGBALA_PEAK,
  COMBUSTION_ORBS,
  NATURAL_FRIENDSHIP,
  VIMSHOTTARI_CYCLE,
  LEVEL_METADATA,
  getOrdinal,
  formatDms,
  parseSignIndex,
}

