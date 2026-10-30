import React, { useMemo } from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import {
  PLANET_COLORS,
  calculateSambhandha,
  expandDashaSubPeriods,
  isSamePeriod,
  getPeriodKey,
} from './dashaUtils'

interface SambhandhaMatrixProps {
  chart: AstroChart
  selectedMd: DashaPeriod | null
  selectedAd: DashaPeriod | null
  onSelectAd: (ad: DashaPeriod) => void
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const SambhandhaMatrix: React.FC<SambhandhaMatrixProps> = ({
  chart,
  selectedMd,
  selectedAd,
  onSelectAd,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const currentMd = selectedMd || chart.dashaTree[0] || null

  // 9 Antardashas for the selected Mahadasha
  const adList = useMemo(() => {
    if (!currentMd) return []
    return currentMd.children && currentMd.children.length > 0
      ? currentMd.children
      : expandDashaSubPeriods(currentMd, 2)
  }, [currentMd])

  // Calculate Sambhandha for each AD with current MD
  const rows = useMemo(() => {
    if (!currentMd) return []
    const nowMs = Date.now()

    return adList.map((ad) => {
      const startMs = new Date(ad.start).getTime()
      const endMs = new Date(ad.end).getTime()
      const isRunning = startMs <= nowMs && nowMs <= endMs
      const isSelected = isSamePeriod(selectedAd, ad)

      const sambhandha = calculateSambhandha(currentMd.lord, ad.lord, chart)
      const planet = chart.planets.find((p) => p.name.toLowerCase() === ad.lord.toLowerCase())

      const durationMos = ((endMs - startMs) / (30.4375 * 24 * 3600 * 1000)).toFixed(1)

      return {
        ad,
        planet,
        sambhandha,
        isRunning,
        isSelected,
        durationMos,
      }
    })
  }, [currentMd, adList, selectedAd, chart])

  if (!currentMd) return null

  return (
    <div className="panel sambhandha-matrix-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span className="eyebrow" style={{ margin: 0 }}>Brihat Parashara Hora Shastra (BPHS) Synthesis</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.05rem', color: '#f8fafc' }}>
            {currentMd.lord} Mahadasha • 9 Antardasha Sambhandha & Auspiciousness Matrix
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(217, 119, 6, 0.2)',
            color: '#fbbf24',
            fontWeight: 600,
          }}
        >
          Comparative Life Chapter Analysis
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
        Classical Parashari predictive outcomes are determined by the mutual relationship (Sambhandha) between the Mahadasha Lord ({currentMd.lord}) and the Antardasha Lord. Click any row to inspect and drill into that period.
      </p>

      {/* Grid of Antardashas */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '8px 10px' }}>Antardasha</th>
              <th style={{ padding: '8px 10px' }}>Duration</th>
              <th style={{ padding: '8px 10px' }}>Dates</th>
              <th style={{ padding: '8px 10px' }}>Natal Placement</th>
              <th style={{ padding: '8px 10px' }}>Mutual Axis</th>
              <th style={{ padding: '8px 10px' }}>Maitri</th>
              <th style={{ padding: '8px 10px' }}>Evaluation</th>
              <th style={{ padding: '8px 10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ ad, planet, sambhandha, isRunning, isSelected, durationMos }) => {
              const lordColor = PLANET_COLORS[ad.lord] || '#d97706'
              return (
                <tr
                  key={getPeriodKey(ad)}
                  onClick={() => onSelectAd(ad)}
                  style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    background: isSelected
                      ? 'rgba(217, 119, 6, 0.2)'
                      : isRunning
                      ? 'rgba(245, 158, 11, 0.1)'
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
                        }}
                      />
                      <strong style={{ color: isSelected ? '#fbbf24' : '#f8fafc', fontSize: '0.84rem' }}>
                        {ad.lord}
                      </strong>
                      {isRunning && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            padding: '1px 4px',
                            borderRadius: 2,
                            background: '#f59e0b',
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
                    {ad.start.slice(0, 10)} → {ad.end.slice(0, 10)}
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
                      '—'
                    )}
                  </td>

                  {/* Mutual Axis */}
                  <td style={{ padding: '10px 10px' }}>
                    {sambhandha ? (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
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
                        }}
                      >
                        {sambhandha.axisLabel}
                      </span>
                    ) : (
                      '1/1'
                    )}
                  </td>

                  {/* Maitri */}
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                      {sambhandha?.compoundMaitri || 'Sama'}
                    </span>
                  </td>

                  {/* Evaluation / Summary */}
                  <td style={{ padding: '10px 10px', color: '#94a3b8', fontSize: '0.72rem', maxWidth: 220 }}>
                    {sambhandha ? sambhandha.synthesis.slice(0, 75) + '...' : 'Co-ruling base chapter.'}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '10px 10px' }}>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAd(ad)
                      }}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
