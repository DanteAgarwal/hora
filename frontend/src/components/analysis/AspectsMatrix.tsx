import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetPosition, HousePosition } from '../../types/astro'

interface AspectsMatrixProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface AspectDetail {
  houseDistance: number
  virupas: number // 0 - 60
  strengthLabel: string
  isSpecial: boolean
  isFull: boolean
  casterType: 'benefic' | 'malefic'
  casterFunctional?: string
  description: string
}

const GRAHA_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

export const AspectsMatrix: React.FC<AspectsMatrixProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [viewMode, setViewMode] = useState<'bhavas' | 'mutual'>('bhavas')
  const [filterType, setFilterType] = useState<'all' | 'fullOnly' | 'benefic' | 'malefic'>('all')
  const [selectedGraha, setSelectedGraha] = useState<string | null>(null)
  const [selectedBhava, setSelectedBhava] = useState<number | null>(null)

  const planetsMap = useMemo(() => {
    const map = new Map<string, PlanetPosition>()
    chart.planets.forEach((p) => map.set(p.name, p))
    return map
  }, [chart.planets])

  const housesMap = useMemo(() => {
    const map = new Map<number, HousePosition>()
    chart.houses.forEach((h) => map.set(h.number, h))
    return map
  }, [chart.houses])

  // Determine whether planet is natural benefic or malefic
  const getCasterNature = (planetName: string): 'benefic' | 'malefic' => {
    if (['Jupiter', 'Venus'].includes(planetName)) return 'benefic'
    if (['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'].includes(planetName)) return 'malefic'
    if (planetName === 'Mercury') {
      // Benefic unless conjunct malefic
      const merc = planetsMap.get('Mercury')
      if (merc) {
        const conjunctMalefic = chart.planets.some(
          (p) => p.houseNumber === merc.houseNumber && ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'].includes(p.name)
        )
        return conjunctMalefic ? 'malefic' : 'benefic'
      }
      return 'benefic'
    }
    if (planetName === 'Moon') {
      // Natural benefic unless deeply waning
      return 'benefic'
    }
    return 'benefic'
  }

  // Calculate Parashari Drishti from planet to house
  const calculateAspect = (caster: PlanetPosition, targetHouseNum: number): AspectDetail | null => {
    const distance = ((targetHouseNum - caster.houseNumber + 12) % 12) + 1
    const casterNature = getCasterNature(caster.name)

    if (distance === 1) {
      // Sthita (occupying)
      return {
        houseDistance: 1,
        virupas: 60,
        strengthLabel: 'Occupies',
        isSpecial: false,
        isFull: true,
        casterType: casterNature,
        description: `Occupies ${caster.houseOrdinal} house directly`,
      }
    }

    // 7th Full aspect for all planets
    if (distance === 7) {
      return {
        houseDistance: 7,
        virupas: 60,
        strengthLabel: '7th Full (60v)',
        isSpecial: false,
        isFull: true,
        casterType: casterNature,
        description: 'Universal 7th House Full Drishti (100% influence)',
      }
    }

    // Mars special aspects: 4th and 8th
    if (caster.name === 'Mars' && (distance === 4 || distance === 8)) {
      return {
        houseDistance: distance,
        virupas: 60,
        strengthLabel: `${distance}th Special (60v)`,
        isSpecial: true,
        isFull: true,
        casterType: 'malefic',
        description: `Mars Special Full Drishti on ${distance}th house`,
      }
    }

    // Jupiter & Rahu/Ketu special aspects: 5th and 9th (Trikona Drishti)
    if (['Jupiter', 'Rahu', 'Ketu'].includes(caster.name) && (distance === 5 || distance === 9)) {
      return {
        houseDistance: distance,
        virupas: 60,
        strengthLabel: `${distance}th Special (60v)`,
        isSpecial: true,
        isFull: true,
        casterType: casterNature,
        description: `${caster.name} Special Full Drishti on ${distance}th house`,
      }
    }

    // Saturn special aspects: 3rd and 10th
    if (caster.name === 'Saturn' && (distance === 3 || distance === 10)) {
      return {
        houseDistance: distance,
        virupas: 60,
        strengthLabel: `${distance}th Special (60v)`,
        isSpecial: true,
        isFull: true,
        casterType: 'malefic',
        description: `Saturn Special Full Drishti on ${distance}th house`,
      }
    }

    // Partial Aspects (Virupas)
    if (distance === 3 || distance === 10) {
      return {
        houseDistance: distance,
        virupas: 30,
        strengthLabel: `${distance}th Partial (30v)`,
        isSpecial: false,
        isFull: false,
        casterType: casterNature,
        description: `Partial Drishti (50% strength) on ${distance}th house`,
      }
    }

    if (distance === 5 || distance === 9) {
      return {
        houseDistance: distance,
        virupas: 30,
        strengthLabel: `${distance}th Partial (30v)`,
        isSpecial: false,
        isFull: false,
        casterType: casterNature,
        description: `Partial Drishti (50% strength) on ${distance}th house`,
      }
    }

    if (distance === 4 || distance === 8) {
      return {
        houseDistance: distance,
        virupas: 15,
        strengthLabel: `${distance}th Quarter (15v)`,
        isSpecial: false,
        isFull: false,
        casterType: casterNature,
        description: `Quarter Drishti (25% strength) on ${distance}th house`,
      }
    }

    return null
  }

  // Calculate mutual aspect between two planets
  const calculateMutualAspect = (pA: PlanetPosition, pB: PlanetPosition) => {
    if (pA.name === pB.name) return null
    const aspectAtoB = calculateAspect(pA, pB.houseNumber)
    const aspectBtoA = calculateAspect(pB, pA.houseNumber)

    return {
      aToB: aspectAtoB,
      bToA: aspectBtoA,
      isMutual: Boolean(aspectAtoB && aspectBtoA && aspectAtoB.isFull && aspectBtoA.isFull),
      isConjunction: pA.houseNumber === pB.houseNumber,
    }
  }

  return (
    <div className="aspects-matrix-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header controls & Legend */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
              border: '1px solid rgba(212, 171, 92, 0.3)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.25rem',
            }}
          >
            👁️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Graha Drishti Matrix (Parashari Planetary Aspects)
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Full 7th aspects & special graha drishti (Mars 4/8, Jupiter/Nodes 5/9, Saturn 3/10) with virupa strengths
            </p>
          </div>
        </div>

        {/* View Toggle and Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              onClick={() => setViewMode('bhavas')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 0,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: viewMode === 'bhavas' ? '#d4ab5c' : 'transparent',
                color: viewMode === 'bhavas' ? '#0f172a' : '#cbd5e1',
                transition: 'all 0.15s ease',
              }}
            >
              Graha → Bhava (9×12)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mutual')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 0,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: viewMode === 'mutual' ? '#d4ab5c' : 'transparent',
                color: viewMode === 'mutual' ? '#0f172a' : '#cbd5e1',
                transition: 'all 0.15s ease',
              }}
            >
              Mutual Grahas (9×9)
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'fullOnly', 'benefic', 'malefic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterType(mode)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: filterType === mode ? '#d4ab5c' : 'rgba(255, 255, 255, 0.1)',
                  background: filterType === mode ? 'rgba(212, 171, 92, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: filterType === mode ? '#fbbf24' : '#94a3b8',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {mode === 'all'
                  ? 'All Aspects'
                  : mode === 'fullOnly'
                  ? 'Full (60v) Only'
                  : mode === 'benefic'
                  ? '✨ Benefic'
                  : '⚡ Malefic'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend strip */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: '0.78rem',
          color: '#cbd5e1',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} />
          <strong>Benefic Aspect</strong> (Jupiter, Venus, Mercury, Moon)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#f43f5e' }} />
          <strong>Malefic Aspect</strong> (Saturn, Mars, Rahu, Ketu, Sun)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#fbbf24' }} />
          <strong>Special Full Aspect</strong> (Mars 4/8, Jupiter 5/9, Saturn 3/10)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255, 255, 255, 0.2)' }} />
          <strong>Sthita</strong> (Occupant)
        </span>
      </div>

      {/* View 1: Graha -> Bhava 9x12 Grid */}
      {viewMode === 'bhavas' && (
        <div className="panel" style={{ padding: 18, borderRadius: 14, overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 1050,
              borderCollapse: 'separate',
              borderSpacing: 3,
              fontSize: '0.8rem',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#e2e8f0',
                    borderRadius: 6,
                    minWidth: 160,
                  }}
                >
                  Graha (Position)
                </th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
                  const house = housesMap.get(hNum)
                  const isHighlighted = selectedBhava === hNum
                  return (
                    <th
                      key={hNum}
                      onClick={() => {
                        setSelectedBhava(selectedBhava === hNum ? null : hNum)
                        if (onSelectHouse) onSelectHouse(hNum)
                      }}
                      style={{
                        padding: '8px 6px',
                        textAlign: 'center',
                        background: isHighlighted ? 'rgba(212, 171, 92, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isHighlighted ? '1px solid #d4ab5c' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isHighlighted ? '#fbbf24' : '#f8fafc',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        minWidth: 70,
                      }}
                      title={`Inspect ${house?.name || `House ${hNum}`}`}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>H{hNum}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {house?.sign?.slice(0, 3) || '—'}
                      </div>
                      {house && house.occupants.length > 0 && (
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: '#38bdf8',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {house.occupants.map((o) => o.slice(0, 2)).join(',')}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {GRAHA_ORDER.map((grahaName) => {
                const planet = planetsMap.get(grahaName)
                if (!planet) return null
                const isPlanetSelected = selectedGraha === grahaName
                const casterNature = getCasterNature(grahaName)

                return (
                  <tr key={grahaName}>
                    <td
                      onClick={() => {
                        setSelectedGraha(selectedGraha === grahaName ? null : grahaName)
                        if (onSelectPlanet) onSelectPlanet(grahaName)
                      }}
                      style={{
                        padding: '10px 12px',
                        background: isPlanetSelected ? 'rgba(212, 171, 92, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isPlanetSelected ? '1px solid #d4ab5c' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: '1rem',
                            color: casterNature === 'benefic' ? '#10b981' : '#f43f5e',
                          }}
                        >
                          {planet.symbol}
                        </span>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{grahaName}</strong>
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: '0.7rem',
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: casterNature === 'benefic' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                              color: casterNature === 'benefic' ? '#34d399' : '#fb7185',
                            }}
                          >
                            {casterNature === 'benefic' ? 'Benefic' : 'Malefic'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            In {planet.houseOrdinal} ({planet.sign})
                          </div>
                        </div>
                      </div>
                    </td>

                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
                      const aspect = calculateAspect(planet, hNum)
                      const house = housesMap.get(hNum)
                      const isOccupant = planet.houseNumber === hNum

                      // Apply active filter
                      let passesFilter = true
                      if (filterType === 'fullOnly' && aspect && !aspect.isFull) passesFilter = false
                      if (filterType === 'benefic' && aspect && aspect.casterType !== 'benefic') passesFilter = false
                      if (filterType === 'malefic' && aspect && aspect.casterType !== 'malefic') passesFilter = false

                      if (!passesFilter || !aspect) {
                        return (
                          <td
                            key={hNum}
                            style={{
                              padding: 6,
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.01)',
                              borderRadius: 6,
                              color: '#475569',
                              fontSize: '0.75rem',
                            }}
                          >
                            ·
                          </td>
                        )
                      }

                      const isBenefic = aspect.casterType === 'benefic'
                      const isFull = aspect.isFull
                      const isSpecial = aspect.isSpecial

                      const bg = isOccupant
                        ? 'rgba(255, 255, 255, 0.08)'
                        : isBenefic
                        ? isFull
                          ? 'rgba(16, 185, 129, 0.18)'
                          : 'rgba(16, 185, 129, 0.07)'
                        : isFull
                        ? 'rgba(244, 63, 94, 0.18)'
                        : 'rgba(244, 63, 94, 0.07)'

                      const borderColor = isOccupant
                        ? 'rgba(255, 255, 255, 0.2)'
                        : isSpecial
                        ? '#fbbf24'
                        : isBenefic
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(244, 63, 94, 0.35)'

                      const textColor = isOccupant
                        ? '#e2e8f0'
                        : isSpecial
                        ? '#fbbf24'
                        : isBenefic
                        ? '#34d399'
                        : '#fb7185'

                      return (
                        <td
                          key={hNum}
                          onClick={() => {
                            if (onSelectHouse) onSelectHouse(hNum)
                          }}
                          style={{
                            padding: '6px 4px',
                            textAlign: 'center',
                            background: bg,
                            border: `1px solid ${borderColor}`,
                            borderRadius: 6,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title={`${planet.name} → House ${hNum}: ${aspect.description}`}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.72rem', color: textColor }}>
                            {isOccupant ? 'Sthita' : aspect.strengthLabel.split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>
                            {isOccupant ? 'Occupant' : `${aspect.virupas}v`}
                          </div>
                          {house && house.occupants.length > 0 && !isOccupant && aspect.isFull && (
                            <div
                              style={{
                                fontSize: '0.62rem',
                                color: '#38bdf8',
                                marginTop: 2,
                                fontWeight: 600,
                              }}
                              title={`Aspecting occupants: ${house.occupants.join(', ')}`}
                            >
                              →{house.occupants[0].slice(0, 2)}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Mutual Planetary Aspects 9x9 Grid */}
      {viewMode === 'mutual' && (
        <div className="panel" style={{ padding: 18, borderRadius: 14, overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 850,
              borderCollapse: 'separate',
              borderSpacing: 3,
              fontSize: '0.8rem',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#e2e8f0',
                    borderRadius: 6,
                    minWidth: 120,
                  }}
                >
                  Graha (Caster)
                </th>
                {GRAHA_ORDER.map((targetName) => {
                  const targetPlanet = planetsMap.get(targetName)
                  if (!targetPlanet) return null
                  return (
                    <th
                      key={targetName}
                      onClick={() => {
                        if (onSelectPlanet) onSelectPlanet(targetName)
                      }}
                      style={{
                        padding: '8px 6px',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#f8fafc',
                        borderRadius: 6,
                        cursor: 'pointer',
                        minWidth: 70,
                      }}
                      title={`Target: ${targetName} (in H${targetPlanet.houseNumber})`}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{targetPlanet.short}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>H{targetPlanet.houseNumber}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {GRAHA_ORDER.map((casterName) => {
                const casterPlanet = planetsMap.get(casterName)
                if (!casterPlanet) return null
                const casterNature = getCasterNature(casterName)

                return (
                  <tr key={casterName}>
                    <td
                      onClick={() => {
                        if (onSelectPlanet) onSelectPlanet(casterName)
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: casterNature === 'benefic' ? '#10b981' : '#f43f5e' }}>
                          {casterPlanet.symbol}
                        </span>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.82rem' }}>{casterName}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 4 }}>
                            (H{casterPlanet.houseNumber})
                          </span>
                        </div>
                      </div>
                    </td>

                    {GRAHA_ORDER.map((targetName) => {
                      const targetPlanet = planetsMap.get(targetName)
                      if (!targetPlanet) return null

                      if (casterName === targetName) {
                        return (
                          <td
                            key={targetName}
                            style={{
                              padding: 6,
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: 6,
                              color: '#64748b',
                              fontSize: '0.75rem',
                            }}
                          >
                            —
                          </td>
                        )
                      }

                      const mutual = calculateMutualAspect(casterPlanet, targetPlanet)
                      if (!mutual) return null

                      if (mutual.isConjunction) {
                        return (
                          <td
                            key={targetName}
                            style={{
                              padding: '6px 4px',
                              textAlign: 'center',
                              background: 'rgba(212, 171, 92, 0.18)',
                              border: '1px solid rgba(212, 171, 92, 0.35)',
                              borderRadius: 6,
                              color: '#fbbf24',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                            title={`Conjunct in ${casterPlanet.houseOrdinal} house`}
                          >
                            Conjunct
                            <div style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>H{casterPlanet.houseNumber}</div>
                          </td>
                        )
                      }

                      const aspect = mutual.aToB
                      if (!aspect) {
                        return (
                          <td
                            key={targetName}
                            style={{
                              padding: 6,
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.01)',
                              borderRadius: 6,
                              color: '#475569',
                              fontSize: '0.75rem',
                            }}
                          >
                            ·
                          </td>
                        )
                      }

                      const isBenefic = aspect.casterType === 'benefic'
                      const isMutual = mutual.isMutual

                      return (
                        <td
                          key={targetName}
                          style={{
                            padding: '6px 4px',
                            textAlign: 'center',
                            background: isMutual
                              ? isBenefic
                                ? 'rgba(16, 185, 129, 0.28)'
                                : 'rgba(244, 63, 94, 0.28)'
                              : isBenefic
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(244, 63, 94, 0.12)',
                            border: isMutual
                              ? `1px solid ${isBenefic ? '#10b981' : '#f43f5e'}`
                              : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 6,
                            color: isBenefic ? '#34d399' : '#fb7185',
                            fontWeight: aspect.isFull ? 700 : 500,
                            fontSize: '0.72rem',
                          }}
                          title={`${casterName} casts ${aspect.strengthLabel} on ${targetName}${isMutual ? ' (MUTUAL ASPECT!)' : ''}`}
                        >
                          <div>{aspect.strengthLabel.split(' ')[0]}</div>
                          {isMutual && (
                            <div style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 800 }}>
                              ⇄ Mutual
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
