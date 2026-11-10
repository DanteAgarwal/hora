/**
 * House Calculations, Classifications & Lord Placements Service
 * Kundli Workbench Server Core
 */

const {
  SIGN_NAMES,
  SIGN_LORDS,
  HOUSE_METADATA,
  getOrdinal,
} = require('./astroConstants')

/**
 * Derives classical classification categories for a house
 */
function deriveHouseCategories(houseNumber) {
  const cats = []
  if ([1, 4, 7, 10].includes(houseNumber)) cats.push('Kendra (Angle)')
  if ([1, 5, 9].includes(houseNumber)) cats.push('Trikona (Trine)')
  if ([3, 6, 10, 11].includes(houseNumber)) cats.push('Upachaya (Growth)')
  if ([6, 8, 12].includes(houseNumber)) cats.push('Dusthana (Difficult)')
  if ([2, 7].includes(houseNumber)) cats.push('Maraka (Killer)')
  if ([1, 5, 9].includes(houseNumber)) cats.push('Dharma')
  if ([2, 6, 10].includes(houseNumber)) cats.push('Artha')
  if ([3, 7, 11].includes(houseNumber)) cats.push('Kama')
  if ([4, 8, 12].includes(houseNumber)) cats.push('Moksha')
  return cats
}

/**
 * Derives classical interpretation of the placement of the house lord
 */
function deriveLordPlacementInsight(houseNumber, lordPlanet) {
  if (!lordPlanet) return 'Lord placement details unavailable.'
  const lH = lordPlanet.houseNumber
  if (lH === houseNumber) {
    return `Swakshetra (Own House) • Lord ${lordPlanet.name} is seated in its own domain. This directly anchors and fortifies the house's significations with natural resilience.`
  }
  if ([1, 4, 7, 10].includes(lH)) {
    return `Kendra Placement • Seated in the ${lordPlanet.houseOrdinal} House (Pillar/Angle). Brings prominent, active, and tangible outward results to the affairs of the ${houseNumber}th House.`
  }
  if ([5, 9].includes(lH)) {
    return `Trikona Placement • Seated in the ${lordPlanet.houseOrdinal} House (Lakshmi Sthana). Blessed with auspicious fortune, purva punya, and ease of fulfillment.`
  }
  if ([3, 6, 11].includes(lH)) {
    return `Upachaya Placement • Seated in the ${lordPlanet.houseOrdinal} House (Growth/Enterprise). Significators improve steadily through time, effort, and perseverance.`
  }
  if ([8, 12].includes(lH)) {
    return `Moksha / Dusthana Placement • Seated in the ${lordPlanet.houseOrdinal} House. Involves transformative cycles, deeper karmic lessons, or foreign / spiritual detachment.`
  }
  if (lH === 2) {
    return `Dhana Placement • Seated in the 2nd House of Wealth & Speech. Connects the themes of the ${houseNumber}th House directly to resources and family lineage.`
  }
  return `Seated in the ${lordPlanet.houseOrdinal} House (${lordPlanet.sign}).`
}

/**
 * Builds and enriches all 12 bhavas with complete metadata and lord placements
 */
function enrichHouses(rawBhavas, lagnaSignIndex, planets) {
  const houses = []

  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + (h - 1)) % 12
    const signName = SIGN_NAMES[signIndex]
    const lord = SIGN_LORDS[signName] || '—'
    const occupants = planets.filter((p) => p.houseNumber === h).map((p) => p.name)
    const rawBhava = (rawBhavas || []).find((b) => b.house === h)
    const lordPlanet = planets.find((p) => p.name === lord)
    const meta = HOUSE_METADATA[h] || {}

    const categories = deriveHouseCategories(h)
    const lordPlacementInsight = deriveLordPlacementInsight(h, lordPlanet)

    houses.push({
      number: h,
      name: `${getOrdinal(h)} House${h === 1 ? ' (Lagna)' : ''}`,
      sanskritName: meta.sanskrit || `Bhava ${h}`,
      sign: signName,
      signNumber: signIndex + 1,
      signIndex,
      lord,
      lordHouseNumber: lordPlanet ? lordPlanet.houseNumber : undefined,
      lordHouseOrdinal: lordPlanet ? lordPlanet.houseOrdinal : undefined,
      lordSign: lordPlanet ? lordPlanet.sign : undefined,
      lordDignity: lordPlanet ? lordPlanet.dignity : undefined,
      lordPlacementInsight,
      naturalKaraka: meta.karaka,
      occupants,
      aspectsReceived: [], // Enriched by aspectsService
      bhavatBhavam: meta.bhavatBhavam,
      significations: meta.significations || [],
      purushartha: meta.purushartha || 'Dharma',
      classificationTags: categories,
      categories,
      startLongitude: rawBhava ? rawBhava.start : undefined,
      cuspLongitude: rawBhava ? rawBhava.middle : undefined,
      endLongitude: rawBhava ? rawBhava.end : undefined,
    })
  }

  return houses
}

module.exports = {
  deriveHouseCategories,
  deriveLordPlacementInsight,
  enrichHouses,
}

