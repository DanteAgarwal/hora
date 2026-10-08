import React, { useMemo } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'

export interface DashaChainItem {
  level: number
  levelLabel: string
  lord: string
}

interface DashaCardProps {
  chart: AstroChart
  selectedPeriod: DashaPeriod | null
  levelLabel: string // 'Mahadasha' | 'Antardasha' | 'Pratyantardasha' | 'Sookshma Dasha' | 'Prana Dasha' | 'Deha Dasha (Sub-Sookshma)'
  hierarchyChain?: DashaChainItem[]
  onSelectPlanet?: (planetName: string) => void
}

export const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b',
  Moon: '#94a3b8',
  Mars: '#ef4444',
  Mercury: '#10b981',
  Jupiter: '#eab308',
  Venus: '#ec4899',
  Saturn: '#6366f1',
  Rahu: '#8b5cf6',
  Ketu: '#a855f7',
}

export const LEVEL_METADATA: Record<number, { name: string; short: string; spanDesc: string; manifestationRole: string }> = {
  1: {
    name: 'Mahadasha',
    short: 'MD',
    spanDesc: 'Major life chapter (6 to 20 years)',
    manifestationRole: 'Determines the baseline life theme, psychological mindset, and karmic background.',
  },
  2: {
    name: 'Antardasha (Bhukti)',
    short: 'AD',
    spanDesc: 'Sub-period (several months to 3 years)',
    manifestationRole: 'Channels the Mahadasha potential toward specific life departments and directed actions.',
  },
  3: {
    name: 'Pratyantardasha',
    short: 'PD',
    spanDesc: 'Sub-sub-period (days to months)',
    manifestationRole: 'Sets the concrete temporal window and environmental catalyst for events.',
  },
  4: {
    name: 'Sookshma Dasha',
    short: 'SD',
    spanDesc: 'Micro-period (hours to several days)',
    manifestationRole: 'Controls subtle psychological shifts, state of mind, and immediate interpersonal encounters.',
  },
  5: {
    name: 'Prana Dasha',
    short: 'PrD',
    spanDesc: 'Breath-level period (1 to 50 hours)',
    manifestationRole: 'Governs vital breath (prana), energy vitality, emotional impulse, and minute-level focus.',
  },
  6: {
    name: 'Deha Dasha (Sub-Sookshma)',
    short: 'DD',
    spanDesc: 'Somatic micro-period (10 to 300 minutes)',
    manifestationRole: 'The physical body (deha) directly receives the sensation and physical manifestation of karma.',
  },
}

export const DashaCard: React.FC<DashaCardProps> = ({
  chart,
  selectedPeriod,
  levelLabel,
  hierarchyChain = [],
  onSelectPlanet,
}) => {
  if (!selectedPeriod) {
    return (
      <div className="panel dasha-card-placeholder" style={{ padding: 18, color: '#94a3b8' }}>
        <p className="eyebrow">Dasha Period Inspector</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>
          Select any period block above to inspect its planetary ruler and timing breakdown down to Prana and Sub-Sookshma levels.
        </p>
      </div>
    )
  }

  const lordName = selectedPeriod.lord
  const planet = chart.planets.find((p) => p.name.toLowerCase() === lordName.toLowerCase())
  const color = PLANET_COLORS[lordName] || '#d97706'
  const levelMeta = LEVEL_METADATA[selectedPeriod.level] || {
    name: levelLabel,
    short: 'Period',
    spanDesc: 'Dasha period',
    manifestationRole: 'Active planetary period.',
  }

  // Precise time progress calculation
  const progressInfo = useMemo(() => {
    if (!selectedPeriod.start || !selectedPeriod.end) return null
    const startMs = new Date(selectedPeriod.start).getTime()
    const endMs = new Date(selectedPeriod.end).getTime()
    const nowMs = Date.now()

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null

    const totalMs = endMs - startMs
    const totalDays = totalMs / (24 * 3600 * 1000)
    const totalHours = totalMs / (3600 * 1000)
    const isPast = nowMs > endMs
    const isFuture = nowMs < startMs
    const isRunning = !isPast && !isFuture

    let pct = 0
    let remainingMs = 0
    if (isRunning) {
      pct = Math.min(100, Math.max(0, Math.round(((nowMs - startMs) / totalMs) * 100)))
      remainingMs = endMs - nowMs
    } else if (isPast) {
      pct = 100
    }

    // Format duration nicely
    let durationString = ''
    if (totalDays >= 365) {
      durationString = `${(totalDays / 365.25).toFixed(1)} years`
    } else if (totalDays >= 30) {
      durationString = `${(totalDays / 30.4375).toFixed(1)} months`
    } else if (totalDays >= 1) {
      durationString = `${totalDays.toFixed(1)} days`
    } else {
      const h = Math.floor(totalHours)
      const m = Math.round((totalHours - h) * 60)
      durationString = `${h}h ${m}m`
    }

    // Format remaining time nicely
    let remainingString = ''
    if (remainingMs > 0) {
      const remDays = remainingMs / (24 * 3600 * 1000)
      const remHours = remainingMs / (3600 * 1000)
      if (remDays >= 365) {
        remainingString = `~${(remDays / 365.25).toFixed(1)} years remaining`
      } else if (remDays >= 30) {
        remainingString = `~${(remDays / 30.4375).toFixed(1)} months remaining`
      } else if (remDays >= 1) {
        remainingString = `~${remDays.toFixed(1)} days remaining`
      } else {
        const rh = Math.floor(remHours)
        const rm = Math.round((remHours - rh) * 60)
        remainingString = `${rh}h ${rm}m remaining`
      }
    }

    return {
      totalDays,
      totalHours,
      isRunning,
      isPast,
      isFuture,
      pct,
      durationString,
      remainingString,
    }
  }, [selectedPeriod])

  return (
    <div
      className="panel dasha-lord-card"
      style={{
        borderLeft: `4px solid ${color}`,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Hierarchy Chain Badge */}
      {hierarchyChain.length > 0 && (
        <div
          className="dasha-chain-ribbon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148, 163, 184, 0.15)',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 600, marginRight: 2 }}>CHAIN:</span>
          {hierarchyChain.map((item, idx) => {
            const itemColor = PLANET_COLORS[item.lord] || '#d97706'
            const isLast = idx === hierarchyChain.length - 1
            return (
              <React.Fragment key={item.level + item.lord}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: isLast ? 'rgba(217, 119, 6, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                    color: isLast ? '#fbbf24' : '#cbd5e1',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: isLast ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.15)',
                    fontWeight: isLast ? 700 : 500,
                  }}
                >
                  <span style={{ color: itemColor, fontWeight: 'bold' }}>{item.lord}</span>
                  <small style={{ color: '#94a3b8' }}>({item.levelLabel})</small>
                </span>
                {idx < hierarchyChain.length - 1 && <span style={{ color: '#64748b' }}>›</span>}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
              {lordName} • Level {selectedPeriod.level} ({levelMeta.name})
            </h3>
            {progressInfo?.isRunning && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  fontWeight: 600,
                  border: '1px solid #f59e0b',
                }}
              >
                ● CURRENTLY RUNNING
              </span>
            )}
          </div>
          <span className="eyebrow" style={{ marginTop: 4, display: 'block' }}>
            {selectedPeriod.start} → {selectedPeriod.end}
            {progressInfo ? ` (${progressInfo.durationString})` : ''} • {levelMeta.spanDesc}
          </span>
        </div>

        {planet && (
          <button
            type="button"
            className="chip-button"
            onClick={() => onSelectPlanet?.(planet.name)}
            style={{ fontSize: '0.75rem', padding: '5px 12px' }}
          >
            Inspect {planet.name} in Universal Inspector →
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {progressInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8' }}>
            <span>
              {progressInfo.isRunning
                ? `Active: ${progressInfo.pct}% elapsed`
                : progressInfo.isPast
                ? 'Completed period'
                : 'Upcoming period'}
            </span>
            {progressInfo.isRunning && (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                {progressInfo.remainingString}
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: 7,
              background: 'rgba(148, 163, 184, 0.15)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressInfo.pct}%`,
                height: '100%',
                background: progressInfo.isRunning ? color : progressInfo.isPast ? '#64748b' : '#334155',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Planet Natal Placement Grid */}
      {planet ? (
        <div
          className="natal-status-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            background: 'rgba(15, 23, 42, 0.6)',
            padding: 12,
            borderRadius: 6,
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <div>
            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Rashi & Degree</span>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#f8fafc' }}>
              {planet.sign} ({planet.houseOrdinal})
            </strong>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{planet.dms}</small>
          </div>

          <div>
            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Dignity</span>
            <strong
              style={{
                display: 'block',
                fontSize: '0.85rem',
                color:
                  planet.dignity === 'Exalted'
                    ? '#10b981'
                    : planet.dignity === 'Debilitated'
                    ? '#ef4444'
                    : planet.dignity === 'Own Sign'
                    ? '#38bdf8'
                    : '#f8fafc',
              }}
            >
              {planet.dignity}
            </strong>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              {planet.retrograde ? 'Retrograde [R]' : 'Direct motion'}
            </small>
          </div>

          <div>
            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Nakshatra</span>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#f8fafc' }}>
              {planet.nakshatra}
            </strong>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Pada {planet.pada}</small>
          </div>

          <div>
            <span className="eyebrow" style={{ fontSize: '0.68rem' }}>Houses Ruled</span>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#f8fafc' }}>
              {planet.lordOfHouses.length > 0 ? planet.lordOfHouses.map((h) => `${h}th`).join(' & ') : 'None (Node)'}
            </strong>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Lord of Bhavas</small>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          Lord <strong>{lordName}</strong> natal placements not directly identified in Graha list.
        </div>
      )}

      {/* Classical Multi-Level Synthesis Guidance */}
      <div
        className="dasha-interpretation-hint"
        style={{
          fontSize: '0.82rem',
          color: '#cbd5e1',
          lineHeight: 1.5,
          borderTop: '1px solid rgba(148, 163, 184, 0.12)',
          paddingTop: 10,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <strong style={{ color: '#fbbf24' }}>Level {selectedPeriod.level} Manifestation Role:</strong>{' '}
          {levelMeta.manifestationRole}
        </div>
        {planet && (
          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
            💡 <strong>Graha Portfolios:</strong> {planet.name} rules bhavas{' '}
            {planet.lordOfHouses.length > 0 ? planet.lordOfHouses.map((h) => `${h}th`).join(' and ') : 'Nodal Axis'} and resides in the{' '}
            <strong>{planet.houseOrdinal} house</strong> ({planet.sign}). In this{' '}
            {levelMeta.name.toLowerCase()} window, its significations directly influence the unfolding karma.
          </div>
        )}
      </div>
    </div>
  )
}
