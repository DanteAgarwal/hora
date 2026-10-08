import React from 'react'
import type { AstroChart, HousePosition } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'

interface HouseInspectorProps {
  house: HousePosition
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const HouseInspector: React.FC<HouseInspectorProps> = ({
  house,
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  // Find where the lord of this house sits
  const lordPlanet = chart.planets.find((p) => p.name === house.lord)

  // Find zodiac sign metadata
  const signInfo = ZODIAC_SIGNS.find((s) => s.name === house.sign) || ZODIAC_SIGNS[house.signIndex]

  // Find natural karaka planet for this house (e.g. primary planet mentioned in house.naturalKaraka)
  const karakaName = house.naturalKaraka?.split(' ')[0] || ''
  const karakaPlanet = chart.planets.find((p) => p.name === karakaName)

  // Derive placement interpretation for the house lord
  const getLordPlacementInsight = () => {
    if (!lordPlanet) return 'Lord placement details unavailable.'
    const lH = lordPlanet.houseNumber
    if (lH === house.number) {
      return `Swakshetra (Own House) • Lord ${house.lord} is seated in its own domain. This directly anchors and fortifies the house's significations with natural resilience.`
    }
    if ([1, 4, 7, 10].includes(lH)) {
      return `Kendra Placement • Seated in the ${lordPlanet.houseOrdinal} House (Pillar/Angle). Brings prominent, active, and tangible outward results to the affairs of the ${house.number}th House.`
    }
    if ([5, 9].includes(lH)) {
      return `Trikona Placement • Seated in the ${lordPlanet.houseOrdinal} House (Lakshmi Sthana). Blessed with auspicious fortune, purva punya, and ease of fulfillment.`
    }
    if ([3, 6, 11].includes(lH)) {
      return `Upachaya Placement • Seated in the ${lordPlanet.houseOrdinal} House (Growth/Enterprise). Significators improve steadily through time, effort, and perseverance.`
    }
    if ([8, 12].includes(lH)) {
      return `Moksha / Dusthana Placement • Seated in the ${lordPlanet.houseOrdinal} House. Involves transformative cycles, deeper karmic lessons, or foreign / spiritual detachment.`
    }
    if (lH === 2) {
      return `Dhana Placement • Seated in the 2nd House of Wealth & Speech. Connects the themes of the ${house.number}th House directly to resources and family lineage.`
    }
    return `Seated in the ${lordPlanet.houseOrdinal} House (${lordPlanet.sign}).`
  }

  return (
    <div className="inspector-panel-content">
      {/* House Summary Card */}
      <div className="planet-summary" style={{ marginBottom: 14 }}>
        <div className="planet-name-row">
          <span className="planet-symbol" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            H{house.number}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0 }}>{house.name}</h4>
              {house.purushartha && (
                <span
                  className="badge"
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  {house.purushartha}
                </span>
              )}
            </div>
            <small style={{ color: '#cbd5e1' }}>
              {house.sanskritName || `${house.sign} Bhava`}
            </small>
          </div>
        </div>

        <p className="planet-degree" style={{ color: '#e5c07b', margin: '10px 0 6px', fontSize: '1.15rem' }}>
          {signInfo ? `${signInfo.name} (${signInfo.sanskrit})` : house.sign}
        </p>

        <div className="planet-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {signInfo && (
              <span style={{ color: '#94a3b8' }}>
                {signInfo.element} Element • {signInfo.modality}
              </span>
            )}
            <span style={{ color: house.occupants.length ? '#34d399' : '#94a3b8' }}>
              • {house.occupants.length ? `${house.occupants.length} Occupant(s)` : 'Unoccupied'}
            </span>
          </div>
        </div>
      </div>

      {/* House Lord & Placement in Deep Detail */}
      <div className="inspector-section" style={{ marginTop: 12 }}>
        <p className="eyebrow">House Lord (Adhipati)</p>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 6,
            padding: '10px',
            marginTop: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}>
                {lordPlanet?.symbol || '✦'}
              </span>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                Lord {house.lord}
              </strong>
            </div>
            {lordPlanet && (
              <button
                type="button"
                onClick={() => onSelectPlanet?.(lordPlanet.name)}
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  borderRadius: 4,
                  color: '#38bdf8',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title={`Inspect Lord ${lordPlanet.name}`}
              >
                Inspect Lord ↗
              </button>
            )}
          </div>

          {lordPlanet ? (
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              <div>
                <strong>Placement:</strong> Resides in the{' '}
                <span
                  onClick={() => onSelectHouse?.(lordPlanet.houseNumber)}
                  style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {lordPlanet.houseOrdinal} House
                </span>{' '}
                ({lordPlanet.sign} • {lordPlanet.dignity})
              </div>
              <div style={{ marginTop: 6, color: '#94a3b8', fontStyle: 'italic' }}>
                {getLordPlacementInsight()}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Lord calculation in progress.
            </div>
          )}
        </div>
      </div>

      {/* Bhava Karaka & Bhavat Bhavam */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Significator & Mirror Principle</p>
        <ul>
          <li>
            <span>Natural Karaka</span>
            <strong style={{ textAlign: 'right', maxWidth: '65%', fontSize: '0.78rem', color: '#cbd5e1' }}>
              {house.naturalKaraka || '—'}
            </strong>
          </li>
          {karakaPlanet && (
            <li>
              <span>Karaka Status</span>
              <strong
                onClick={() => onSelectPlanet?.(karakaPlanet.name)}
                style={{ cursor: 'pointer', color: '#38bdf8', textDecoration: 'underline' }}
                title={`Inspect ${karakaPlanet.name}`}
              >
                {karakaPlanet.name} in H{karakaPlanet.houseNumber} ({karakaPlanet.dignity}) ↗
              </strong>
            </li>
          )}
          {house.bhavatBhavam && (
            <li>
              <span>Bhavat Bhavam</span>
              <strong style={{ textAlign: 'right', maxWidth: '65%', fontSize: '0.76rem', color: '#e5c07b' }}>
                {house.bhavatBhavam}
              </strong>
            </li>
          )}
        </ul>
      </div>

      {/* Resident Occupants */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Resident Occupants ({house.occupants.length})</p>
        {house.occupants.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', margin: '6px 0' }}>
            No grahas occupy this house. Its significations are directed primarily by Lord {house.lord} and aspecting planets.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {house.occupants.map((occName) => {
              const occPlanet = chart.planets.find((p) => p.name === occName)
              return (
                <div
                  key={occName}
                  onClick={() => onSelectPlanet?.(occName)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: onSelectPlanet ? 'pointer' : 'default',
                  }}
                  title={`Inspect ${occName}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.95rem' }}>{occPlanet?.symbol || '✦'}</span>
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{occName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>
                        {occPlanet?.dms}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {occPlanet && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: occPlanet.dignity === 'Exalted' ? '#fbbf24' : occPlanet.dignity === 'Debilitated' ? '#f87171' : '#cbd5e1',
                        }}
                      >
                        {occPlanet.dignity}
                      </span>
                    )}
                    <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>↗</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Aspects Received (Drishti on this House) */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Aspects Received (Drishti on H{house.number})</p>
        {house.aspectsReceived && house.aspectsReceived.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {house.aspectsReceived.map((asp, idx) => {
              const aspPlanet = chart.planets.find((p) => p.name === asp.planet)
              return (
                <div
                  key={`${asp.planet}-${idx}`}
                  onClick={() => onSelectPlanet?.(asp.planet)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: onSelectPlanet ? 'pointer' : 'default',
                  }}
                  title={`Inspect aspecting planet ${asp.planet}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{aspPlanet?.symbol || '✦'}</span>
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{asp.planet}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>
                        (from H{aspPlanet?.houseNumber})
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#e5c07b' }}>
                    {asp.type.split(' ')[0]} Drishti ↗
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', margin: '4px 0' }}>
            No major planetary aspects cast directly on this bhava.
          </p>
        )}
      </div>

      {/* Primary Significations (Karaktwas) */}
      {house.significations && house.significations.length > 0 && (
        <div className="inspector-section" style={{ marginTop: 14 }}>
          <p className="eyebrow">Key Significations (Karaktwas)</p>
          <ul style={{ marginTop: 6 }}>
            {house.significations.map((sig, sIdx) => (
              <li key={sIdx} style={{ fontSize: '0.78rem', color: '#cbd5e1', padding: '2px 0' }}>
                <span style={{ color: '#38bdf8', marginRight: 6 }}>•</span>
                <span style={{ flex: 1 }}>{sig}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Classifications & Categories */}
      <div className="inspector-section" style={{ marginTop: 14 }}>
        <p className="eyebrow">Classical Classifications</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {house.categories.map((cat) => (
            <span
              key={cat}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: 4,
                padding: '3px 7px',
                fontSize: '0.72rem',
                color: '#e2e8f0',
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Bhava Extents */}
      {(house.cuspLongitude !== undefined || house.startLongitude !== undefined) && (
        <div className="inspector-section" style={{ marginTop: 14 }}>
          <p className="eyebrow">Bhava Cuspal Extents</p>
          <ul>
            {house.startLongitude !== undefined && (
              <li><span>Bhava Start</span><strong>{house.startLongitude.toFixed(2)}°</strong></li>
            )}
            {house.cuspLongitude !== undefined && (
              <li><span>Bhava Midpoint (Cusp)</span><strong>{house.cuspLongitude.toFixed(2)}°</strong></li>
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
