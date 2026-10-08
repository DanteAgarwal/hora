import React, { useState, useMemo, useEffect } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import { DashaCard, PLANET_COLORS } from './DashaCard'

interface DashaTimelineProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  chart,
  onSelectPlanet,
}) => {
  // Drilldown state
  const [selectedMd, setSelectedMd] = useState<DashaPeriod | null>(null)
  const [selectedAd, setSelectedAd] = useState<DashaPeriod | null>(null)
  const [selectedPd, setSelectedPd] = useState<DashaPeriod | null>(null)
  const [displayMode, setDisplayMode] = useState<'timeline' | 'table'>('timeline')

  const dashaTree = chart.dashaTree

  // Find currently running periods automatically on mount or chart change
  useEffect(() => {
    const nowStr = new Date().toISOString().slice(0, 10)
    let curMd: DashaPeriod | null = null
    let curAd: DashaPeriod | null = null
    let curPd: DashaPeriod | null = null

    for (const md of dashaTree) {
      if (md.start.slice(0, 10) <= nowStr && nowStr <= md.end.slice(0, 10)) {
        curMd = md
        if (md.children && md.children.length > 0) {
          for (const ad of md.children) {
            if (ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)) {
              curAd = ad
              if (ad.children && ad.children.length > 0) {
                for (const pd of ad.children) {
                  if (pd.start.slice(0, 10) <= nowStr && nowStr <= pd.end.slice(0, 10)) {
                    curPd = pd
                    break
                  }
                }
              }
              break
            }
          }
        }
        break
      }
    }

    if (curMd) {
      setSelectedMd(curMd)
      if (curAd) setSelectedAd(curAd)
      if (curPd) setSelectedPd(curPd)
    } else if (dashaTree.length > 0) {
      setSelectedMd(dashaTree[0])
    }
  }, [dashaTree])

  // Helper to jump to current
  const handleJumpToCurrent = () => {
    const nowStr = new Date().toISOString().slice(0, 10)
    for (const md of dashaTree) {
      if (md.start.slice(0, 10) <= nowStr && nowStr <= md.end.slice(0, 10)) {
        setSelectedMd(md)
        let foundAd: DashaPeriod | null = null
        if (md.children) {
          for (const ad of md.children) {
            if (ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)) {
              foundAd = ad
              setSelectedAd(ad)
              if (ad.children) {
                for (const pd of ad.children) {
                  if (pd.start.slice(0, 10) <= nowStr && nowStr <= pd.end.slice(0, 10)) {
                    setSelectedPd(pd)
                    return
                  }
                }
              }
              return
            }
          }
        }
        if (!foundAd) setSelectedAd(null)
        setSelectedPd(null)
        return
      }
    }
  }

  // Active period to inspect in DashaCard
  const inspectPeriod = selectedPd || selectedAd || selectedMd
  const inspectLevelLabel = selectedPd
    ? 'Pratyantardasha (PD)'
    : selectedAd
    ? 'Antardasha (AD)'
    : 'Mahadasha (MD)'

  // Proportional timeline calculations for Mahadashas (Level 1)
  const mdTimelineData = useMemo(() => {
    if (!dashaTree || dashaTree.length === 0) return { items: [], totalMs: 1, startMs: 0, endMs: 0, todayPct: -1 }

    const first = dashaTree[0]
    const last = dashaTree[dashaTree.length - 1]
    const startMs = new Date(first.start).getTime()
    const endMs = new Date(last.end).getTime()
    const totalMs = Math.max(1, endMs - startMs)
    const nowMs = Date.now()

    let todayPct = -1
    if (nowMs >= startMs && nowMs <= endMs) {
      todayPct = ((nowMs - startMs) / totalMs) * 100
    }

    const nowStr = new Date().toISOString().slice(0, 10)

    const items = dashaTree.map((md) => {
      const s = new Date(md.start).getTime()
      const e = new Date(md.end).getTime()
      const widthPct = Math.max(1, ((e - s) / totalMs) * 100)
      const isRunning = md.start.slice(0, 10) <= nowStr && nowStr <= md.end.slice(0, 10)
      const isSelected = selectedMd?.lord === md.lord

      return {
        ...md,
        widthPct,
        isRunning,
        isSelected,
        color: PLANET_COLORS[md.lord] || '#d97706',
        years: ((e - s) / (365.25 * 24 * 3600 * 1000)).toFixed(1),
      }
    })

    return { items, totalMs, startMs, endMs, todayPct }
  }, [dashaTree, selectedMd])

  // Proportional timeline calculations for Antardashas (Level 2)
  const adTimelineData = useMemo(() => {
    if (!selectedMd || !selectedMd.children || selectedMd.children.length === 0) {
      return { items: [], totalMs: 1, startMs: 0, endMs: 0, todayPct: -1 }
    }

    const children = selectedMd.children
    const first = children[0]
    const last = children[children.length - 1]
    const startMs = new Date(first.start).getTime()
    const endMs = new Date(last.end).getTime()
    const totalMs = Math.max(1, endMs - startMs)
    const nowMs = Date.now()

    let todayPct = -1
    if (nowMs >= startMs && nowMs <= endMs) {
      todayPct = ((nowMs - startMs) / totalMs) * 100
    }

    const nowStr = new Date().toISOString().slice(0, 10)

    const items = children.map((ad) => {
      const s = new Date(ad.start).getTime()
      const e = new Date(ad.end).getTime()
      const widthPct = Math.max(1, ((e - s) / totalMs) * 100)
      const isRunning = ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)
      const isSelected = selectedAd?.lord === ad.lord

      const durationMonths = ((e - s) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)

      return {
        ...ad,
        widthPct,
        isRunning,
        isSelected,
        color: PLANET_COLORS[ad.lord] || '#d97706',
        durationMonths,
      }
    })

    return { items, totalMs, startMs, endMs, todayPct }
  }, [selectedMd, selectedAd])

  // Proportional timeline calculations for Pratyantardashas (Level 3)
  const pdTimelineData = useMemo(() => {
    if (!selectedAd || !selectedAd.children || selectedAd.children.length === 0) {
      return { items: [], totalMs: 1, startMs: 0, endMs: 0, todayPct: -1 }
    }

    const children = selectedAd.children
    const first = children[0]
    const last = children[children.length - 1]
    const startMs = new Date(first.start).getTime()
    const endMs = new Date(last.end).getTime()
    const totalMs = Math.max(1, endMs - startMs)
    const nowMs = Date.now()

    let todayPct = -1
    if (nowMs >= startMs && nowMs <= endMs) {
      todayPct = ((nowMs - startMs) / totalMs) * 100
    }

    const nowStr = new Date().toISOString().slice(0, 10)

    const items = children.map((pd) => {
      const s = new Date(pd.start).getTime()
      const e = new Date(pd.end).getTime()
      const widthPct = Math.max(1, ((e - s) / totalMs) * 100)
      const isRunning = pd.start.slice(0, 10) <= nowStr && nowStr <= pd.end.slice(0, 10)
      const isSelected = selectedPd?.lord === pd.lord

      const durationDays = Math.round((e - s) / (24 * 3600 * 1000))

      return {
        ...pd,
        widthPct,
        isRunning,
        isSelected,
        color: PLANET_COLORS[pd.lord] || '#d97706',
        durationDays,
      }
    })

    return { items, totalMs, startMs, endMs, todayPct }
  }, [selectedAd, selectedPd])

  const todayLabel = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' })
  }, [])

  return (
    <div className="dasha-timeline-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workspace Header */}
      <div className="panel dasha-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Vedic Predictive Timing (PRD §17, §39)</p>
          <h2 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            Interactive Vimshottari Dasha Timeline
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
            120-year Nakshatra-based planetary cycle. Hierarchical 3-level proportional drilldown (Mahadasha → Antardasha → Pratyantardasha) with live date positioning.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="primary-button"
            onClick={handleJumpToCurrent}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            ⚡ Jump to Current Period
          </button>

          <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
            <button
              type="button"
              className={`segment-btn ${displayMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setDisplayMode('timeline')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: displayMode === 'timeline' ? '#d97706' : 'transparent',
                color: displayMode === 'timeline' ? '#fff' : '#94a3b8',
                fontWeight: displayMode === 'timeline' ? 600 : 400,
              }}
            >
              📊 Visual Timeline
            </button>
            <button
              type="button"
              className={`segment-btn ${displayMode === 'table' ? 'active' : ''}`}
              onClick={() => setDisplayMode('table')}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: displayMode === 'table' ? '#d97706' : 'transparent',
                color: displayMode === 'table' ? '#fff' : '#94a3b8',
                fontWeight: displayMode === 'table' ? 600 : 400,
              }}
            >
              📋 Table View
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div className="panel breadcrumb-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
        <button
          type="button"
          onClick={() => {
            setSelectedAd(null)
            setSelectedPd(null)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 600,
          }}
        >
          🌐 120-Year Mahadashas
        </button>

        {selectedMd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <button
              type="button"
              onClick={() => setSelectedPd(null)}
              style={{
                background: 'none',
                border: 'none',
                color: selectedAd ? '#38bdf8' : '#fbbf24',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
              }}
            >
              {selectedMd.lord} MD ({selectedMd.start.slice(0, 4)}–{selectedMd.end.slice(0, 4)})
            </button>
          </>
        )}

        {selectedAd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: selectedPd ? '#38bdf8' : '#fbbf24', fontWeight: 600 }}>
              {selectedAd.lord} AD ({selectedAd.start.slice(0, 7)}–{selectedAd.end.slice(0, 7)})
            </span>
          </>
        )}

        {selectedPd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              {selectedPd.lord} PD ({selectedPd.start.slice(5, 10)}–{selectedPd.end.slice(5, 10)})
            </span>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {displayMode === 'timeline' ? (
        <div className="timeline-interactive-stack" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ---------------- LEVEL 1: MAHADASHAS ---------------- */}
          <div className="panel level-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                  Level 1 • Mahadasha Cycle (Major 120-Year Lifespan)
                </h3>
                <span className="eyebrow">Click any Mahadasha block to zoom into its 9 Antardashas</span>
              </div>
              <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4 }}>
                9 Periods
              </span>
            </div>

            {/* Proportional Bar */}
            <div
              className="proportional-timeline-container"
              style={{
                position: 'relative',
                width: '100%',
                height: 52,
                borderRadius: 8,
                overflow: 'visible',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                marginTop: 22,
                marginBottom: 10,
              }}
            >
              {/* TODAY Indicator Marker */}
              {mdTimelineData.todayPct >= 0 && (
                <div
                  className="today-marker"
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: `${mdTimelineData.todayPct}%`,
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      background: '#f59e0b',
                      color: '#0f172a',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 4,
                      boxShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ▼ TODAY ({todayLabel})
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 58,
                      background: '#f59e0b',
                      boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)',
                    }}
                  />
                </div>
              )}

              {/* Segments */}
              {mdTimelineData.items.map((item) => (
                <div
                  key={item.lord}
                  onClick={() => {
                    setSelectedMd(item)
                    setSelectedAd(item.children?.[0] || null)
                    setSelectedPd(null)
                  }}
                  style={{
                    width: `${item.widthPct}%`,
                    height: '100%',
                    background: item.isSelected
                      ? `linear-gradient(180deg, ${item.color} 0%, rgba(15, 23, 42, 0.9) 100%)`
                      : 'rgba(30, 41, 59, 0.7)',
                    borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 4px',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  title={`${item.lord} Mahadasha: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)} (${item.years} yrs)`}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      background: item.color,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  <strong
                    style={{
                      fontSize: '0.78rem',
                      color: item.isSelected ? '#fff' : '#e2e8f0',
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {item.lord}
                  </strong>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: item.isSelected ? '#fde68a' : '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.years}y
                  </span>
                  {item.isRunning && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        fontSize: '0.55rem',
                        background: '#f59e0b',
                        color: '#0f172a',
                        fontWeight: 'bold',
                        padding: '0 4px',
                        borderRadius: 2,
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
              <span>Birth: {dashaTree[0]?.start.slice(0, 10)}</span>
              <span>120-Year Full Vimshottari Cycle</span>
              <span>End: {dashaTree[dashaTree.length - 1]?.end.slice(0, 10)}</span>
            </div>
          </div>

          {/* ---------------- LEVEL 2: ANTARDASHAS ---------------- */}
          {selectedMd && selectedMd.children && selectedMd.children.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedMd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 2 • Antardashas within {selectedMd.lord} Mahadasha
                  </h3>
                  <span className="eyebrow">
                    Span: {selectedMd.start.slice(0, 10)} → {selectedMd.end.slice(0, 10)} • Click any Antardasha to view Pratyantardashas
                  </span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: 4 }}>
                  9 Sub-periods
                </span>
              </div>

              {/* Antardasha Proportional Bar */}
              <div
                className="proportional-timeline-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 48,
                  borderRadius: 8,
                  overflow: 'visible',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  marginTop: 22,
                  marginBottom: 10,
                }}
              >
                {/* TODAY marker if within this MD */}
                {adTimelineData.todayPct >= 0 && (
                  <div
                    className="today-marker"
                    style={{
                      position: 'absolute',
                      top: -22,
                      left: `${adTimelineData.todayPct}%`,
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        background: '#f59e0b',
                        color: '#0f172a',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 3,
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ▼ TODAY
                    </div>
                    <div
                      style={{
                        width: 2,
                        height: 54,
                        background: '#f59e0b',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)',
                      }}
                    />
                  </div>
                )}

                {/* AD Segments */}
                {adTimelineData.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => {
                      setSelectedAd(item)
                      setSelectedPd(item.children?.[0] || null)
                    }}
                    style={{
                      width: `${item.widthPct}%`,
                      height: '100%',
                      background: item.isSelected
                        ? `linear-gradient(180deg, ${item.color} 0%, rgba(15, 23, 42, 0.9) 100%)`
                        : 'rgba(30, 41, 59, 0.7)',
                      borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 4px',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    title={`${selectedMd.lord}-${item.lord} Antardasha: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)} (${item.durationMonths} mos)`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 3,
                        background: item.color,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                    <strong
                      style={{
                        fontSize: '0.74rem',
                        color: item.isSelected ? '#fff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.lord}
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {item.durationMonths}m
                    </span>
                    {item.isRunning && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          fontSize: '0.52rem',
                          background: '#f59e0b',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          padding: '0 3px',
                          borderRadius: 2,
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- LEVEL 3: PRATYANTARDASHAS ---------------- */}
          {selectedAd && selectedAd.children && selectedAd.children.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedAd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 3 • Pratyantardashas within {selectedMd?.lord}–{selectedAd.lord}
                  </h3>
                  <span className="eyebrow">
                    Span: {selectedAd.start.slice(0, 10)} → {selectedAd.end.slice(0, 10)} • Deep precision sub-sub timing
                  </span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderRadius: 4 }}>
                  9 Micro-periods
                </span>
              </div>

              {/* PD Proportional Bar */}
              <div
                className="proportional-timeline-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 44,
                  borderRadius: 8,
                  overflow: 'visible',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  marginTop: 22,
                  marginBottom: 10,
                }}
              >
                {/* TODAY marker if within this AD */}
                {pdTimelineData.todayPct >= 0 && (
                  <div
                    className="today-marker"
                    style={{
                      position: 'absolute',
                      top: -22,
                      left: `${pdTimelineData.todayPct}%`,
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        background: '#f59e0b',
                        color: '#0f172a',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: 3,
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ▼ TODAY
                    </div>
                    <div
                      style={{
                        width: 2,
                        height: 50,
                        background: '#f59e0b',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)',
                      }}
                    />
                  </div>
                )}

                {/* PD Segments */}
                {pdTimelineData.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => setSelectedPd(item)}
                    style={{
                      width: `${item.widthPct}%`,
                      height: '100%',
                      background: item.isSelected
                        ? `linear-gradient(180deg, ${item.color} 0%, rgba(15, 23, 42, 0.9) 100%)`
                        : 'rgba(30, 41, 59, 0.7)',
                      borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 3px',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    title={`${selectedMd?.lord}-${selectedAd.lord}-${item.lord} Pratyantardasha: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)} (${item.durationDays} days)`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 2,
                        background: item.color,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                    <strong
                      style={{
                        fontSize: '0.7rem',
                        color: item.isSelected ? '#fff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.lord}
                    </strong>
                    <span style={{ fontSize: '0.6rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {item.durationDays}d
                    </span>
                    {item.isRunning && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          fontSize: '0.5rem',
                          background: '#f59e0b',
                          color: '#0f172a',
                          fontWeight: 'bold',
                          padding: '0 2px',
                          borderRadius: 2,
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Inspector Card for Selected Period Lord */}
          <DashaCard
            chart={chart}
            selectedPeriod={inspectPeriod}
            levelLabel={inspectLevelLabel}
            onSelectPlanet={onSelectPlanet}
          />
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="panel dasha-table-mode" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                Complete Vimshottari Mahadasha & Antardasha Schedule
              </h3>
              <p className="eyebrow" style={{ marginTop: 2 }}>Chronological breakdown of planetary cycles</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '8px 10px' }}>Period</th>
                  <th style={{ padding: '8px 10px' }}>Lord</th>
                  <th style={{ padding: '8px 10px' }}>Start Date</th>
                  <th style={{ padding: '8px 10px' }}>End Date</th>
                  <th style={{ padding: '8px 10px' }}>Duration</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashaTree.map((md) => {
                  const nowStr = new Date().toISOString().slice(0, 10)
                  const isMdRunning = md.start.slice(0, 10) <= nowStr && nowStr <= md.end.slice(0, 10)
                  return (
                    <React.Fragment key={md.lord}>
                      <tr
                        onClick={() => {
                          setSelectedMd(md)
                          setSelectedAd(md.children?.[0] || null)
                          setSelectedPd(null)
                          setDisplayMode('timeline')
                        }}
                        style={{
                          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                          background: isMdRunning ? 'rgba(217, 119, 6, 0.15)' : 'rgba(30, 41, 59, 0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{md.lord} Mahadasha</span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ color: PLANET_COLORS[md.lord] || '#d97706', fontWeight: 600 }}>
                            {md.lord}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>{md.start.slice(0, 10)}</td>
                        <td style={{ padding: '10px 10px' }}>{md.end.slice(0, 10)}</td>
                        <td style={{ padding: '10px 10px' }}>
                          {((new Date(md.end).getTime() - new Date(md.start).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1)} yrs
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          {isMdRunning ? (
                            <span style={{ background: '#f59e0b', color: '#0f172a', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.72rem' }}>
                              ● Current
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>
                              {nowStr > md.end.slice(0, 10) ? 'Completed' : 'Upcoming'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Nested Antardashas */}
                      {md.children?.map((ad) => {
                        const isAdRunning = ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)
                        return (
                          <tr
                            key={`${md.lord}-${ad.lord}`}
                            onClick={() => {
                              setSelectedMd(md)
                              setSelectedAd(ad)
                              setSelectedPd(null)
                              setDisplayMode('timeline')
                            }}
                            style={{
                              borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                              background: isAdRunning ? 'rgba(217, 119, 6, 0.08)' : undefined,
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '6px 10px 6px 28px', color: '#94a3b8' }}>
                              ↳ {md.lord}–{ad.lord} Antardasha
                            </td>
                            <td style={{ padding: '6px 10px', color: PLANET_COLORS[ad.lord] || '#94a3b8' }}>
                              {ad.lord}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{ad.start.slice(0, 10)}</td>
                            <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{ad.end.slice(0, 10)}</td>
                            <td style={{ padding: '6px 10px', color: '#94a3b8' }}>
                              {((new Date(ad.end).getTime() - new Date(ad.start).getTime()) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)} mos
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              {isAdRunning && (
                                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.72rem' }}>
                                  ● Active AD
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
