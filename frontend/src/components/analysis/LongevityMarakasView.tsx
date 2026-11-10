import React from 'react'
import type { AstroChart } from '../../types/astro'

interface LongevityMarakasViewProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const LongevityMarakasView: React.FC<LongevityMarakasViewProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const baadhaka = chart.baadhakas
  const maraka = chart.marakas
  const functional = chart.functional

  const marakaGrahas = maraka?.marakaGrahas || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Baadhaka Analysis (BPHS 13.3) */}
      <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, color: '#f87171' }}>
              BPHS §13.3 & Table 31
            </span>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
            ⚡ Baadhaka Sthana & Obstacle-Causing Influences
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Vedic obstruction principle: Movable signs reckon from 11th, Fixed from 9th, and Dual from 7th
          </p>
        </div>

        {baadhaka ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Lagna Modality</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                {baadhaka.lagnaSignName} ({baadhaka.modality?.toUpperCase() || 'MODALITY'})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6 }}>
                Governs the calculation rule for obstruction in this nativity.
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Baadhaka Sthana (House)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginTop: 4 }}>
                House {baadhaka.baadhakaHouse} ({baadhaka.baadhakaSignName})
              </div>
              <button
                type="button"
                onClick={() => onSelectHouse?.(baadhaka.baadhakaHouse)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  padding: 0,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: 6,
                }}
              >
                Inspect H{baadhaka.baadhakaHouse} in Object Inspector →
              </button>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Baadhaka Planets</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {[...(baadhaka.lords || []), ...(baadhaka.occupants || [])].map((pName) => {
                  const p = chart.planets.find((pl) => pl.name === pName)
                  return (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => onSelectPlanet?.(pName)}
                      className="occupant-chip"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                    >
                      <span>{p?.symbol || '✦'}</span>
                      <strong>{pName}</strong>
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 6 }}>
                Lord(s) & occupant(s) capable of introducing impediments during their dashas.
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Baadhaka details computed in real-time.</p>
        )}
      </section>

      {/* 2. Marakas Analysis (BPHS 14.2) */}
      <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, color: '#c084fc' }}>
              BPHS Chapter 14
            </span>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
            🗡️ Maraka Sthanas & Transition Indicators
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            The 2nd and 7th houses (12th from houses of life 3 & 8) and malefics making contact with them or their lords
          </p>
        </div>

        <div className="table-scroll-wrap">
          <table className="astro-data-table">
            <thead>
              <tr>
                <th>Maraka Planet</th>
                <th>Classification</th>
                <th>Classical Qualification Reasons</th>
                <th>Placement</th>
                <th>Dignity</th>
              </tr>
            </thead>
            <tbody>
              {marakaGrahas.map((mg: any) => {
                const planet = chart.planets.find((p) => p.name === mg.grahaName)
                return (
                  <tr key={mg.grahaName} className="table-row">
                    <td>
                      <button
                        type="button"
                        onClick={() => onSelectPlanet?.(mg.grahaName)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f8fafc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: '#c084fc', fontSize: '1rem' }}>{planet?.symbol || '✦'}</span>
                        <strong style={{ fontSize: '0.88rem' }}>{mg.grahaName}</strong>
                      </button>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: mg.kind === 'house lord' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                          color: mg.kind === 'house lord' ? '#c084fc' : '#f87171',
                          border: '1px solid',
                          borderColor: mg.kind === 'house lord' ? 'rgba(192, 132, 252, 0.4)' : 'rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {mg.kind === 'house lord' ? 'House Lord (Primary)' : 'Malefic Contact'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {mg.reasons?.map((r: string, rIdx: number) => (
                          <span key={rIdx} style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                            • {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {planet ? (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          in H{planet.houseNumber} ({planet.sign})
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {planet ? (
                        <span className={`dignity-tag dign-${planet.dignity.toLowerCase().replace(/\s+/g, '-')}`}>
                          {planet.dignity}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Table 30 Parashari Functional Benefics / Malefics */}
      {functional && functional.planets && (
        <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              📜 Classical Functional Nature (BPHS Table 30 Authority)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Functional roles for {functional.lagna_name} Lagna: benefic, malefic, neutral, and yogakaraka
            </p>
          </div>

          <div className="table-scroll-wrap">
            <table className="astro-data-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Houses Ruled</th>
                  <th>Functional Nature</th>
                  <th>Yogakaraka</th>
                  <th>Textual Foundation & Rule</th>
                </tr>
              </thead>
              <tbody>
                {functional.planets.map((fp: any) => {
                  const p = chart.planets.find((pl) => pl.name === fp.planet)
                  const isBen = fp.nature?.includes('benefic')
                  const isMal = fp.nature?.includes('malefic')
                  const clr = fp.yogakaraka ? '#fbbf24' : isBen ? '#34d399' : isMal ? '#f87171' : '#cbd5e1'

                  return (
                    <tr key={fp.planet} className="table-row">
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{fp.planet}</strong>
                        {p && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#94a3b8' }}>({p.sanskritName})</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {fp.houses?.map((h: number) => (
                            <span key={h} className="lord-pill-btn" style={{ fontSize: '0.72rem' }}>
                              H{h}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: clr,
                            background: `${clr}15`,
                            border: `1px solid ${clr}40`,
                          }}
                        >
                          {fp.nature}
                        </span>
                      </td>
                      <td>
                        {fp.yogakaraka ? (
                          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}>👑 Yes</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{fp.why}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

