import React, { useState, useEffect, useMemo } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import {
  PLANET_COLORS,
  calculateSambhandha,
  isSamePeriod,
  getPeriodKey,
  getMahadashaProfile,
  parseDateMs,
} from './dashaUtils'
import { useNow } from '../../hooks/useNow'
import { fetchExpandedSubPeriods } from '../../services/dashaApi'

interface SambhandhaMatrixProps {
  chart: AstroChart
  selectedMd: DashaPeriod | null
  selectedAd: DashaPeriod | null
  onSelectAd: (ad: DashaPeriod) => void
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onDrillIntoTimeline?: (ad: DashaPeriod) => void
}

const DEFAULT_VIMSHOTTARI_CYCLE = [
  { name: 'Ketu', years: 7 },
  { name: 'Venus', years: 20 },
  { name: 'Sun', years: 6 },
  { name: 'Moon', years: 10 },
  { name: 'Mars', years: 7 },
  { name: 'Rahu', years: 18 },
  { name: 'Jupiter', years: 16 },
  { name: 'Saturn', years: 19 },
  { name: 'Mercury', years: 17 },
]

export const SambhandhaMatrix: React.FC<SambhandhaMatrixProps> = ({
  chart,
  selectedMd,
  selectedAd,
  onSelectAd,
  onSelectPlanet,
  onSelectHouse,
  onDrillIntoTimeline,
}) => {
  const nowMs = useNow(30000)

  // Allow user to select and browse any Mahadasha in the matrix
  const [viewedMdLord, setViewedMdLord] = useState<string | null>(null)
  const [adList, setAdList] = useState<DashaPeriod[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const dashaTree = chart.dashaTree || []

  // Resolve the active Mahadasha to inspect
  const currentMd: DashaPeriod | null = useMemo(() => {
    if (viewedMdLord) {
      const found = dashaTree.find(
        (md) => (md.lord || '').toLowerCase() === viewedMdLord.toLowerCase()
      )
      if (found) return found
    }
    if (selectedMd) return selectedMd
    if (dashaTree.length > 0) return dashaTree[0]

    // Fallback if chart dashaTree is completely empty
    return {
      lord: 'Sun',
      level: 1,
      start: '2020-01-01',
      end: '2026-01-01',
      children: [],
    }
  }, [viewedMdLord, selectedMd, dashaTree])

  // Synchronize viewed lord when selectedMd changes externally
  useEffect(() => {
    if (selectedMd?.lord && !viewedMdLord) {
      setViewedMdLord(selectedMd.lord)
    }
  }, [selectedMd, viewedMdLord])

  // Asynchronously fetch 9 Antardashas from backend expansion API
  useEffect(() => {
    if (!currentMd) {
      setAdList([])
      return
    }

    // If current Mahadasha already carries pre-expanded 9 children, use them immediately
    if (currentMd.children && currentMd.children.length === 9) {
      setAdList(currentMd.children)
      return
    }

    let isMounted = true
    setLoading(true)

    fetchExpandedSubPeriods(currentMd, 2)
      .then((subperiods) => {
        if (!isMounted) return
        if (subperiods && subperiods.length > 0) {
          setAdList(subperiods)
        } else {
          setAdList([])
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load Antardashas from backend expansion API:', err)
        setAdList([])
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentMd])

  // Compute Sambhandha for each Antardasha with the current Mahadasha lord
  const rows = useMemo(() => {
    if (!currentMd) return []

    return adList.map((ad) => {
      const startMs = parseDateMs(ad.start)
      const endMs = parseDateMs(ad.end)
      const isRunning = !isNaN(startMs) && !isNaN(endMs) && startMs <= nowMs && nowMs <= endMs
      const isSelected = isSamePeriod(selectedAd, ad)

      const sambhandha = calculateSambhandha(currentMd.lord, ad.lord, chart)
      const planet = chart.planets.find(
        (p) => (p.name || '').toLowerCase() === (ad.lord || '').toLowerCase()
      )

      let durationMos = '—'
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        durationMos = ((endMs - startMs) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)
      }

      return {
        ad,
        planet,
        sambhandha,
        isRunning,
        isSelected,
        durationMos,
      }
    })
  }, [currentMd, adList, selectedAd, chart, nowMs])

  // Summary counts across all 9 Antardashas for quick structural overview
  const summaryCounts = useMemo(() => {
    let auspicious = 0
    let growth = 0
    let friction = 0
    let neutral = 0

    rows.forEach(({ sambhandha }) => {
      if (!sambhandha) return
      if (sambhandha.category === 'Auspicious') auspicious++
      else if (sambhandha.category === 'Favorable Growth') growth++
      else if (sambhandha.category === 'Challenging Friction' || sambhandha.category === 'Expenditure & Shift') friction++
      else neutral++
    })

    return { auspicious, growth, friction, neutral }
  }, [rows])

  // Filter rows if user clicks a category chip
  const filteredRows = useMemo(() => {
    if (filterCategory === 'all') return rows
    if (filterCategory === 'auspicious') {
      return rows.filter((r) => r.sambhandha?.category === 'Auspicious')
    }
    if (filterCategory === 'growth') {
      return rows.filter((r) => r.sambhandha?.category === 'Favorable Growth')
    }
    if (filterCategory === 'friction') {
      return rows.filter(
        (r) =>
          r.sambhandha?.category === 'Challenging Friction' ||
          r.sambhandha?.category === 'Expenditure & Shift'
      )
    }
    if (filterCategory === 'live') {
      return rows.filter((r) => r.isRunning)
    }
    return rows
  }, [rows, filterCategory])

  if (!currentMd) return null

  const mdProfile = getMahadashaProfile(currentMd.lord)
  const currentLordColor = PLANET_COLORS[currentMd.lord] || '#d97706'

  return (
    <div
      className="panel sambhandha-matrix-panel"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 8,
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.15rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
              Brihat Parashara Hora Shastra (BPHS) Sambhandha Matrix
            </h3>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(217, 119, 6, 0.2)',
                color: '#fbbf24',
                fontWeight: 700,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              9 Antardasha Auspiciousness Grid
            </span>
          </div>
          <p style={{ margin: '3px 0 0 28px', fontSize: '0.78rem', color: '#94a3b8' }}>
            Classical Parashari predictive outcomes determined by the mutual relationship (Sambhandha) & Panchadha Maitri between the Mahadasha Lord ({currentMd.lord}) and the 9 Antardasha Lords.
          </p>
        </div>

        {/* Live Running Period Badge */}
        {rows.some((r) => r.isRunning) && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '3px 10px',
              borderRadius: 4,
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            CURRENTLY IN {currentMd.lord} MAHADASHA
          </span>
        )}
      </div>

      {/* 1. Mahadasha Selector Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="eyebrow" style={{ fontSize: '0.68rem', margin: 0 }}>
            Select Mahadasha to Inspect 9-Antardasha Sambhandha Matrix:
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            Viewing: <strong style={{ color: currentLordColor }}>{currentMd.lord}</strong> ({currentMd.start ? currentMd.start.slice(0, 4) : ''} → {currentMd.end ? currentMd.end.slice(0, 4) : ''})
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            padding: '6px 8px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 6,
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          {(dashaTree.length > 0 ? dashaTree : DEFAULT_VIMSHOTTARI_CYCLE.map((c) => ({ lord: c.name, level: 1, start: '', end: '', children: [] }))).map((md) => {
            const isCurrent = (md.lord || '').toLowerCase() === (currentMd.lord || '').toLowerCase()
            const lordColor = PLANET_COLORS[md.lord] || '#d97706'
            const sMs = md.start ? parseDateMs(md.start) : NaN
            const eMs = md.end ? parseDateMs(md.end) : NaN
            const isMdRunning = !isNaN(sMs) && !isNaN(eMs) && sMs <= nowMs && nowMs <= eMs

            return (
              <button
                key={`md-tab-${md.lord}`}
                type="button"
                onClick={() => setViewedMdLord(md.lord)}
                style={{
                  background: isCurrent ? 'rgba(217, 119, 6, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                  border: isCurrent ? `1.5px solid ${lordColor}` : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 5,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: isCurrent ? '#fbbf24' : '#e2e8f0',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.74rem',
                  boxShadow: isCurrent ? `0 0 10px ${lordColor}44` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: lordColor,
                    display: 'inline-block',
                  }}
                />
                <span>{md.lord}</span>
                {isMdRunning && (
                  <span
                    style={{
                      fontSize: '0.58rem',
                      padding: '1px 4px',
                      borderRadius: 2,
                      background: '#10b981',
                      color: '#0f172a',
                      fontWeight: 800,
                    }}
                  >
                    LIVE
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Mahadasha Karmic Profile Strip & Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        {/* Core Theme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="eyebrow" style={{ fontSize: '0.64rem', margin: 0, color: '#94a3b8' }}>
            Chapter Archetype & Core Theme
          </span>
          <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600 }}>
            {mdProfile?.archetype || `${currentMd.lord} Major Lifespan Cycle`}
          </span>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.3 }}>
            {mdProfile?.coreTheme || 'Major Parashari lifecycle activation.'}
          </p>
        </div>

        {/* Auspiciousness Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="eyebrow" style={{ fontSize: '0.64rem', margin: 0, color: '#94a3b8' }}>
            9-Antardasha Axis Breakdown
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterCategory(filterCategory === 'auspicious' ? 'all' : 'auspicious')}
              style={{
                fontSize: '0.66rem',
                padding: '2px 8px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: filterCategory === 'auspicious' ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                color: filterCategory === 'auspicious' ? '#0f172a' : '#34d399',
                fontWeight: 700,
              }}
            >
              🌟 {summaryCounts.auspicious} Auspicious (5/9)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory(filterCategory === 'growth' ? 'all' : 'growth')}
              style={{
                fontSize: '0.66rem',
                padding: '2px 8px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: filterCategory === 'growth' ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)',
                color: filterCategory === 'growth' ? '#0f172a' : '#38bdf8',
                fontWeight: 700,
              }}
            >
              📈 {summaryCounts.growth} Growth (3/11)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory(filterCategory === 'friction' ? 'all' : 'friction')}
              style={{
                fontSize: '0.66rem',
                padding: '2px 8px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: filterCategory === 'friction' ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                color: filterCategory === 'friction' ? '#ffffff' : '#f87171',
                fontWeight: 700,
              }}
            >
              ⚠️ {summaryCounts.friction} Friction (6/8, 2/12)
            </button>
            {filterCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                style={{
                  fontSize: '0.66rem',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#94a3b8',
                }}
              >
                Clear Filter ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. The 9-Antardasha Sambhandha Matrix Table */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        {loading && (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 6,
              color: '#fbbf24',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⏳ Loading classical Sambhandha Matrix for {currentMd.lord} Mahadasha from backend...</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Expanding 9 proportional Antardasha dates and evaluating mutual astrological axes.
            </span>
          </div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '0.8rem',
            }}
          >
            No Antardashas match the selected filter.
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              style={{
                marginLeft: 8,
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Show all 9 Antardashas
            </button>
          </div>
        )}

        {!loading && filteredRows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '8px 10px' }}>Antardasha Lord</th>
                <th style={{ padding: '8px 10px' }}>Duration</th>
                <th style={{ padding: '8px 10px' }}>Date Range</th>
                <th style={{ padding: '8px 10px' }}>Natal Placement</th>
                <th style={{ padding: '8px 10px' }}>Mutual Axis</th>
                <th style={{ padding: '8px 10px' }}>Panchadha Maitri</th>
                <th style={{ padding: '8px 10px' }}>Classical Parashari BPHS Synthesis</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ ad, planet, sambhandha, isRunning, isSelected, durationMos }) => {
                const lordColor = PLANET_COLORS[ad.lord] || '#d97706'
                return (
                  <tr
                    key={getPeriodKey(ad)}
                    onClick={() => onSelectAd(ad)}
                    style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                      background: isSelected
                        ? 'rgba(217, 119, 6, 0.22)'
                        : isRunning
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Antardasha Lord */}
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: lordColor,
                            flexShrink: 0,
                          }}
                        />
                        <strong style={{ color: isSelected ? '#fbbf24' : '#f8fafc', fontSize: '0.84rem' }}>
                          {ad.lord}
                        </strong>
                        {isRunning && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: 2,
                              background: '#10b981',
                              color: '#0f172a',
                              fontWeight: 800,
                            }}
                          >
                            LIVE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '10px 10px', color: '#cbd5e1' }}>
                      {durationMos} mos
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '10px 10px', color: '#94a3b8', fontSize: '0.74rem' }}>
                      {ad.start ? ad.start.slice(0, 10) : '—'} → {ad.end ? ad.end.slice(0, 10) : '—'}
                    </td>

                    {/* Natal Placement */}
                    <td style={{ padding: '10px 10px' }}>
                      {planet ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectHouse?.(planet.houseNumber)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#38bdf8',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                            title={`Inspect House ${planet.houseNumber}`}
                          >
                            H{planet.houseNumber}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectPlanet?.(planet.name)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#e2e8f0',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                            }}
                            title={`Inspect ${planet.name}`}
                          >
                            ({planet.sign})
                          </button>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              color:
                                planet.dignity === 'Exalted'
                                  ? '#34d399'
                                  : planet.dignity === 'Debilitated'
                                  ? '#f87171'
                                  : '#fbbf24',
                            }}
                          >
                            {planet.dignity === 'Exalted' ? '👑' : planet.dignity === 'Own Sign' ? '🏰' : planet.dignity === 'Debilitated' ? '⚡' : ''}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>

                    {/* Mutual Axis */}
                    <td style={{ padding: '10px 10px' }}>
                      {sambhandha ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 7px',
                            borderRadius: 4,
                            fontWeight: 700,
                            display: 'inline-block',
                            background:
                              sambhandha.category === 'Auspicious'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : sambhandha.category === 'Favorable Growth'
                                ? 'rgba(56, 189, 248, 0.2)'
                                : sambhandha.category === 'Challenging Friction'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : sambhandha.category === 'Conjunction'
                                ? 'rgba(168, 85, 247, 0.2)'
                                : sambhandha.category === 'Mutual Aspect'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(148, 163, 184, 0.2)',
                            color:
                              sambhandha.category === 'Auspicious'
                                ? '#34d399'
                                : sambhandha.category === 'Favorable Growth'
                                ? '#38bdf8'
                                : sambhandha.category === 'Challenging Friction'
                                ? '#f87171'
                                : sambhandha.category === 'Conjunction'
                                ? '#c084fc'
                                : sambhandha.category === 'Mutual Aspect'
                                ? '#fbbf24'
                                : '#cbd5e1',
                          }}
                        >
                          {sambhandha.axisLabel}
                        </span>
                      ) : (
                        '1/1'
                      )}
                    </td>

                    {/* Panchadha Maitri */}
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color:
                            sambhandha?.compoundMaitri === 'Adhi-Mitra'
                              ? '#34d399'
                              : sambhandha?.compoundMaitri === 'Mitra'
                              ? '#38bdf8'
                              : sambhandha?.compoundMaitri === 'Sama'
                              ? '#fbbf24'
                              : '#f87171',
                        }}
                      >
                        {sambhandha?.compoundMaitri || 'Sama'}
                      </span>
                    </td>

                    {/* Parashari Synthesis */}
                    <td style={{ padding: '10px 10px', color: '#94a3b8', fontSize: '0.72rem', maxWidth: 260, lineHeight: 1.35 }}>
                      {sambhandha ? (
                        <>
                          <div style={{ color: '#cbd5e1' }}>{sambhandha.synthesis}</div>
                          <div style={{ marginTop: 2, color: '#f59e0b', fontSize: '0.68rem', fontStyle: 'italic' }}>
                            {sambhandha.bphsGuidance}
                          </div>
                        </>
                      ) : (
                        'Base co-ruling period.'
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          type="button"
                          className="chip-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectAd(ad)
                          }}
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            background: isSelected ? 'rgba(217, 119, 6, 0.4)' : undefined,
                            border: isSelected ? '1px solid #f59e0b' : undefined,
                            color: isSelected ? '#fbbf24' : undefined,
                          }}
                          title="Inspect this Antardasha in Inspector"
                        >
                          Inspect 🔍
                        </button>
                        {onDrillIntoTimeline && (
                          <button
                            type="button"
                            className="chip-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDrillIntoTimeline(ad)
                            }}
                            style={{
                              fontSize: '0.68rem',
                              padding: '3px 8px',
                              color: '#38bdf8',
                            }}
                            title="Jump to timeline tracks for this Antardasha"
                          >
                            Timeline ⏱️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
