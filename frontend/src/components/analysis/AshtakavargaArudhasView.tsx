import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'

interface AshtakavargaArudhasViewProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const AshtakavargaArudhasView: React.FC<AshtakavargaArudhasViewProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [selectedBavPlanet, setSelectedBavPlanet] = useState<string>('Sun')

  const sav = chart.ashtakavarga?.sarvashtakavarga
  const binnas = chart.ashtakavarga?.bhinnashtakavarga || []
  const arudhasList = chart.arudhas?.padas || []

  // Active BAV table
  const activeBav = binnas.find((b: any) => b.owner === selectedBavPlanet) || binnas[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Sarvashtakavarga (SAV) Summary Banner */}
      <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              🔢 Sarvashtakavarga (SAV) 12-Bhava Distribution
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Collective benefic points (rekhas) across all 12 signs • Total: {sav?.total ?? 337} / 337 • Classical benchmark: 28 average
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              Strong (≥ 30)
            </span>
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
              Average (26–29)
            </span>
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              Weak (≤ 25)
            </span>
          </div>
        </div>

        {/* 12 Signs SAV Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {chart.houses.map((house) => {
            const points = house.savPoints ?? 28
            const isStrong = points >= 30
            const isWeak = points <= 25
            const color = isStrong ? '#34d399' : isWeak ? '#f87171' : '#cbd5e1'
            const bg = isStrong ? 'rgba(52, 211, 153, 0.1)' : isWeak ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.6)'
            const border = isStrong ? 'rgba(52, 211, 153, 0.3)' : isWeak ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'

            return (
              <div
                key={house.number}
                onClick={() => onSelectHouse?.(house.number)}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  cursor: onSelectHouse ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#e5c07b' }}>H{house.number}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{house.sign.slice(0, 3)}</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color, margin: '2px 0' }}>
                  {points} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8' }}>pts</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{isStrong ? 'Strong' : isWeak ? 'Weak' : 'Moderate'}</span>
                  {house.occupants.length > 0 && <span style={{ color: '#38bdf8' }}>{house.occupants.length} Gr</span>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. Arudha Padas (A1 to A12, AL, UL) */}
      <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
            🏛️ Jaimini Arudha Padas (A1 to A12, Arudha Lagna & Upapada)
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Manifested tangible images of the 12 bhavas computed per Maharishi Parasara's six-step sequence (BPHS Chapter 9)
          </p>
        </div>

        <div className="table-scroll-wrap">
          <table className="astro-data-table">
            <thead>
              <tr>
                <th>Bhava</th>
                <th>Arudha Symbol</th>
                <th>Traditional Title</th>
                <th>Pada Sign (Rashi)</th>
                <th>House of Placement</th>
                <th>Sign Lord</th>
                <th>Exception</th>
              </tr>
            </thead>
            <tbody>
              {arudhasList.map((p: any) => {
                const targetHouse = chart.houses.find((h) => h.signIndex === p.signIndex)
                const lordPlanet = chart.planets.find((pl) => pl.name === p.lordName)

                return (
                  <tr key={p.house} className="table-row">
                    <td>
                      <strong style={{ color: '#38bdf8' }}>H{p.house}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          background: p.symbol === 'AL' ? 'rgba(217, 119, 6, 0.25)' : p.symbol === 'UL' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                          color: p.symbol === 'AL' ? '#fbbf24' : p.symbol === 'UL' ? '#c084fc' : '#38bdf8',
                          border: '1px solid',
                          borderColor: p.symbol === 'AL' ? '#f59e0b' : p.symbol === 'UL' ? '#a855f7' : 'rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        {p.symbol}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{p.name}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#e5c07b' }}>{p.signName}</strong>
                    </td>
                    <td>
                      {targetHouse ? (
                        <button
                          type="button"
                          className="house-link-btn"
                          onClick={() => onSelectHouse?.(targetHouse.number)}
                          style={{ cursor: 'pointer' }}
                        >
                          H{targetHouse.number} ({targetHouse.name.replace(' House', '')})
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {lordPlanet ? (
                        <button
                          type="button"
                          onClick={() => onSelectPlanet?.(lordPlanet.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>{lordPlanet.symbol}</span>
                          <strong>{p.lordName}</strong>
                        </button>
                      ) : (
                        p.lordName || '—'
                      )}
                    </td>
                    <td>
                      {p.exceptionApplied ? (
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                          10th Step Applied
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Standard Count</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Bhinnashtakavarga (BAV) Grids */}
      {binnas.length > 0 && (
        <section className="panel" style={{ padding: '20px', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                🪐 Individual Planet Bhinnashtakavarga (BAV)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Benefic rekhas contributed by 8 reference points (7 Grahas + Lagna) across 12 signs
              </p>
            </div>

            {/* Planet Selector Switcher */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {binnas.map((b: any) => {
                const isActive = (activeBav?.owner || 'Sun') === b.owner
                return (
                  <button
                    key={b.owner}
                    type="button"
                    onClick={() => setSelectedBavPlanet(b.owner)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                      background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {b.owner} ({b.total})
                  </button>
                )
              })}
            </div>
          </div>

          {activeBav && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {ZODIAC_SIGNS.map((sign, sIdx) => {
                const rekhas = activeBav.rekhas?.[sIdx] ?? 4
                const isFav = rekhas >= 5
                const isUnfav = rekhas <= 3
                const clr = isFav ? '#34d399' : isUnfav ? '#f87171' : '#cbd5e1'
                const bg = isFav ? 'rgba(52, 211, 153, 0.1)' : isUnfav ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.6)'

                return (
                  <div
                    key={sign.name}
                    style={{
                      background: bg,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 6,
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sign.name.slice(0, 3)}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: clr, margin: '2px 0' }}>
                      {rekhas}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: clr }}>
                      {isFav ? 'Favorable' : isUnfav ? 'Unfavorable' : 'Neutral'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

