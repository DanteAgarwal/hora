import React, { useState, useMemo } from 'react'
import type { AstroChart, ChartStyle, DignityType } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'
import { VedicChart } from '../chart/VedicChart'

interface VargaComparisonProps {
  chart: AstroChart
  selectedPlanet?: string
  selectedHouse?: number
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface PlanetComparisonRow {
  name: string
  sanskrit: string
  symbol: string
  retrograde: boolean
  combust: boolean
  d1Sign: string
  d1SignIndex: number
  d1House: number
  d1Dms: string
  d1Dignity: DignityType
  d9Sign: string
  d9SignIndex: number
  d9House: number
  d9Dignity: DignityType
  isVargottama: boolean
  dignityShift: string
  shiftTone: 'elevated' | 'reduced' | 'stable' | 'neutral'
}

export const VargaComparison: React.FC<VargaComparisonProps> = ({
  chart,
  selectedPlanet,
  selectedHouse,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'vargottama' | 'shifts'>('all')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north')

  const d1 = chart.vargas['D1']
  const d9 = chart.vargas['D9']

  const isLagnaVargottama = useMemo(() => {
    if (!d1 || !d9) return false
    return d1.lagnaSignIndex === d9.lagnaSignIndex
  }, [d1, d9])

  const comparisonRows = useMemo<PlanetComparisonRow[]>(() => {
    if (!d9) return []

    return chart.planets.map((p) => {
      const d9Placement = d9.grahas.find((g) => g.name === p.name)
      const d9SignIndex = d9Placement ? d9Placement.signIndex : p.signIndex
      const d9Sign = ZODIAC_SIGNS[d9SignIndex]?.name || 'Unknown'
      const d9House = d9Placement ? d9Placement.houseNumber : p.houseNumber

      const isVargottama = p.signIndex === d9SignIndex

      // Derive D9 Dignity
      let d9Dignity: DignityType = 'Calculated'
      const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 }
      const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 }
      const OWN: Record<string, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10], Rahu: [10], Ketu: [7] }

      if (EXALT[p.name] === d9SignIndex) d9Dignity = 'Exalted'
      else if (DEBIL[p.name] === d9SignIndex) d9Dignity = 'Debilitated'
      else if (OWN[p.name]?.includes(d9SignIndex)) d9Dignity = 'Own Sign'
      else d9Dignity = 'Neutral'

      // Evaluate Shift
      let dignityShift = 'Consistent'
      let shiftTone: 'elevated' | 'reduced' | 'stable' | 'neutral' = 'neutral'

      if (p.dignity === 'Debilitated' && (d9Dignity === 'Exalted' || d9Dignity === 'Own Sign')) {
        dignityShift = 'Neecha Bhanga (Dharmic Elevation: Outer struggle transforms into deep inner wisdom)'
        shiftTone = 'elevated'
      } else if (p.dignity === 'Exalted' && d9Dignity === 'Debilitated') {
        dignityShift = 'Hollow Exaltation (Promising start but lacks enduring spiritual stability)'
        shiftTone = 'reduced'
      } else if (p.dignity === 'Exalted' && d9Dignity === 'Exalted') {
        dignityShift = 'Param Vargottama (Supreme exaltation across body and soul)'
        shiftTone = 'elevated'
      } else if (isVargottama) {
        dignityShift = 'Vargottama Root (Inner and outer nature completely aligned)'
        shiftTone = 'stable'
      } else if (d9Dignity === 'Exalted') {
        dignityShift = 'Inner Elevation (Gains spiritual strength in Navamsha)'
        shiftTone = 'elevated'
      } else if (d9Dignity === 'Debilitated') {
        dignityShift = 'Inner Friction (Challenges in dharmic application)'
        shiftTone = 'reduced'
      } else if (d9Dignity === 'Own Sign') {
        dignityShift = 'Sthira Grounding (Own sign in Navamsha confers inner confidence)'
        shiftTone = 'stable'
      }

      return {
        name: p.name,
        sanskrit: p.sanskritName,
        symbol: p.symbol,
        retrograde: p.retrograde,
        combust: p.combust,
        d1Sign: p.sign,
        d1SignIndex: p.signIndex,
        d1House: p.houseNumber,
        d1Dms: p.dms,
        d1Dignity: p.dignity,
        d9Sign,
        d9SignIndex,
        d9House,
        d9Dignity,
        isVargottama,
        dignityShift,
        shiftTone,
      }
    })
  }, [chart, d9])

  const vargottamaPlanets = useMemo(() => {
    return comparisonRows.filter((r) => r.isVargottama)
  }, [comparisonRows])

  const filteredRows = useMemo(() => {
    if (filterMode === 'vargottama') {
      return comparisonRows.filter((r) => r.isVargottama)
    }
    if (filterMode === 'shifts') {
      return comparisonRows.filter((r) => r.shiftTone === 'elevated' || r.shiftTone === 'reduced')
    }
    return comparisonRows
  }, [comparisonRows, filterMode])

  return (
    <div className="varga-comparison-view" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Banner */}
      <div className="panel comparison-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Classical Jyotish Comparative Synthesis</p>
          <h2 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            D1 Rashi (The Tree) vs D9 Navamsha (The Fruit)
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: 780 }}>
            In Parashari astrology, D1 reflects manifest karma, physical vitality, and worldly circumstances.
            D9 Navamsha reveals the hidden dharmic potential, soul inclination, spouse partnership, and the true enduring strength of the grahas.
          </p>
        </div>

        {/* Global Style Switcher */}
        <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
          <button
            type="button"
            className={`segment-btn ${chartStyle === 'north' ? 'active' : ''}`}
            onClick={() => setChartStyle('north')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: chartStyle === 'north' ? '#d97706' : 'transparent',
              color: chartStyle === 'north' ? '#fff' : '#94a3b8',
              fontWeight: chartStyle === 'north' ? 600 : 400,
            }}
          >
            North Indian (Diamond)
          </button>
          <button
            type="button"
            className={`segment-btn ${chartStyle === 'south' ? 'active' : ''}`}
            onClick={() => setChartStyle('south')}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: chartStyle === 'south' ? '#d97706' : 'transparent',
              color: chartStyle === 'south' ? '#fff' : '#94a3b8',
              fontWeight: chartStyle === 'south' ? 600 : 400,
            }}
          >
            South Indian (Square)
          </button>
        </div>
      </div>

      {/* Side-by-side Dual Charts */}
      <div className="dual-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18 }}>
        {/* Left: D1 Rashi */}
        <div className="chart-split-card panel" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 8 }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#f59e0b' }}>D1 • Rashi Chakra</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>Physical Existence & Vitality</span>
            </div>
            <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: 4 }}>
              Lagna: {d1?.lagnaSignName || chart.quickFacts.lagna}
            </span>
          </div>

          <VedicChart
            chart={chart}
            forcedVarga="D1"
            hideVargaSelector
            defaultStyle={chartStyle}
            selectedPlanet={selectedPlanet}
            selectedHouse={selectedHouse}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        </div>

        {/* Right: D9 Navamsha */}
        <div className="chart-split-card panel" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 8 }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>D9 • Navamsha Chakra</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>Dharma, Spouse & Inner Strength</span>
            </div>
            <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4 }}>
              Lagna: {d9?.lagnaSignName || 'Derived'}
            </span>
          </div>

          <VedicChart
            chart={chart}
            forcedVarga="D9"
            hideVargaSelector
            defaultStyle={chartStyle}
            selectedPlanet={selectedPlanet}
            selectedHouse={selectedHouse}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        </div>
      </div>

      {/* Vargottama Spotlight Box */}
      <div className="panel vargottama-spotlight" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(217, 119, 6, 0.08)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>🌟</span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fbbf24' }}>
            Vargottama Grahas ({vargottamaPlanets.length + (isLagnaVargottama ? 1 : 0)} Identified)
          </h3>
        </div>

        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
          <strong>Vargottama</strong> occurs when a planet occupies the exact same zodiac sign in both the natal Rashi (D1) and Navamsha (D9).
          Classically revered as giving the planet the stability, resilience, and unyielding fortitude of an <em>Own Sign</em> placement,
          ensuring internal convictions match external circumstances.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {isLagnaVargottama && (
            <div
              className="vargottama-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid #f59e0b',
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>Ascendant (Lagna)</span>
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Vargottama in {d1?.lagnaSignName}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Superb physical stamina & clear sense of purpose</span>
            </div>
          )}

          {vargottamaPlanets.map((vp) => (
            <div
              key={vp.name}
              className="vargottama-card"
              onClick={() => onSelectPlanet?.(vp.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid #f59e0b',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              title="Click to inspect this Vargottama planet"
            >
              <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{vp.name} ({vp.sanskrit})</span>
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Vargottama in {vp.d1Sign}</span>
              <span style={{ fontSize: '0.72rem', background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                Own-Sign Quality
              </span>
            </div>
          ))}

          {vargottamaPlanets.length === 0 && !isLagnaVargottama && (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No planets are strictly Vargottama in this chart. Check the table below for dignity shifts (such as planets gaining strength in D9).
            </div>
          )}
        </div>
      </div>

      {/* Comparative Grahas Table */}
      <div className="panel comparison-table-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>Planetary D1 vs D9 Comparative Analysis</h3>
            <p className="eyebrow" style={{ marginTop: 2 }}>Click any planet to inspect full details in the side panel</p>
          </div>

          <div className="filter-chips" style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`chip-button ${filterMode === 'all' ? 'selected' : ''}`}
              onClick={() => setFilterMode('all')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              All Grahas ({comparisonRows.length})
            </button>
            <button
              type="button"
              className={`chip-button ${filterMode === 'vargottama' ? 'selected' : ''}`}
              onClick={() => setFilterMode('vargottama')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Vargottama Only ({vargottamaPlanets.length})
            </button>
            <button
              type="button"
              className={`chip-button ${filterMode === 'shifts' ? 'selected' : ''}`}
              onClick={() => setFilterMode('shifts')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Dignity Shifts Only
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '8px 10px' }}>Graha</th>
                <th style={{ padding: '8px 10px' }}>D1 Rashi (Root)</th>
                <th style={{ padding: '8px 10px' }}>D1 Dignity</th>
                <th style={{ padding: '8px 10px' }}>D9 Navamsha (Fruit)</th>
                <th style={{ padding: '8px 10px' }}>D9 Dignity</th>
                <th style={{ padding: '8px 10px' }}>Status & Classical Shift</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isSelected = selectedPlanet === row.name
                return (
                  <tr
                    key={row.name}
                    onClick={() => onSelectPlanet?.(row.name)}
                    style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(217, 119, 6, 0.18)' : undefined,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '10px 10px' }}>
                      <strong style={{ color: '#f8fafc' }}>{row.name}</strong> <small style={{ color: '#94a3b8' }}>({row.sanskrit})</small>
                      {row.retrograde && <span style={{ color: '#f59e0b', marginLeft: 4, fontWeight: 'bold' }}>[R]</span>}
                      {row.combust && <span style={{ color: '#ef4444', marginLeft: 2, fontWeight: 'bold' }}>*</span>}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span>{row.d1Sign} (H{row.d1House})</span>
                      <small style={{ display: 'block', color: '#64748b' }}>{row.d1Dms}</small>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          color:
                            row.d1Dignity === 'Exalted' ? '#10b981' : row.d1Dignity === 'Debilitated' ? '#ef4444' : row.d1Dignity === 'Own Sign' ? '#38bdf8' : '#e2e8f0',
                          fontWeight: ['Exalted', 'Debilitated', 'Own Sign'].includes(row.d1Dignity) ? 600 : 400,
                        }}
                      >
                        {row.d1Dignity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <strong style={{ color: '#38bdf8' }}>{row.d9Sign}</strong> <span>(H{row.d9House})</span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          color:
                            row.d9Dignity === 'Exalted' ? '#10b981' : row.d9Dignity === 'Debilitated' ? '#ef4444' : row.d9Dignity === 'Own Sign' ? '#38bdf8' : '#e2e8f0',
                          fontWeight: ['Exalted', 'Debilitated', 'Own Sign'].includes(row.d9Dignity) ? 600 : 400,
                        }}
                      >
                        {row.d9Dignity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      {row.isVargottama && (
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'rgba(245, 158, 11, 0.25)',
                            color: '#fbbf24',
                            border: '1px solid #f59e0b',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            marginRight: 6,
                          }}
                        >
                          VARGOTTAMA
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color:
                            row.shiftTone === 'elevated'
                              ? '#34d399'
                              : row.shiftTone === 'reduced'
                              ? '#f87171'
                              : row.shiftTone === 'stable'
                              ? '#fbbf24'
                              : '#94a3b8',
                        }}
                      >
                        {row.dignityShift}
                      </span>
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
