import React, { useState } from 'react'
import type { TransitPlanet } from '../../types/astro'

interface TransitAshtakavargaTableProps {
  planets: TransitPlanet[]
  onSelectPlanet?: (planetName: string) => void
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

export const TransitAshtakavargaTable: React.FC<TransitAshtakavargaTableProps> = ({
  planets,
  onSelectPlanet,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorable' | 'unfavorable' | 'retrograde'>('all')

  const filteredPlanets = planets.filter((p) => {
    if (filter === 'favorable') {
      return p.ashtakavarga.finalVerdict === 'good' || p.ashtakavarga.finalVerdict === 'favorable'
    }
    if (filter === 'unfavorable') {
      return p.ashtakavarga.finalVerdict === 'bad' || p.ashtakavarga.finalVerdict === 'unfavorable'
    }
    if (filter === 'retrograde') {
      return p.retrograde
    }
    return true
  })

  const getVerdictBadge = (verdict: string, _decidedBy: string) => {
    switch (verdict) {
      case 'good':
      case 'favorable':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: 'rgba(16, 185, 129, 0.4)',
          label: 'Auspicious',
        }
      case 'bad':
      case 'unfavorable':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.4)',
          label: 'Challenging',
        }
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.4)',
          label: 'Neutral',
        }
    }
  }

  return (
    <div className="panel" style={{ padding: 24, borderRadius: 16 }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f6db9d' }}>
              Transit Ashtakavarga & Gochara Evaluation
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.84rem' }}>
            Parashari BAV & SAV synthesis (§25.5 & §25.5.1) across all 9 transiting grahas
          </p>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={filter === 'all' ? 'chip-button active' : 'chip-button'}
            onClick={() => setFilter('all')}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            All Grahas ({planets.length})
          </button>
          <button
            type="button"
            className={filter === 'favorable' ? 'chip-button active' : 'chip-button'}
            onClick={() => setFilter('favorable')}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            Auspicious ({planets.filter((p) => p.ashtakavarga.finalVerdict === 'good' || p.ashtakavarga.finalVerdict === 'favorable').length})
          </button>
          <button
            type="button"
            className={filter === 'unfavorable' ? 'chip-button active' : 'chip-button'}
            onClick={() => setFilter('unfavorable')}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            Challenging ({planets.filter((p) => p.ashtakavarga.finalVerdict === 'bad' || p.ashtakavarga.finalVerdict === 'unfavorable').length})
          </button>
          <button
            type="button"
            className={filter === 'retrograde' ? 'chip-button active' : 'chip-button'}
            onClick={() => setFilter('retrograde')}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            Retrograde [Rx] ({planets.filter((p) => p.retrograde).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="analysis-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Graha</th>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Transit Position</th>
              <th style={{ textAlign: 'center', padding: '12px 10px' }}>From Lagna</th>
              <th style={{ textAlign: 'center', padding: '12px 10px' }}>From Moon</th>
              <th style={{ textAlign: 'center', padding: '12px 12px' }}>BAV Points</th>
              <th style={{ textAlign: 'center', padding: '12px 12px' }}>SAV Points</th>
              <th style={{ textAlign: 'center', padding: '12px 14px' }}>Parashari Verdict</th>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Classical Reading (BPHS)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlanets.map((planet) => {
              const badge = getVerdictBadge(planet.ashtakavarga.finalVerdict, planet.ashtakavarga.decidedBy)
              const glyph = PLANET_GLYPHS[planet.name] || '✦'

              return (
                <tr
                  key={planet.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: onSelectPlanet ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => onSelectPlanet?.(planet.name)}
                  className="table-row-hover"
                >
                  {/* Graha */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.2rem', color: '#f6db9d', width: 20, textAlign: 'center' }}>
                        {glyph}
                      </span>
                      <div>
                        <strong style={{ color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {planet.name}
                          {planet.retrograde && (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              Rx
                            </span>
                          )}
                          {planet.combust && (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fcd34d',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              Combust
                            </span>
                          )}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {planet.nakshatraName} • Pada {planet.pada}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Transit Position */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {planet.signName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {planet.dms}
                    </div>
                    {planet.natalConjunct.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 2 }}>
                        Conjunct Natal: {planet.natalConjunct.join(', ')}
                      </div>
                    )}
                  </td>

                  {/* House From Lagna */}
                  <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      H{planet.houseFromNatalLagna}
                    </span>
                  </td>

                  {/* House From Moon (Janma) */}
                  <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                    <span
                      style={{
                        background: planet.isClassicalGood
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.12)',
                        color: planet.isClassicalGood ? '#34d399' : '#f87171',
                        border: `1px solid ${planet.isClassicalGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      H{planet.houseFromNatalMoon}
                    </span>
                  </td>

                  {/* BAV Points */}
                  <td style={{ textAlign: 'center', padding: '12px 12px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          planet.ashtakavarga.bavRekhas >= 5
                            ? 'rgba(16, 185, 129, 0.2)'
                            : planet.ashtakavarga.bavRekhas <= 3
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          planet.ashtakavarga.bavRekhas >= 5
                            ? '#34d399'
                            : planet.ashtakavarga.bavRekhas <= 3
                            ? '#f87171'
                            : '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                      title={`BAV: ${planet.ashtakavarga.bavRekhas} of 8 bindus (${planet.ashtakavarga.bavVerdict})`}
                    >
                      {planet.ashtakavarga.bavRekhas}
                    </div>
                    {planet.ashtakavarga.bavEmphasis && (
                      <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: 2, fontWeight: 600 }}>
                        {planet.ashtakavarga.bavEmphasis}
                      </div>
                    )}
                  </td>

                  {/* SAV Points */}
                  <td style={{ textAlign: 'center', padding: '12px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                      {planet.ashtakavarga.savRekhas}
                    </div>
                    {planet.ashtakavarga.savDominant ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background:
                            planet.ashtakavarga.savRekhas > 30
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color:
                            planet.ashtakavarga.savRekhas > 30 ? '#34d399' : '#f87171',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        SAV Dominant
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Balanced</span>
                    )}
                  </td>

                  {/* Parashari Verdict */}
                  <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}
                    >
                      {badge.label}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3 }}>
                      Decided by {planet.ashtakavarga.decidedBy}
                    </div>
                  </td>

                  {/* Classical BPHS Reading */}
                  <td style={{ padding: '12px 14px', maxWidth: 320 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                      {planet.gocharaEffect}
                    </p>
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
