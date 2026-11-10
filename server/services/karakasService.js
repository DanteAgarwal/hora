/**
 * Jaimini Chara Karakas & Parashari Functional Roles Service
 * Kundli Workbench Server Core
 */

const { getOrdinal } = require('./astroConstants')

const CHARA_ROLES = [
  { code: 'AK', name: 'Atmakaraka (AK)' },
  { code: 'AmK', name: 'Amatyakaraka (AmK)' },
  { code: 'BK', name: 'Bhratrikaraka (BK)' },
  { code: 'MK', name: 'Matrikaraka (MK)' },
  { code: 'PK', name: 'Putrakaraka (PK)' },
  { code: 'GK', name: 'Gnatikaraka (GK)' },
  { code: 'DK', name: 'Darakaraka (DK)' },
]

/**
 * Computes Jaimini 7-Karaka Chara Karakas based on longitude within sign
 */
function computeCharaKarakas(planets) {
  const classicalGrahas = planets.filter((pl) =>
    ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(pl.name)
  )

  // Sort descending by degreeInSign
  classicalGrahas.sort((a, b) => (b.degreeInSign || 0) - (a.degreeInSign || 0))

  classicalGrahas.forEach((pl, idx) => {
    if (CHARA_ROLES[idx]) {
      pl.charaKarakaCode = CHARA_ROLES[idx].code
      pl.charaKaraka = CHARA_ROLES[idx].name
    }
  })
}

/**
 * Computes Parashari Functional Roles relative to Lagna
 */
function computeFunctionalRoles(planets) {
  for (const pl of planets) {
    const lordHouses = pl.lordOfHouses || []
    const rKendra = lordHouses.some((h) => [1, 4, 7, 10].includes(h))
    const rTrikona = lordHouses.some((h) => [5, 9].includes(h))
    const rDusthana = lordHouses.some((h) => [6, 8, 12].includes(h))
    const rMaraka = lordHouses.some((h) => [2, 7].includes(h))
    const rLagna = lordHouses.includes(1)

    if (rKendra && rTrikona) {
      pl.functionalType = 'Yogakaraka'
      pl.functionalRole = `Yogakaraka (${lordHouses.map(getOrdinal).join(' & ')} Lord) • Auspicious Raja Yoga producer for this Ascendant`
    } else if (rLagna) {
      pl.functionalType = 'Lagna Lord'
      pl.functionalRole = `Lagna Lord (${lordHouses.map(getOrdinal).join(' & ')} Lord) • Prime guardian of life force, constitution, and self`
    } else if (rTrikona) {
      pl.functionalType = 'Functional Benefic'
      pl.functionalRole = `Functional Benefic (${lordHouses.map(getOrdinal).join(' & ')} Lord) • Auspicious Trikona lord blessing fortune and merit`
    } else if (rDusthana && !rLagna) {
      pl.functionalType = 'Functional Malefic'
      pl.functionalRole = `Functional Malefic (${lordHouses.map(getOrdinal).join(' & ')} Lord) • Dusthana lord bringing karmic tests and growth through effort`
    } else if (rMaraka) {
      pl.functionalType = 'Maraka'
      pl.functionalRole = `Maraka Lord (${lordHouses.map(getOrdinal).join(' & ')} Lord) • Signifies alliances, worldly resources, and major life transitions`
    } else if (pl.name === 'Rahu' || pl.name === 'Ketu') {
      pl.functionalType = 'Neutral'
      pl.functionalRole = `Karmic Node (in ${pl.houseOrdinal} House) • Operates through dispositor ${pl.dispositor}`
    } else {
      pl.functionalType = 'Neutral'
      pl.functionalRole = `Functional Neutral (${lordHouses.map(getOrdinal).join(' & ')} Lord)`
    }
  }
}

module.exports = {
  computeCharaKarakas,
  computeFunctionalRoles,
}

