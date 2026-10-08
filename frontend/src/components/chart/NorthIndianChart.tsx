import React, { useState } from 'react'
import { PlanetBadge } from './PlanetBadge'
import type { PlanetPosition, VargaGrahaPlacement } from '../../types/astro'

interface NorthIndianChartProps {
  lagnaSignIndex: number // 0 to 11
  planets: (PlanetPosition | VargaGrahaPlacement)[]
  selectedPlanet?: string
  selectedHouse?: number
  showDegrees?: boolean
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface HouseDef {
  number: number
  polygon: string
  signPos: { x: number; y: number }
  planetAnchor: { x: number; y: number }
}

const HOUSE_DEFS: HouseDef[] = [
  {
    number: 1,
    polygon: '250,0 125,125 250,250 375,125',
    signPos: { x: 250, y: 55 },
    planetAnchor: { x: 250, y: 145 },
  },
  {
    number: 2,
    polygon: '0,0 250,0 125,125',
    signPos: { x: 145, y: 45 },
    planetAnchor: { x: 100, y: 75 },
  },
  {
    number: 3,
    polygon: '0,0 0,250 125,125',
    signPos: { x: 45, y: 145 },
    planetAnchor: { x: 65, y: 100 },
  },
  {
    number: 4,
    polygon: '0,250 125,125 250,250 125,375',
    signPos: { x: 55, y: 250 },
    planetAnchor: { x: 135, y: 250 },
  },
  {
    number: 5,
    polygon: '0,250 0,500 125,375',
    signPos: { x: 45, y: 355 },
    planetAnchor: { x: 65, y: 400 },
  },
  {
    number: 6,
    polygon: '0,500 250,500 125,375',
    signPos: { x: 145, y: 455 },
    planetAnchor: { x: 100, y: 425 },
  },
  {
    number: 7,
    polygon: '250,250 125,375 250,500 375,375',
    signPos: { x: 250, y: 455 },
    planetAnchor: { x: 250, y: 355 },
  },
  {
    number: 8,
    polygon: '250,500 500,500 375,375',
    signPos: { x: 355, y: 455 },
    planetAnchor: { x: 400, y: 425 },
  },
  {
    number: 9,
    polygon: '500,250 500,500 375,375',
    signPos: { x: 455, y: 355 },
    planetAnchor: { x: 435, y: 400 },
  },
  {
    number: 10,
    polygon: '250,250 375,125 500,250 375,375',
    signPos: { x: 445, y: 250 },
    planetAnchor: { x: 365, y: 250 },
  },
  {
    number: 11,
    polygon: '500,0 500,250 375,125',
    signPos: { x: 455, y: 145 },
    planetAnchor: { x: 435, y: 100 },
  },
  {
    number: 12,
    polygon: '250,0 500,0 375,125',
    signPos: { x: 355, y: 45 },
    planetAnchor: { x: 400, y: 75 },
  },
]

export const NorthIndianChart: React.FC<NorthIndianChartProps> = ({
  lagnaSignIndex,
  planets,
  selectedPlanet,
  selectedHouse,
  showDegrees = true,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{
    text: string
    subtext?: string
    x: number
    y: number
  } | null>(null)

  // Group planets by house (1 to 12)
  const houseOccupants: Record<number, (PlanetPosition | VargaGrahaPlacement)[]> = {}
  for (let h = 1; h <= 12; h++) {
    houseOccupants[h] = []
  }

  for (const p of planets) {
    let hNum = p.houseNumber
    if (!hNum) {
      const pSign = 'signIndex' in p ? p.signIndex : 0
      hNum = ((pSign - lagnaSignIndex + 12) % 12) + 1
    }
    if (houseOccupants[hNum]) {
      houseOccupants[hNum].push(p)
    }
  }

  // Calculate layout offsets for planets inside a house
  const getPlanetOffsets = (count: number) => {
    if (count <= 1) return [{ dx: 0, dy: 0 }]
    if (count === 2) return [{ dx: 0, dy: -12 }, { dx: 0, dy: 12 }]
    if (count === 3) return [{ dx: 0, dy: -24 }, { dx: 0, dy: 0 }, { dx: 0, dy: 24 }]
    if (count === 4) {
      return [
        { dx: -22, dy: -13 }, { dx: 22, dy: -13 },
        { dx: -22, dy: 13 }, { dx: 22, dy: 13 },
      ]
    }
    // 5 or more planets
    return [
      { dx: -22, dy: -25 }, { dx: 22, dy: -25 },
      { dx: -22, dy: 0 }, { dx: 22, dy: 0 },
      { dx: 0, dy: 25 },
    ]
  }

  return (
    <div className="kundli-svg-container" style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <svg
        viewBox="0 0 500 500"
        className="kundli-svg north-indian-svg"
        style={{ width: '100%', height: 'auto', display: 'block', background: '#090d16', borderRadius: 8 }}
      >
        <defs>
          <radialGradient id="houseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(217, 119, 6, 0.22)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.05)" />
          </radialGradient>
          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. House Polygons (Clickable & Hoverable) */}
        {HOUSE_DEFS.map((hd) => {
          const isHouseSelected = selectedHouse === hd.number
          const isHouseHovered = hoveredHouse === hd.number
          const signNum = ((lagnaSignIndex + (hd.number - 1)) % 12) + 1

          return (
            <g key={hd.number}>
              <polygon
                points={hd.polygon}
                fill={
                  isHouseSelected
                    ? 'rgba(217, 119, 6, 0.25)'
                    : isHouseHovered
                    ? 'url(#houseGlow)'
                    : hd.number % 2 === 0
                    ? 'rgba(15, 23, 42, 0.65)'
                    : 'rgba(15, 23, 42, 0.45)'
                }
                stroke={isHouseSelected ? '#f59e0b' : isHouseHovered ? 'rgba(245, 158, 11, 0.6)' : 'rgba(71, 85, 105, 0.45)'}
                strokeWidth={isHouseSelected ? 2 : 1}
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease, stroke 0.15s ease' }}
                onClick={() => onSelectHouse?.(hd.number)}
                onMouseEnter={() => {
                  setHoveredHouse(hd.number)
                  setTooltip({
                    text: `House ${hd.number} (${hd.number === 1 ? 'Lagna' : 'Bhava'})`,
                    subtext: `Sign ${signNum}`,
                    x: hd.planetAnchor.x,
                    y: hd.planetAnchor.y,
                  })
                }}
                onMouseLeave={() => {
                  setHoveredHouse(null)
                  setTooltip(null)
                }}
              />

              {/* Sign Number Numeral */}
              <text
                x={hd.signPos.x}
                y={hd.signPos.y}
                fill={hd.number === 1 ? '#38bdf8' : '#e5c07b'}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'JetBrains Mono', 'Segoe UI', monospace"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {signNum}
              </text>
            </g>
          )
        })}

        {/* 2. Geometric Grid Lines */}
        <g stroke="rgba(148, 163, 184, 0.55)" strokeWidth="1.2" strokeLinecap="round" style={{ pointerEvents: 'none' }}>
          {/* Outer Border */}
          <rect x="0" y="0" width="500" height="500" fill="none" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="2" />
          {/* Main Diagonals */}
          <line x1="0" y1="0" x2="500" y2="500" />
          <line x1="500" y1="0" x2="0" y2="500" />
          {/* Center Diamond */}
          <line x1="250" y1="0" x2="0" y2="250" />
          <line x1="0" y1="250" x2="250" y2="500" />
          <line x1="250" y1="500" x2="500" y2="250" />
          <line x1="500" y1="250" x2="250" y2="0" />
        </g>

        {/* 3. Planets Placed Inside Each House */}
        {HOUSE_DEFS.map((hd) => {
          const occupants = houseOccupants[hd.number] || []
          const offsets = getPlanetOffsets(occupants.length)

          return (
            <g key={`occupants-${hd.number}`}>
              {occupants.map((p, pIdx) => {
                const off = offsets[pIdx] || { dx: 0, dy: 0 }
                const posX = hd.planetAnchor.x + off.dx
                const posY = hd.planetAnchor.y + off.dy
                const isSelected = selectedPlanet === p.name
                const pDeg = 'dms' in p ? p.dms : undefined
                const pDignity = 'dignity' in p ? p.dignity : undefined

                return (
                  <g
                    key={p.name}
                    transform={`translate(${posX}, ${posY})`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPlanet?.(p.name)
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      setTooltip({
                        text: `${p.name} in House ${hd.number}`,
                        subtext: pDeg ? `${pDeg} • ${'nakshatra' in p ? (p as any).nakshatra : ''}` : undefined,
                        x: posX,
                        y: posY - 25,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <PlanetBadge
                      name={p.name}
                      short={p.short}
                      dms={pDeg}
                      retrograde={p.retrograde}
                      combust={'combust' in p ? (p as any).combust : false}
                      dignity={pDignity}
                      isSelected={isSelected}
                      showDegrees={showDegrees}
                    />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Lagna Identifier Marker in House 1 */}
        <g transform="translate(250, 22)" style={{ pointerEvents: 'none' }}>
          <rect x="-24" y="-8" width="48" height="15" rx="3" fill="rgba(14, 116, 144, 0.4)" stroke="rgba(56, 189, 248, 0.7)" strokeWidth="0.8" />
          <text x="0" y="3" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
            LAGNA
          </text>
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / 500) * 100}%`,
            top: `${(tooltip.y / 500) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #d97706',
            borderRadius: 6,
            padding: '4px 9px',
            color: '#f8fafc',
            fontSize: '0.78rem',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.text}</div>
          {tooltip.subtext && <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{tooltip.subtext}</div>}
        </div>
      )}
    </div>
  )
}
