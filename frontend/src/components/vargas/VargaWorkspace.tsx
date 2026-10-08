import React, { useState, useMemo } from 'react'
import type { AstroChart, DignityType } from '../../types/astro'
import { VARGA_CATALOG, type VargaInfo } from '../../data/vargaData'
import { VedicChart } from '../chart/VedicChart'
import { VargaComparison } from './VargaComparison'
import { ZODIAC_SIGNS } from '../../types/astro'

interface VargaWorkspaceProps {
  chart: AstroChart
  selectedPlanet?: string
  selectedHouse?: number
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

type WorkspaceViewMode = 'comparison' | 'explorer'
type CategoryFilter = 'all' | 'Shadvarga' | 'Saptavarga' | 'Dashavarga' | 'Shodasavarga'

export const VargaWorkspace: React.FC<VargaWorkspaceProps> = ({
  chart,
  selectedPlanet,
  selectedHouse,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('comparison')
  const [selectedVargaCode, setSelectedVargaCode] = useState<string>('D9')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    if (categoryFilter === 'all') return VARGA_CATALOG

    const SHADVARGA_CODES = ['D1', 'D2', 'D3', 'D9', 'D12', 'D30']
    const SAPTAVARGA_CODES = [...SHADVARGA_CODES, 'D7']
    const DASHAVARGA_CODES = [...SAPTAVARGA_CODES, 'D4', 'D10', 'D16']

    if (categoryFilter === 'Shadvarga') {
      return VARGA_CATALOG.filter((v) => SHADVARGA_CODES.includes(v.code))
    }
    if (categoryFilter === 'Saptavarga') {
      return VARGA_CATALOG.filter((v) => SAPTAVARGA_CODES.includes(v.code))
    }
    if (categoryFilter === 'Dashavarga') {
      return VARGA_CATALOG.filter((v) => DASHAVARGA_CODES.includes(v.code))
    }
    return VARGA_CATALOG
  }, [categoryFilter])

  // Get selected varga metadata and chart data
  const currentVargaMeta: VargaInfo = useMemo(() => {
    return VARGA_CATALOG.find((v) => v.code === selectedVargaCode) || VARGA_CATALOG[0]
  }, [selectedVargaCode])

  const currentVargaData = chart.vargas[selectedVargaCode] || chart.vargas['D1']

  // Dignity calculations for the selected varga
  const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 }
  const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 }
  const OWN: Record<string, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10], Rahu: [10], Ketu: [7] }

  const vargaPlanetsWithDetails = useMemo(() => {
    if (!currentVargaData) return []
    return currentVargaData.grahas.map((g) => {
      let dignity: DignityType = 'Neutral'
      if (EXALT[g.name] === g.signIndex) dignity = 'Exalted'
      else if (DEBIL[g.name] === g.signIndex) dignity = 'Debilitated'
      else if (OWN[g.name]?.includes(g.signIndex)) dignity = 'Own Sign'

      const signInfo = ZODIAC_SIGNS[g.signIndex]
      const dispositor = signInfo ? signInfo.lord : '—'

      // Check if Vargottama with D1
      const d1Planet = chart.planets.find((p) => p.name === g.name)
      const isVargottama = d1Planet ? d1Planet.signIndex === g.signIndex : false

      return {
        ...g,
        dignity,
        dispositor,
        isVargottama,
      }
    })
  }, [currentVargaData, chart.planets])

  return (
    <div className="varga-workspace-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workspace Master Header */}
      <div className="panel varga-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Shodasavarga Divisional Architecture (PRD §16)</p>
          <h2 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            Divisional Charts & Comparative Analysis Workspace
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
            Examine deep harmonic divisions of the zodiac. Compare D1 with D9 or explore all 16 classical Parashari vargas with clear purpose vs calculation fact distinction.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
          <button
            type="button"
            className={`segment-btn ${viewMode === 'comparison' ? 'active' : ''}`}
            onClick={() => setViewMode('comparison')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: viewMode === 'comparison' ? '#d97706' : 'transparent',
              color: viewMode === 'comparison' ? '#fff' : '#94a3b8',
              fontWeight: viewMode === 'comparison' ? 600 : 400,
            }}
          >
            ⚖️ D1 vs D9 Comparison
          </button>
          <button
            type="button"
            className={`segment-btn ${viewMode === 'explorer' ? 'active' : ''}`}
            onClick={() => setViewMode('explorer')}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: viewMode === 'explorer' ? '#d97706' : 'transparent',
              color: viewMode === 'explorer' ? '#fff' : '#94a3b8',
              fontWeight: viewMode === 'explorer' ? 600 : 400,
            }}
          >
            🧭 16-Varga Explorer
          </button>
        </div>
      </div>

      {/* VIEW 1: D1 vs D9 Comparison */}
      {viewMode === 'comparison' && (
        <VargaComparison
          chart={chart}
          selectedPlanet={selectedPlanet}
          selectedHouse={selectedHouse}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* VIEW 2: 16-Varga Explorer */}
      {viewMode === 'explorer' && (
        <div className="varga-explorer-mode" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Category Filter Chips */}
          <div className="panel varga-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Filter Groups:
              </span>
              {(['all', 'Shadvarga', 'Saptavarga', 'Dashavarga', 'Shodasavarga'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip-button ${categoryFilter === cat ? 'selected' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {cat === 'all' ? 'All (16)' : cat}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Selected: <strong style={{ color: '#f59e0b' }}>{currentVargaMeta.name} ({currentVargaMeta.code})</strong>
            </div>
          </div>

          {/* Varga Quick-Selector Ribbon */}
          <div
            className="varga-selector-ribbon"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 8,
            }}
          >
            {filteredCatalog.map((v) => {
              const isSelected = selectedVargaCode === v.code
              const chartVarga = chart.vargas[v.code]
              return (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => setSelectedVargaCode(v.code)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.15)',
                    background: isSelected ? 'rgba(217, 119, 6, 0.18)' : 'rgba(15, 23, 42, 0.5)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <strong style={{ color: isSelected ? '#fbbf24' : '#f8fafc', fontSize: '0.85rem' }}>{v.code}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>D{v.divisions}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 500, marginTop: 2 }}>{v.name}</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {v.keyFocus}
                  </span>
                  {chartVarga && (
                    <small style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: 4 }}>
                      L: {chartVarga.lagnaSignName}
                    </small>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Varga Workspace Grid: Left Chart, Right Analysis & Grahas */}
          <div className="active-varga-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(360px, 1fr)', gap: 18 }}>
            {/* Left: Interactive SVG Chart */}
            <div className="panel varga-chart-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc' }}>
                    {currentVargaMeta.name} Chakra ({currentVargaMeta.code})
                  </h3>
                  <span className="eyebrow">D{currentVargaMeta.divisions} Harmonic Division • {currentVargaMeta.keyFocus}</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', borderRadius: 4 }}>
                  Lagna: {currentVargaData?.lagnaSignName || 'Derived'}
                </span>
              </div>

              <VedicChart
                chart={chart}
                forcedVarga={selectedVargaCode}
                hideVargaSelector
                defaultStyle="north"
                selectedPlanet={selectedPlanet}
                selectedHouse={selectedHouse}
                onSelectPlanet={onSelectPlanet}
                onSelectHouse={onSelectHouse}
              />
            </div>

            {/* Right: Traditional Purpose vs Calculation Fact & Planetary Placements */}
            <div className="varga-details-column" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Card 1: Traditional Purpose & Significators (PRD §16) */}
              <div className="panel purpose-card" style={{ borderLeft: '4px solid #38bdf8', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>📜</span>
                  <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>Traditional Purpose & Domain (Phalita)</strong>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {currentVargaMeta.traditionalDomain}
                </p>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  <strong>Key Focus:</strong> {currentVargaMeta.keyFocus} • <strong>Classical Group:</strong> {currentVargaMeta.traditionalCategory}
                </div>
              </div>

              {/* Card 2: Calculation Fact & Mathematics (PRD §16) */}
              <div className="panel calculation-card" style={{ borderLeft: '4px solid #f59e0b', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>📐</span>
                  <strong style={{ fontSize: '0.9rem', color: '#f59e0b' }}>Calculation Fact & Mathematics (Ganita)</strong>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {currentVargaMeta.calculationBasis}
                </p>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  <strong>Division factor:</strong> 30° / {currentVargaMeta.divisions} = {(30 / currentVargaMeta.divisions).toFixed(4)}° per harmonic segment
                </div>
              </div>

              {/* Card 3: Planetary Placements in this Varga */}
              <div className="panel grahas-in-varga-panel" style={{ padding: 14, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc' }}>
                    Grahas in {currentVargaMeta.code} ({currentVargaMeta.name})
                  </h4>
                  <span className="eyebrow">Click to inspect</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
                        <th style={{ padding: '6px 8px' }}>Graha</th>
                        <th style={{ padding: '6px 8px' }}>Sign in {currentVargaMeta.code}</th>
                        <th style={{ padding: '6px 8px' }}>House</th>
                        <th style={{ padding: '6px 8px' }}>Dignity</th>
                        <th style={{ padding: '6px 8px' }}>Dispositor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vargaPlanetsWithDetails.map((gp) => {
                        const isSelected = selectedPlanet === gp.name
                        return (
                          <tr
                            key={gp.name}
                            onClick={() => onSelectPlanet?.(gp.name)}
                            style={{
                              borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(217, 119, 6, 0.18)' : undefined,
                            }}
                          >
                            <td style={{ padding: '6px 8px' }}>
                              <strong style={{ color: '#f8fafc' }}>{gp.name}</strong>
                              {gp.retrograde && <span style={{ color: '#f59e0b', marginLeft: 4, fontWeight: 'bold' }}>[R]</span>}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ color: '#38bdf8' }}>{gp.signName}</span>
                              {gp.isVargottama && (
                                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', padding: '1px 4px', borderRadius: 3 }}>
                                  Vargottama
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '6px 8px' }}>{gp.houseNumber}th</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span
                                style={{
                                  color:
                                    gp.dignity === 'Exalted'
                                      ? '#10b981'
                                      : gp.dignity === 'Debilitated'
                                      ? '#ef4444'
                                      : gp.dignity === 'Own Sign'
                                      ? '#38bdf8'
                                      : '#94a3b8',
                                  fontWeight: ['Exalted', 'Debilitated', 'Own Sign'].includes(gp.dignity) ? 600 : 400,
                                }}
                              >
                                {gp.dignity}
                              </span>
                            </td>
                            <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{gp.dispositor}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
