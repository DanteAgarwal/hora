import React, { useMemo } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import {
  PLANET_COLORS,
  calculateSambhandha,
  findRunningDashaHierarchy,
  checkDashaSandhi,
  getActivatedHouses,
} from './dashaUtils'

interface DashaCockpitProps {
  chart: AstroChart
  selectedMd: DashaPeriod | null
  selectedAd: DashaPeriod | null
  displayMode: 'timeline' | 'table' | 'matrix'
  showMicroTiming: boolean
  onChangeDisplayMode: (mode: 'timeline' | 'table' | 'matrix') => void
  onToggleMicroTiming: () => void
  onJumpToLive: () => void
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const DashaCockpit: React.FC<DashaCockpitProps> = ({
  chart,
  selectedMd,
  selectedAd,
  displayMode,
  showMicroTiming,
  onChangeDisplayMode,
  onToggleMicroTiming,
  onJumpToLive,
  onSelectPlanet,
  onSelectHouse,
}) => {
  // Find live running dasha hierarchy
  const liveHierarchy = useMemo(() => {
    return findRunningDashaHierarchy(chart.dashaTree)
  }, [chart.dashaTree])

  // MD & AD lords to display in the cockpit summary
  const activeMdLord = selectedMd?.lord || liveHierarchy.md?.lord || 'Sun'
  const activeAdLord = selectedAd?.lord || liveHierarchy.ad?.lord || 'Moon'

  // Mutual Sambhandha calculation for the active MD ↔ AD pair
  const sambhandha = useMemo(() => {
    return calculateSambhandha(activeMdLord, activeAdLord, chart)
  }, [activeMdLord, activeAdLord, chart])

  // Dasha Sandhi transition check on the running period
  const sandhi = useMemo(() => {
    if (!liveHierarchy.ad) return null
    return checkDashaSandhi(liveHierarchy.ad)
  }, [liveHierarchy.ad])

  // Activated Bhavas
  const activatedHouses = useMemo(() => {
    return getActivatedHouses([activeMdLord, activeAdLord], chart)
  }, [activeMdLord, activeAdLord, chart])

  return (
    <div className="dasha-cockpit-container panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Bar: Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>⏱️</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Precision Vedic Predictive Timing (Vimshottari Dasha Cockpit)
            </h2>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontWeight: 600,
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              120-Yr Mahadasha Cycle
            </span>
          </div>
          <p style={{ margin: '2px 0 0 26px', fontSize: '0.78rem', color: '#94a3b8' }}>
            Instant classical Sambhandha, Lordship activations, and Parashari multi-tier temporal progression.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="primary-button"
            onClick={onJumpToLive}
            style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ⚡ Jump to Live Moment
          </button>

          <button
            type="button"
            className="chip-button"
            onClick={onToggleMicroTiming}
            style={{
              fontSize: '0.78rem',
              padding: '5px 10px',
              background: showMicroTiming ? 'rgba(217, 119, 6, 0.25)' : 'rgba(30, 41, 59, 0.7)',
              border: showMicroTiming ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
              color: showMicroTiming ? '#fbbf24' : '#94a3b8',
              fontWeight: 600,
            }}
          >
            {showMicroTiming ? 'Hide Micro-Timing (L4-L6)' : '⏱️ Deep Micro-Timing (L4-L6)'}
          </button>

          <div
            className="segmented-control"
            style={{
              display: 'flex',
              background: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 6,
              padding: 2,
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            <button
              type="button"
              className={`segment-btn ${displayMode === 'timeline' ? 'active' : ''}`}
              onClick={() => onChangeDisplayMode('timeline')}
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: displayMode === 'timeline' ? '#d97706' : 'transparent',
                color: displayMode === 'timeline' ? '#fff' : '#94a3b8',
                fontWeight: displayMode === 'timeline' ? 600 : 400,
              }}
            >
              📊 Multi-Track Timeline
            </button>
            <button
              type="button"
              className={`segment-btn ${displayMode === 'matrix' ? 'active' : ''}`}
              onClick={() => onChangeDisplayMode('matrix')}
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: displayMode === 'matrix' ? '#d97706' : 'transparent',
                color: displayMode === 'matrix' ? '#fff' : '#94a3b8',
                fontWeight: displayMode === 'matrix' ? 600 : 400,
              }}
            >
              ⚡ Sambhandha Matrix
            </button>
            <button
              type="button"
              className={`segment-btn ${displayMode === 'table' ? 'active' : ''}`}
              onClick={() => onChangeDisplayMode('table')}
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: displayMode === 'table' ? '#d97706' : 'transparent',
                color: displayMode === 'table' ? '#fff' : '#94a3b8',
                fontWeight: displayMode === 'table' ? 600 : 400,
              }}
            >
              📋 Master Schedule
            </button>
          </div>
        </div>
      </div>

      {/* 4-Tile High-Density Metric Strip */}
      <div
        className="dasha-cockpit-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 10,
        }}
      >
        {/* Tile 1: Running Dasha Chain */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="eyebrow" style={{ fontSize: '0.68rem', margin: 0 }}>Active Dasha Chain</span>
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>● RUNNING NOW</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {liveHierarchy.chain.slice(0, 3).map((item, idx) => {
              const itemColor = PLANET_COLORS[item.lord] || '#d97706'
              return (
                <React.Fragment key={`${item.levelLabel}-${item.lord}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onSelectPlanet?.(item.lord)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: `1px solid ${itemColor}66`,
                        color: itemColor,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      {item.lord} <small style={{ color: '#94a3b8' }}>({item.levelLabel})</small>
                    </span>
                  </button>
                  {idx < 2 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>›</span>}
                </React.Fragment>
              )
            })}
          </div>

          <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#94a3b8' }}>
            MD: <strong>{liveHierarchy.md?.lord}</strong> • AD: <strong>{liveHierarchy.ad?.lord}</strong> • PD: <strong>{liveHierarchy.pd?.lord}</strong>
          </div>
        </div>

        {/* Tile 2: Mutual Sambhandha (MD ↔ AD) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="eyebrow" style={{ fontSize: '0.68rem', margin: 0 }}>
              Lord Sambhandha ({activeMdLord} ↔ {activeAdLord})
            </span>
            {sambhandha && (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontWeight: 700,
                  background:
                    sambhandha.category === 'Auspicious'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : sambhandha.category === 'Challenging Friction'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                  color:
                    sambhandha.category === 'Auspicious'
                      ? '#34d399'
                      : sambhandha.category === 'Challenging Friction'
                      ? '#f87171'
                      : '#fbbf24',
                }}
              >
                {sambhandha.category}
              </span>
            )}
          </div>

          {sambhandha ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <strong style={{ color: '#f8fafc' }}>{sambhandha.axisLabel}</strong>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#fbbf24', fontSize: '0.74rem' }}>
                  {sambhandha.compoundMaitri}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.3 }}>
                {sambhandha.synthesis.slice(0, 90)}...
              </p>
            </div>
          ) : (
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Single period active</span>
          )}
        </div>

        {/* Tile 3: Active Bhavas (Life Portfolios) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="eyebrow" style={{ fontSize: '0.68rem', margin: 0 }}>Activated Bhavas</span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Occupied & Ruled</span>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {activatedHouses.houseNumbers.map((hNum) => (
              <button
                key={hNum}
                type="button"
                onClick={() => onSelectHouse?.(hNum)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title={`Inspect House ${hNum}`}
              >
                H{hNum}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#64748b' }}>
            Ruled by {activeMdLord} & {activeAdLord}
          </div>
        </div>

        {/* Tile 4: Dasha Sandhi / Countdown */}
        <div
          style={{
            background: sandhi?.isSandhi ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.65)',
            border: sandhi?.isSandhi ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="eyebrow" style={{ fontSize: '0.68rem', margin: 0, color: sandhi?.isSandhi ? '#fbbf24' : '#94a3b8' }}>
              {sandhi?.isSandhi ? '⚠️ Dasha Sandhi Alert' : 'Temporal Horizon'}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>
              {sandhi?.remainingFormatted}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#f8fafc' }}>
            Current AD: <strong>{liveHierarchy.ad?.lord}</strong> ends in <strong>{sandhi?.remainingFormatted}</strong>
          </div>

          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
            Next AD: <strong>Parashari transition approaches</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
