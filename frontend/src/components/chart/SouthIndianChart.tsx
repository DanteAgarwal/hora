import React, { useState } from 'react'
import { PlanetBadge } from './PlanetBadge'
import type { PlanetPosition, VargaGrahaPlacement } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'

interface SouthIndianChartProps {
  lagnaSignIndex: number // 0 to 11
  planets: (PlanetPosition | VargaGrahaPlacement)[]
  selectedPlanet?: string
  selectedHouse?: number
  showDegrees?: boolean
  chartTitle?: string
  ayanamsaText?: string
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface SouthCell {
  signIndex: number // 0 = Aries, 1 = Taurus, ... 11 = Pisces
  row: number
  col: number
  x: number
  y: number
}

// 12 outer cells in clockwise order around hollow center
const SOUTH_CELLS: SouthCell[] = [
  { signIndex: 11, row: 0, col: 0, x: 0, y: 0 }, // Pisces
  { signIndex: 0, row: 0, col: 1, x: 125, y: 0 }, // Aries
  { signIndex: 1, row: 0, col: 2, x: 250, y: 0 }, // Taurus
  { signIndex: 2, row: 0, col: 3, x: 375, y: 0 }, // Gemini
  { signIndex: 3, row: 1, col: 3, x: 375, y: 125 }, // Cancer
  { signIndex: 4, row: 2, col: 3, x: 375, y: 250 }, // Leo
  { signIndex: 5, row: 3, col: 3, x: 375, y: 375 }, // Virgo
  { signIndex: 6, row: 3, col: 2, x: 250, y: 375 }, // Libra
  { signIndex: 7, row: 3, col: 1, x: 125, y: 375 }, // Scorpio
  { signIndex: 8, row: 3, col: 0, x: 0, y: 375 }, // Sagittarius
  { signIndex: 9, row: 2, col: 0, x: 0, y: 250 }, // Capricorn
  { signIndex: 10, row: 1, col: 0, x: 0, y: 125 }, // Aquarius
]

export const SouthIndianChart: React.FC<SouthIndianChartProps> = ({
  lagnaSignIndex,
  planets,
  selectedPlanet,
  selectedHouse,
  showDegrees = true,
  chartTitle = 'Rashi Chart',
  ayanamsaText,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [hoveredSign, setHoveredSign] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{
    text: string
    subtext?: string
    x: number
    y: number
  } | null>(null)

  // Group planets by sign index (0 to 11)
  const signOccupants: Record<number, (PlanetPosition | VargaGrahaPlacement)[]> = {}
  for (let s = 0; s < 12; s++) {
    signOccupants[s] = []
  }

  for (const p of planets) {
    const sIdx = 'signIndex' in p ? p.signIndex : 0
    if (signOccupants[sIdx]) {
      signOccupants[sIdx].push(p)
    }
  }

  // Calculate layout offsets for planets inside a 125x125 cell
  const getPlanetOffsets = (count: number) => {
    if (count <= 1) return [{ dx: 62.5, dy: 68 }]
    if (count === 2) return [{ dx: 62.5, dy: 54 }, { dx: 62.5, dy: 80 }]
    if (count === 3) return [{ dx: 62.5, dy: 44 }, { dx: 62.5, dy: 68 }, { dx: 62.5, dy: 92 }]
    if (count === 4) {
      return [
        { dx: 38, dy: 54 }, { dx: 87, dy: 54 },
        { dx: 38, dy: 82 }, { dx: 87, dy: 82 },
      ]
    }
    return [
      { dx: 38, dy: 44 }, { dx: 87, dy: 44 },
      { dx: 38, dy: 68 }, { dx: 87, dy: 68 },
      { dx: 62.5, dy: 94 },
    ]
  }

  return (
    <div className="kundli-svg-container" style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <svg
        viewBox="0 0 500 500"
        className="kundli-svg south-indian-svg"
        style={{ width: '100%', height: 'auto', display: 'block', background: '#090d16', borderRadius: 8 }}
      >
        <defs>
          <radialGradient id="southHouseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(217, 119, 6, 0.22)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0.05)" />
          </radialGradient>
        </defs>

        {/* 1. Center Area Details */}
        <g transform="translate(125, 125)">
          <rect
            x="0"
            y="0"
            width="250"
            height="250"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth="1.5"
          />
          <text
            x="125"
            y="75"
            fill="#e5c07b"
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="'Cinzel', Georgia, serif"
            letterSpacing="0.05em"
          >
            {chartTitle}
          </text>
          <text
            x="125"
            y="105"
            fill="#38bdf8"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
          >
            Lagna: {ZODIAC_SIGNS[lagnaSignIndex]?.name}
          </text>
          {ayanamsaText && (
            <text
              x="125"
              y="135"
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
            >
              Ayanamsha: {ayanamsaText}
            </text>
          )}
          <text
            x="125"
            y="170"
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
          >
            South Indian Style (Fixed Signs)
          </text>
        </g>

        {/* 2. Zodiac Sign Cells */}
        {SOUTH_CELLS.map((cell) => {
          const signInfo = ZODIAC_SIGNS[cell.signIndex]
          const isLagna = cell.signIndex === lagnaSignIndex
          const houseNum = ((cell.signIndex - lagnaSignIndex + 12) % 12) + 1
          const isSelected = selectedHouse === houseNum
          const isHovered = hoveredSign === cell.signIndex
          const occupants = signOccupants[cell.signIndex] || []
          const offsets = getPlanetOffsets(occupants.length)

          return (
            <g key={cell.signIndex}>
              {/* Cell Background Box */}
              <rect
                x={cell.x}
                y={cell.y}
                width={125}
                height={125}
                fill={
                  isSelected
                    ? 'rgba(217, 119, 6, 0.25)'
                    : isHovered
                    ? 'url(#southHouseGlow)'
                    : isLagna
                    ? 'rgba(14, 116, 144, 0.15)'
                    : 'rgba(15, 23, 42, 0.55)'
                }
                stroke={isSelected ? '#f59e0b' : isHovered ? 'rgba(245, 158, 11, 0.6)' : 'rgba(71, 85, 105, 0.45)'}
                strokeWidth={isSelected ? 2 : 1}
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease, stroke 0.15s ease' }}
                onClick={() => onSelectHouse?.(houseNum)}
                onMouseEnter={() => {
                  setHoveredSign(cell.signIndex)
                  setTooltip({
                    text: `${signInfo.name} (House ${houseNum})`,
                    subtext: isLagna ? 'Lagna / Ascendant Sign' : `Lord: ${signInfo.lord}`,
                    x: cell.x + 62.5,
                    y: cell.y + 40,
                  })
                }}
                onMouseLeave={() => {
                  setHoveredSign(null)
                  setTooltip(null)
                }}
              />

              {/* Classical Lagna Diagonal Slash for South Indian chart */}
              {isLagna && (
                <line
                  x1={cell.x}
                  y1={cell.y}
                  x2={cell.x + 125}
                  y2={cell.y + 125}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Top Row in Cell: Sign Name on Left, House Num on Right */}
              <text
                x={cell.x + 8}
                y={cell.y + 16}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
                fontFamily="'JetBrains Mono', monospace"
                style={{ pointerEvents: 'none' }}
              >
                {signInfo.name.slice(0, 3)}
              </text>

              <text
                x={cell.x + 117}
                y={cell.y + 16}
                fill={isLagna ? '#38bdf8' : '#e5c07b'}
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace"
                style={{ pointerEvents: 'none' }}
              >
                {isLagna ? 'H1 (Asc)' : `H${houseNum}`}
              </text>

              {/* Planets inside this sign */}
              {occupants.map((p, pIdx) => {
                const off = offsets[pIdx] || { dx: 62.5, dy: 68 }
                const posX = cell.x + off.dx
                const posY = cell.y + off.dy
                const isPlanetSelected = selectedPlanet === p.name
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
                        text: `${p.name} in ${signInfo.name} (House ${houseNum})`,
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
                      isSelected={isPlanetSelected}
                      showDegrees={showDegrees}
                    />
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Outer Border */}
        <rect
          x="0"
          y="0"
          width="500"
          height="500"
          fill="none"
          stroke="rgba(148, 163, 184, 0.7)"
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        />
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
