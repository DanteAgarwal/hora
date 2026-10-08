import React from 'react'
import type { AstroChart, PlanetPosition } from '../../types/astro'

interface PlanetInspectorProps {
  planet: PlanetPosition
  chart: AstroChart
  onSelectHouse?: (houseNumber: number) => void
}

export const PlanetInspector: React.FC<PlanetInspectorProps> = ({
  planet,
  chart,
  onSelectHouse,
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

  return (
    <div className="inspector-panel-content">
      {/* Header Banner */}
      <div className="planet-summary" style={{ marginBottom: 16 }}>
        <div className="planet-name-row">
          <span className="planet-symbol">{planet.symbol || planet.short}</span>
          <div>
            <h4>{planet.name} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({planet.sanskritName})</span></h4>
            <small>{planet.sign} • {planet.houseOrdinal} House</small>
          </div>
        </div>
        <p className="planet-degree">{planet.dms}</p>
        <div className="planet-meta">
          <span>{planet.nakshatra} • Pada {planet.pada}</span>
          {planet.retrograde && <span className="badge badge-err" style={{ marginLeft: 6 }}>Retrograde [R]</span>}
          {planet.combust && <span className="badge badge-err" style={{ marginLeft: 6 }}>Combust *</span>}
        </div>
      </div>

      {/* Dignity & Nature */}
      <div className="inspector-section">
        <p className="eyebrow">Dignity & Nature</p>
        <ul>
          <li>
            <span>Dignity</span>
            <strong style={{ color: planet.dignity === 'Exalted' ? '#fbbf24' : planet.dignity === 'Own Sign' ? '#34d399' : planet.dignity === 'Debilitated' ? '#f87171' : '#f8fafc' }}>
              {planet.dignity}
            </strong>
          </li>
          <li><span>Dispositor</span><strong>{planet.dispositor}</strong></li>
          <li>
            <span>Lord of Houses</span>
            <strong>
              {planet.lordOfHouses.length ? (
                planet.lordOfHouses.map((h, hIdx) => (
                  <span
                    key={h}
                    onClick={() => onSelectHouse?.(h)}
                    style={{ cursor: onSelectHouse ? 'pointer' : 'default', color: '#38bdf8', textDecoration: 'underline' }}
                    title={`Click to inspect House ${h}`}
                  >
                    {hIdx > 0 ? ', ' : ''}{h}th
                  </span>
                ))
              ) : (
                'None / Node'
              )}
            </strong>
          </li>
          <li><span>House Nature</span><strong>{planet.houseLabels.slice(0, 2).join(', ') || 'Bhava'}</strong></li>
        </ul>
      </div>

      {/* Vargas Placements */}
      <div className="inspector-section">
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
      <div className="inspector-section">
        <p className="eyebrow">Astronomical Calculation</p>
        <ul>
          <li><span>Absolute Longitude</span><strong>{planet.longitude.toFixed(4)}°</strong></li>
          {planet.speed !== undefined && (
            <li>
              <span>Speed</span>
              <strong>{planet.speed.toFixed(4)}° / day</strong>
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
