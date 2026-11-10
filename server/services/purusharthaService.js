/**
 * Bhava Purushartha & Stanza Balance Service
 * Kundli Workbench Server Core
 */

/**
 * Computes Purushartha distribution and quadrant/stanza balance for a chart
 */
function computePurusharthaBalance(planets) {
  const validPlanets = (planets || []).filter((p) => !['Lagna', 'Ascendant'].includes(p.name))
  const total = validPlanets.length || 9

  const dharmaPlanets = validPlanets.filter((p) => [1, 5, 9].includes(p.houseNumber))
  const arthaPlanets = validPlanets.filter((p) => [2, 6, 10].includes(p.houseNumber))
  const kamaPlanets = validPlanets.filter((p) => [3, 7, 11].includes(p.houseNumber))
  const mokshaPlanets = validPlanets.filter((p) => [4, 8, 12].includes(p.houseNumber))

  const purusharthas = [
    {
      name: 'Dharma',
      sanskrit: 'धर्म',
      houses: [1, 5, 9],
      theme: 'Duty, purpose, creative intelligence, self-identity, divine grace & righteous trajectory.',
      color: '#fbbf24',
      bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(17, 21, 28, 0.8))',
      planets: dharmaPlanets,
      count: dharmaPlanets.length,
      percentage: Math.round((dharmaPlanets.length / total) * 100),
    },
    {
      name: 'Artha',
      sanskrit: 'अर्थ',
      houses: [2, 6, 10],
      theme: 'Material resources, accumulated wealth, professional duties, executive status & tangible manifestations.',
      color: '#34d399',
      bgGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(17, 21, 28, 0.8))',
      planets: arthaPlanets,
      count: arthaPlanets.length,
      percentage: Math.round((arthaPlanets.length / total) * 100),
    },
    {
      name: 'Kama',
      sanskrit: 'काम',
      houses: [3, 7, 11],
      theme: 'Desires, passionate initiatives, partnerships, public interfaces, social networks & realization of gains.',
      color: '#38bdf8',
      bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(17, 21, 28, 0.8))',
      planets: kamaPlanets,
      count: kamaPlanets.length,
      percentage: Math.round((kamaPlanets.length / total) * 100),
    },
    {
      name: 'Moksha',
      sanskrit: 'मोक्ष',
      houses: [4, 8, 12],
      theme: 'Emotional sanctuary, transformation, occult insight, detachment, spiritual transcendence & inner release.',
      color: '#c084fc',
      bgGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.12), rgba(17, 21, 28, 0.8))',
      planets: mokshaPlanets,
      count: mokshaPlanets.length,
      percentage: Math.round((mokshaPlanets.length / total) * 100),
    },
  ]

  const sortedPurusharthas = [...purusharthas].sort((a, b) => b.count - a.count)
  const dominant = sortedPurusharthas[0] || purusharthas[0]

  const kendraPlanets = validPlanets.filter((p) => [1, 4, 7, 10].includes(p.houseNumber))
  const trikonaPlanets = validPlanets.filter((p) => [1, 5, 9].includes(p.houseNumber))
  const panapharaPlanets = validPlanets.filter((p) => [2, 5, 8, 11].includes(p.houseNumber))
  const apoklimaPlanets = validPlanets.filter((p) => [3, 6, 9, 12].includes(p.houseNumber))
  const upachayaPlanets = validPlanets.filter((p) => [3, 6, 10, 11].includes(p.houseNumber))
  const dusthanaPlanets = validPlanets.filter((p) => [6, 8, 12].includes(p.houseNumber))

  const stanzas = [
    {
      name: 'Kendra Sthanas',
      sanskrit: 'केन्द्र (Quadrants: 1, 4, 7, 10)',
      houses: [1, 4, 7, 10],
      description: 'Vishnu Sthana — The four foundational pillars of active manifest life and direct worldly capacity.',
      planets: kendraPlanets,
      count: kendraPlanets.length,
    },
    {
      name: 'Trikona Sthanas',
      sanskrit: 'त्रिकोण (Trines: 1, 5, 9)',
      houses: [1, 5, 9],
      description: 'Lakshmi Sthana — Holy trines of past-life blessings (Purva Punya), fortune, virtue, and wisdom.',
      planets: trikonaPlanets,
      count: trikonaPlanets.length,
    },
    {
      name: 'Panaphara',
      sanskrit: 'पणफर (Succedent: 2, 5, 8, 11)',
      houses: [2, 5, 8, 11],
      description: 'Houses of material maintenance, accumulation, resource consolidation, and continuous sustaining support.',
      planets: panapharaPlanets,
      count: panapharaPlanets.length,
    },
    {
      name: 'Apoklima',
      sanskrit: 'आपोक्लिम (Cadent: 3, 6, 9, 12)',
      houses: [3, 6, 9, 12],
      description: 'Houses of effort, transition, endurance, service, and detachment.',
      planets: apoklimaPlanets,
      count: apoklimaPlanets.length,
    },
    {
      name: 'Upachaya Sthanas',
      sanskrit: 'उपचय (Growth: 3, 6, 10, 11)',
      houses: [3, 6, 10, 11],
      description: 'Houses of progressive expansion where planets improve with age, willpower, and disciplined effort.',
      planets: upachayaPlanets,
      count: upachayaPlanets.length,
    },
    {
      name: 'Dusthana Sthanas',
      sanskrit: 'दुस्थान (Challenging: 6, 8, 12)',
      houses: [6, 8, 12],
      description: 'Houses of struggle, karmic debts, transformative crises, and eventual spiritual emancipation.',
      planets: dusthanaPlanets,
      count: dusthanaPlanets.length,
    },
  ]

  return {
    purusharthas,
    dominantPurushartha: dominant.name,
    dominantTheme: dominant.theme,
    stanzas,
  }
}

module.exports = {
  computePurusharthaBalance,
}
