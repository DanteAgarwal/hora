import React, { useState, useMemo, useEffect } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import { DashaCard, PLANET_COLORS, LEVEL_METADATA, type DashaChainItem } from './DashaCard'
import { expandDashaSubPeriods } from '../../adapters/horaAdapter'

interface DashaTimelineProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  chart,
  onSelectPlanet,
}) => {
  // 6-Level Hierarchy Selection State
  const [selectedMd, setSelectedMd] = useState<DashaPeriod | null>(null) // Level 1
  const [selectedAd, setSelectedAd] = useState<DashaPeriod | null>(null) // Level 2
  const [selectedPd, setSelectedPd] = useState<DashaPeriod | null>(null) // Level 3
  const [selectedSd, setSelectedSd] = useState<DashaPeriod | null>(null) // Level 4 (Sookshma)
  const [selectedPrd, setSelectedPrd] = useState<DashaPeriod | null>(null) // Level 5 (Prana)
  const [selectedDd, setSelectedDd] = useState<DashaPeriod | null>(null) // Level 6 (Deha / Sub-Sookshma)

  const [displayMode, setDisplayMode] = useState<'timeline' | 'table'>('timeline')

  const dashaTree = chart.dashaTree

  // Helper to find period containing a target timestamp
  const findRunningChild = (list: DashaPeriod[], targetMs: number): DashaPeriod | null => {
    for (const p of list) {
      const s = new Date(p.start).getTime()
      const e = new Date(p.end).getTime()
      if (s <= targetMs && targetMs <= e) return p
    }
    return null
  }

  // Automatic initial selection of running dasha down to Level 6
  useEffect(() => {
    const nowMs = Date.now()
    const curMd = findRunningChild(dashaTree, nowMs) || dashaTree[0] || null
    if (!curMd) return
    setSelectedMd(curMd)

    const adList = curMd.children && curMd.children.length > 0 ? curMd.children : expandDashaSubPeriods(curMd, 2)
    const curAd = findRunningChild(adList, nowMs) || adList[0] || null
    setSelectedAd(curAd)
    if (!curAd) return

    const pdList = curAd.children && curAd.children.length > 0 ? curAd.children : expandDashaSubPeriods(curAd, 3)
    const curPd = findRunningChild(pdList, nowMs) || pdList[0] || null
    setSelectedPd(curPd)
    if (!curPd) return

    const sdList = expandDashaSubPeriods(curPd, 4)
    const curSd = findRunningChild(sdList, nowMs) || sdList[0] || null
    setSelectedSd(curSd)
    if (!curSd) return

    const prdList = expandDashaSubPeriods(curSd, 5)
    const curPrd = findRunningChild(prdList, nowMs) || prdList[0] || null
    setSelectedPrd(curPrd)
    if (!curPrd) return

    const ddList = expandDashaSubPeriods(curPrd, 6)
    const curDd = findRunningChild(ddList, nowMs) || ddList[0] || null
    setSelectedDd(curDd)
  }, [dashaTree])

  // One-click Jump to live running dasha across all 6 levels
  const handleJumpToCurrent = () => {
    const nowMs = Date.now()
    const curMd = findRunningChild(dashaTree, nowMs)
    if (!curMd) return
    setSelectedMd(curMd)

    const adList = curMd.children && curMd.children.length > 0 ? curMd.children : expandDashaSubPeriods(curMd, 2)
    const curAd = findRunningChild(adList, nowMs)
    setSelectedAd(curAd)
    if (!curAd) return

    const pdList = curAd.children && curAd.children.length > 0 ? curAd.children : expandDashaSubPeriods(curAd, 3)
    const curPd = findRunningChild(pdList, nowMs)
    setSelectedPd(curPd)
    if (!curPd) return

    const sdList = expandDashaSubPeriods(curPd, 4)
    const curSd = findRunningChild(sdList, nowMs)
    setSelectedSd(curSd)
    if (!curSd) return

    const prdList = expandDashaSubPeriods(curSd, 5)
    const curPrd = findRunningChild(prdList, nowMs)
    setSelectedPrd(curPrd)
    if (!curPrd) return

    const ddList = expandDashaSubPeriods(curPrd, 6)
    const curDd = findRunningChild(ddList, nowMs)
    setSelectedDd(curDd)
  }

  // Active period to inspect
  const activeInspectPeriod = selectedDd || selectedPrd || selectedSd || selectedPd || selectedAd || selectedMd
  const activeLevelLabel = activeInspectPeriod
    ? LEVEL_METADATA[activeInspectPeriod.level]?.name || `Level ${activeInspectPeriod.level}`
    : 'Mahadasha'

  // Hierarchy Chain construction for DashaCard
  const hierarchyChain = useMemo<DashaChainItem[]>(() => {
    const chain: DashaChainItem[] = []
    if (selectedMd) chain.push({ level: 1, levelLabel: 'MD', lord: selectedMd.lord })
    if (selectedAd) chain.push({ level: 2, levelLabel: 'AD', lord: selectedAd.lord })
    if (selectedPd) chain.push({ level: 3, levelLabel: 'PD', lord: selectedPd.lord })
    if (selectedSd) chain.push({ level: 4, levelLabel: 'Sookshma', lord: selectedSd.lord })
    if (selectedPrd) chain.push({ level: 5, levelLabel: 'Prana', lord: selectedPrd.lord })
    if (selectedDd) chain.push({ level: 6, levelLabel: 'Sub-Sookshma', lord: selectedDd.lord })
    return chain
  }, [selectedMd, selectedAd, selectedPd, selectedSd, selectedPrd, selectedDd])

  // Sub-period list derivations
  const adList = useMemo(() => {
    if (!selectedMd) return []
    return selectedMd.children && selectedMd.children.length > 0 ? selectedMd.children : expandDashaSubPeriods(selectedMd, 2)
  }, [selectedMd])

  const pdList = useMemo(() => {
    if (!selectedAd) return []
    return selectedAd.children && selectedAd.children.length > 0 ? selectedAd.children : expandDashaSubPeriods(selectedAd, 3)
  }, [selectedAd])

  const sdList = useMemo(() => {
    if (!selectedPd) return []
    return expandDashaSubPeriods(selectedPd, 4)
  }, [selectedPd])

  const prdList = useMemo(() => {
    if (!selectedSd) return []
    return expandDashaSubPeriods(selectedSd, 5)
  }, [selectedSd])

  const ddList = useMemo(() => {
    if (!selectedPrd) return []
    return expandDashaSubPeriods(selectedPrd, 6)
  }, [selectedPrd])

  // Generic helper for timeline calculations of any level list
  const getTimelineBarData = (list: DashaPeriod[], activeSelection: DashaPeriod | null) => {
    if (!list || list.length === 0) return { items: [], todayPct: -1 }
    const first = list[0]
    const last = list[list.length - 1]
    const startMs = new Date(first.start).getTime()
    const endMs = new Date(last.end).getTime()
    const totalMs = Math.max(1, endMs - startMs)
    const nowMs = Date.now()

    let todayPct = -1
    if (nowMs >= startMs && nowMs <= endMs) {
      todayPct = ((nowMs - startMs) / totalMs) * 100
    }

    const items = list.map((item) => {
      const s = new Date(item.start).getTime()
      const e = new Date(item.end).getTime()
      const widthPct = Math.max(1, ((e - s) / totalMs) * 100)
      const isRunning = s <= nowMs && nowMs <= e
      const isSelected = activeSelection?.lord === item.lord

      return {
        ...item,
        widthPct,
        isRunning,
        isSelected,
        color: PLANET_COLORS[item.lord] || '#d97706',
      }
    })

    return { items, todayPct }
  }

  const mdBar = useMemo(() => getTimelineBarData(dashaTree, selectedMd), [dashaTree, selectedMd])
  const adBar = useMemo(() => getTimelineBarData(adList, selectedAd), [adList, selectedAd])
  const pdBar = useMemo(() => getTimelineBarData(pdList, selectedPd), [pdList, selectedPd])
  const sdBar = useMemo(() => getTimelineBarData(sdList, selectedSd), [sdList, selectedSd])
  const prdBar = useMemo(() => getTimelineBarData(prdList, selectedPrd), [prdList, selectedPrd])
  const ddBar = useMemo(() => getTimelineBarData(ddList, selectedDd), [ddList, selectedDd])

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }, [])

  return (
    <div className="dasha-timeline-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workspace Master Header */}
      <div className="panel dasha-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p className="eyebrow">Precision Vedic Predictive Timing (PRD §17, §39)</p>
          <h2 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            Interactive Vimshottari Dasha Explorer (6-Level Micro-Timing)
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
            Full classical hierarchy: <strong>Mahadasha (MD) → Antardasha (AD) → Pratyantardasha (PD) → Sookshma (SD) → Prana (PrD) → Deha (DD / Sub-Sookshma)</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="primary-button"
            onClick={handleJumpToCurrent}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            ⚡ Jump to Live Moment (All 6 Levels)
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
              📊 Multi-Level Timeline
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
              📋 Schedule Table
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic 6-Level Breadcrumb Bar */}
      <div className="panel breadcrumb-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            setSelectedAd(null)
            setSelectedPd(null)
            setSelectedSd(null)
            setSelectedPrd(null)
            setSelectedDd(null)
          }}
          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          🌐 120-Yr Mahadashas
        </button>

        {selectedMd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <button
              type="button"
              onClick={() => {
                setSelectedPd(null)
                setSelectedSd(null)
                setSelectedPrd(null)
                setSelectedDd(null)
              }}
              style={{ background: 'none', border: 'none', color: selectedAd ? '#38bdf8' : '#fbbf24', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              {selectedMd.lord} MD
            </button>
          </>
        )}

        {selectedAd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <button
              type="button"
              onClick={() => {
                setSelectedSd(null)
                setSelectedPrd(null)
                setSelectedDd(null)
              }}
              style={{ background: 'none', border: 'none', color: selectedPd ? '#38bdf8' : '#fbbf24', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              {selectedAd.lord} AD
            </button>
          </>
        )}

        {selectedPd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <button
              type="button"
              onClick={() => {
                setSelectedPrd(null)
                setSelectedDd(null)
              }}
              style={{ background: 'none', border: 'none', color: selectedSd ? '#38bdf8' : '#fbbf24', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              {selectedPd.lord} PD
            </button>
          </>
        )}

        {selectedSd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <button
              type="button"
              onClick={() => setSelectedDd(null)}
              style={{ background: 'none', border: 'none', color: selectedPrd ? '#38bdf8' : '#fbbf24', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              {selectedSd.lord} Sookshma
            </button>
          </>
        )}

        {selectedPrd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: selectedDd ? '#38bdf8' : '#fbbf24', fontWeight: 600 }}>
              {selectedPrd.lord} Prana
            </span>
          </>
        )}

        {selectedDd && (
          <>
            <span style={{ color: '#64748b' }}>›</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              {selectedDd.lord} Sub-Sookshma (Deha)
            </span>
          </>
        )}
      </div>

      {displayMode === 'timeline' ? (
        <div className="timeline-interactive-stack" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ---------------- LEVEL 1: MAHADASHAS (MD) ---------------- */}
          <div className="panel level-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                  Level 1 • Mahadasha (Major Life Chapter — 120-Year Lifespan)
                </h3>
                <span className="eyebrow">Click any Mahadasha block to inspect and drill into Antardashas</span>
              </div>
              <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4 }}>
                120 Years Total
              </span>
            </div>

            <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 48, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
              {mdBar.todayPct >= 0 && (
                <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${mdBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)', whiteSpace: 'nowrap' }}>
                    ▼ TODAY ({todayLabel})
                  </div>
                  <div style={{ width: 2, height: 54, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                </div>
              )}

              {mdBar.items.map((item) => (
                <div
                  key={item.lord}
                  onClick={() => {
                    setSelectedMd(item)
                    const nextAdList = item.children && item.children.length > 0 ? item.children : expandDashaSubPeriods(item, 2)
                    setSelectedAd(nextAdList[0] || null)
                    setSelectedPd(null)
                    setSelectedSd(null)
                    setSelectedPrd(null)
                    setSelectedDd(null)
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
                    padding: '2px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  title={`${item.lord} MD: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)}`}
                >
                  <div style={{ width: '100%', height: 3, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                  <strong style={{ fontSize: '0.74rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                  <span style={{ fontSize: '0.62rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                    {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1)}y
                  </span>
                  {item.isRunning && (
                    <span style={{ position: 'absolute', bottom: 2, fontSize: '0.52rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 3px', borderRadius: 2 }}>
                      LIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- LEVEL 2: ANTARDASHAS (AD) ---------------- */}
          {selectedMd && adList.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedMd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 2 • Antardashas within {selectedMd.lord} Mahadasha
                  </h3>
                  <span className="eyebrow">{selectedMd.start.slice(0, 10)} → {selectedMd.end.slice(0, 10)} • Click to zoom into Pratyantardashas</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: 4 }}>
                  Months scale
                </span>
              </div>

              <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 46, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
                {adBar.todayPct >= 0 && (
                  <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${adBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)' }}>
                      ▼ TODAY
                    </div>
                    <div style={{ width: 2, height: 52, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {adBar.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => {
                      setSelectedAd(item)
                      const nextPdList = item.children && item.children.length > 0 ? item.children : expandDashaSubPeriods(item, 3)
                      setSelectedPd(nextPdList[0] || null)
                      setSelectedSd(null)
                      setSelectedPrd(null)
                      setSelectedDd(null)
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
                      padding: '2px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: '100%', height: 3, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                    <strong style={{ fontSize: '0.72rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                    <span style={{ fontSize: '0.6rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)}m
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 2, fontSize: '0.5rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 3px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- LEVEL 3: PRATYANTARDASHAS (PD) ---------------- */}
          {selectedAd && pdList.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedAd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 3 • Pratyantardashas within {selectedMd?.lord}–{selectedAd.lord}
                  </h3>
                  <span className="eyebrow">{selectedAd.start.slice(0, 10)} → {selectedAd.end.slice(0, 10)} • Click to zoom into Sookshma Dashas</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderRadius: 4 }}>
                  Days scale
                </span>
              </div>

              <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 44, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
                {pdBar.todayPct >= 0 && (
                  <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${pdBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.62rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                      ▼ TODAY
                    </div>
                    <div style={{ width: 2, height: 50, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {pdBar.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => {
                      setSelectedPd(item)
                      const nextSdList = expandDashaSubPeriods(item, 4)
                      setSelectedSd(nextSdList[0] || null)
                      setSelectedPrd(null)
                      setSelectedDd(null)
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
                      padding: '2px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: '100%', height: 3, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                    <strong style={{ fontSize: '0.7rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                    <span style={{ fontSize: '0.58rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {Math.round((new Date(item.end).getTime() - new Date(item.start).getTime()) / (24 * 3600 * 1000))}d
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 1, fontSize: '0.48rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 2px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- LEVEL 4: SOOKSHMA DASHAS (SD) ---------------- */}
          {selectedPd && sdList.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedPd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 4 • Sookshma Dasha (Subtle Mind / Micro-Timing) within {selectedPd.lord}
                  </h3>
                  <span className="eyebrow">{selectedPd.start.slice(0, 16)} → {selectedPd.end.slice(0, 16)} • Click to zoom into Prana Dashas</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: 4 }}>
                  Hours to Days
                </span>
              </div>

              <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 42, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
                {sdBar.todayPct >= 0 && (
                  <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${sdBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.62rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                      ▼ TODAY
                    </div>
                    <div style={{ width: 2, height: 48, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {sdBar.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => {
                      setSelectedSd(item)
                      const nextPrdList = expandDashaSubPeriods(item, 5)
                      setSelectedPrd(nextPrdList[0] || null)
                      setSelectedDd(null)
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
                      padding: '2px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: '100%', height: 2, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                    <strong style={{ fontSize: '0.68rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                    <span style={{ fontSize: '0.55rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (24 * 3600 * 1000)).toFixed(1)}d
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 1, fontSize: '0.45rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 2px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- LEVEL 5: PRANA DASHAS (PrD) ---------------- */}
          {selectedSd && prdList.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedSd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 5 • Prana Dasha (Vital Breath / Hour-Level Impulse) within {selectedSd.lord}
                  </h3>
                  <span className="eyebrow">{selectedSd.start} → {selectedSd.end} • Click to zoom into Sub-Sookshma (Deha)</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: 4 }}>
                  1 to 50 Hours
                </span>
              </div>

              <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 40, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
                {prdBar.todayPct >= 0 && (
                  <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${prdBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.6rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                      ▼ TODAY
                    </div>
                    <div style={{ width: 2, height: 46, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {prdBar.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => {
                      setSelectedPrd(item)
                      const nextDdList = expandDashaSubPeriods(item, 6)
                      setSelectedDd(nextDdList[0] || null)
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
                      padding: '2px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: '100%', height: 2, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                    <strong style={{ fontSize: '0.65rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                    <span style={{ fontSize: '0.52rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (3600 * 1000)).toFixed(0)}h
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 1, fontSize: '0.45rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 2px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- LEVEL 6: DEHA DASHAS (SUB-SOOKSHMA) ---------------- */}
          {selectedPrd && ddList.length > 0 && (
            <div className="panel level-card" style={{ padding: 16, borderLeft: `4px solid ${PLANET_COLORS[selectedPrd.lord] || '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Level 6 • Deha Dasha / Sub-Sookshma (Somatic Manifestation / Minutes) within {selectedPrd.lord}
                  </h3>
                  <span className="eyebrow">{selectedPrd.start} → {selectedPrd.end} • Ultimate Parashari micro-division</span>
                </div>
                <span className="varga-tag" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: 4 }}>
                  10 to 300 Mins
                </span>
              </div>

              <div className="proportional-timeline-container" style={{ position: 'relative', width: '100%', height: 38, borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'flex', marginTop: 22, marginBottom: 8 }}>
                {ddBar.todayPct >= 0 && (
                  <div className="today-marker" style={{ position: 'absolute', top: -22, left: `${ddBar.todayPct}%`, transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.58rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                      ▼ TODAY
                    </div>
                    <div style={{ width: 2, height: 44, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {ddBar.items.map((item) => (
                  <div
                    key={item.lord}
                    onClick={() => setSelectedDd(item)}
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
                      padding: '2px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: '100%', height: 2, background: item.color, position: 'absolute', top: 0, left: 0 }} />
                    <strong style={{ fontSize: '0.62rem', color: item.isSelected ? '#fff' : '#e2e8f0' }}>{item.lord}</strong>
                    <span style={{ fontSize: '0.5rem', color: item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {Math.round((new Date(item.end).getTime() - new Date(item.start).getTime()) / (60 * 1000))}m
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 1, fontSize: '0.42rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 2px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Inspector Card for Selected Period Ruler */}
          <DashaCard
            chart={chart}
            selectedPeriod={activeInspectPeriod}
            levelLabel={activeLevelLabel}
            hierarchyChain={hierarchyChain}
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
              <p className="eyebrow" style={{ marginTop: 2 }}>Chronological schedule with on-demand Sookshma & Prana drilldown</p>
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
                  const subAds = md.children && md.children.length > 0 ? md.children : expandDashaSubPeriods(md, 2)
                  return (
                    <React.Fragment key={md.lord}>
                      <tr
                        onClick={() => {
                          setSelectedMd(md)
                          setSelectedAd(subAds[0] || null)
                          setSelectedPd(null)
                          setSelectedSd(null)
                          setSelectedPrd(null)
                          setSelectedDd(null)
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

                      {subAds.map((ad) => {
                        const isAdRunning = ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)
                        return (
                          <tr
                            key={`${md.lord}-${ad.lord}`}
                            onClick={() => {
                              setSelectedMd(md)
                              setSelectedAd(ad)
                              const nextPdList = ad.children && ad.children.length > 0 ? ad.children : expandDashaSubPeriods(ad, 3)
                              setSelectedPd(nextPdList[0] || null)
                              setSelectedSd(null)
                              setSelectedPrd(null)
                              setSelectedDd(null)
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
