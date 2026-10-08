import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetPosition, DignityType } from '../../types/astro'

interface DignityStrengthOverviewProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface PlanetDignityData {
  planet: PlanetPosition
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
  dispositorPlanet?: PlanetPosition
}

// Classical Digbala peak houses
const DIGBALA_PEAK: Record<string, number> = {
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

// Classical Combustion orbs from Sun
const COMBUSTION_ORBS: Record<string, number> = {
  Moon: 12,
  Mars: 17,
  Mercury: 14, // 12 if retrograde
  Jupiter: 11,
  Venus: 10, // 8 if retrograde
  Saturn: 15,
}

export const DignityStrengthOverview: React.FC<DignityStrengthOverviewProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [filterDignity, setFilterDignity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'order' | 'digbala' | 'combustion' | 'dignity'>('order')

  const planetsMap = useMemo(() => {
    const map = new Map<string, PlanetPosition>()
    chart.planets.forEach((p) => map.set(p.name, p))
    return map
  }, [chart.planets])

  const sun = planetsMap.get('Sun')
  const moon = planetsMap.get('Moon')

  // Detailed analysis of each planet
  const enrichedPlanets: PlanetDignityData[] = useMemo(() => {
    return chart.planets.map((planet) => {
      const isExalted = planet.dignity === 'Exalted'
      const isMoolatrikona = planet.dignity === 'Moolatrikona'
      const isOwnSign = planet.dignity === 'Own Sign'
      const isDebilitated = planet.dignity === 'Debilitated'

      // Check for Neecha Bhanga (Cancellation of Debilitation)
      let isNeechaBhanga = false
      let neechaBhangaReason = ''

      if (isDebilitated) {
        // Rule 1: Dispositor is in a Kendra from Lagna or Moon
        const dispositor = planetsMap.get(planet.dispositor)
        if (dispositor && [1, 4, 7, 10].includes(dispositor.houseNumber)) {
          isNeechaBhanga = true
          neechaBhangaReason = `Dispositor ${dispositor.name} occupies Kendra (H${dispositor.houseNumber}) from Lagna.`
        } else if (dispositor && moon) {
          const diffFromMoon = ((dispositor.houseNumber - moon.houseNumber + 12) % 12) + 1
          if ([1, 4, 7, 10].includes(diffFromMoon)) {
            isNeechaBhanga = true
            neechaBhangaReason = `Dispositor ${dispositor.name} occupies Kendra (H${diffFromMoon}) from Moon.`
          }
        }

        // Rule 2: Planet is in Kendra from Lagna or Moon
        if (!isNeechaBhanga && [1, 4, 7, 10].includes(planet.houseNumber)) {
          isNeechaBhanga = true
          neechaBhangaReason = `Planet itself is in a Kendra (H${planet.houseNumber}), providing institutional strength.`
        }
      }

      // Combustion analysis
      let combustionDegrees: number | undefined
      let combustionStatus: PlanetDignityData['combustionStatus'] = 'Exempt'

      if (!['Sun', 'Rahu', 'Ketu', 'Lagna'].includes(planet.name) && sun) {
        let diff = Math.abs(planet.longitude - sun.longitude)
        if (diff > 180) diff = 360 - diff
        combustionDegrees = diff

        const maxOrb = COMBUSTION_ORBS[planet.name] || 12
        if (diff < 3.5) {
          combustionStatus = 'Deeply Combust'
        } else if (diff < maxOrb * 0.65) {
          combustionStatus = 'Combust'
        } else if (diff < maxOrb) {
          combustionStatus = 'Mildly Combust'
        } else {
          combustionStatus = 'Safe'
        }
      }

      // Digbala (Directional Strength)
      const peakHouse = DIGBALA_PEAK[planet.name] || 1
      const distFromPeak = Math.min(
        Math.abs(planet.houseNumber - peakHouse),
        12 - Math.abs(planet.houseNumber - peakHouse)
      ) // 0 to 6
      // 0 diff = 100%, 6 diff (opposite) = 0%
      const digbalaScore = Math.round(((6 - distFromPeak) / 6) * 100)

      let digbalaStatus: PlanetDignityData['digbalaStatus'] = 'Moderate'
      if (distFromPeak === 0) digbalaStatus = 'Full Digbala'
      else if (distFromPeak === 1) digbalaStatus = 'High Digbala'
      else if (distFromPeak === 6) digbalaStatus = 'Zero Digbala'

      return {
        planet,
        dignity: planet.dignity,
        isExalted,
        isMoolatrikona,
        isOwnSign,
        isDebilitated,
        isNeechaBhanga,
        neechaBhangaReason,
        isRetrograde: planet.retrograde,
        isCombust: combustionStatus === 'Deeply Combust' || combustionStatus === 'Combust',
        combustionDegrees,
        combustionStatus,
        digbalaScore,
        digbalaPeakHouse: peakHouse,
        digbalaStatus,
        dispositor: planet.dispositor,
        dispositorPlanet: planetsMap.get(planet.dispositor),
      }
    })
  }, [chart.planets, planetsMap, sun, moon])

  // Count aggregates
  const stats = useMemo(() => {
    return {
      exalted: enrichedPlanets.filter((p) => p.isExalted).length,
      ownSign: enrichedPlanets.filter((p) => p.isOwnSign || p.isMoolatrikona).length,
      debilitated: enrichedPlanets.filter((p) => p.isDebilitated).length,
      neechaBhanga: enrichedPlanets.filter((p) => p.isNeechaBhanga).length,
      retrograde: enrichedPlanets.filter((p) => p.isRetrograde).length,
      combust: enrichedPlanets.filter((p) => p.isCombust).length,
      fullDigbala: enrichedPlanets.filter((p) => p.digbalaStatus === 'Full Digbala').length,
    }
  }, [enrichedPlanets])

  // Filter & Sort
  const filteredPlanets = useMemo(() => {
    let list = [...enrichedPlanets]

    if (filterDignity === 'exalted') list = list.filter((p) => p.isExalted)
    else if (filterDignity === 'own') list = list.filter((p) => p.isOwnSign || p.isMoolatrikona)
    else if (filterDignity === 'debilitated') list = list.filter((p) => p.isDebilitated)
    else if (filterDignity === 'retrograde') list = list.filter((p) => p.isRetrograde)
    else if (filterDignity === 'combust') list = list.filter((p) => p.isCombust)
    else if (filterDignity === 'digbala') list = list.filter((p) => p.digbalaStatus === 'Full Digbala' || p.digbalaStatus === 'High Digbala')

    if (sortBy === 'digbala') {
      list.sort((a, b) => b.digbalaScore - a.digbalaScore)
    } else if (sortBy === 'combustion') {
      list.sort((a, b) => (a.combustionDegrees ?? 999) - (b.combustionDegrees ?? 999))
    } else if (sortBy === 'dignity') {
      const order = ['Exalted', 'Moolatrikona', 'Own Sign', 'Great Friend', 'Friend', 'Neutral', 'Enemy', 'Debilitated']
      list.sort((a, b) => order.indexOf(a.dignity) - order.indexOf(b.dignity))
    }

    return list
  }, [enrichedPlanets, filterDignity, sortBy])

  return (
    <div className="dignity-strength-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* KPI Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        {/* Exalted */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'exalted' ? 'all' : 'exalted')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'exalted' ? '1px solid #fbbf24' : '1px solid rgba(251, 191, 36, 0.2)',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              👑 Uchcha (Exalted)
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{stats.exalted}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {enrichedPlanets.filter((p) => p.isExalted).map((p) => p.planet.short).join(', ') || 'None'}
          </div>
        </div>

        {/* Own Sign / Moolatrikona */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'own' ? 'all' : 'own')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'own' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              🏠 Swakshetra / MT
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{stats.ownSign}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {enrichedPlanets.filter((p) => p.isOwnSign || p.isMoolatrikona).map((p) => p.planet.short).join(', ') || 'None'}
          </div>
        </div>

        {/* Debilitated & Neecha Bhanga */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'debilitated' ? 'all' : 'debilitated')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'debilitated' ? '1px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.2)',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              ⚠️ Neecha (Debil.)
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb7185' }}>{stats.debilitated}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {stats.neechaBhanga > 0
              ? `${stats.neechaBhanga} cancelled (Bhanga)`
              : enrichedPlanets.filter((p) => p.isDebilitated).map((p) => p.planet.short).join(', ') || 'None'}
          </div>
        </div>

        {/* Retrograde Motions */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'retrograde' ? 'all' : 'retrograde')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'retrograde' ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.2)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              🔄 Vakri [R]
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{stats.retrograde}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {enrichedPlanets.filter((p) => p.isRetrograde).map((p) => p.planet.short).join(', ') || 'All Direct'}
          </div>
        </div>

        {/* Combustions */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'combust' ? 'all' : 'combust')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'combust' ? '1px solid #f97316' : '1px solid rgba(249, 115, 22, 0.2)',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#fb923c', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              🔥 Asta (Combust)
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb923c' }}>{stats.combust}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {enrichedPlanets.filter((p) => p.isCombust).map((p) => p.planet.short).join(', ') || 'None combust'}
          </div>
        </div>

        {/* Directional Strength (Digbala) */}
        <div
          onClick={() => setFilterDignity(filterDignity === 'digbala' ? 'all' : 'digbala')}
          className="panel"
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            border: filterDignity === 'digbala' ? '1px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.2)',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(17, 21, 28, 0.8))',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              🧭 Digbala
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc' }}>{stats.fullDigbala}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
            {enrichedPlanets.filter((p) => p.digbalaStatus === 'Full Digbala').map((p) => p.planet.short).join(', ') || 'None in peak'}
          </div>
        </div>
      </div>

      {/* Main Table and Details Panel */}
      <div className="panel" style={{ padding: 20, borderRadius: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
              Planetary Dignity & Strength Ledger
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Showing {filteredPlanets.length} grahas • Exaltation, Retrograde motion, Combustion, Digbala & Dispositor alignment
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.8rem',
              }}
            >
              <option value="order">Standard Order</option>
              <option value="dignity">Dignity Priority</option>
              <option value="digbala">Digbala %</option>
              <option value="combustion">Sun Proximity</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: 900,
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Graha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Placement</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Dignity (Avastha)</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#94a3b8' }}>Motion</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Combustion</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Digbala</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Dispositor</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlanets.map((item) => {
                const { planet } = item
                const isExalted = item.isExalted
                const isOwn = item.isOwnSign || item.isMoolatrikona
                const isDebil = item.isDebilitated

                const dignityBadgeBg = isExalted
                  ? 'rgba(251, 191, 36, 0.18)'
                  : isOwn
                  ? 'rgba(16, 185, 129, 0.18)'
                  : isDebil
                  ? 'rgba(244, 63, 94, 0.18)'
                  : 'rgba(255, 255, 255, 0.05)'

                const dignityBadgeColor = isExalted
                  ? '#fbbf24'
                  : isOwn
                  ? '#34d399'
                  : isDebil
                  ? '#fb7185'
                  : '#cbd5e1'

                return (
                  <tr
                    key={planet.name}
                    onClick={() => onSelectPlanet && onSelectPlanet(planet.name)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Planet Column */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{planet.symbol}</span>
                        <div>
                          <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>{planet.name}</strong>
                          <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                            {planet.sanskritName} • {planet.short}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Placement */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {planet.sign} {planet.dms}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSelectHouse) onSelectHouse(planet.houseNumber)
                        }}
                        style={{
                          fontSize: '0.74rem',
                          color: '#38bdf8',
                          marginTop: 2,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        In {planet.houseOrdinal} House ↗
                      </div>
                    </td>

                    {/* Dignity */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: dignityBadgeBg,
                          color: dignityBadgeColor,
                          border: `1px solid ${dignityBadgeColor}33`,
                        }}
                      >
                        {item.dignity}
                      </span>
                      {item.isNeechaBhanga && (
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: '#34d399',
                            fontWeight: 600,
                            marginTop: 3,
                          }}
                          title={item.neechaBhangaReason}
                        >
                          ✓ Neecha Bhanga Raja
                        </div>
                      )}
                    </td>

                    {/* Motion */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.isRetrograde ? (
                        <span
                          style={{
                            padding: '3px 7px',
                            borderRadius: 6,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        >
                          [R] Vakri
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Margi (Dir)</span>
                      )}
                    </td>

                    {/* Combustion */}
                    <td style={{ padding: '12px' }}>
                      {item.combustionStatus === 'Exempt' ? (
                        <span style={{ color: '#64748b', fontSize: '0.74rem' }}>—</span>
                      ) : (
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background:
                                item.combustionStatus === 'Deeply Combust'
                                  ? 'rgba(244, 63, 94, 0.2)'
                                  : item.combustionStatus === 'Combust'
                                  ? 'rgba(249, 115, 22, 0.2)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              color:
                                item.combustionStatus === 'Deeply Combust'
                                  ? '#f43f5e'
                                  : item.combustionStatus === 'Combust'
                                  ? '#fb923c'
                                  : '#94a3b8',
                            }}
                          >
                            {item.combustionStatus}
                          </span>
                          {item.combustionDegrees !== undefined && (
                            <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem', marginTop: 2 }}>
                              {item.combustionDegrees.toFixed(1)}° from Sun
                            </small>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Digbala */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 36,
                            height: 6,
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${item.digbalaScore}%`,
                              height: '100%',
                              background:
                                item.digbalaScore > 80
                                  ? '#c084fc'
                                  : item.digbalaScore > 50
                                  ? '#38bdf8'
                                  : '#64748b',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#f8fafc' }}>
                          {item.digbalaScore}%
                        </span>
                      </div>
                      <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                        Peak: H{item.digbalaPeakHouse} ({item.digbalaStatus})
                      </small>
                    </td>

                    {/* Dispositor */}
                    <td style={{ padding: '12px' }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSelectPlanet) onSelectPlanet(item.dispositor)
                        }}
                        style={{
                          color: '#fbbf24',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {item.dispositor} ↗
                      </span>
                      {item.dispositorPlanet && (
                        <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.68rem' }}>
                          In {item.dispositorPlanet.houseOrdinal} ({item.dispositorPlanet.dignity})
                        </small>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
