import React, { useMemo, useState, useEffect } from 'react'
import type { AstroChart, DashaPeriod, PlanetPosition } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'
import {
  PLANET_COLORS,
  LEVEL_METADATA,
  calculateSambhandha,
  checkDashaSandhi,
  getActivatedHouses,
  getMahadashaProfile,
  getPeriodKey,
  parseDateMs,
  type DashaChainItem,
} from '../timing/dashaUtils'
import { fetchExpandedSubPeriods } from '../../services/dashaApi'
import { useNow } from '../../hooks/useNow'

interface DashaInspectorProps {
  chart: AstroChart
  selectedPeriod: DashaPeriod | null
  hierarchyChain?: DashaChainItem[]
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onSelectPeriod?: (period: DashaPeriod) => void
  onOpenHelp?: (termId: string) => void
}

const safeDateSlice = (d?: string | number | null, len = 10): string => {
  if (typeof d === 'string') return d.slice(0, len)
  if (d) return String(d).slice(0, len)
  return '—'
}

export const DashaInspector: React.FC<DashaInspectorProps> = ({
  chart,
  selectedPeriod,
  hierarchyChain = [],
  onSelectPlanet,
  onSelectHouse,
  onSelectPeriod,
  onOpenHelp,
}) => {
  const nowMs = useNow()
  // If no period selected, fall back to the first available period or live period
  const activePeriod = selectedPeriod || chart?.dashaTree?.[0] || null

  // Find the planet position corresponding to this period's lord
  const lordName = activePeriod?.lord || ''
  const planet: PlanetPosition | undefined = useMemo(() => {
    if (!lordName) return undefined
    return chart.planets.find((p) => p.name.toLowerCase() === lordName.toLowerCase())
  }, [chart.planets, lordName])

  // Color & metadata for the period
  const color = PLANET_COLORS[lordName] || '#d97706'
  const levelMeta = activePeriod ? LEVEL_METADATA[activePeriod.level] || {
    name: `Level ${activePeriod.level}`,
    short: 'Period',
    spanDesc: 'Dasha period',
    manifestationRole: 'Active planetary period.',
  } : null

  // Native birth timestamp
  const birthMs = useMemo(() => {
    if (chart.birthData?.year) {
      return new Date(
        chart.birthData.year,
        (chart.birthData.month || 1) - 1,
        chart.birthData.day || 1,
        chart.birthData.hour || 12,
        chart.birthData.minute || 0
      ).getTime()
    }
    if (chart.metadata?.dateFormatted) {
      const parsed = new Date(chart.metadata.dateFormatted).getTime()
      if (!isNaN(parsed)) return parsed
    }
    return null
  }, [chart.birthData, chart.metadata])

  // Native age during period
  const ageStats = useMemo(() => {
    if (!birthMs || !activePeriod?.start || !activePeriod?.end) return null
    const startMs = new Date(activePeriod.start).getTime()
    const endMs = new Date(activePeriod.end).getTime()
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null

    const msPerYear = 365.25 * 24 * 3600 * 1000
    const startAge = Math.max(0, (startMs - birthMs) / msPerYear)
    const endAge = Math.max(0, (endMs - birthMs) / msPerYear)

    let stageLabel = ''
    if (endAge <= 12) stageLabel = 'Childhood & Formative Years'
    else if (endAge <= 22) stageLabel = 'Youth, Education & Identity'
    else if (endAge <= 36) stageLabel = 'Career Foundation & Establishment'
    else if (endAge <= 52) stageLabel = 'Peak Productivity & Mastery'
    else if (endAge <= 68) stageLabel = 'Maturity, Influence & Mentorship'
    else stageLabel = 'Elder Wisdom, Reflection & Moksha'

    return {
      startAge: startAge.toFixed(1),
      endAge: endAge.toFixed(1),
      stageLabel,
    }
  }, [birthMs, activePeriod])

  // Mahadasha Karmic Profile (Level 1 only)
  const mdProfile = useMemo(() => {
    if (!activePeriod || activePeriod.level !== 1) return null
    return getMahadashaProfile(activePeriod.lord)
  }, [activePeriod])

  // Child Sub-periods under this active period (for levels 1..5)
  // Level 1 -> Level 2 (AD)
  // Level 2 -> Level 3 (PD)
  // Level 3 -> Level 4 (SD)
  // Level 4 -> Level 5 (PrD)
  // Level 5 -> Level 6 (DD)
  const [childSubPeriods, setChildSubPeriods] = useState<DashaPeriod[]>([])

  useEffect(() => {
    let cancelled = false
    if (!activePeriod || (activePeriod.level && activePeriod.level >= 6)) {
      setChildSubPeriods([])
      return
    }

    if (activePeriod.children && activePeriod.children.length === 9) {
      setChildSubPeriods(activePeriod.children)
      return
    }

    const nextLevel = (activePeriod.level || 1) + 1
    fetchExpandedSubPeriods(activePeriod, nextLevel).then((subs) => {
      if (!cancelled) setChildSubPeriods(subs)
    })

    return () => {
      cancelled = true
    }
  }, [activePeriod])

  const childLevelMeta = useMemo(() => {
    if (!activePeriod || (activePeriod.level && activePeriod.level >= 6)) return null
    const nextLevel = (activePeriod.level || 1) + 1
    return LEVEL_METADATA[nextLevel] || null
  }, [activePeriod])

  // Progress & duration calculations
  const timingStats = useMemo(() => {
    if (!activePeriod?.start || !activePeriod?.end) return null
    const startMs = parseDateMs(activePeriod.start)
    const endMs = parseDateMs(activePeriod.end)

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null

    const totalMs = endMs - startMs
    const totalDays = totalMs / (24 * 3600 * 1000)
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

    // Format duration
    let durationFormatted = ''
    if (totalDays >= 365.25) {
      durationFormatted = `${(totalDays / 365.25).toFixed(1)} yrs`
    } else if (totalDays >= 30) {
      durationFormatted = `${(totalDays / 30.4375).toFixed(1)} mos`
    } else if (totalDays >= 1) {
      durationFormatted = `${Math.round(totalDays)} days`
    } else {
      const hours = totalMs / (3600 * 1000)
      durationFormatted = `${hours.toFixed(1)} hrs`
    }

    // Format remaining time
    let remainingFormatted = ''
    if (remainingMs > 0) {
      const remDays = remainingMs / (24 * 3600 * 1000)
      if (remDays >= 365.25) {
        remainingFormatted = `~${(remDays / 365.25).toFixed(1)} yrs left`
      } else if (remDays >= 30) {
        remainingFormatted = `~${(remDays / 30.4375).toFixed(1)} mos left`
      } else if (remDays >= 1) {
        remainingFormatted = `~${Math.round(remDays)} days left`
      } else {
        const remHrs = remainingMs / (3600 * 1000)
        remainingFormatted = `~${remHrs.toFixed(1)} hrs left`
      }
    }

    return {
      isRunning,
      isPast,
      isFuture,
      pct,
      durationFormatted,
      remainingFormatted,
    }
  }, [activePeriod, nowMs])

  // Sambhandha with Mahadasha Lord (Root Period) for Sub-periods (Level > 1)
  const sambhandha = useMemo(() => {
    if (!activePeriod || activePeriod.level <= 1 || hierarchyChain.length === 0) return null
    const rootMdLord = hierarchyChain[0]?.lord
    if (!rootMdLord || rootMdLord.toLowerCase() === activePeriod.lord.toLowerCase()) return null
    return calculateSambhandha(rootMdLord, activePeriod.lord, chart)
  }, [activePeriod, hierarchyChain, chart])

  // Combined Activated Bhavas for Sub-periods
  const combinedHouses = useMemo(() => {
    if (!activePeriod || activePeriod.level <= 1 || hierarchyChain.length === 0) return null
    const rootLord = hierarchyChain[0]?.lord
    const subLord = activePeriod.lord
    return getActivatedHouses([rootLord, subLord], chart)
  }, [activePeriod, hierarchyChain, chart])

  // Dasha Sandhi twilight detection
  const sandhiInfo = useMemo(() => {
    if (!activePeriod) return null
    return checkDashaSandhi(activePeriod)
  }, [activePeriod])

  // Zodiac Sign Info & Degree Progress
  const signInfo = useMemo(() => {
    if (!planet) return null
    return ZODIAC_SIGNS.find((s) => s.name === planet.sign) || ZODIAC_SIGNS[planet.signIndex || 0] || ZODIAC_SIGNS[0]
  }, [planet])

  const degInSign = planet?.degreeInSign || 0
  const progressDegPct = Math.min(100, Math.max(0, (degInSign / 30) * 100))

  if (!activePeriod) {
    return (
      <div className="inspector-panel-content" style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>
        <p className="eyebrow">Dasha Period Inspector</p>
        <p style={{ fontSize: '0.84rem', marginTop: 8 }}>
          Select any period from the timeline or schedule table to inspect its planetary ruler, mutual Sambhandha, and Parashari indications.
        </p>
      </div>
    )
  }

  // ==========================================
  // LEVEL 1: MAHADASHA MASTER CHAPTER VIEW
  // ==========================================
  if (activePeriod.level === 1) {
    return (
      <div className="inspector-panel-content dasha-inspector-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 1. Sovereign Mahadasha Header */}
        <div
          className="dasha-inspector-hero"
          style={{
            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)`,
            border: `1px solid rgba(148, 163, 184, 0.18)`,
            borderLeft: `4px solid ${color}`,
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color,
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  boxShadow: `0 0 12px ${color}88`,
                }}
              >
                {planet?.symbol || activePeriod.lord.slice(0, 2)}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 800 }}>
                    {mdProfile?.sanskritTitle || `${activePeriod.lord} Mahadasha`}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24',
                      fontWeight: 700,
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    Level 1 • Mahadasha
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                  {mdProfile?.archetype || 'Root Vimshottari Life Chapter'}
                </p>
              </div>
            </div>

            {timingStats?.isRunning && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  fontWeight: 800,
                  border: '1px solid #f59e0b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
                  animation: 'pulse 2s infinite',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                CURRENT LIVE CHAPTER
              </span>
            )}
          </div>
        </div>

        {/* 2. Chronological Span, Lifespan Share & Native's Age */}
        <div
          className="inspector-section"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            padding: 12,
            borderRadius: 6,
            border: '1px solid rgba(148, 163, 184, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.76rem', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: '#cbd5e1' }}>
              📅 <strong>{safeDateSlice(activePeriod?.start)}</strong> → <strong>{safeDateSlice(activePeriod?.end)}</strong>
            </span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              {mdProfile ? `${mdProfile.totalYears} Years (${mdProfile.lifespanPct}% of 120-Yr Lifespan)` : timingStats?.durationFormatted}
            </span>
          </div>

          {/* Native's Age Card */}
          {ageStats && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 41, 59, 0.75)',
                padding: '8px 10px',
                borderRadius: 4,
                marginTop: 6,
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>👤</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                    Native's Age: {ageStats.startAge} to {ageStats.endAge} years old
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Life Stage: {ageStats.stageLabel}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4, fontWeight: 600 }}>
                Vimshottari Age Window
              </span>
            </div>
          )}

          {/* Chapter Progression Bar */}
          {timingStats && (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(148, 163, 184, 0.15)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: `${timingStats.pct}%`,
                    height: '100%',
                    background: timingStats.isRunning
                      ? `linear-gradient(90deg, ${color} 0%, #fbbf24 100%)`
                      : timingStats.isPast
                      ? '#64748b'
                      : '#334155',
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span style={{ color: timingStats.isRunning ? '#fbbf24' : '#94a3b8' }}>
                  {timingStats.isRunning ? `${timingStats.pct}% of Chapter Elapsed` : timingStats.isPast ? 'Chapter Completed' : 'Upcoming Chapter'}
                </span>
                {timingStats.isRunning && timingStats.remainingFormatted && (
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {timingStats.remainingFormatted}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Dasha Sandhi Twilight Alert (if active) */}
        {sandhiInfo?.isSandhi && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: '0.74rem',
              color: '#fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <div>
              <strong>Mahadasha Sandhi Twilight:</strong> This major {activePeriod.lord} life chapter is concluding in {sandhiInfo.remainingFormatted}. Classical Parashari rules warn that the final twilight months of a Mahadasha manifest destabilizing transitions as the consciousness readies for the incoming planetary lord.
            </div>
          </div>
        )}

        {/* 4. Karmic Chapter Blueprint */}
        {mdProfile && (
          <div
            className="inspector-section"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              padding: 12,
              borderRadius: 6,
              border: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow" style={{ margin: 0, color: '#f59e0b' }}>
                Karmic Chapter Blueprint & Life Mission
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>BPHS Shanti & Phala</span>
            </div>

            <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {mdProfile.coreTheme}
            </p>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 10px', borderRadius: 4, marginBottom: 8, borderLeft: `3px solid ${color}` }}>
              <strong style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'block', marginBottom: 2 }}>
                Psychological Transformation:
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                {mdProfile.psychologicalShift}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                Key Life Manifestations:
              </strong>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                {mdProfile.keyManifestations.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: 2 }}>{m}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, fontSize: '0.72rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '6px 8px', borderRadius: 4, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <strong style={{ color: '#f87171' }}>⚠️ Growth Challenge: </strong>
                <span style={{ color: '#cbd5e1' }}>{mdProfile.growthChallenges}</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px 8px', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: '#34d399' }}>🌿 Classical Remedy: </strong>
                <span style={{ color: '#cbd5e1' }}>{mdProfile.classicalRemedy}</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Natal Dignity & Astronomical Placement */}
        {planet && (
          <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="eyebrow" style={{ margin: 0 }}>Natal Placement & Dignity</span>
              <button
                type="button"
                className="chip-button"
                onClick={() => onSelectPlanet?.(planet.name)}
                style={{ fontSize: '0.68rem', padding: '2px 8px' }}
              >
                Open Planet Inspector →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.78rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>House & Sign</span>
                <strong style={{ color: '#f8fafc' }}>
                  {planet.houseOrdinal} House ({planet.sign})
                </strong>
                {signInfo && (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginTop: 1 }}>
                    {signInfo.element} • {signInfo.modality}
                  </span>
                )}
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Dignity & Motion</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <strong
                    style={{
                      color:
                        planet.dignity === 'Exalted'
                          ? '#34d399'
                          : planet.dignity === 'Own Sign'
                          ? '#38bdf8'
                          : planet.dignity === 'Debilitated'
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {planet.dignity}
                  </strong>
                  {planet.retrograde && (
                    <button
                      type="button"
                      onClick={() => onOpenHelp?.('retrograde')}
                      style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                      title="Learn about Retrograde (Vakri)"
                    >
                      [R]
                    </button>
                  )}
                  {planet.combust && (
                    <button
                      type="button"
                      onClick={() => onOpenHelp?.('combustion')}
                      style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                      title="Learn about Combustion (Asta)"
                    >
                      🔥 Asta
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Nakshatra & Pada</span>
                <strong style={{ color: '#f8fafc' }}>
                  {planet.nakshatra} <small style={{ color: '#94a3b8' }}>P{planet.pada}</small>
                </strong>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Exact DMS</span>
                <strong style={{ color: '#94a3b8' }}>{planet.dms}</strong>
              </div>
            </div>

            {/* 0° - 30° Sign Degree Gauge */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#64748b', marginBottom: 2 }}>
                <span>0°</span>
                <span style={{ color: '#94a3b8' }}>{degInSign.toFixed(2)}° in {planet.sign}</span>
                <span>30°</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${progressDegPct}%`, height: '100%', background: color, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        )}

        {/* 6. Activated Life Departments (Bhavas) */}
        {planet && (
          <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <span className="eyebrow" style={{ margin: '0 0 6px 0', display: 'block' }}>
              Activated Life Departments (Bhavas)
            </span>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="chip-button"
                onClick={() => onSelectHouse?.(planet.houseNumber)}
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 8px',
                  background: 'rgba(217, 119, 6, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                📍 {planet.houseOrdinal} House (Occupied)
              </button>

              {planet.lordOfHouses && planet.lordOfHouses.length > 0 ? (
                planet.lordOfHouses.map((hNum) => (
                  <button
                    key={hNum}
                    type="button"
                    className="chip-button"
                    onClick={() => onSelectHouse?.(hNum)}
                    style={{
                      fontSize: '0.74rem',
                      padding: '4px 8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    👑 {hNum}th House Lord (Ruled)
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nodal Axis (Shadow Graha)</span>
              )}
            </div>
          </div>
        )}

        {/* 7. The 9 Sub-Periods (Antardashas) Under This Mahadasha */}
        {childSubPeriods.length > 0 && (
          <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="eyebrow" style={{ margin: 0 }}>
                The 9 {childLevelMeta?.name || 'Antardashas'} ({childLevelMeta?.short || 'AD'})
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Click any to drill down
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
              {childSubPeriods.map((ad, adIdx) => {
                const adColor = PLANET_COLORS[ad.lord] || '#94a3b8'
                const sMs = parseDateMs(ad.start)
                const eMs = parseDateMs(ad.end)
                const isLive = sMs <= nowMs && nowMs <= eMs
                const isPast = nowMs > eMs
                const durationMos = ((eMs - sMs) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)

                return (
                  <div
                    key={getPeriodKey(ad, adIdx)}
                    onClick={() => onSelectPeriod?.(ad)}
                    style={{
                      background: isLive ? 'rgba(245, 158, 11, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                      border: isLive ? '1.5px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.12)',
                      borderRadius: 6,
                      padding: '8px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isLive ? '0 0 10px rgba(245, 158, 11, 0.25)' : undefined,
                    }}
                    title={`Inspect ${activePeriod.lord}–${ad.lord} ${childLevelMeta?.short || 'AD'}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: adColor }} />
                        <strong style={{ fontSize: '0.74rem', color: '#f8fafc' }}>{ad.lord}</strong>
                      </div>
                      {isLive ? (
                        <span style={{ fontSize: '0.58rem', padding: '1px 4px', background: '#f59e0b', color: '#0f172a', fontWeight: 900, borderRadius: 3 }}>
                          LIVE
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.62rem', color: isPast ? '#64748b' : '#94a3b8' }}>
                          {durationMos}m
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginBottom: 4 }}>
                      {safeDateSlice(ad.start)} → {safeDateSlice(ad.end)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPeriod?.(ad)
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        borderRadius: 3,
                        padding: '2px 0',
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Inspect {childLevelMeta?.short || 'AD'} →
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // LEVEL 2+: SUB-PERIOD INSPECTION VIEW
  // ==========================================
  return (
    <div className="inspector-panel-content dasha-inspector-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Header Banner & Status */}
      <div
        className="dasha-inspector-hero"
        style={{
          background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)`,
          border: `1px solid rgba(148, 163, 184, 0.15)`,
          borderLeft: `4px solid ${color}`,
          borderRadius: 8,
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: color,
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  boxShadow: `0 0 10px ${color}88`,
                }}
              >
                {planet?.symbol || activePeriod.lord.slice(0, 2)}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                {activePeriod.lord}
              </h3>
              {planet?.sanskritName && (
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>({planet.sanskritName})</span>
              )}
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                L{activePeriod.level} • {levelMeta?.short}
              </span>
            </div>

            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
              {levelMeta?.name} • <span style={{ color: '#94a3b8' }}>{levelMeta?.spanDesc}</span>
            </p>
          </div>

          {timingStats?.isRunning && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                fontWeight: 700,
                border: '1px solid #f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                animation: 'pulse 2s infinite',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
              LIVE MOMENT
            </span>
          )}
        </div>

        {/* Hierarchy Chain Ribbon */}
        {hierarchyChain.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(148, 163, 184, 0.12)',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>CHAIN:</span>
            {hierarchyChain.map((item, idx) => {
              const itemColor = PLANET_COLORS[item.lord] || '#d97706'
              const isCurrent = item.level === activePeriod.level && item.lord === activePeriod.lord
              return (
                <React.Fragment key={`${item.level}-${item.lord}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.period && onSelectPeriod) {
                        onSelectPeriod(item.period)
                      } else {
                        onSelectPlanet?.(item.lord)
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: isCurrent ? 'rgba(217, 119, 6, 0.3)' : 'rgba(30, 41, 59, 0.7)',
                      border: isCurrent ? `1px solid ${itemColor}` : '1px solid rgba(148, 163, 184, 0.12)',
                      color: isCurrent ? '#fbbf24' : '#cbd5e1',
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: 'pointer',
                    }}
                    title={item.period ? `Drill back & inspect ${item.levelLabel}: ${item.lord} (collapses deeper levels)` : `Inspect ${item.lord}`}
                  >
                    <span style={{ color: itemColor, fontWeight: 700 }}>{item.lord}</span>
                    <small style={{ color: '#94a3b8' }}>({item.levelLabel})</small>
                  </button>
                  {idx < hierarchyChain.length - 1 && <span style={{ color: '#475569' }}>›</span>}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Timing Progression Meter & Native Age */}
      {timingStats && (
        <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.74rem' }}>
            <span style={{ color: '#94a3b8' }}>
              {safeDateSlice(activePeriod?.start)} → {safeDateSlice(activePeriod?.end)}
            </span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>
              {timingStats.durationFormatted}
            </span>
          </div>

          {/* Native's Age during sub-period */}
          {ageStats && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.6)', padding: '4px 8px', borderRadius: 4, marginBottom: 8, fontSize: '0.72rem' }}>
              <span style={{ color: '#38bdf8' }}>
                👤 Native's Age: <strong>{ageStats.startAge} to {ageStats.endAge} yrs</strong>
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{ageStats.stageLabel}</span>
            </div>
          )}

          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(148, 163, 184, 0.15)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: `${timingStats.pct}%`,
                height: '100%',
                background: timingStats.isRunning
                  ? `linear-gradient(90deg, ${color} 0%, #fbbf24 100%)`
                  : timingStats.isPast
                  ? '#64748b'
                  : '#334155',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: timingStats.isRunning ? '#fbbf24' : '#94a3b8' }}>
              {timingStats.isRunning
                ? `${timingStats.pct}% elapsed`
                : timingStats.isPast
                ? 'Completed'
                : 'Upcoming'}
            </span>
            {timingStats.isRunning && timingStats.remainingFormatted && (
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {timingStats.remainingFormatted}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Dasha Sandhi Twilight Alert (if active) */}
      {sandhiInfo?.isSandhi && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: '0.74rem',
            color: '#fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <div>
            <strong>Dasha Sandhi Transition:</strong> Period concluding in {sandhiInfo.remainingFormatted}. Parashari tradition advises caution during major life junction twilights.
          </div>
        </div>
      )}

      {/* 4. Mutual Sambhandha (MD ↔ Sub-Period Lord Chemistry) */}
      {sambhandha && hierarchyChain[0] && (
        <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              Mutual Sambhandha ({hierarchyChain[0].lord} ↔ {activePeriod.lord})
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: 4,
                background:
                  sambhandha.category === 'Auspicious'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : sambhandha.category === 'Favorable Growth'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : sambhandha.category === 'Challenging Friction'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                color:
                  sambhandha.category === 'Auspicious'
                    ? '#34d399'
                    : sambhandha.category === 'Favorable Growth'
                    ? '#38bdf8'
                    : sambhandha.category === 'Challenging Friction'
                    ? '#f87171'
                    : '#fbbf24',
                fontWeight: 700,
              }}
            >
              {sambhandha.axisLabel}
            </span>
          </div>

          {/* Friendship & Synthesis Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              5-Fold Maitri: <strong style={{ color: '#fbbf24' }}>{sambhandha.compoundMaitri}</strong>
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              Natural: {sambhandha.naturalMaitri} • Temporal: {sambhandha.temporalMaitri}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
            {sambhandha.synthesis}
          </p>

          {sambhandha.bphsGuidance && (
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 6, marginTop: 8 }}>
              📜 <strong>BPHS Classical Rule:</strong> {sambhandha.bphsGuidance}
            </div>
          )}
        </div>
      )}

      {/* 5. Combined Activated Bhavas in Life */}
      {combinedHouses && hierarchyChain[0] && (
        <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              Combined Activated Bhavas ({hierarchyChain[0].lord} + {activePeriod.lord})
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{combinedHouses.houseNumbers.length} Houses Active</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {combinedHouses.details.map((d) => (
              <div key={d.lord} style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(30, 41, 59, 0.7)', padding: '4px 8px', borderRadius: 4 }}>
                <span style={{ color: PLANET_COLORS[d.lord] || '#fbbf24', fontWeight: 700, fontSize: '0.72rem' }}>
                  {d.lord}:
                </span>
                <button
                  type="button"
                  onClick={() => onSelectHouse?.(d.occupiedHouse)}
                  style={{
                    background: 'rgba(217, 119, 6, 0.25)',
                    border: 'none',
                    color: '#fbbf24',
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                  title={`Occupies House ${d.occupiedHouse}`}
                >
                  H{d.occupiedHouse} (Occ)
                </button>
                {d.ruledHouses.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onSelectHouse?.(h)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.68rem',
                      padding: '1px 5px',
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                    title={`Rules House ${h}`}
                  >
                    H{h}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Lord Natal Dignity & Astronomical Placement */}
      {planet ? (
        <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="eyebrow" style={{ margin: 0 }}>Natal Placement & Dignity</span>
            <button
              type="button"
              className="chip-button"
              onClick={() => onSelectPlanet?.(planet.name)}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              Open Planet Inspector →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.78rem' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>House & Sign</span>
              <strong style={{ color: '#f8fafc' }}>
                {planet.houseOrdinal} House ({planet.sign})
              </strong>
              {signInfo && (
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginTop: 1 }}>
                  {signInfo.element} • {signInfo.modality}
                </span>
              )}
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Dignity & Motion</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong
                  style={{
                    color:
                      planet.dignity === 'Exalted'
                        ? '#34d399'
                        : planet.dignity === 'Own Sign'
                        ? '#38bdf8'
                        : planet.dignity === 'Debilitated'
                        ? '#f87171'
                        : '#fbbf24',
                  }}
                >
                  {planet.dignity}
                </strong>
                {planet.retrograde && (
                  <button
                    type="button"
                    onClick={() => onOpenHelp?.('retrograde')}
                    style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                    title="Learn about Retrograde (Vakri)"
                  >
                    [R]
                  </button>
                )}
                {planet.combust && (
                  <button
                    type="button"
                    onClick={() => onOpenHelp?.('combustion')}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                    title="Learn about Combustion (Asta)"
                  >
                    🔥 Asta
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Nakshatra & Pada</span>
              <strong style={{ color: '#f8fafc' }}>
                {planet.nakshatra} <small style={{ color: '#94a3b8' }}>P{planet.pada}</small>
              </strong>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4 }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Exact DMS</span>
              <strong style={{ color: '#94a3b8' }}>{planet.dms}</strong>
            </div>
          </div>

          {/* 0° - 30° Sign Degree Gauge */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#64748b', marginBottom: 2 }}>
              <span>0°</span>
              <span style={{ color: '#94a3b8' }}>{degInSign.toFixed(2)}° in {planet.sign}</span>
              <span>30°</span>
            </div>
            <div style={{ width: '100%', height: 4, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progressDegPct}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', padding: 8 }}>
          Ruler <strong>{lordName}</strong> not mapped as primary graha.
        </div>
      )}

      {/* 7. Child Sub-Periods (Drill-Down to Level + 1) */}
      {childSubPeriods.length > 0 && (
        <div className="inspector-section" style={{ background: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              The 9 {childLevelMeta?.name || 'Sub-Periods'} ({childLevelMeta?.short})
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              Click any to drill down
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
            {childSubPeriods.map((sub, sIdx) => {
              const subColor = PLANET_COLORS[sub.lord] || '#94a3b8'
              const sMs = parseDateMs(sub.start)
              const eMs = parseDateMs(sub.end)
              const isLive = sMs <= nowMs && nowMs <= eMs
              const isPast = nowMs > eMs
              const totalDays = (eMs - sMs) / (24 * 3600 * 1000)
              const spanText = totalDays >= 30 ? `${(totalDays / 30.4375).toFixed(1)}m` : `${Math.max(1, Math.round(totalDays))}d`

              return (
                <div
                  key={getPeriodKey(sub, sIdx)}
                  onClick={() => onSelectPeriod?.(sub)}
                  style={{
                    background: isLive ? 'rgba(245, 158, 11, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                    border: isLive ? '1.5px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 6,
                    padding: '8px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isLive ? '0 0 10px rgba(245, 158, 11, 0.25)' : undefined,
                  }}
                  title={`Inspect ${activePeriod.lord}–${sub.lord} (${childLevelMeta?.short})`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: subColor }} />
                      <strong style={{ fontSize: '0.74rem', color: '#f8fafc' }}>{sub.lord}</strong>
                    </div>
                    {isLive ? (
                      <span style={{ fontSize: '0.58rem', padding: '1px 4px', background: '#f59e0b', color: '#0f172a', fontWeight: 900, borderRadius: 3 }}>
                        LIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: isPast ? '#64748b' : '#94a3b8' }}>
                        {spanText}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginBottom: 4 }}>
                    {safeDateSlice(sub.start)} → {safeDateSlice(sub.end)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPeriod?.(sub)
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      borderRadius: 3,
                      padding: '2px 0',
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Inspect {childLevelMeta?.short} →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 8. Parashari Manifestation Role */}
      <div
        className="inspector-section"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: 12,
          borderRadius: 6,
          border: '1px solid rgba(148, 163, 184, 0.12)',
          fontSize: '0.76rem',
          lineHeight: 1.5,
          color: '#cbd5e1',
        }}
      >
        <span className="eyebrow" style={{ margin: '0 0 6px 0', display: 'block' }}>
          Parashari Manifestation Role ({levelMeta?.short})
        </span>
        <p style={{ margin: 0 }}>
          {levelMeta?.manifestationRole}
        </p>
      </div>
    </div>
  )
}
