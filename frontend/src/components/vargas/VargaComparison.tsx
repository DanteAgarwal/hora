import React, { useState, useMemo } from 'react'
import type { AstroChart, ChartStyle, PlanetComparisonRow } from '../../types/astro'
import { VedicChart } from '../chart/VedicChart'
import { VARGA_CATALOG } from '../../data/vargaData'

interface VargaComparisonProps {
  chart: AstroChart
  selectedPlanet?: string
  selectedHouse?: number
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const VargaComparison: React.FC<VargaComparisonProps> = ({
  chart,
  selectedPlanet,
  selectedHouse,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [targetVargaCode, setTargetVargaCode] = useState<string>('D9')
  const [filterMode, setFilterMode] = useState<'all' | 'vargottama' | 'shifts'>('all')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north')

  const d1 = chart.vargas['D1']
  const targetVarga = chart.vargas[targetVargaCode] || chart.vargas['D9']

  const targetVargaMeta = useMemo(() => {
    return VARGA_CATALOG.find((v) => v.code === targetVargaCode) || VARGA_CATALOG.find((v) => v.code === 'D9') || VARGA_CATALOG[0]
  }, [targetVargaCode])

  const isLagnaVargottama = useMemo(() => {
    if (!d1 || !targetVarga) return false
    return d1.lagnaSignIndex === targetVarga.lagnaSignIndex
  }, [d1, targetVarga])

  // Varga comparison rows: if D9 use pre-computed or dynamic; otherwise compute dynamically
  const comparisonRows = useMemo<PlanetComparisonRow[]>(() => {
    if (targetVargaCode === 'D9' && chart.vargaComparison && chart.vargaComparison.length > 0) {
      return chart.vargaComparison
    }

    if (!targetVarga || !chart.planets) return []

    return chart.planets.map((p) => {
      const tPlacement = targetVarga.grahas?.find((g) => g.name === p.name)
      const tSign = tPlacement ? tPlacement.signName : p.sign
      const tSignIndex = tPlacement ? tPlacement.signIndex : p.signIndex
      const tHouse = tPlacement ? tPlacement.houseNumber : p.houseNumber
      const tDignity = tPlacement?.dignity || 'Neutral'
      const tDms = tPlacement ? tPlacement.dms : p.dms

      const isVargottama = p.signIndex === tSignIndex

      let dignityShift = 'Consistent'
      let shiftTone: 'elevated' | 'reduced' | 'stable' | 'neutral' = 'neutral'

      if (p.dignity === 'Debilitated' && (tDignity === 'Exalted' || tDignity === 'Own Sign')) {
        dignityShift = `Neecha Bhanga (Harmonic Elevation in ${targetVargaCode})`
        shiftTone = 'elevated'
      } else if (p.dignity === 'Exalted' && tDignity === 'Debilitated') {
        dignityShift = `Hollow Exaltation (Lacks enduring stability in ${targetVargaCode})`
        shiftTone = 'reduced'
      } else if (p.dignity === 'Exalted' && tDignity === 'Exalted') {
        dignityShift = `Param Vargottama (Supreme exaltation across both charts)`
        shiftTone = 'elevated'
      } else if (isVargottama) {
        dignityShift = `Same-Sign Alignment in ${targetVargaCode}`
        shiftTone = 'stable'
      } else if (tDignity === 'Exalted') {
        dignityShift = `Harmonic Elevation (Gains high strength in ${targetVargaCode})`
        shiftTone = 'elevated'
      } else if (tDignity === 'Debilitated') {
        dignityShift = `Harmonic Friction (Challenges in ${targetVargaCode} matters)`
        shiftTone = 'reduced'
      } else if (tDignity === 'Own Sign') {
        dignityShift = `Sthira Grounding (Own sign in ${targetVargaCode})`
        shiftTone = 'stable'
      }

      return {
        name: p.name,
        sanskrit: p.sanskritName || p.name,
        symbol: p.symbol || '✦',
        retrograde: Boolean(p.retrograde),
        combust: Boolean(p.combust),
        d1Sign: p.sign,
        d1SignIndex: p.signIndex,
        d1House: p.houseNumber,
        d1Dms: p.dms,
        d1Dignity: p.dignity,
        targetVargaCode,
        targetSign: tSign,
        targetSignIndex: tSignIndex,
        targetHouse: tHouse,
        targetDms: tDms,
        targetDignity: tDignity,
        d9Sign: tSign,
        d9SignIndex: tSignIndex,
        d9House: tHouse,
        d9Dignity: tDignity,
        isVargottama,
        dignityShift,
        shiftTone,
      }
    })
  }, [targetVargaCode, targetVarga, chart.vargaComparison, chart.planets])

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
      {/* Overview Banner with Target Varga Selector */}
      <div className="panel comparison-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Classical Jyotish Comparative Synthesis</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              D1 Rashi vs
            </h2>
            <select
              value={targetVargaCode}
              onChange={(e) => setTargetVargaCode(e.target.value)}
              style={{
                background: 'rgba(217, 119, 6, 0.2)',
                border: '1px solid #f59e0b',
                color: '#fbbf24',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {VARGA_CATALOG.filter((v) => v.code !== 'D1').map((v) => (
                <option key={v.code} value={v.code} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {v.code} {v.name} ({v.keyFocus})
                </option>
              ))}
            </select>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#94a3b8', maxWidth: 820 }}>
            {targetVargaCode === 'D9' ? (
              <>
                D1 reflects manifest karma, physical vitality, and worldly circumstances.
                D9 Navamsha reveals the hidden dharmic potential, soul inclination, spouse partnership, and true enduring strength.
              </>
            ) : (
              <>
                Comparing baseline D1 Rashi with <strong>{targetVargaMeta.name} ({targetVargaMeta.code})</strong>.
                Focuses specifically on: <em>{targetVargaMeta.traditionalDomain}</em>
              </>
            )}
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
              Lagna: {d1?.lagnaSignName} {d1?.lagnaDms ? d1.lagnaDms : ''}
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

        {/* Right: Target Varga */}
        <div className="chart-split-card panel" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 8 }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{targetVargaMeta.code} • {targetVargaMeta.name}</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>{targetVargaMeta.keyFocus}</span>
            </div>
            <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4 }}>
              Lagna: {targetVarga?.lagnaSignName || 'Derived'} {targetVarga?.lagnaDms ? targetVarga.lagnaDms : ''}
            </span>
          </div>

          <VedicChart
            chart={chart}
            forcedVarga={targetVargaCode}
            hideVargaSelector
            defaultStyle={chartStyle}
            selectedPlanet={selectedPlanet}
            selectedHouse={selectedHouse}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        </div>
      </div>

      {/* Vargottama / Same-Sign Alignment Spotlight Box */}
      <div className="panel vargottama-spotlight" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(217, 119, 6, 0.08)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>🌟</span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fbbf24' }}>
            {targetVargaCode === 'D9' ? 'Vargottama Grahas' : `Harmonic Alignment in ${targetVargaCode}`} ({vargottamaPlanets.length + (isLagnaVargottama ? 1 : 0)} Identified)
          </h3>
        </div>

        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
          {targetVargaCode === 'D9' ? (
            <>
              <strong>Vargottama</strong> occurs when a planet occupies the exact same zodiac sign in both natal Rashi (D1) and Navamsha (D9).
              Classically revered as giving the planet the stability, resilience, and fortitude of an <em>Own Sign</em> placement,
              ensuring internal soul convictions match external worldly circumstances.
            </>
          ) : (
            <>
              Planets that occupy the same zodiac sign in both D1 and {targetVargaMeta.name} ({targetVargaCode}) retain unwavering consistency
              and direct expression for {targetVargaMeta.keyFocus.toLowerCase()}.
            </>
          )}
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
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Aligned in {d1?.lagnaSignName}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Superb physical stamina & unshakeable purpose</span>
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
              title={`Click to inspect this planet`}
            >
              <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{vp.name} ({vp.sanskrit})</span>
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>In {vp.d1Sign}</span>
              <span style={{ fontSize: '0.72rem', background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                {targetVargaCode === 'D9' ? 'Vargottama' : 'Aligned Sign'}
              </span>
            </div>
          ))}

          {vargottamaPlanets.length === 0 && !isLagnaVargottama && (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No planets occupy the identical sign across D1 and {targetVargaCode}. Check the comparative table below for dignity shifts and harmonic gains.
            </div>
          )}
        </div>
      </div>

      {/* Comparative Grahas Table */}
      <div className="panel comparison-table-panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
              Planetary D1 vs {targetVargaMeta.code} Comparative Analysis
            </h3>
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
              {targetVargaCode === 'D9' ? 'Vargottama' : 'Aligned'} ({vargottamaPlanets.length})
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
                <th style={{ padding: '8px 10px' }}>{targetVargaMeta.code} {targetVargaMeta.name}</th>
                <th style={{ padding: '8px 10px' }}>{targetVargaMeta.code} Dignity</th>
                <th style={{ padding: '8px 10px' }}>Status & Harmonic Shift</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isSelected = selectedPlanet === row.name
                const targetSignDisplay = row.targetSign || row.d9Sign
                const targetHouseDisplay = row.targetHouse || row.d9House
                const targetDignityDisplay = row.targetDignity || row.d9Dignity
                const targetDmsDisplay = row.targetDms

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
                      <small style={{ display: 'block', color: '#64748b', fontFamily: 'monospace' }}>{row.d1Dms}</small>
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
                      <strong style={{ color: '#38bdf8' }}>{targetSignDisplay}</strong> <span>(H{targetHouseDisplay})</span>
                      {targetDmsDisplay && (
                        <small style={{ display: 'block', color: '#64748b', fontFamily: 'monospace' }}>{targetDmsDisplay}</small>
                      )}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          color:
                            targetDignityDisplay === 'Exalted' ? '#10b981' : targetDignityDisplay === 'Debilitated' ? '#ef4444' : targetDignityDisplay === 'Own Sign' ? '#38bdf8' : '#e2e8f0',
                          fontWeight: ['Exalted', 'Debilitated', 'Own Sign'].includes(targetDignityDisplay) ? 600 : 400,
                        }}
                      >
                        {targetDignityDisplay}
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
                          {targetVargaCode === 'D9' ? 'VARGOTTAMA' : 'SAME SIGN'}
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
