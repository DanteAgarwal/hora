import React from 'react'
import type { DignityType } from '../../types/astro'

interface PlanetBadgeProps {
  name: string
  short: string
  dms?: string
  retrograde?: boolean
  combust?: boolean
  dignity?: DignityType
  isSelected?: boolean
  showDegrees?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
}

export const PlanetBadge: React.FC<PlanetBadgeProps> = ({
  name,
  short,
  dms,
  retrograde,
  combust,
  dignity,
  isSelected,
  showDegrees = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Color according to dignity / role
  let badgeColor = '#e2e8f0' // Slate 200
  let badgeBg = 'rgba(30, 41, 59, 0.85)' // Slate 800
  let borderStroke = 'rgba(148, 163, 184, 0.35)'

  if (name === 'Asc' || name === 'Lagna' || name === 'Ascendant') {
    badgeColor = '#38bdf8' // Cyan
    borderStroke = 'rgba(56, 189, 248, 0.6)'
    badgeBg = 'rgba(14, 116, 144, 0.4)'
  } else if (dignity === 'Exalted') {
    badgeColor = '#fbbf24' // Gold
    borderStroke = 'rgba(251, 191, 36, 0.7)'
    badgeBg = 'rgba(120, 53, 15, 0.5)'
  } else if (dignity === 'Own Sign' || dignity === 'Moolatrikona') {
    badgeColor = '#34d399' // Emerald
    borderStroke = 'rgba(52, 211, 153, 0.6)'
    badgeBg = 'rgba(6, 78, 59, 0.4)'
  } else if (dignity === 'Debilitated') {
    badgeColor = '#f87171' // Red
    borderStroke = 'rgba(248, 113, 113, 0.6)'
    badgeBg = 'rgba(127, 29, 29, 0.4)'
  }

  if (isSelected) {
    borderStroke = '#e5c07b'
    badgeBg = 'rgba(217, 119, 6, 0.5)'
  }

  return (
    <g
      className={`planet-badge ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={-28}
        y={-10}
        width={showDegrees && dms ? 56 : 38}
        height={18}
        rx={4}
        fill={badgeBg}
        stroke={borderStroke}
        strokeWidth={isSelected ? 1.5 : 1}
      />
      <text
        x={showDegrees && dms ? -23 : -14}
        y={3}
        fill={badgeColor}
        fontSize="11"
        fontWeight="600"
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
      >
        {short}
      </text>

      {/* Retrograde indicator */}
      {retrograde && (
        <text
          x={showDegrees && dms ? -8 : 2}
          y={2}
          fill="#f59e0b"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="monospace"
        >
          R
        </text>
      )}

      {/* Combust indicator */}
      {combust && (
        <text
          x={showDegrees && dms ? -1 : 9}
          y={0}
          fill="#ef4444"
          fontSize="9"
          fontWeight="bold"
        >
          *
        </text>
      )}

      {/* Degrees in sign */}
      {showDegrees && dms && (
        <text
          x={5}
          y={3}
          fill="#94a3b8"
          fontSize="8.5"
          fontFamily="'JetBrains Mono', monospace"
        >
          {dms.split("'")[0]}°
        </text>
      )}
    </g>
  )
}
