import React from 'react'
import type { AstroChart, PlanetPosition } from '../../types/astro'

interface PlanetInspectorProps {
  planet: PlanetPosition
  chart: AstroChart
  onSelectHouse?: (houseNumber: number) => void
  onSelectPlanet?: (planetName: string) => void
}

export const PlanetInspector: React.FC<PlanetInspectorProps> = ({
  planet,
  chart,
  onSelectHouse,
  onSelectPlanet,
}) => {
  // Collect varga positions for this planet
  const vargaSummary = ['D1', 'D9', 'D10', 'D60'].map((code) => {
    const vChart = chart.vargas[code]
    const gPlacement = vChart?.grahas.find((g) => g.name === planet.name)
    return {
      code,
      name: vChart?.name || code,
      signName: gPlacement?.signName || '—',
      houseNumber: gPlacement?.houseNumber,
    }
  })

  // Dispositor planet lookup
  const dispositorPlanet = chart.planets.find((p) => p.name === planet.dispositor)
  // Nakshatra lord planet lookup
  const nakLordPlanet = chart.planets.find((p) => p.name === planet.nakshatraLord)

  // Color mapping for functional types
  const functionalBadgeColor =
    planet.functionalType === 'Yogakaraka'
      ? '#fbbf24'
      : planet.functionalType === 'Lagna Lord'
      ? '#34d399'
      : planet.functionalType === 'Functional Benefic'
      ? '#38bdf8'
      : planet.functionalType === 'Functional Malefic'
      ? '#f87171'
      : planet.functionalType === 'Maraka'
      ? '#c084fc'
      : '#94a3b8'

  const dignityColor =
    planet.dignity === 'Exalted'
      ? '#fbbf24'
      : planet.dignity === 'Moolatrikona' || planet.dignity === 'Own Sign'
      ? '#34d399'
      : planet.dignity === 'Great Friend' || planet.dignity === 'Friend'
      ? '#60a5fa'
      : planet.dignity === 'Debilitated' || planet.dignity === 'Great Enemy'
      ? '#f87171'
      : '#94a3b8'

  return (
    <div className="inspector-panel-content">
      {/* Header Banner */}
      <div className="planet-summary" style={{ marginBottom: 14 }}>
        <div className="planet-name-row">
          <span className="planet-symbol">{planet.symbol || planet.short}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0 }}>
                {planet.name} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({planet.sanskritName})</span>
              </h4>
              {planet.charaKarakaCode && (
                <span
                  className="badge"
                  style={{
                    background: 'rgba(217, 119, 6, 0.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                  title={planet.charaKaraka}
                >
                  {planet.charaKarakaCode}
                </span>
              )}
            </div>
            <small style={{ color: '#cbd5e1' }}>
              {planet.sign} •{' '}
              <span
                onClick={() => onSelectHouse?.(planet.houseNumber)}
                style={{ cursor: onSelectHouse ? 'pointer' : 'default', color: '#38bdf8', textDecoration: 'underline' }}
                title={`Click to inspect House ${planet.houseNumber}`}
              >
                {planet.houseOrdinal} House
              </span>
            </small>
          </div>
        </div>

        <p className="planet-degree" style={{ margin: '10px 0 6px' }}>{planet.dms}</p>

        <div className="planet-meta" style={{ gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ color: '#cbd5e1' }}>
              {planet.nakshatra} (Pada {planet.pada})
            </span>
            {planet.retrograde && (
              <span className="badge badge-err" style={{ fontSize: '0.7rem' }}>
                Retrograde [R]
              </span>
            )}
            {planet.combust && (
              <span className="badge badge-err" style={{ fontSize: '0.7rem' }}>
                Combust ({planet.sunSeparation?.toFixed(1)}° Sun)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Astrological Functional Role & Nature */}
      <div className="inspector-section" style={{ marginTop: 12 }}>
        <p className="eyebrow">Functional Role (Lagna Perspective)</p>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${functionalBadgeColor}40`,
            borderRadius: 6,
            padding: '8px 10px',
            marginTop: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: functionalBadgeColor,
              }}
            />
            <strong style={{ fontSize: '0.82rem', color: functionalBadgeColor }}>
              {planet.functionalType || 'Functional Status'}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            {planet.functionalRole || 'Calculated based on house rulerships from Lagna.'}
          </p>
        </div>
      </div>

      {/* Parashari House Rulerships (Lord of Houses) */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">House Rulerships (Lord Of)</p>
        {planet.lordOfHouses.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {planet.lordOfHouses.map((hNum) => {
              const ruledHouse = chart.houses.find((h) => h.number === hNum)
              return (
                <button
                  key={hNum}
                  type="button"
                  onClick={() => onSelectHouse?.(hNum)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: 6,
                    padding: '5px 8px',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    cursor: onSelectHouse ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textAlign: 'left',
                  }}
                  title={`Inspect House ${hNum}`}
                >
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>H{hNum}</span>
                  <span>
                    {ruledHouse ? ruledHouse.name.split(' (')[0] : `${hNum}th House`}
                    <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                      {ruledHouse?.sign || ''}
                    </small>
                  </span>
                  <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>↗</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px dashed rgba(148, 163, 184, 0.3)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: '0.78rem',
              color: '#94a3b8',
              marginTop: 6,
            }}
          >
            Nodal Axis (Shadow Graha) • Rules no physical sign in standard Parashari.
            {dispositorPlanet && (
              <span style={{ display: 'block', marginTop: 4, color: '#e2e8f0' }}>
                Acts as proxy through dispositor{' '}
                <strong
                  onClick={() => onSelectPlanet?.(dispositorPlanet.name)}
                  style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {dispositorPlanet.name}
                </strong>
                .
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dignity & Signification Details */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Dignity & Nakshatra Details</p>
        <ul>
          <li>
            <span>Dignity</span>
            <strong style={{ color: dignityColor }}>{planet.dignity}</strong>
          </li>
          <li>
            <span>Sign Dispositor</span>
            <strong
              onClick={() => dispositorPlanet && onSelectPlanet?.(dispositorPlanet.name)}
              style={{
                cursor: dispositorPlanet ? 'pointer' : 'default',
                color: dispositorPlanet ? '#38bdf8' : '#f8fafc',
                textDecoration: dispositorPlanet ? 'underline' : 'none',
              }}
              title={dispositorPlanet ? `Inspect ${dispositorPlanet.name}` : undefined}
            >
              {planet.dispositor} {dispositorPlanet ? `(in H${dispositorPlanet.houseNumber})` : ''}
            </strong>
          </li>
          <li>
            <span>Nakshatra Lord</span>
            <strong
              onClick={() => nakLordPlanet && onSelectPlanet?.(nakLordPlanet.name)}
              style={{
                cursor: nakLordPlanet ? 'pointer' : 'default',
                color: nakLordPlanet ? '#38bdf8' : '#f8fafc',
                textDecoration: nakLordPlanet ? 'underline' : 'none',
              }}
              title={nakLordPlanet ? `Inspect ${nakLordPlanet.name}` : undefined}
            >
              {planet.nakshatraLord} {nakLordPlanet ? `(in H${nakLordPlanet.houseNumber})` : ''}
            </strong>
          </li>
          {planet.charaKaraka && (
            <li>
              <span>Jaimini Karaka</span>
              <strong style={{ color: '#f59e0b' }}>{planet.charaKaraka}</strong>
            </li>
          )}
          <li>
            <span>Natural Karaka</span>
            <strong style={{ fontSize: '0.76rem', color: '#cbd5e1', maxWidth: '60%', textAlign: 'right' }}>
              {planet.naturalKaraka || '—'}
            </strong>
          </li>
        </ul>
      </div>

      {/* Parashari Drishti (Aspects Cast) */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Parashari Aspects Cast (Drishti)</p>
        {planet.aspectsCast && planet.aspectsCast.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {planet.aspectsCast.map((asp) => (
              <div
                key={asp.house}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      onClick={() => onSelectHouse?.(asp.house)}
                      style={{
                        cursor: onSelectHouse ? 'pointer' : 'default',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textDecoration: 'underline',
                      }}
                      title={`Inspect ${asp.houseOrdinal} House`}
                    >
                      {asp.houseOrdinal} House ({asp.sign})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{asp.type.split(' ')[0]}</span>
                  </div>
                  {asp.aspectedPlanets.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#e2e8f0', marginTop: 2 }}>
                      Aspected Grahas:{' '}
                      {asp.aspectedPlanets.map((pName, pIdx) => (
                        <span
                          key={pName}
                          onClick={() => onSelectPlanet?.(pName)}
                          style={{
                            cursor: onSelectPlanet ? 'pointer' : 'default',
                            color: '#fbbf24',
                            textDecoration: 'underline',
                            marginRight: 4,
                          }}
                          title={`Inspect ${pName}`}
                        >
                          {pIdx > 0 ? ', ' : ''}{pName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectHouse?.(asp.house)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 4,
                    color: '#38bdf8',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  View H{asp.house}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic', margin: '4px 0' }}>
            No aspects calculated.
          </p>
        )}
      </div>

      {/* Aspects Received */}
      {planet.aspectsReceived && planet.aspectsReceived.length > 0 && (
        <div className="inspector-section" style={{ marginTop: 14 }}>
          <p className="eyebrow">Aspects Received by this Graha</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {planet.aspectsReceived.map((asp, idx) => (
              <span
                key={`${asp.planet}-${idx}`}
                onClick={() => onSelectPlanet?.(asp.planet)}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#f8fafc',
                  fontSize: '0.76rem',
                  cursor: onSelectPlanet ? 'pointer' : 'default',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={`Inspect aspecting planet ${asp.planet}`}
              >
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{asp.planet}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({asp.type.split(' ')[0]})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vargas Placements */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Divisional Placements</p>
        <div className="vargas-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
          {vargaSummary.map((v) => (
            <div key={v.code} style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '6px 8px', borderRadius: 4, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#e5c07b', fontWeight: 600 }}>{v.code} ({v.name})</div>
              <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600 }}>
                {v.signName} {v.houseNumber ? `(H${v.houseNumber})` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical & Astronomical Coordinates */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Astronomical Calculation</p>
        <ul>
          <li><span>Absolute Longitude</span><strong>{planet.longitude.toFixed(4)}°</strong></li>
          {planet.speed !== undefined && (
            <li>
              <span>Daily Speed</span>
              <strong>
                {planet.speed.toFixed(4)}° / day {planet.speed < 0 ? '[R]' : ''}
              </strong>
            </li>
          )}
          {planet.latitude !== undefined && (
            <li><span>Celestial Latitude</span><strong>{planet.latitude.toFixed(4)}°</strong></li>
          )}
          <li><span>Ayanamsha Used</span><strong>{chart.metadata.ayanamsaName} ({chart.metadata.ayanamsaDms})</strong></li>
        </ul>
      </div>
    </div>
  )
}
