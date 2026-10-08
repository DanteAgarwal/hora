import React from 'react'
import type { AstroChart, HousePosition } from '../../types/astro'

interface HouseInspectorProps {
  house: HousePosition
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
}

export const HouseInspector: React.FC<HouseInspectorProps> = ({
  house,
  chart,
  onSelectPlanet,
}) => {
  // Find where the lord of this house sits
  const lordPlanet = chart.planets.find((p) => p.name === house.lord)

  return (
    <div className="inspector-panel-content">
      {/* House Summary Card */}
      <div className="planet-summary" style={{ marginBottom: 16 }}>
        <div className="planet-name-row">
          <span className="planet-symbol" style={{ color: '#38bdf8' }}>H{house.number}</span>
          <div>
            <h4>{house.name}</h4>
            <small>{house.sign} Sign • Lord {house.lord}</small>
          </div>
        </div>
        <p className="planet-degree" style={{ color: '#e5c07b' }}>
          {house.occupants.length ? `${house.occupants.length} Occupant(s)` : 'Empty House'}
        </p>
        <div className="planet-meta">
          <span>{house.categories.slice(0, 2).join(' • ') || 'Bhava'}</span>
        </div>
      </div>

      {/* Lordship & Dispositor */}
      <div className="inspector-section">
        <p className="eyebrow">House Lord & Placements</p>
        <ul>
          <li>
            <span>Lord of House</span>
            <strong
              style={{ cursor: lordPlanet ? 'pointer' : 'default', color: lordPlanet ? '#38bdf8' : '#f8fafc' }}
              onClick={() => lordPlanet && onSelectPlanet?.(lordPlanet.name)}
              title={lordPlanet ? 'Click to inspect lord planet' : undefined}
            >
              {house.lord} {lordPlanet ? `(in ${lordPlanet.houseOrdinal})` : ''} ↗
            </strong>
          </li>
          <li><span>Sign Number</span><strong>{house.signNumber} ({house.sign})</strong></li>
          <li><span>Categories</span><strong>{house.categories.join(', ') || 'Bhava'}</strong></li>
        </ul>
      </div>

      {/* Resident Occupants */}
      <div className="inspector-section">
        <p className="eyebrow">Occupants</p>
        {house.occupants.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', margin: '6px 0' }}>
            No planets occupy this house. Its results are governed directly by its lord ({house.lord}).
          </p>
        ) : (
          <div className="chip-grid" style={{ marginTop: 8 }}>
            {house.occupants.map((occName) => {
              const occPlanet = chart.planets.find((p) => p.name === occName)
              return (
                <button
                  key={occName}
                  type="button"
                  className="chip-button selected"
                  onClick={() => onSelectPlanet?.(occName)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{occPlanet?.symbol || '✦'}</span>
                  <span>{occName}</span>
                  {occPlanet && <small style={{ color: '#e5c07b' }}>({occPlanet.dms.split("'")[0]}°)</small>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bhava Extents */}
      {(house.cuspLongitude !== undefined || house.startLongitude !== undefined) && (
        <div className="inspector-section">
          <p className="eyebrow">Bhava Extents (Calculation)</p>
          <ul>
            {house.startLongitude !== undefined && (
              <li><span>Bhava Start</span><strong>{house.startLongitude.toFixed(2)}°</strong></li>
            )}
            {house.cuspLongitude !== undefined && (
              <li><span>Bhava Midpoint / Cusp</span><strong>{house.cuspLongitude.toFixed(2)}°</strong></li>
            )}
            {house.endLongitude !== undefined && (
              <li><span>Bhava End</span><strong>{house.endLongitude.toFixed(2)}°</strong></li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
