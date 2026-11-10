/**
 * Live Gochara (Transits) & Sade Sati Calculation Engine
 * Kundli Workbench Server Core • BPHS Chapter 25 & Classical Ephemeris
 */

const { SIGN_NAMES } = require('./astroConstants')

// Classical BPHS §25.2 Gochara Results from Janma Rasi (Natal Moon)
const GOCHARA_TABLES = {
  Sun: {
    goodHouses: [3, 6, 10, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Fatigue, unnecessary travels, financial expenditure, and lack of vitality' },
      2: { snapshot: 'Bad', effect: 'Financial strain, eye troubles, loss of domestic peace, and disputes' },
      3: { snapshot: 'Good', effect: 'Courage, victory over obstacles, acquisition of wealth, and robust health' },
      4: { snapshot: 'Bad', effect: 'Domestic disharmony, loss of comfort, maternal worries, and mental strain' },
      5: { snapshot: 'Bad', effect: 'Stomach ailments, mental anxiety, friction with superiors or children' },
      6: { snapshot: 'Good', effect: 'Total victory over adversaries, eradication of debts, and thriving vigor' },
      7: { snapshot: 'Bad', effect: 'Fatiguing journeys, marital tension, digestive sensitivity, and restlessness' },
      8: { snapshot: 'Bad', effect: 'Health vulnerabilities, sudden obstacles, friction with authorities, and distress' },
      9: { snapshot: 'Bad', effect: 'Delays in fortune, fatigue from travels, paternal concerns, and mental worries' },
      10: { snapshot: 'Good', effect: 'High occupational honors, professional success, authority, and public acclaim' },
      11: { snapshot: 'Good', effect: 'Abundant financial gains, incoming prosperity, social prestige, and joy' },
      12: { snapshot: 'Bad', effect: 'Heavy expenditures, sleeplessness, grief, and temporary displacement' },
    },
  },
  Moon: {
    goodHouses: [1, 3, 6, 7, 10, 11],
    results: {
      1: { snapshot: 'Good', effect: 'Emotional contentment, delicious meals, bodily comfort, and peaceful sleep' },
      2: { snapshot: 'Bad', effect: 'Financial drain, misunderstandings with relatives, and mental agitation' },
      3: { snapshot: 'Good', effect: 'Courageous enterprise, gifts of fine clothes, pleasant news, and siblings joy' },
      4: { snapshot: 'Bad', effect: 'Mental anxiety, loss of trust, domestic discomfort, and chest sensitivity' },
      5: { snapshot: 'Bad', effect: 'Indecision, sorrow concerning children, and speculative hesitation' },
      6: { snapshot: 'Good', effect: 'Relief from ailments, triumph over competition, cheerfulness, and clarity' },
      7: { snapshot: 'Good', effect: 'Romantic and spousal harmony, joyous social gatherings, and pleasant travels' },
      8: { snapshot: 'Bad', effect: 'Emotional fluctuations, unexpected frights, lethargy, and digestive unrest' },
      9: { snapshot: 'Bad', effect: 'Spiritual melancholy, setbacks in fortunes, and exhaustion from duties' },
      10: { snapshot: 'Good', effect: 'Workplace esteem, successful execution of projects, and material gains' },
      11: { snapshot: 'Good', effect: 'Multilateral profits, warm friendships, celebratory events, and prosperity' },
      12: { snapshot: 'Bad', effect: 'Unproductive expenses, emotional fatigue, solitude, and physical strain' },
    },
  },
  Mars: {
    goodHouses: [3, 6, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Physical accidents, blood/heat imbalances, anger flare-ups, and haste' },
      2: { snapshot: 'Bad', effect: 'Abrasive speech, property disputes, financial drain, and friction with kin' },
      3: { snapshot: 'Good', effect: 'Extraordinary courage, acquiring landed assets, overcoming rivals, and victory' },
      4: { snapshot: 'Bad', effect: 'Domestic strife, disputes over land/home, maternal worries, and heartburn' },
      5: { snapshot: 'Bad', effect: 'Agitation over progeny, emotional friction, speculative losses, and fever' },
      6: { snapshot: 'Good', effect: 'Complete liquidation of adversaries, litigation triumph, and dynamic vigor' },
      7: { snapshot: 'Bad', effect: 'Marital arguments, partnership rifts, eye inflammation, and hazardous journeys' },
      8: { snapshot: 'Bad', effect: 'Sudden emergencies, blood/urinary issues, hidden adversaries, and heavy fatigue' },
      9: { snapshot: 'Bad', effect: 'Impediments in higher undertakings, paternal distress, and fruitless travels' },
      10: { snapshot: 'Bad', effect: 'High occupational friction, professional friction, and overwork' },
      11: { snapshot: 'Good', effect: 'Major financial windfalls, real-estate gains, sibling support, and leadership' },
      12: { snapshot: 'Bad', effect: 'Excessive expenditures, sleep disturbances, legal penalties, and eye strain' },
    },
  },
  Mercury: {
    goodHouses: [2, 4, 6, 8, 10, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Mental distraction, communication slips, sarcastic speech, and fatigue' },
      2: { snapshot: 'Good', effect: 'Financial gains through intellectual skill, poetic speech, and scholastic honor' },
      3: { snapshot: 'Bad', effect: 'Misunderstandings with peers, futile travel, and nervous tension' },
      4: { snapshot: 'Good', effect: 'Educational excellence, maternal blessings, domestic peace, and property comforts' },
      5: { snapshot: 'Bad', effect: 'Mental restlessness, disputes with children, and speculative doubt' },
      6: { snapshot: 'Good', effect: 'Intellectual mastery, sharp analytical victory over opponents, and job efficiency' },
      7: { snapshot: 'Bad', effect: 'Debates with spouse, contract disagreements, and mental agitation' },
      8: { snapshot: 'Good', effect: 'Unexpected financial gains, peace of intellect, acquisition of hidden knowledge' },
      9: { snapshot: 'Bad', effect: 'Ethical indecision, blocked ventures, and fatigue from distant travel' },
      10: { snapshot: 'Good', effect: 'Professional promotion, commercial success, literary accolades, and status' },
      11: { snapshot: 'Good', effect: 'Lucrative networks, diversified income, intellectual companionship, and joy' },
      12: { snapshot: 'Bad', effect: 'Scattered attention, loss of focus, wasteful purchases, and nervous strain' },
    },
  },
  Jupiter: {
    goodHouses: [2, 5, 7, 9, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Relocation, heavy administrative duties, spiritual tests, and mental burden' },
      2: { snapshot: 'Good', effect: 'Substantial wealth accumulation, family blessings, eloquence, and happiness' },
      3: { snapshot: 'Bad', effect: 'Loss of enthusiasm, separation from close kin, and procedural obstacles' },
      4: { snapshot: 'Bad', effect: 'Domestic relocation, emotional concerns for elders, and property delays' },
      5: { snapshot: 'Good', effect: 'Spiritual awakening, birth/advancement of progeny, divine grace, and wisdom' },
      6: { snapshot: 'Bad', effect: 'Need for health discipline, disputes with subordinates, and debt management' },
      7: { snapshot: 'Good', effect: 'Blissful marital harmony, auspicious alliances, high social prestige, and travels' },
      8: { snapshot: 'Bad', effect: 'Fatigue, difficult travels, health vigilance, and major life reorganizations' },
      9: { snapshot: 'Good', effect: 'Supreme divine fortune, pilgrimages, paternal blessings, and spiritual elevation' },
      10: { snapshot: 'Bad', effect: 'Career changes, testing professional duties, and public accountability' },
      11: { snapshot: 'Good', effect: 'Immense long-term gains, realization of grand dreams, respect, and honors' },
      12: { snapshot: 'Bad', effect: 'High spending on religious/charitable causes, emotional detachment, and exile' },
    },
  },
  Venus: {
    goodHouses: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    results: {
      1: { snapshot: 'Good', effect: 'Personal magnetism, sensual comforts, fine attire, and romantic delights' },
      2: { snapshot: 'Good', effect: 'Financial enhancement, pleasant domestic environment, and creative speech' },
      3: { snapshot: 'Good', effect: 'Artistic appreciation, joyous short trips, social popularity, and presents' },
      4: { snapshot: 'Good', effect: 'Home embellishments, acquisition of luxury vehicles, maternal joy, and peace' },
      5: { snapshot: 'Good', effect: 'Creative inspiration, romantic happiness, celebration with offspring, and joy' },
      6: { snapshot: 'Bad', effect: 'Disagreements with partners, excessive indulgence, and kidney/sugar vigilance' },
      7: { snapshot: 'Bad', effect: 'Marital fatigue, relationship demands, overspending on luxuries, and envy' },
      8: { snapshot: 'Good', effect: 'Unexpected financial gifts, marital reconciliation, and luxury access' },
      9: { snapshot: 'Good', effect: 'Auspicious fortune through art and diplomacy, virtuous conduct, and comfort' },
      10: { snapshot: 'Bad', effect: 'Professional envy, workplace vanity, and disputes regarding creative credits' },
      11: { snapshot: 'Good', effect: 'Acquisition of gems, affluence, harmonious female friendships, and merriment' },
      12: { snapshot: 'Good', effect: 'Luxurious retreat, bed comforts, restful privacy, and overseas pleasure' },
    },
  },
  Saturn: {
    goodHouses: [3, 6, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Janma Shani (Sade Sati Peak): heavy existential burdens, physical stamina tests, and serious responsibilities' },
      2: { snapshot: 'Bad', effect: 'Antya Sade Sati (Setting): financial discipline required, speech restraint, and family obligations' },
      3: { snapshot: 'Good', effect: 'Indomitable fortitude, destruction of barriers, enduring authority, and wealth gains' },
      4: { snapshot: 'Bad', effect: 'Ardhashtama Shani: domestic strain, home renovations, emotional heaviness, and mother care' },
      5: { snapshot: 'Bad', effect: 'Mental somberness, delays in creative/speculative plans, and worries for children' },
      6: { snapshot: 'Good', effect: 'Decisive conquest of adversaries, debt settlement, litigation triumph, and stamina' },
      7: { snapshot: 'Bad', effect: 'Kantaka Shani: strain in partnerships, weary travels, and business contract delays' },
      8: { snapshot: 'Bad', effect: 'Ashtama Shani: deep transformative crisis, vitality vigilance, delays, and inheritance affairs' },
      9: { snapshot: 'Bad', effect: 'Spiritual trials, father’s health vigilance, delays in long journeys, and duty tests' },
      10: { snapshot: 'Bad', effect: 'Kantaka Shani: demanding occupational pressures, heavy labor, and authority friction' },
      11: { snapshot: 'Good', effect: 'Monumental financial breakthroughs, realization of ambitious goals, and enduring leadership' },
      12: { snapshot: 'Bad', effect: 'Aardha Sade Sati (Rising): foreign isolation, sleep disturbances, high expenditures, and introspection' },
    },
  },
  Rahu: {
    goodHouses: [3, 6, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Psychological illusions, identity restlessness, and unconventional impulses' },
      2: { snapshot: 'Bad', effect: 'Financial volatility, erratic speech patterns, and family misunderstandings' },
      3: { snapshot: 'Good', effect: 'Fearless enterprise, technological mastery, bold ventures, and sudden success' },
      4: { snapshot: 'Bad', effect: 'Domestic relocation, emotional alienation, and unrest in residence' },
      5: { snapshot: 'Bad', effect: 'Speculative impulsiveness, creative obsessions, and anxiety over offspring' },
      6: { snapshot: 'Good', effect: 'Overwhelming victory over competitors, tactical genius, and debt removal' },
      7: { snapshot: 'Bad', effect: 'Unorthodox partnership friction, eccentric associations, and marital tension' },
      8: { snapshot: 'Bad', effect: 'Occult intrigue, sudden disruptions, hidden health issues, and anxiety' },
      9: { snapshot: 'Bad', effect: 'Unconventional spiritual inquiries, disputes with orthodox elders, and distant travels' },
      10: { snapshot: 'Bad', effect: 'Sudden career shifts, intense ambition, controversies, and political friction' },
      11: { snapshot: 'Good', effect: 'Sudden massive windfalls, lucrative foreign contacts, and breakthrough gains' },
      12: { snapshot: 'Bad', effect: 'Exorbitant expenditure, eccentric dreams, foreign relocation, and seclusion' },
    },
  },
  Ketu: {
    goodHouses: [3, 6, 11],
    results: {
      1: { snapshot: 'Bad', effect: 'Deep detachment, spiritual disorientation, and bodily vulnerability' },
      2: { snapshot: 'Bad', effect: 'Speech bluntness, fiscal austerity, and distance from lineage' },
      3: { snapshot: 'Good', effect: 'Spiritual valor, quiet mastery over obstacles, and intuitive breakthroughs' },
      4: { snapshot: 'Bad', effect: 'Lack of emotional grounding, maternal health worries, and home detachment' },
      5: { snapshot: 'Bad', effect: 'Spiritual introspection, detachment from speculative desires, and gut sensitivity' },
      6: { snapshot: 'Good', effect: 'Elimination of hidden enemies, spiritual resilience, and overcoming adversity' },
      7: { snapshot: 'Bad', effect: 'Spousal detachment, cool emotional climate in relationships, and ascetic impulses' },
      8: { snapshot: 'Bad', effect: 'Mystical revelations, chronic health vigilance, and psychic sensitivities' },
      9: { snapshot: 'Bad', effect: 'Pilgrimages, philosophical questioning of dogmas, and solitary paths' },
      10: { snapshot: 'Bad', effect: 'Disinterest in worldly honors, career ambiguity, and non-conformist duties' },
      11: { snapshot: 'Good', effect: 'Unexpected spiritual gains, selective social ties, and dissolution of materialistic blocks' },
      12: { snapshot: 'Bad', effect: 'High charitable disbursements, profound spiritual surrender, and isolation' },
    },
  },
}

/**
 * Evaluates transit strength synthesizing BAV and SAV (BPHS §25.5 & §25.5.1)
 */
function evaluateTransitAshtakavarga(planetName, transitSignIndex, natalAshtakavarga) {
  let bavRekhas = 4
  let savRekhas = 28

  if (natalAshtakavarga) {
    if (Array.isArray(natalAshtakavarga.bhinnashtakavarga)) {
      const bTable = natalAshtakavarga.bhinnashtakavarga.find((b) => b.owner === planetName)
      if (bTable && Array.isArray(bTable.rekhas)) {
        bavRekhas = bTable.rekhas[transitSignIndex] ?? 4
      }
    }
    if (natalAshtakavarga.sarvashtakavarga && Array.isArray(natalAshtakavarga.sarvashtakavarga.rekhas)) {
      savRekhas = natalAshtakavarga.sarvashtakavarga.rekhas[transitSignIndex] ?? 28
    }
  }

  // BAV verdict: >= 5 good, == 4 neutral, <= 3 bad
  let bavVerdict = 'neutral'
  let bavEmphasis = null
  if (bavRekhas >= 5) {
    bavVerdict = 'good'
    if (bavRekhas >= 6) bavEmphasis = 'invariably excellent'
  } else if (bavRekhas <= 3) {
    bavVerdict = 'bad'
    if (bavRekhas <= 1) bavEmphasis = 'invariably very poor'
  }

  // SAV dominance: > 30 favorable, < 25 unfavorable
  const savDominant = savRekhas > 30 || savRekhas < 25
  const savVerdict = savRekhas > 30 ? 'favorable' : savRekhas < 25 ? 'unfavorable' : null

  // Combined Parashari verdict
  let finalVerdict = savDominant ? savVerdict : bavVerdict
  let decidedBy = savDominant ? 'SAV' : 'BAV'

  // Score normalized 0 - 100 for visual telemetry
  // BAV contributes 50%, SAV contributes 50%
  const bavPercent = Math.min(100, Math.max(0, (bavRekhas / 8) * 100))
  const savPercent = Math.min(100, Math.max(0, ((savRekhas - 18) / 24) * 100))
  const transitScore = Math.round(bavPercent * 0.5 + savPercent * 0.5)

  return {
    bavRekhas,
    bavVerdict,
    bavEmphasis,
    savRekhas,
    savDominant,
    savVerdict,
    decidedBy,
    finalVerdict,
    transitScore,
  }
}

/**
 * Evaluates Saturn Sade Sati, Kantaka Shani, and Ashtama/Ardhashtama Shani
 */
function evaluateSaturnSadeSati(saturnTransit, natalMoon, natalLagnaSign) {
  if (!saturnTransit || !natalMoon) {
    return {
      sadeSati: {
        isActive: false,
        phase: 'none',
        phaseNumber: 0,
        phaseName: 'Inactive',
        sanskritName: 'Nir-mukta',
        intensity: 'None',
        description: 'Saturn is currently not traversing the 12th, 1st, or 2nd house from natal Moon.',
        degreeOrb: 0,
        isExactOrb: false,
        advice: ['Saturn is operating outside your Janma Moon sanctuary. Focus on constructive long-term building.'],
        remedies: ['Perform Saturday charity or chanting Shani Stotra for general auspiciousness.'],
      },
      ashtamaShani: { isActive: false, houseFromMoon: 0, description: '' },
      ardhashtamaShani: { isActive: false, houseFromMoon: 0, description: '' },
      kantakaShani: { isActive: false, activeFrom: 'None', houseFromLagna: 0, houseFromMoon: 0, description: '' },
    }
  }

  const sSign = saturnTransit.rasi
  const mMoonSign = natalMoon.signIndex ?? 0
  const houseFromMoon = ((sSign - mMoonSign + 12) % 12) + 1
  const houseFromLagna = ((sSign - natalLagnaSign + 12) % 12) + 1

  // Angular degree separation between transiting Saturn and natal Moon
  const sLon = saturnTransit.longitude ?? 0
  const mLon = natalMoon.longitude ?? 0
  let diff = Math.abs(sLon - mLon)
  if (diff > 180) diff = 360 - diff
  const degreeOrb = Math.round(diff * 100) / 100
  const isExactOrb = houseFromMoon === 1 && degreeOrb <= 5.0

  // 1. Sade Sati Phase Engine
  let sadeSati = {
    isActive: false,
    phase: 'none',
    phaseNumber: 0,
    phaseName: 'Inactive',
    sanskritName: 'Nir-mukta',
    intensity: 'None',
    description: 'Saturn is currently not transiting the 12th, 1st, or 2nd house from your Janma Rasi (Moon).',
    saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
    saturnSignIndex: sSign,
    natalMoonSign: natalMoon.signName || SIGN_NAMES[mMoonSign],
    natalMoonSignIndex: mMoonSign,
    degreeOrb,
    isExactOrb: false,
    advice: [
      'You are free from Sade Sati pressures.',
      'Maintain steady work ethic and ethical foundations to maximize planetary blessings.',
    ],
    remedies: [
      'Maintain regular Saturday discipline and acts of humble service.',
      'Light a sesame oil lamp on Saturdays during evening hours.',
    ],
  }

  if (houseFromMoon === 12) {
    sadeSati = {
      isActive: true,
      phase: 'rising',
      phaseNumber: 1,
      phaseName: 'Rising Phase (12th from Moon)',
      sanskritName: 'Aardha Sade Sati',
      intensity: 'Moderate to High',
      description:
        'Saturn transits the 12th house from your Janma Moon. This marks the entry into the 7.5-year cycle, highlighting mental clearing, unexpected expenditures, sleep rhythm recalibration, and overseas or secluded pursuits.',
      saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
      saturnSignIndex: sSign,
      natalMoonSign: natalMoon.signName || SIGN_NAMES[mMoonSign],
      natalMoonSignIndex: mMoonSign,
      degreeOrb,
      isExactOrb: false,
      advice: [
        'Curate your financial expenditures rigorously; avoid speculative bets or impulsive splurges.',
        'Prioritize deep restorative sleep, meditation, and quiet downtime to protect psychological calm.',
        'Welcome foreign connections, long-distance travels, or introspective retreats.',
      ],
      remedies: [
        'Chant Hanuman Chalisa or Dasharatha Shani Stotra on Tuesday and Saturday evenings.',
        'Feed black sesame seeds or mustard-oil fried bread to stray animals or crows on Saturdays.',
        'Donate dark blankets or footwear to elderly underprivileged individuals.',
      ],
    }
  } else if (houseFromMoon === 1) {
    sadeSati = {
      isActive: true,
      phase: 'peak',
      phaseNumber: 2,
      phaseName: 'Peak Phase (Janma Shani)',
      sanskritName: 'Janma Shani (Core Sade Sati)',
      intensity: isExactOrb ? 'Maximum Intensity (Exact Orb ≤ 5°)' : 'Maximum / Peak',
      description:
        'Saturn transits directly over your Janma Moon sign. This is the culmination and epicenter of the Sade Sati cycle, demanding rigorous self-honesty, emotional fortitude, physical stamina, and mature responsibility.',
      saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
      saturnSignIndex: sSign,
      natalMoonSign: natalMoon.signName || SIGN_NAMES[mMoonSign],
      natalMoonSignIndex: mMoonSign,
      degreeOrb,
      isExactOrb,
      advice: [
        'Pay acute attention to physical well-being, dietary purity, and emotional grounding.',
        'Accept heavy leadership and family duties without resentment; Saturn rewards stoic diligence.',
        'Avoid making radical ego-driven life pivots during exact planetary conjunction orb.',
      ],
      remedies: [
        'Recite the Maha Mrityunjaya Mantra daily 108 times for health protection and mental serenity.',
        'Visit a Lord Shiva or Hanuman shrine on Saturdays and perform water/milk Abhishek.',
        'Serve laborers, sanitation workers, or handicapped individuals with genuine humility.',
      ],
    }
  } else if (houseFromMoon === 2) {
    sadeSati = {
      isActive: true,
      phase: 'setting',
      phaseNumber: 3,
      phaseName: 'Setting Phase (2nd from Moon)',
      sanskritName: 'Antya Sade Sati',
      intensity: 'Moderate',
      description:
        'Saturn transits the 2nd house from your Janma Moon. This is the exit phase of the 7.5-year cycle, focusing upon stabilizing financial reserves, family lineage responsibilities, speech restraint, and steady consolidation.',
      saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
      saturnSignIndex: sSign,
      natalMoonSign: natalMoon.signName || SIGN_NAMES[mMoonSign],
      natalMoonSignIndex: mMoonSign,
      degreeOrb,
      isExactOrb: false,
      advice: [
        'Consolidate earnings into safe, liquid, tangible assets rather than risky ventures.',
        'Practice deliberate softness in speech; avoid abrasive dialogue within close family circles.',
        'Prepare for gradual lifting of burdens as Saturn prepares to cross into the 3rd house of triumph.',
      ],
      remedies: [
        'Donate iron utensils or whole black urad dal to charitable kitchens on Saturdays.',
        'Chant Om Sham Shanaishcharaya Namah 108 times at dusk facing west.',
        'Support elderly family members with medical provisions and compassionate care.',
      ],
    }
  }

  // 2. Ashtama Shani (Saturn in 8th house from Moon)
  const isAshtama = houseFromMoon === 8
  const ashtamaShani = {
    isActive: isAshtama,
    houseFromMoon,
    saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
    description: isAshtama
      ? 'Saturn is transiting the 8th house from Janma Moon (Ashtama Shani). Known in classical Jyotish as an intense transformational period calling for vitality vigilance, emotional depth, handling legacies, and patience against sudden obstacles.'
      : 'Saturn is not currently in Ashtama Shani.',
  }

  // 3. Ardhashtama Shani (Saturn in 4th house from Moon)
  const isArdhashtama = houseFromMoon === 4
  const ardhashtamaShani = {
    isActive: isArdhashtama,
    houseFromMoon,
    saturnSign: saturnTransit.rasi_name || SIGN_NAMES[sSign],
    description: isArdhashtama
      ? 'Saturn is transiting the 4th house from Janma Moon (Ardhashtama Shani). Brings profound domestic recalibration, focus on property/vehicles, maternal health awareness, and learning to anchor inner peace amidst worldly duties.'
      : 'Saturn is not currently in Ardhashtama Shani.',
  }

  // 4. Kantaka Shani (Saturn in Kendra 1, 4, 7, 10 from Lagna or Moon)
  const kendras = [1, 4, 7, 10]
  const isFromLagna = kendras.includes(houseFromLagna)
  const isFromMoon = kendras.includes(houseFromMoon)
  const isKantaka = isFromLagna || isFromMoon
  let activeFrom = 'None'
  if (isFromLagna && isFromMoon) activeFrom = 'Both Lagna & Moon'
  else if (isFromLagna) activeFrom = 'Lagna'
  else if (isFromMoon) activeFrom = 'Moon'

  const kantakaShani = {
    isActive: isKantaka,
    activeFrom,
    houseFromLagna,
    houseFromMoon,
    description: isKantaka
      ? `Saturn is positioned in a Kendra (${activeFrom === 'Both Lagna & Moon' ? `House ${houseFromLagna} from Lagna & House ${houseFromMoon} from Moon` : activeFrom === 'Lagna' ? `House ${houseFromLagna} from Lagna` : `House ${houseFromMoon} from Moon`}), creating Kantaka Shani ("thorn in the foot"). Calls for deliberate deliberation before hasty career, domestic, or relational moves.`
      : 'Saturn is not creating Kantaka Shani.',
  }

  return {
    sadeSati,
    ashtamaShani,
    ardhashtamaShani,
    kantakaShani,
  }
}

/**
 * Evaluates Jupiter Gochara (Guru Gochara) Blessing
 */
function evaluateJupiterGochara(jupiterTransit, natalMoon) {
  if (!jupiterTransit || !natalMoon) {
    return {
      houseFromMoon: 0,
      isFavorable: false,
      status: 'Unknown',
      description: '',
    }
  }

  const jSign = jupiterTransit.rasi
  const mMoonSign = natalMoon.signIndex ?? 0
  const houseFromMoon = ((jSign - mMoonSign + 12) % 12) + 1
  const favorableHouses = [2, 5, 7, 9, 11]
  const isFavorable = favorableHouses.includes(houseFromMoon)

  return {
    houseFromMoon,
    isFavorable,
    status: isFavorable ? 'Auspicious Guru Blessing' : 'Guarded Guru Transit',
    description: isFavorable
      ? `Jupiter is transiting house ${houseFromMoon} from Janma Moon, providing divine protection, wisdom, financial cushion, and mitigating harsh planetary transits.`
      : `Jupiter is transiting house ${houseFromMoon} from Janma Moon, advising principled conduct, patience in expansion, and avoiding overly idealistic commitments.`,
  }
}

/**
 * Builds Full Live Gochara (Transits) and Ashtakavarga Evaluation
 */
function buildLiveGocharaReport(rawTransitRasi, natalChart, transitDate, transitPlace) {
  if (!rawTransitRasi || !natalChart) {
    throw new Error('rawTransitRasi and natalChart are required to compute transits')
  }

  const natalLagnaSign = natalChart.lagna?.signIndex ?? 0
  const natalMoon = (natalChart.planets || []).find((p) => p.name === 'Moon') || {
    signIndex: 0,
    longitude: 0,
    signName: 'Aries',
  }
  const natalMoonSign = natalMoon.signIndex ?? 0

  const transitLagna = rawTransitRasi.lagna || null
  const transitLagnaSign = transitLagna?.rasi ?? 0

  // 1. Map all transiting grahas
  const transitingPlanets = (rawTransitRasi.grahas || []).map((g) => {
    const transitSignIndex = g.rasi
    const houseFromNatalLagna = ((transitSignIndex - natalLagnaSign + 12) % 12) + 1
    const houseFromNatalMoon = ((transitSignIndex - natalMoonSign + 12) % 12) + 1

    // Classical BPHS 25.2 snapshot & effects
    const table = GOCHARA_TABLES[g.name]
    let gocharaSnapshot = 'Neutral'
    let gocharaEffect = 'Standard transit influences apply.'
    let isClassicalGood = false

    if (table && table.results[houseFromNatalMoon]) {
      gocharaSnapshot = table.results[houseFromNatalMoon].snapshot
      gocharaEffect = table.results[houseFromNatalMoon].effect
      isClassicalGood = table.goodHouses.includes(houseFromNatalMoon)
    }

    // Ashtakavarga Transit Evaluation (BAV + SAV)
    const ashtakavarga = evaluateTransitAshtakavarga(g.name, transitSignIndex, natalChart.ashtakavarga)

    // Natal planet in the same sign?
    const natalConjunct = (natalChart.planets || [])
      .filter((np) => np.signIndex === transitSignIndex)
      .map((np) => np.name)

    return {
      id: g.id,
      name: g.name,
      longitude: g.longitude,
      latitude: g.latitude,
      speed: g.speed,
      retrograde: Boolean(g.retrograde),
      signIndex: transitSignIndex,
      signName: g.rasi_name || SIGN_NAMES[transitSignIndex],
      degreesInSign: g.degrees_in_rasi,
      dms: g.dms,
      nakshatra: g.nakshatra,
      nakshatraName: g.nakshatra_name,
      pada: g.pada,
      dignity: g.dignity,
      combust: Boolean(g.combust),
      houseFromNatalLagna,
      houseFromNatalMoon,
      gocharaSnapshot,
      gocharaEffect,
      isClassicalGood,
      ashtakavarga,
      natalConjunct,
    }
  })

  // 2. Saturn & Shani Afflictions
  const transitingSaturn = (rawTransitRasi.grahas || []).find((g) => g.name === 'Saturn')
  const shaniReport = evaluateSaturnSadeSati(transitingSaturn, natalMoon, natalLagnaSign)

  // 3. Jupiter Gochara
  const transitingJupiter = (rawTransitRasi.grahas || []).find((g) => g.name === 'Jupiter')
  const guruReport = evaluateJupiterGochara(transitingJupiter, natalMoon)

  // 4. Construct Dual-Wheel Layout per Sign and per House
  const dualWheelHouses = []
  for (let h = 1; h <= 12; h++) {
    const signIdx = (natalLagnaSign + (h - 1)) % 12
    const natalPlanetsInHouse = (natalChart.planets || []).filter((p) => p.signIndex === signIdx)
    const transitPlanetsInHouse = transitingPlanets.filter((p) => p.signIndex === signIdx)
    const savRekhas = natalChart.ashtakavarga?.sarvashtakavarga?.rekhas?.[signIdx] ?? 28

    dualWheelHouses.push({
      houseNumber: h,
      signIndex: signIdx,
      signName: SIGN_NAMES[signIdx],
      houseFromMoon: ((signIdx - natalMoonSign + 12) % 12) + 1,
      savRekhas,
      natalPlanets: natalPlanetsInHouse.map((p) => ({
        name: p.name,
        dms: p.dms || `${Math.floor(p.degreesInSign || 0)}°`,
        retrograde: Boolean(p.retrograde),
      })),
      transitPlanets: transitPlanetsInHouse.map((p) => ({
        name: p.name,
        dms: p.dms,
        retrograde: p.retrograde,
        speed: p.speed,
        verdict: p.ashtakavarga.finalVerdict,
      })),
    })
  }

  // 5. Overall Transit Health Score
  const totalScore = transitingPlanets.reduce((acc, p) => acc + (p.ashtakavarga?.transitScore || 50), 0)
  const averageTransitScore = Math.round(totalScore / (transitingPlanets.length || 1))

  return {
    transitEpoch: {
      timestamp: transitDate ? new Date(transitDate).toISOString() : new Date().toISOString(),
      place: transitPlace || natalChart.birthData?.place || { name: 'New Delhi', latitude: 28.6139, longitude: 77.209 },
      transitLagna: transitLagna
        ? {
            signIndex: transitLagnaSign,
            signName: transitLagna.rasi_name || SIGN_NAMES[transitLagnaSign],
            degreesInSign: transitLagna.degrees_in_rasi,
            dms: transitLagna.dms,
            houseFromNatalLagna: ((transitLagnaSign - natalLagnaSign + 12) % 12) + 1,
          }
        : null,
    },
    natalReference: {
      chartName: natalChart.name,
      natalLagna: {
        signIndex: natalLagnaSign,
        signName: SIGN_NAMES[natalLagnaSign],
      },
      natalMoon: {
        signIndex: natalMoonSign,
        signName: natalMoon.signName || SIGN_NAMES[natalMoonSign],
        longitude: natalMoon.longitude,
        dms: natalMoon.dms,
      },
    },
    transitingPlanets,
    sadeSati: shaniReport.sadeSati,
    ashtamaShani: shaniReport.ashtamaShani,
    ardhashtamaShani: shaniReport.ardhashtamaShani,
    kantakaShani: shaniReport.kantakaShani,
    guruGochara: guruReport,
    dualWheelHouses,
    summary: {
      averageTransitScore,
      favorableCount: transitingPlanets.filter((p) => p.ashtakavarga?.finalVerdict === 'good' || p.ashtakavarga?.finalVerdict === 'favorable').length,
      unfavorableCount: transitingPlanets.filter((p) => p.ashtakavarga?.finalVerdict === 'bad' || p.ashtakavarga?.finalVerdict === 'unfavorable').length,
      neutralCount: transitingPlanets.filter((p) => p.ashtakavarga?.finalVerdict === 'neutral').length,
      isSadeSatiActive: shaniReport.sadeSati.isActive,
      isAshtamaShaniActive: shaniReport.ashtamaShani.isActive,
      isGuruFavorable: guruReport.isFavorable,
    },
  }
}

module.exports = {
  GOCHARA_TABLES,
  evaluateTransitAshtakavarga,
  evaluateSaturnSadeSati,
  evaluateJupiterGochara,
  buildLiveGocharaReport,
}

