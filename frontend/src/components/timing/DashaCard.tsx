import React, { useMemo } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'

interface DashaCardProps {
  chart: AstroChart
  selectedPeriod: DashaPeriod | null
  levelLabel: string // 'Mahadasha' | 'Antardasha' | 'Pratyantardasha'
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

export const DashaCard: React.FC<DashaCardProps> = ({
  chart,
  selectedPeriod,
  levelLabel,
  onSelectPlanet,
}) => {
  if (!selectedPeriod) {
    return (
      <div className="panel dasha-card-placeholder" style={{ padding: 18, color: '#94a3b8' }}>
        <p className="eyebrow">Dasha Period Inspector</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>Select any period block above to inspect its planetary ruler and timing breakdown.</p>
      </div>
    )
  }

  const lordName = selectedPeriod.lord
  const planet = chart.planets.find((p) => p.name.toLowerCase() === lordName.toLowerCase())
  const color = PLANET_COLORS[lordName] || '#d97706'

  // Time progress calculation
  const progressInfo = useMemo(() => {
    if (!selectedPeriod.start || !selectedPeriod.end) return null
    const startMs = new Date(selectedPeriod.start).getTime()
    const endMs = new Date(selectedPeriod.end).getTime()
    const nowMs = Date.now()

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null

    const totalDays = Math.round((endMs - startMs) / (24 * 3600 * 1000))
    const isPast = nowMs > endMs
    const isFuture = nowMs < startMs
    const isRunning = !isPast && !isFuture

    let pct = 0
    let daysRemaining = 0
    if (isRunning) {
      pct = Math.min(100, Math.max(0, Math.round(((nowMs - startMs) / (endMs - startMs)) * 100)))
      daysRemaining = Math.round((endMs - nowMs) / (24 * 3600 * 1000))
    } else if (isPast) {
      pct = 100
    }

    return {
      totalDays,
      isRunning,
      isPast,
      isFuture,
      pct,
      daysRemaining,
    }
  }, [selectedPeriod])

  return (
    <div
      className="panel dasha-lord-card"
      style={{
        borderLeft: `4px solid ${color}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              {lordName} {levelLabel}
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
          <span className="eyebrow" style={{ marginTop: 2 }}>
            {selectedPeriod.start.slice(0, 10)} → {selectedPeriod.end.slice(0, 10)}
            {progressInfo ? ` (${(progressInfo.totalDays / 365.25).toFixed(1)} yrs / ${progressInfo.totalDays} days)` : ''}
          </span>
        </div>

        {planet && (
          <button
            type="button"
            className="chip-button"
            onClick={() => onSelectPlanet?.(planet.name)}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Inspect {planet.name} in Detail →
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {progressInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>
              {progressInfo.isRunning
                ? `Active: ${progressInfo.pct}% elapsed`
                : progressInfo.isPast
                ? 'Completed period'
                : 'Upcoming period'}
            </span>
            {progressInfo.isRunning && (
              <span style={{ color: '#f59e0b' }}>
                {progressInfo.daysRemaining > 365
                  ? `~${(progressInfo.daysRemaining / 365.25).toFixed(1)} years remaining`
                  : `${progressInfo.daysRemaining} days remaining`}
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(148, 163, 184, 0.15)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressInfo.pct}%`,
                height: '100%',
                background: progressInfo.isRunning ? color : progressInfo.isPast ? '#64748b' : '#334155',
                borderRadius: 3,
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

      {/* Classical Interpretation Note */}
      {planet && (
        <div
          className="dasha-interpretation-hint"
          style={{
            fontSize: '0.8rem',
            color: '#cbd5e1',
            lineHeight: 1.45,
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            paddingTop: 8,
          }}
        >
          💡 <strong>Activation Themes:</strong> During this period, matters related to{' '}
          {planet.lordOfHouses.length > 0 ? (
            <>the <strong>{planet.lordOfHouses.map((h) => `${h}th`).join(' and ')} houses</strong> and </>
          ) : (
            'karmic nodal axes and '
          )}
          the <strong>{planet.houseOrdinal} house</strong> ({planet.sign}) are activated in manifest life.
          {planet.dignity === 'Exalted' || planet.dignity === 'Own Sign'
            ? ' With high dignity, the Graha yields auspicious results with minimal friction.'
            : planet.dignity === 'Debilitated'
            ? ' The native may encounter tests and soul lessons in the significations of this Graha.'
            : ' Balanced results subject to transits and supporting planetary aspects.'}
        </div>
      )}
    </div>
  )
}
