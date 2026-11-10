import React, { useState, useMemo } from 'react'
import type {
  AstroChart,
  PlanetPosition,
  VakriPlanetAnalysis,
  VakriChartAnalysis,
} from '../../types/astro'

interface VakriGrahaIntelligenceViewProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const VakriGrahaIntelligenceView: React.FC<VakriGrahaIntelligenceViewProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [selectedPlanetName, setSelectedPlanetName] = useState<string>('all')
  const [filterRetroOnly, setFilterRetroOnly] = useState<boolean>(true)
  const [includeHouseOffsets, setIncludeHouseOffsets] = useState<boolean>(false)
  const [includeUttaraKalamrita, setIncludeUttaraKalamrita] = useState<boolean>(false)
  const [expandedPassages, setExpandedPassages] = useState<Record<string, boolean>>({})

  const togglePassage = (key: string) => {
    setExpandedPassages((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Extract or synthesize Vakri analysis for planets
  const vakriData: VakriChartAnalysis | null = chart.vakriAnalysis || null

  // Fallback calculation in case backend payload was loaded without pre-computed vakriAnalysis
  const planetsList: { planet: PlanetPosition; vakri: VakriPlanetAnalysis | null }[] = useMemo(() => {
    return chart.planets.map((p) => {
      let v = p.vakri || null
      if (!v && vakriData?.planets?.[p.name]) {
        v = vakriData.planets[p.name]
      }
      return { planet: p, vakri: v }
    })
  }, [chart.planets, vakriData])

  const retrogradePlanets = useMemo(() => {
    return planetsList.filter((item) => {
      if (item.vakri) return item.vakri.retrograde && !item.vakri.is_node
      return item.planet.retrograde && !['Rahu', 'Ketu'].includes(item.planet.name)
    })
  }, [planetsList])

  const displayedItems = useMemo(() => {
    let list = planetsList
    if (filterRetroOnly && retrogradePlanets.length > 0) {
      list = list.filter((item) => {
        if (item.vakri) return item.vakri.retrograde
        return item.planet.retrograde
      })
    }
    if (selectedPlanetName !== 'all') {
      list = list.filter((item) => item.planet.name === selectedPlanetName)
    }
    return list
  }, [planetsList, filterRetroOnly, retrogradePlanets.length, selectedPlanetName])

  return (
    <div className="vakri-intelligence-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner: Core Philosophy & Chart Synthesis */}
      <div
        className="panel"
        style={{
          padding: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.95), rgba(15, 13, 26, 0.9))',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: '#c084fc',
                  background: 'rgba(192, 132, 252, 0.15)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                }}
              >
                Classical Jyotisha Engine • Spec v1.0
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Deterministic • Explainable • Source-Traceable
              </span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: '#f8fafc', fontWeight: 800 }}>
              🪐 Vakri Graha Intelligence Engine
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              Comprehensive multi-dimensional evaluation of planetary retrogression through astronomical velocity,
              BPHS Chesta Bala, independent sign dignity, house lordship, drishti, and classical textual witnesses
              (BPHS, Phaladeepika, Jataka Parijata, Saravali, Uttara Kalamrita, Horasara).
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
                {retrogradePlanets.length}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>
                Vakri Taragrahas
              </span>
            </div>

            <div
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                60 Virupas
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase' }}>
                BPHS Chesta Bala
              </span>
            </div>
          </div>
        </div>

        {/* Fundamental Design Rule Callout */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 18px',
            borderRadius: 10,
            background: 'rgba(251, 191, 36, 0.08)',
            borderLeft: '4px solid #fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>⚖️</span>
          <div style={{ fontSize: '0.82rem', color: '#fef3c7', lineHeight: 1.5 }}>
            <strong style={{ color: '#fbbf24' }}>Fundamental Jyotisha Rule:</strong> Retrograde status imparts motional power (Chesta Bala), but <em>strength does not equal auspiciousness</em>. A strong malefic (e.g. Saturn/Mars) manifests intense, demanding labor or karma; a benefic (e.g. Jupiter/Venus) expands wisdom and prosperity, qualified by house lordship and combustion. Actual sign dignity is never overwritten.
          </div>
        </div>

        {/* Chart Level Synthesis */}
        {vakriData?.chart_level_synthesis && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 18px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.82rem',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#f8fafc' }}>Chart-Level Synthesis:</strong> {vakriData.chart_level_synthesis}
          </div>
        )}

        {/* Controls & Tradition Toggles */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Filter options */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setFilterRetroOnly(!filterRetroOnly)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterRetroOnly ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                background: filterRetroOnly ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterRetroOnly ? '#fca5a5' : '#cbd5e1',
                transition: 'all 0.15s ease',
              }}
            >
              {filterRetroOnly ? '🔴 Retrograde Only' : '🌐 All Planets'}
            </button>

            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>•</span>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeHouseOffsets}
                onChange={(e) => setIncludeHouseOffsets(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Module G Offsets (Alt BPHS / Sanketa Nidhi)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeUttaraKalamrita}
                onChange={(e) => setIncludeUttaraKalamrita(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Uttara Kalamrita 2.6 Dual Rule
            </label>
          </div>

          {/* Quick Planet Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map((pName) => {
              const isSelected = selectedPlanetName === pName
              return (
                <button
                  key={pName}
                  type="button"
                  onClick={() => setSelectedPlanetName(pName)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#f5d0fe' : '#94a3b8',
                  }}
                >
                  {pName === 'all' ? 'All' : pName}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Grid of Planetary Analysis Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {displayedItems.length === 0 ? (
          <div
            className="panel"
            style={{
              padding: 32,
              textAlign: 'center',
              borderRadius: 16,
              color: '#94a3b8',
              background: 'rgba(17, 21, 28, 0.7)',
            }}
          >
            <p style={{ margin: 0, fontSize: '1rem' }}>No planets match the current filter.</p>
          </div>
        ) : (
          displayedItems.map(({ planet, vakri }) => {
            const isRetrograde = vakri ? vakri.retrograde : Boolean(planet.retrograde)
            const isStationary = vakri ? vakri.is_stationary : false
            const isNode = ['Rahu', 'Ketu'].includes(planet.name)
            const isLuminary = ['Sun', 'Moon'].includes(planet.name)

            let motionBadge = { label: 'Direct', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
            if (isLuminary) {
              motionBadge = { label: 'Direct (Luminary)', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
            } else if (isNode) {
              motionBadge = { label: 'Naturally Retrograde (Node)', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' }
            } else if (isRetrograde) {
              motionBadge = { label: 'Vakri (Retrograde)', color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)' }
            } else if (isStationary) {
              motionBadge = { label: 'Stationary (Vikala)', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' }
            }

            const dailySpeed = vakri?.motion?.daily_speed ?? planet.speed ?? 0
            const actualDignity = vakri?.dignity?.actual ?? planet.dignity
            const classicalEffect = vakri?.dignity?.retrograde_classical_effect || null
            const interpretiveSource = vakri?.dignity?.interpretive_source || null

            const chestaVirupas = vakri?.chesta_bala?.traditional_chesta_value ?? (isRetrograde && !isNode && !isLuminary ? 60.0 : 30.0)
            const shadbalaStatus = vakri?.shadbala?.strength_status ?? null

            const occupiedHouse = vakri?.house_analysis?.occupied_house ?? planet.houseNumber
            const ownedHouses = vakri?.house_analysis?.owned_houses ?? planet.lordOfHouses
            const functionalNature = vakri?.house_analysis?.functional_nature ?? planet.functionalType ?? 'Neutral'

            const appliedRules = vakri?.classical_rules || []
            const conflicts = vakri?.textual_conflicts || []
            const interpretation = vakri?.interpretation || null

            return (
              <div
                key={planet.name}
                className="panel vakri-planet-card"
                style={{
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(17, 21, 28, 0.98), rgba(11, 14, 19, 0.95))',
                  border: isRetrograde && !isNode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isRetrograde && !isNode ? '0 6px 24px rgba(239, 68, 68, 0.12)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Header Bar */}
                <div
                  style={{
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontSize: '1.4rem',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {planet.symbol}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: '#f8fafc',
                            cursor: 'pointer',
                          }}
                          onClick={() => onSelectPlanet?.(planet.name)}
                        >
                          {planet.name}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          ({planet.sanskritName})
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: motionBadge.color,
                            background: motionBadge.bg,
                            border: `1px solid ${motionBadge.color}40`,
                          }}
                        >
                          {motionBadge.label}
                        </span>
                        {planet.combust && (
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 6,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#fb923c',
                              background: 'rgba(251, 146, 60, 0.15)',
                              border: '1px solid rgba(251, 146, 60, 0.3)',
                            }}
                          >
                            Combust (Asta)
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        {planet.sign} {planet.dms} •{' '}
                        <span
                          style={{ cursor: onSelectHouse ? 'pointer' : 'default', color: '#94a3b8' }}
                          onClick={() => onSelectHouse?.(occupiedHouse)}
                          title="View House details"
                        >
                          House {occupiedHouse} ({planet.houseOrdinal})
                        </span>{' '}
                        • Nakshatra {planet.nakshatra} (Pada {planet.pada})
                      </p>
                    </div>
                  </div>

                  {/* Velocity & Astronomical Stats */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem' }}>
                      <span style={{ color: '#94a3b8' }}>Daily Velocity:</span>
                      <strong style={{ color: dailySpeed < 0 ? '#f87171' : '#34d399', fontFamily: 'monospace' }}>
                        {dailySpeed > 0 ? `+${dailySpeed.toFixed(4)}` : dailySpeed.toFixed(4)}°/day
                      </strong>
                    </div>
                    {planet.sunSeparation != null && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Solar Distance: {planet.sunSeparation.toFixed(2)}°
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Grid */}
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Two-Column Grid: Dignity vs Chesta/Shadbala */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {/* Left Panel: Dignity Dual-Layer */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', fontWeight: 700, marginBottom: 10 }}>
                        👑 Dual-Layer Dignity Assessment
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Actual Sign Dignity:</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: actualDignity.toLowerCase().includes('debilitat')
                                ? 'rgba(239, 68, 68, 0.15)'
                                : actualDignity.toLowerCase().includes('exalt') || actualDignity.toLowerCase().includes('own')
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: actualDignity.toLowerCase().includes('debilitat')
                                ? '#fca5a5'
                                : actualDignity.toLowerCase().includes('exalt') || actualDignity.toLowerCase().includes('own')
                                ? '#6ee7b7'
                                : '#e2e8f0',
                            }}
                          >
                            {actualDignity}
                          </span>
                        </div>

                        {classicalEffect && (
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'rgba(212, 171, 92, 0.1)',
                              border: '1px solid rgba(212, 171, 92, 0.25)',
                              fontSize: '0.78rem',
                              lineHeight: 1.45,
                            }}
                          >
                            <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 2 }}>
                              ⚡ Classical Vakri Effect: {classicalEffect.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style={{ color: '#fef3c7', fontSize: '0.74rem' }}>
                              Authority: <strong>{interpretiveSource}</strong>. Retrogression expands the planet's capacity to manifest its house results like an exalted planet, while its base astronomical placement remains strictly {actualDignity}.
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                          Dispositor: <strong style={{ color: '#cbd5e1' }}>{planet.dispositor}</strong> in House {vakri?.house_analysis?.dispositor_house ?? '—'} ({vakri?.house_analysis?.dispositor_dignity ?? '—'})
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Chesta Bala & Shadbala Breakdown */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', fontWeight: 700, marginBottom: 10 }}>
                        ⚡ Chesta Bala & Motional Potency
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Chesta Bala (BPHS 27.22):</span>
                          <span style={{ fontWeight: 800, color: isRetrograde ? '#fbbf24' : '#94a3b8', fontSize: '0.9rem' }}>
                            {chestaVirupas.toFixed(1)} Virupas <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({(chestaVirupas / 60).toFixed(2)} Rupas)</span>
                          </span>
                        </div>

                        {vakri?.shadbala && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Total Shadbala:</span>
                              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>
                                {vakri.shadbala.total_shadbala_rupas.toFixed(2)} Rupas / {vakri.shadbala.required_shadbala_rupas.toFixed(2)} Req
                              </span>
                            </div>

                            {/* Ratio Bar */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>
                                <span>Strength Ratio ({vakri.shadbala.strength_ratio.toFixed(2)}×)</span>
                                <span style={{ color: shadbalaStatus === 'meets_reference_threshold' ? '#34d399' : '#f87171' }}>
                                  {shadbalaStatus === 'meets_reference_threshold' ? '✓ Meets Reference Threshold' : 'Below Reference Threshold'}
                                </span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, (vakri.shadbala.strength_ratio / 1.5) * 100)}%`,
                                    background: shadbalaStatus === 'meets_reference_threshold' ? '#10b981' : '#f87171',
                                    borderRadius: 3,
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div style={{ fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                          Standards: BPHS Ch. 27 recension (Units: Virupas, 60 Virupas = 1 Rupa).
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* House Lordship & Functional Context */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>
                        🏠 House Lordship & Functional Role
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        Occupies <strong>House {occupiedHouse}</strong>; owns <strong>House(s) {ownedHouses.join(', ') || 'None'}</strong>.
                        <div style={{ marginTop: 4, color: '#cbd5e1' }}>
                          Role: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{functionalNature}</span> • {vakri?.house_analysis?.functional_explanation || ''}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>
                        🏛️ Divisional Charts (Vargas)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        D1: <strong>{vakri?.varga_analysis?.D1_sign || planet.sign}</strong> • D9 (Navamsha): <strong>{vakri?.varga_analysis?.D9_sign || '—'}</strong> • D10: <strong>{vakri?.varga_analysis?.D10_sign || '—'}</strong>
                        {vakri?.varga_analysis?.is_vargottama && (
                          <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: '#10b98120', color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>
                            Vargottama
                          </span>
                        )}
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                          Natal retrograde state accompanies into D9/D10 without independent motion recalculation.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module G House Offset (if enabled and present) */}
                  {includeHouseOffsets && vakri?.house_analysis?.house_offset_influence && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        fontSize: '0.8rem',
                        color: '#c7d2fe',
                      }}
                    >
                      <strong style={{ color: '#a5b4fc' }}>Module G House Offset Projection:</strong> {vakri.house_analysis.house_offset_influence.description} (Authority: <em>{vakri.house_analysis.house_offset_influence.source}</em>, Confidence: {vakri.house_analysis.house_offset_influence.confidence})
                    </div>
                  )}

                  {/* Applied Classical Rules & Verses Accordion */}
                  {appliedRules.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>
                        📜 Verified Classical Rules Applied ({appliedRules.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {appliedRules.map((rule) => {
                          const isOpen = Boolean(expandedPassages[rule.rule_id])
                          return (
                            <div
                              key={rule.rule_id}
                              style={{
                                borderRadius: 10,
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                onClick={() => togglePassage(rule.rule_id)}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  background: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>✦</span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                                    {rule.rule_name}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                    • {rule.text_title} ({rule.chapter_verse})
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      color: rule.confidence === 'A' ? '#34d399' : '#fbbf24',
                                    }}
                                  >
                                    Grade {rule.confidence}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {isOpen ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {isOpen && (
                                <div
                                  style={{
                                    padding: '14px 16px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                    background: 'rgba(11, 14, 19, 0.6)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                  }}
                                >
                                  {/* Sanskrit Devanagari */}
                                  <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 2 }}>
                                      Sanskrit (Devanagari):
                                    </div>
                                    <div style={{ fontSize: '0.92rem', color: '#fef3c7', fontFamily: 'serif', lineHeight: 1.6 }}>
                                      {rule.sanskrit}
                                    </div>
                                  </div>

                                  {/* IAST */}
                                  <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
                                      IAST Transliteration:
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.5 }}>
                                      {rule.iast}
                                    </div>
                                  </div>

                                  {/* English Translation */}
                                  <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
                                      Classical Translation & Effect:
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                      {rule.translation}
                                    </div>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Witness: {rule.witness}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Doctrinal Conflicts Panel (Module N: display_both) */}
                  {conflicts.length > 0 && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: 'rgba(239, 68, 68, 0.04)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', letterSpacing: 1, marginBottom: 8 }}>
                        ⚖️ Doctrinal Conflict Resolution (Display Both Paradigm)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {conflicts.map((conf) => (
                          <div key={conf.conflict_id} style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                            <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>
                              {conf.topic}
                            </div>
                            <div style={{ color: '#cbd5e1', marginBottom: 6 }}>
                              {conf.explanation}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12, borderLeft: '2px solid rgba(239, 68, 68, 0.4)' }}>
                              {conf.diverging_rules.map((dr, idx) => (
                                <div key={idx} style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                                  <strong style={{ color: '#e2e8f0' }}>{dr.source}:</strong> {dr.interpretation} <span style={{ color: '#64748b' }}>({dr.status})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multi-Dimensional Explainable Summary */}
                  {interpretation && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        background: 'rgba(168, 85, 247, 0.07)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: 1, color: '#c084fc', fontWeight: 800, marginBottom: 4 }}>
                        🔍 Multi-Dimensional Synthesis
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#f5d0fe', lineHeight: 1.55 }}>
                        {interpretation.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
