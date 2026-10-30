import React, { useState, useMemo, useEffect } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import {
  PLANET_COLORS,
  findRunningDashaHierarchy,
  findDashaAncestors,
  isSamePeriod,
  getPeriodKey,
  type DashaChainItem,
} from './dashaUtils'
import { expandDashaSubPeriods } from '../../adapters/horaAdapter'
import { DashaCockpit } from './DashaCockpit'
import { SambhandhaMatrix } from './SambhandhaMatrix'
import { DashaInspector } from '../inspector/DashaInspector'

interface DashaTimelineProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onSelectPeriod?: (period: DashaPeriod, chain: DashaChainItem[]) => void
}

export const DashaTimeline: React.FC<DashaTimelineProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
  onSelectPeriod,
}) => {
  // 6-Level Hierarchy Selection State (tracks currently open/expanded branches)
  const [selectedMd, setSelectedMd] = useState<DashaPeriod | null>(null) // Level 1
  const [selectedAd, setSelectedAd] = useState<DashaPeriod | null>(null) // Level 2
  const [selectedPd, setSelectedPd] = useState<DashaPeriod | null>(null) // Level 3
  const [selectedSd, setSelectedSd] = useState<DashaPeriod | null>(null) // Level 4 (Sookshma)
  const [selectedPrd, setSelectedPrd] = useState<DashaPeriod | null>(null) // Level 5 (Prana)
  const [selectedDd, setSelectedDd] = useState<DashaPeriod | null>(null) // Level 6 (Deha / Sub-Sookshma)

  // Explicitly Inspected Period (decoupled from lowest open branch)
  const [inspectedPeriod, setInspectedPeriod] = useState<DashaPeriod | null>(null)

  const [displayMode, setDisplayMode] = useState<'timeline' | 'table' | 'matrix'>('timeline')
  const [showMicroTiming, setShowMicroTiming] = useState<boolean>(false)
  const [tableFilterMd, setTableFilterMd] = useState<string>('all')
  const [tableSearch, setTableSearch] = useState<string>('')

  const dashaTree = chart.dashaTree

  // Automatic initial selection of live running dasha down to Level 6
  useEffect(() => {
    const nowMs = Date.now()
    const live = findRunningDashaHierarchy(dashaTree, nowMs)
    if (live.md) setSelectedMd(live.md)
    if (live.ad) setSelectedAd(live.ad)
    if (live.pd) setSelectedPd(live.pd)
    if (live.sd) setSelectedSd(live.sd)
    if (live.prd) setSelectedPrd(live.prd)
    if (live.dd) setSelectedDd(live.dd)

    // Initial inspection defaults to active Antardasha or Mahadasha for immediate high-value context
    setInspectedPeriod(live.ad || live.md || null)
  }, [dashaTree])

  // One-click Jump to live running dasha across all 6 levels
  const handleJumpToLive = () => {
    const live = findRunningDashaHierarchy(dashaTree)
    if (live.md) setSelectedMd(live.md)
    if (live.ad) setSelectedAd(live.ad)
    if (live.pd) setSelectedPd(live.pd)
    if (live.sd) setSelectedSd(live.sd)
    if (live.prd) setSelectedPrd(live.prd)
    if (live.dd) setSelectedDd(live.dd)
    setInspectedPeriod(live.ad || live.md || null)
    setDisplayMode('timeline')
  }

  // Unified parent-child expansion model:
  // Given any period (from tracks, breadcrumbs, inspector, matrix, or table),
  // resolves ancestor path, sets current node, collapses/deselects all deeper descendants,
  // and cleanly marks this node as the active inspection target.
  const handleSelectPeriod = (period: DashaPeriod, explicitAncestors?: DashaPeriod[]) => {
    const level = period.level || 1
    setInspectedPeriod(period)

    // Ensure micro-timing tracks are visible when navigating into fine temporal tiers (SD, PrD, DD)
    if (level >= 4) {
      setShowMicroTiming(true)
    }

    // Resolve ancestors if needed
    let ancestors = explicitAncestors
    if (!ancestors || ancestors.length < level - 1) {
      ancestors = findDashaAncestors(dashaTree, period)
    }

    if (level === 1) {
      setSelectedMd(period)
      setSelectedAd(null)
      setSelectedPd(null)
      setSelectedSd(null)
      setSelectedPrd(null)
      setSelectedDd(null)
    } else if (level === 2) {
      if (ancestors && ancestors[0]) setSelectedMd(ancestors[0])
      setSelectedAd(period)
      setSelectedPd(null)
      setSelectedSd(null)
      setSelectedPrd(null)
      setSelectedDd(null)
    } else if (level === 3) {
      if (ancestors) {
        if (ancestors[0]) setSelectedMd(ancestors[0])
        if (ancestors[1]) setSelectedAd(ancestors[1])
      }
      setSelectedPd(period)
      setSelectedSd(null)
      setSelectedPrd(null)
      setSelectedDd(null)
    } else if (level === 4) {
      if (ancestors) {
        if (ancestors[0]) setSelectedMd(ancestors[0])
        if (ancestors[1]) setSelectedAd(ancestors[1])
        if (ancestors[2]) setSelectedPd(ancestors[2])
      }
      setSelectedSd(period)
      setSelectedPrd(null)
      setSelectedDd(null)
    } else if (level === 5) {
      if (ancestors) {
        if (ancestors[0]) setSelectedMd(ancestors[0])
        if (ancestors[1]) setSelectedAd(ancestors[1])
        if (ancestors[2]) setSelectedPd(ancestors[2])
        if (ancestors[3]) setSelectedSd(ancestors[3])
      }
      setSelectedPrd(period)
      setSelectedDd(null)
    } else if (level === 6) {
      if (ancestors) {
        if (ancestors[0]) setSelectedMd(ancestors[0])
        if (ancestors[1]) setSelectedAd(ancestors[1])
        if (ancestors[2]) setSelectedPd(ancestors[2])
        if (ancestors[3]) setSelectedSd(ancestors[3])
        if (ancestors[4]) setSelectedPrd(ancestors[4])
      }
      setSelectedDd(period)
    }
  }

  // Active period to inspect: purely driven by explicit inspectedPeriod state.
  // Fallback defaults to selectedMd (Level 1 root) or chart's first MD.
  // NEVER falls back to selectedAd before selectedMd!
  const activeInspectPeriod = inspectedPeriod || selectedMd || (dashaTree && dashaTree[0]) || null

  // Hierarchy Chain construction with period references
  const hierarchyChain = useMemo<DashaChainItem[]>(() => {
    const chain: DashaChainItem[] = []
    if (selectedMd) chain.push({ level: 1, levelLabel: 'MD', lord: selectedMd.lord, period: selectedMd })
    if (selectedAd) chain.push({ level: 2, levelLabel: 'AD', lord: selectedAd.lord, period: selectedAd })
    if (selectedPd) chain.push({ level: 3, levelLabel: 'PD', lord: selectedPd.lord, period: selectedPd })
    if (selectedSd) chain.push({ level: 4, levelLabel: 'SD', lord: selectedSd.lord, period: selectedSd })
    if (selectedPrd) chain.push({ level: 5, levelLabel: 'PrD', lord: selectedPrd.lord, period: selectedPrd })
    if (selectedDd) chain.push({ level: 6, levelLabel: 'DD', lord: selectedDd.lord, period: selectedDd })
    return chain
  }, [selectedMd, selectedAd, selectedPd, selectedSd, selectedPrd, selectedDd])

  // Sync with parent when selection changes
  useEffect(() => {
    if (activeInspectPeriod && onSelectPeriod) {
      onSelectPeriod(activeInspectPeriod, hierarchyChain)
    }
  }, [activeInspectPeriod, hierarchyChain, onSelectPeriod])

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

    const items = list.map((item, idx) => {
      const s = new Date(item.start).getTime()
      const e = new Date(item.end).getTime()
      const widthPct = Math.max(1, ((e - s) / totalMs) * 100)
      const isRunning = s <= nowMs && nowMs <= e
      const isSelected = isSamePeriod(activeSelection, item)
      const isInspected = isSamePeriod(activeInspectPeriod, item)

      // Find planet for dignity icon
      const pl = chart.planets.find((p) => p.name.toLowerCase() === item.lord.toLowerCase())
      let dignityIcon = ''
      if (pl?.dignity === 'Exalted') dignityIcon = '👑'
      else if (pl?.dignity === 'Own Sign') dignityIcon = '🏰'
      else if (pl?.dignity === 'Debilitated') dignityIcon = '⚡'

      return {
        ...item,
        uniqueKey: getPeriodKey(item, idx),
        widthPct,
        isRunning,
        isSelected,
        isInspected,
        dignityIcon,
        color: PLANET_COLORS[item.lord] || '#d97706',
      }
    })

    return { items, todayPct }
  }

  const mdBar = useMemo(() => getTimelineBarData(dashaTree, selectedMd), [dashaTree, selectedMd, activeInspectPeriod])
  const adBar = useMemo(() => getTimelineBarData(adList, selectedAd), [adList, selectedAd, activeInspectPeriod])
  const pdBar = useMemo(() => getTimelineBarData(pdList, selectedPd), [pdList, selectedPd, activeInspectPeriod])
  const sdBar = useMemo(() => getTimelineBarData(sdList, selectedSd), [sdList, selectedSd, activeInspectPeriod])
  const prdBar = useMemo(() => getTimelineBarData(prdList, selectedPrd), [prdList, selectedPrd, activeInspectPeriod])
  const ddBar = useMemo(() => getTimelineBarData(ddList, selectedDd), [ddList, selectedDd, activeInspectPeriod])

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }, [])

  return (
    <div className="dasha-timeline-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Master Timing Command Cockpit */}
      <DashaCockpit
        chart={chart}
        selectedMd={selectedMd}
        selectedAd={selectedAd}
        displayMode={displayMode}
        showMicroTiming={showMicroTiming}
        onChangeDisplayMode={setDisplayMode}
        onToggleMicroTiming={() => setShowMicroTiming(!showMicroTiming)}
        onJumpToLive={handleJumpToLive}
        onSelectPlanet={onSelectPlanet}
        onSelectHouse={onSelectHouse}
      />

      {/* 2. Interactive Breadcrumb Navigation Strip (Unified dynamic ancestral collapse) */}
      <div
        className="panel dasha-breadcrumb-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem' }}>ZOOM & INSPECT:</span>

        {hierarchyChain.map((crumb, idx) => {
          const isInspected = isSamePeriod(activeInspectPeriod, crumb.period)
          return (
            <React.Fragment key={`${crumb.level}-${crumb.lord}-${idx}`}>
              {idx > 0 && <span style={{ color: '#475569' }}>›</span>}
              <button
                type="button"
                onClick={() => crumb.period && handleSelectPeriod(crumb.period)}
                style={{
                  background: isInspected ? 'rgba(251, 191, 36, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  border: isInspected ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: isInspected ? '#fbbf24' : '#38bdf8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
                title={`Inspect Level ${crumb.level} ${crumb.lord} ${crumb.levelLabel} (collapses deeper levels)`}
              >
                <span>{crumb.lord} {crumb.levelLabel}</span>
                {isInspected && <span style={{ fontSize: '0.7rem' }}>🔍</span>}
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* 3. Main Workspace Area depending on Display Mode */}
      {displayMode === 'timeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 16 }}>
          {/* Left Column: Multi-Track Timeline Sequencer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* TRACK 1: MAHADASHAS (MD) */}
            <div className="panel level-track-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#f8fafc', fontWeight: 700 }}>
                    Track 1 • 120-Year Mahadasha Lifespan (Level 1)
                  </h4>
                  <span className="eyebrow" style={{ fontSize: '0.66rem' }}>
                    Major life chapters • Click any block to inspect and drill down
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: 4 }}>
                  120 Years
                </span>
              </div>

              {/* MD Bar */}
              <div
                className="proportional-timeline-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 44,
                  borderRadius: 6,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  marginTop: 18,
                  marginBottom: 6,
                }}
              >
                {mdBar.todayPct >= 0 && (
                  <div
                    className="today-marker"
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: `${mdBar.todayPct}%`,
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
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        padding: '1px 4px',
                        borderRadius: 3,
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      TODAY ({todayLabel})
                    </div>
                    <div style={{ width: 2, height: 50, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                  </div>
                )}

                {mdBar.items.map((item) => (
                  <div
                    key={item.uniqueKey}
                    onClick={() => handleSelectPeriod(item)}
                    style={{
                      width: `${item.widthPct}%`,
                      height: '100%',
                      background: item.isInspected
                        ? `linear-gradient(180deg, ${item.color} 0%, rgba(30, 41, 59, 0.95) 100%)`
                        : item.isSelected
                        ? `linear-gradient(180deg, ${item.color}88 0%, rgba(15, 23, 42, 0.9) 100%)`
                        : 'rgba(30, 41, 59, 0.7)',
                      borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                      border: item.isInspected ? '2px solid #fbbf24' : undefined,
                      borderTop: item.isInspected ? '2px solid #fbbf24' : item.isSelected ? `3px solid #fbbf24` : `3px solid ${item.color}`,
                      boxShadow: item.isInspected ? '0 0 12px rgba(251, 191, 36, 0.7), inset 0 0 8px rgba(251, 191, 36, 0.35)' : undefined,
                      zIndex: item.isInspected ? 5 : 1,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                    }}
                    title={`${item.lord} MD: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)} (Click to inspect)`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <strong style={{ fontSize: '0.74rem', color: item.isInspected ? '#fff' : item.isSelected ? '#fff' : '#e2e8f0' }}>
                        {item.lord}
                      </strong>
                      {item.dignityIcon && <span style={{ fontSize: '0.62rem' }}>{item.dignityIcon}</span>}
                      {item.isInspected && <span style={{ fontSize: '0.55rem' }}>🔍</span>}
                    </div>
                    <span style={{ fontSize: '0.62rem', color: item.isInspected ? '#fde68a' : item.isSelected ? '#fde68a' : '#94a3b8' }}>
                      {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (365.25 * 24 * 3600 * 1000)).toFixed(1)}y
                    </span>
                    {item.isRunning && (
                      <span style={{ position: 'absolute', bottom: 1, fontSize: '0.48rem', background: '#f59e0b', color: '#0f172a', fontWeight: 'bold', padding: '0 3px', borderRadius: 2 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TRACK 2: ANTARDASHAS (AD) */}
            {selectedMd && adList.length > 0 && (
              <div
                className="panel level-track-card"
                style={{
                  padding: '12px 14px',
                  borderLeft: `4px solid ${PLANET_COLORS[selectedMd.lord] || '#d97706'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#f8fafc', fontWeight: 700 }}>
                      Track 2 • Antardashas within {selectedMd.lord} Mahadasha (Level 2)
                    </h4>
                    <span className="eyebrow" style={{ fontSize: '0.66rem' }}>
                      {selectedMd.start.slice(0, 10)} → {selectedMd.end.slice(0, 10)} • Months scale • Click any to inspect
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderRadius: 4 }}>
                    Months
                  </span>
                </div>

                {/* AD Bar */}
                <div
                  className="proportional-timeline-container"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 42,
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex',
                    marginTop: 18,
                    marginBottom: 6,
                  }}
                >
                  {adBar.todayPct >= 0 && (
                    <div
                      className="today-marker"
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: `${adBar.todayPct}%`,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.58rem', fontWeight: 900, padding: '1px 4px', borderRadius: 3 }}>
                        TODAY
                      </div>
                      <div style={{ width: 2, height: 48, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                    </div>
                  )}

                  {adBar.items.map((item) => (
                    <div
                      key={item.uniqueKey}
                      onClick={() => handleSelectPeriod(item)}
                      style={{
                        width: `${item.widthPct}%`,
                        height: '100%',
                        background: item.isInspected
                          ? `linear-gradient(180deg, ${item.color} 0%, rgba(30, 41, 59, 0.95) 100%)`
                          : item.isSelected
                          ? `linear-gradient(180deg, ${item.color}88 0%, rgba(15, 23, 42, 0.9) 100%)`
                          : 'rgba(30, 41, 59, 0.7)',
                        borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                        border: item.isInspected ? '2px solid #fbbf24' : undefined,
                        borderTop: item.isInspected ? '2px solid #fbbf24' : item.isSelected ? `3px solid #fbbf24` : `3px solid ${item.color}`,
                        boxShadow: item.isInspected ? '0 0 12px rgba(251, 191, 36, 0.7), inset 0 0 8px rgba(251, 191, 36, 0.35)' : undefined,
                        zIndex: item.isInspected ? 5 : 1,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.15s ease',
                      }}
                      title={`${selectedMd.lord}–${item.lord} AD: ${item.start.slice(0, 10)} to ${item.end.slice(0, 10)}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <strong style={{ fontSize: '0.72rem', color: item.isInspected ? '#fff' : item.isSelected ? '#fff' : '#e2e8f0' }}>
                          {item.lord}
                        </strong>
                        {item.dignityIcon && <span style={{ fontSize: '0.6rem' }}>{item.dignityIcon}</span>}
                        {item.isInspected && <span style={{ fontSize: '0.55rem' }}>🔍</span>}
                      </div>
                      <span style={{ fontSize: '0.6rem', color: item.isInspected ? '#fde68a' : item.isSelected ? '#fde68a' : '#94a3b8' }}>
                        {((new Date(item.end).getTime() - new Date(item.start).getTime()) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)}m
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

            {/* TRACK 3: PRATYANTARDASHAS (PD) */}
            {selectedAd && pdList.length > 0 && (
              <div
                className="panel level-track-card"
                style={{
                  padding: '12px 14px',
                  borderLeft: `4px solid ${PLANET_COLORS[selectedAd.lord] || '#d97706'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#f8fafc', fontWeight: 700 }}>
                      Track 3 • Pratyantardashas within {selectedMd?.lord}–{selectedAd.lord} (Level 3)
                    </h4>
                    <span className="eyebrow" style={{ fontSize: '0.66rem' }}>
                      {selectedAd.start.slice(0, 10)} → {selectedAd.end.slice(0, 10)} • Days scale • Click any to inspect
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderRadius: 4 }}>
                    Days
                  </span>
                </div>

                {/* PD Bar */}
                <div
                  className="proportional-timeline-container"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 40,
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex',
                    marginTop: 18,
                    marginBottom: 6,
                  }}
                >
                  {pdBar.todayPct >= 0 && (
                    <div
                      className="today-marker"
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: `${pdBar.todayPct}%`,
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.58rem', fontWeight: 900, padding: '1px 4px', borderRadius: 3 }}>
                        TODAY
                      </div>
                      <div style={{ width: 2, height: 46, background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.9)' }} />
                    </div>
                  )}

                  {pdBar.items.map((item) => (
                    <div
                      key={item.uniqueKey}
                      onClick={() => handleSelectPeriod(item)}
                      style={{
                        width: `${item.widthPct}%`,
                        height: '100%',
                        background: item.isInspected
                          ? `linear-gradient(180deg, ${item.color} 0%, rgba(30, 41, 59, 0.95) 100%)`
                          : item.isSelected
                          ? `linear-gradient(180deg, ${item.color}88 0%, rgba(15, 23, 42, 0.9) 100%)`
                          : 'rgba(30, 41, 59, 0.7)',
                        borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                        border: item.isInspected ? '2px solid #fbbf24' : undefined,
                        borderTop: item.isInspected ? '2px solid #fbbf24' : item.isSelected ? `3px solid #fbbf24` : `3px solid ${item.color}`,
                        boxShadow: item.isInspected ? '0 0 12px rgba(251, 191, 36, 0.7), inset 0 0 8px rgba(251, 191, 36, 0.35)' : undefined,
                        zIndex: item.isInspected ? 5 : 1,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <strong style={{ fontSize: '0.7rem', color: item.isInspected ? '#fff' : item.isSelected ? '#fff' : '#e2e8f0' }}>
                          {item.lord}
                        </strong>
                        {item.isInspected && <span style={{ fontSize: '0.55rem' }}>🔍</span>}
                      </div>
                      <span style={{ fontSize: '0.58rem', color: item.isInspected ? '#fde68a' : item.isSelected ? '#fde68a' : '#94a3b8' }}>
                        {Math.round((new Date(item.end).getTime() - new Date(item.start).getTime()) / (24 * 3600 * 1000))}d
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

            {/* OPTIONAL DEEP MICRO-TIMING TRACKS (LEVELS 4, 5, 6) */}
            {showMicroTiming && selectedPd && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 12,
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: 8,
                  border: '1px dashed rgba(245, 158, 11, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="eyebrow" style={{ color: '#fbbf24', margin: 0 }}>
                    ⚡ Deep Micro-Timing (Parashari Fine Temporal Resolutions)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Sookshma (SD) → Prana (PrD) → Deha (DD)
                  </span>
                </div>

                {/* TRACK 4: SOOKSHMA DASHAS (SD) */}
                {selectedPd && sdList.length > 0 && (
                  <div className="panel level-track-card" style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <strong style={{ color: '#f8fafc' }}>Level 4 • Sookshma ({selectedPd.lord})</strong>
                      <span style={{ color: '#10b981' }}>Hours/Days • Click to inspect</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: 34, borderRadius: 4, background: 'rgba(15, 23, 42, 0.85)', display: 'flex' }}>
                      {sdBar.items.map((item) => (
                        <div
                          key={item.uniqueKey}
                          onClick={() => handleSelectPeriod(item)}
                          style={{
                            width: `${item.widthPct}%`,
                            height: '100%',
                            background: item.isInspected ? '#fbbf24' : item.isSelected ? item.color : 'rgba(30, 41, 59, 0.6)',
                            borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                            border: item.isInspected ? '2px solid #fbbf24' : undefined,
                            boxShadow: item.isInspected ? '0 0 10px rgba(251, 191, 36, 0.7)' : undefined,
                            zIndex: item.isInspected ? 5 : 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.64rem',
                            color: item.isInspected ? '#0f172a' : item.isSelected ? '#0f172a' : '#cbd5e1',
                            fontWeight: 700,
                            gap: 2,
                          }}
                        >
                          <span>{item.lord.slice(0, 2)}</span>
                          {item.isInspected && <span style={{ fontSize: '0.52rem' }}>🔍</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRACK 5: PRANA DASHAS (PrD) */}
                {selectedSd && prdList.length > 0 && (
                  <div className="panel level-track-card" style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <strong style={{ color: '#f8fafc' }}>Level 5 • Prana ({selectedSd.lord})</strong>
                      <span style={{ color: '#a855f7' }}>1–50 Hours • Click to inspect</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: 30, borderRadius: 4, background: 'rgba(15, 23, 42, 0.85)', display: 'flex' }}>
                      {prdBar.items.map((item) => (
                        <div
                          key={item.uniqueKey}
                          onClick={() => handleSelectPeriod(item)}
                          style={{
                            width: `${item.widthPct}%`,
                            height: '100%',
                            background: item.isInspected ? '#fbbf24' : item.isSelected ? item.color : 'rgba(30, 41, 59, 0.6)',
                            borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                            border: item.isInspected ? '2px solid #fbbf24' : undefined,
                            boxShadow: item.isInspected ? '0 0 10px rgba(251, 191, 36, 0.7)' : undefined,
                            zIndex: item.isInspected ? 5 : 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: item.isInspected ? '#0f172a' : item.isSelected ? '#0f172a' : '#cbd5e1',
                            fontWeight: 700,
                            gap: 2,
                          }}
                        >
                          <span>{item.lord.slice(0, 2)}</span>
                          {item.isInspected && <span style={{ fontSize: '0.5rem' }}>🔍</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRACK 6: DEHA DASHAS (DD) */}
                {selectedPrd && ddList.length > 0 && (
                  <div className="panel level-track-card" style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <strong style={{ color: '#f8fafc' }}>Level 6 • Deha ({selectedPrd.lord})</strong>
                      <span style={{ color: '#ef4444' }}>Minutes • Somatic somatic timing</span>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: 28, borderRadius: 4, background: 'rgba(15, 23, 42, 0.85)', display: 'flex' }}>
                      {ddBar.items.map((item) => (
                        <div
                          key={item.uniqueKey}
                          onClick={() => handleSelectPeriod(item)}
                          style={{
                            width: `${item.widthPct}%`,
                            height: '100%',
                            background: item.isInspected ? '#fbbf24' : item.isSelected ? item.color : 'rgba(30, 41, 59, 0.6)',
                            borderRight: '1px solid rgba(15, 23, 42, 0.8)',
                            border: item.isInspected ? '2px solid #fbbf24' : undefined,
                            boxShadow: item.isInspected ? '0 0 10px rgba(251, 191, 36, 0.7)' : undefined,
                            zIndex: item.isInspected ? 5 : 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.58rem',
                            color: item.isInspected ? '#0f172a' : item.isSelected ? '#0f172a' : '#cbd5e1',
                            fontWeight: 700,
                            gap: 2,
                          }}
                        >
                          <span>{item.lord.slice(0, 2)}</span>
                          {item.isInspected && <span style={{ fontSize: '0.48rem' }}>🔍</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Embedded Real-Time Dasha Inspector Card */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DashaInspector
              chart={chart}
              selectedPeriod={activeInspectPeriod}
              hierarchyChain={hierarchyChain}
              onSelectPlanet={onSelectPlanet}
              onSelectHouse={onSelectHouse}
              onSelectPeriod={handleSelectPeriod}
            />
          </div>
        </div>
      )}

      {/* Sambhandha Matrix Mode */}
      {displayMode === 'matrix' && (
        <SambhandhaMatrix
          chart={chart}
          selectedMd={selectedMd}
          selectedAd={selectedAd}
          onSelectAd={(ad) => {
            handleSelectPeriod(ad)
            setDisplayMode('timeline')
          }}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Table Mode */}
      {displayMode === 'table' && (
        <div className="panel dasha-table-mode" style={{ padding: 16 }}>
          {/* Table Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                Complete Vimshottari Mahadasha & Antardasha Schedule
              </h3>
              <p className="eyebrow" style={{ marginTop: 2 }}>Chronological schedule with lord dignities and direct zoom</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search lord, year, or date..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  minWidth: 180,
                }}
              />

              <select
                value={tableFilterMd}
                onChange={(e) => setTableFilterMd(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '5px 8px',
                  fontSize: '0.78rem',
                }}
              >
                <option value="all">All Mahadashas (120y)</option>
                {dashaTree.map((md, idx) => (
                  <option key={getPeriodKey(md, idx)} value={md.lord}>
                    {md.lord} Mahadasha
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
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
                {dashaTree
                  .filter((md) => tableFilterMd === 'all' || md.lord === tableFilterMd)
                  .map((md, mdIdx) => {
                    const nowStr = new Date().toISOString().slice(0, 10)
                    const isMdRunning = md.start.slice(0, 10) <= nowStr && nowStr <= md.end.slice(0, 10)
                    const subAds = md.children && md.children.length > 0 ? md.children : expandDashaSubPeriods(md, 2)

                    return (
                      <React.Fragment key={getPeriodKey(md, mdIdx)}>
                        <tr
                          onClick={() => {
                            handleSelectPeriod(md)
                            setDisplayMode('timeline')
                          }}
                          style={{
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                            background: isMdRunning ? 'rgba(217, 119, 6, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{md.lord} Mahadasha</span>
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ color: PLANET_COLORS[md.lord] || '#d97706', fontWeight: 700 }}>
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
                              <span style={{ background: '#f59e0b', color: '#0f172a', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.7rem' }}>
                                ● LIVE MD
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>
                                {nowStr > md.end.slice(0, 10) ? 'Completed' : 'Upcoming'}
                              </span>
                            )}
                          </td>
                        </tr>

                        {subAds
                          .filter((ad) => {
                            if (!tableSearch) return true
                            const q = tableSearch.toLowerCase()
                            return (
                              ad.lord.toLowerCase().includes(q) ||
                              ad.start.includes(q) ||
                              ad.end.includes(q)
                            )
                          })
                          .map((ad, adIdx) => {
                            const isAdRunning = ad.start.slice(0, 10) <= nowStr && nowStr <= ad.end.slice(0, 10)
                            return (
                              <tr
                                key={getPeriodKey(ad, adIdx)}
                                onClick={() => {
                                  handleSelectPeriod(ad, [md])
                                  setDisplayMode('timeline')
                                }}
                                style={{
                                  borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                                  background: isAdRunning ? 'rgba(217, 119, 6, 0.08)' : undefined,
                                  cursor: 'pointer',
                                }}
                              >
                                <td style={{ padding: '6px 10px 6px 28px', color: '#cbd5e1' }}>
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
                                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.72rem' }}>
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
