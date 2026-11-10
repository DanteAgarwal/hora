import React, { useState, useMemo } from 'react'
import type { AstroChart, ChartStyle } from '../../types/astro'
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
type TableFilter = 'all' | 'vargottama' | 'dignified' | 'debilitated'

export const VargaWorkspace: React.FC<VargaWorkspaceProps> = ({
  chart,
  selectedPlanet,
  selectedHouse,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('explorer')
  const [selectedVargaCode, setSelectedVargaCode] = useState<string>('D9')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [explorerChartStyle, setExplorerChartStyle] = useState<ChartStyle>('north')
  const [tableFilter, setTableFilter] = useState<TableFilter>('all')

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

  // Grahas with varga dignities, dispositors, DMS, and vargottama calculated by backend
  const vargaPlanetsWithDetails = useMemo(() => {
    if (!currentVargaData) return []
    return currentVargaData.grahas.map((g) => ({
      ...g,
      dignity: g.dignity || 'Neutral',
      dispositor: g.dispositor || ZODIAC_SIGNS[g.signIndex]?.lord || '—',
      isVargottama: g.isVargottama ?? false,
      dms: g.dms || (g.degreeInSign != null ? `${Math.floor(g.degreeInSign)}°` : '—'),
    }))
  }, [currentVargaData])

  // Dignity counts in active varga
  const dignityCounts = useMemo(() => {
    let exalted = 0
    let own = 0
    let debilitated = 0
    let vargottama = 0
    for (const g of vargaPlanetsWithDetails) {
      if (g.dignity === 'Exalted') exalted++
      if (g.dignity === 'Own Sign' || g.dignity === 'Moolatrikona') own++
      if (g.dignity === 'Debilitated') debilitated++
      if (g.isVargottama) vargottama++
    }
    return { exalted, own, debilitated, vargottama, total: vargaPlanetsWithDetails.length }
  }, [vargaPlanetsWithDetails])

  // Filtered graha list for the table
  const filteredPlanets = useMemo(() => {
    if (tableFilter === 'vargottama') {
      return vargaPlanetsWithDetails.filter((g) => g.isVargottama)
    }
    if (tableFilter === 'dignified') {
      return vargaPlanetsWithDetails.filter((g) => g.dignity === 'Exalted' || g.dignity === 'Own Sign' || g.dignity === 'Moolatrikona')
    }
    if (tableFilter === 'debilitated') {
      return vargaPlanetsWithDetails.filter((g) => g.dignity === 'Debilitated')
    }
    return vargaPlanetsWithDetails
  }, [vargaPlanetsWithDetails, tableFilter])

  return (
    <div className="varga-workspace-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workspace Master Header */}
      <div className="panel varga-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Shodasavarga Divisional Architecture (BPHS §6)</p>
          <h2 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            Divisional Charts & Comparative Analysis Workspace
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
            All 16 classical Parashari vargas verified with exact divisional degrees, dignities, and sign placements.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
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
            ⚖️ Multi-Varga Comparison
          </button>
        </div>
      </div>

      {/* VIEW 1: Multi-Varga Comparison */}
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
          {/* Category Filter Chips & Chart Style Toggle */}
          <div className="panel varga-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Divisional Groups:
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

            {/* North / South Style Toggle for Explorer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Chart Style:
              </span>
              <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
                <button
                  type="button"
                  className={`segment-btn ${explorerChartStyle === 'north' ? 'active' : ''}`}
                  onClick={() => setExplorerChartStyle('north')}
                  style={{
                    padding: '3px 9px',
                    fontSize: '0.75rem',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: explorerChartStyle === 'north' ? '#d97706' : 'transparent',
                    color: explorerChartStyle === 'north' ? '#fff' : '#94a3b8',
                    fontWeight: explorerChartStyle === 'north' ? 600 : 400,
                  }}
                >
                  North
                </button>
                <button
                  type="button"
                  className={`segment-btn ${explorerChartStyle === 'south' ? 'active' : ''}`}
                  onClick={() => setExplorerChartStyle('south')}
                  style={{
                    padding: '3px 9px',
                    fontSize: '0.75rem',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: explorerChartStyle === 'south' ? '#d97706' : 'transparent',
                    color: explorerChartStyle === 'south' ? '#fff' : '#94a3b8',
                    fontWeight: explorerChartStyle === 'south' ? 600 : 400,
                  }}
                >
                  South
                </button>
              </div>
            </div>
          </div>

          {/* Varga Quick-Selector Ribbon */}
          <div
            className="varga-selector-ribbon"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
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
                    borderRadius: 8,
                    border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.15)',
                    background: isSelected ? 'rgba(217, 119, 6, 0.22)' : 'rgba(15, 23, 42, 0.55)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <strong style={{ color: isSelected ? '#fbbf24' : '#f8fafc', fontSize: '0.88rem' }}>{v.code}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>1/{v.divisions}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginTop: 2 }}>{v.name}</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {v.keyFocus}
                  </span>
                  {chartVarga && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                        L: {chartVarga.lagnaSignName.slice(0, 3)}
                      </span>
                      {chartVarga.lagnaDms && (
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {chartVarga.lagnaDms.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Varga Workspace Grid: Left Chart, Right Analysis & Grahas */}
          <div className="active-varga-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(380px, 1fr)', gap: 18 }}>
            {/* Left: Interactive SVG Chart */}
            <div className="panel varga-chart-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                    {currentVargaMeta.name} Chakra ({currentVargaMeta.code})
                  </h3>
                  <span className="eyebrow">D{currentVargaMeta.divisions} Harmonic Division • {currentVargaMeta.keyFocus}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="varga-tag"
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      background: 'rgba(217, 119, 6, 0.18)',
                      color: '#fbbf24',
                      borderRadius: 6,
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      fontWeight: 600,
                    }}
                  >
                    Lagna: {currentVargaData?.lagnaSignName} {currentVargaData?.lagnaDms ? currentVargaData.lagnaDms : ''}
                  </span>
                </div>
              </div>

              <VedicChart
                chart={chart}
                forcedVarga={selectedVargaCode}
                hideVargaSelector
                defaultStyle={explorerChartStyle}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc' }}>
                      Grahas in {currentVargaMeta.code} ({currentVargaMeta.name})
                    </h4>
                    <span className="eyebrow">
                      {dignityCounts.exalted > 0 && <span style={{ color: '#10b981', marginRight: 6 }}>{dignityCounts.exalted} Exalted</span>}
                      {dignityCounts.own > 0 && <span style={{ color: '#38bdf8', marginRight: 6 }}>{dignityCounts.own} Own Sign</span>}
                      {dignityCounts.debilitated > 0 && <span style={{ color: '#f87171', marginRight: 6 }}>{dignityCounts.debilitated} Debilitated</span>}
                      {dignityCounts.vargottama > 0 && <span style={{ color: '#fbbf24' }}>{dignityCounts.vargottama} Vargottama</span>}
                    </span>
                  </div>

                  {/* Filter chips */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className={`chip-button ${tableFilter === 'all' ? 'selected' : ''}`}
                      onClick={() => setTableFilter('all')}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      All (9)
                    </button>
                    {dignityCounts.vargottama > 0 && (
                      <button
                        type="button"
                        className={`chip-button ${tableFilter === 'vargottama' ? 'selected' : ''}`}
                        onClick={() => setTableFilter('vargottama')}
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      >
                        Vargottama ({dignityCounts.vargottama})
                      </button>
                    )}
                    {(dignityCounts.exalted > 0 || dignityCounts.own > 0) && (
                      <button
                        type="button"
                        className={`chip-button ${tableFilter === 'dignified' ? 'selected' : ''}`}
                        onClick={() => setTableFilter('dignified')}
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      >
                        Dignified ({dignityCounts.exalted + dignityCounts.own})
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
                        <th style={{ padding: '6px 8px' }}>Graha</th>
                        <th style={{ padding: '6px 8px' }}>Sign in {currentVargaMeta.code}</th>
                        <th style={{ padding: '6px 8px' }}>Deg (DMS)</th>
                        <th style={{ padding: '6px 8px' }}>House</th>
                        <th style={{ padding: '6px 8px' }}>Dignity</th>
                        <th style={{ padding: '6px 8px' }}>Dispositor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlanets.map((gp) => {
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
                            <td style={{ padding: '6px 8px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {gp.dms}
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
