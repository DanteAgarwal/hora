import React, { useState } from 'react'
import type { LiveGocharaResult } from '../../types/astro'

interface DualWheelChartProps {
  data: LiveGocharaResult
  selectedPlanet?: string
  onSelectPlanet?: (planetName: string) => void
}

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', short: 'Ar', sanskrit: 'Mesha' },
  { name: 'Taurus', symbol: '♉', short: 'Ta', sanskrit: 'Vrishabha' },
  { name: 'Gemini', symbol: '♊', short: 'Ge', sanskrit: 'Mithuna' },
  { name: 'Cancer', symbol: '♋', short: 'Cn', sanskrit: 'Karkata' },
  { name: 'Leo', symbol: '♌', short: 'Le', sanskrit: 'Simha' },
  { name: 'Virgo', symbol: '♍', short: 'Vi', sanskrit: 'Kanya' },
  { name: 'Libra', symbol: '♎', short: 'Li', sanskrit: 'Tula' },
  { name: 'Scorpio', symbol: '♏', short: 'Sc', sanskrit: 'Vrischika' },
  { name: 'Sagittarius', symbol: '♐', short: 'Sg', sanskrit: 'Dhanus' },
  { name: 'Capricorn', symbol: '♑', short: 'Cp', sanskrit: 'Makara' },
  { name: 'Aquarius', symbol: '♒', short: 'Aq', sanskrit: 'Kumbha' },
  { name: 'Pisces', symbol: '♓', short: 'Pi', sanskrit: 'Meena' },
]

const PLANET_SYMBOLS: Record<string, string> = {
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

export const DualWheelChart: React.FC<DualWheelChartProps> = ({
  data,
  selectedPlanet,
  onSelectPlanet,
}) => {
  const [chartMode, setChartMode] = useState<'wheel' | 'north' | 'south'>('wheel')
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null)

  const natalLagnaSign = data.natalReference.natalLagna.signIndex
  const natalMoonSign = data.natalReference.natalMoon.signIndex

  // Helper for polar to cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  // Draw circular arc path
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
  }

  return (
    <div className="panel" style={{ padding: 24, borderRadius: 16 }}>
      {/* Visualizer Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>🪐</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f6db9d' }}>
              Real-Time Planetary Transit Visualizer
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>
            Inner Core: Natal Rasi (D1) • Outer Ring: Live Current Transits (Gochara)
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            className={chartMode === 'wheel' ? 'chip-button active' : 'chip-button'}
            onClick={() => setChartMode('wheel')}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            Dual Wheel (Circular)
          </button>
          <button
            type="button"
            className={chartMode === 'north' ? 'chip-button active' : 'chip-button'}
            onClick={() => setChartMode('north')}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            North Indian Overlay
          </button>
          <button
            type="button"
            className={chartMode === 'south' ? 'chip-button active' : 'chip-button'}
            onClick={() => setChartMode('south')}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            South Indian Overlay
          </button>
        </div>
      </div>

      {/* Render Chart Mode */}
      {chartMode === 'wheel' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
          <svg viewBox="0 0 640 640" style={{ width: '100%', maxWidth: 580, height: 'auto', userSelect: 'none' }}>
            <defs>
              {/* Radial gradient background */}
              <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0c1017" />
                <stop offset="70%" stopColor="#141a24" />
                <stop offset="100%" stopColor="#1e2736" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base Background Circles */}
            <circle cx="320" cy="320" r="310" fill="url(#wheelBg)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            <circle cx="320" cy="320" r="230" fill="none" stroke="rgba(212, 167, 90, 0.35)" strokeWidth="1.5" />
            <circle cx="320" cy="320" r="140" fill="rgba(10, 14, 20, 0.7)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <circle cx="320" cy="320" r="60" fill="#0b0f17" stroke="rgba(212, 167, 90, 0.6)" strokeWidth="2" />

            {/* Center Hub Telemetry */}
            <text x="320" y="315" textAnchor="middle" fill="#f6db9d" fontSize="13" fontWeight="bold">
              GOCHARA
            </text>
            <text x="320" y="332" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Live Transits
            </text>

            {/* 12 Zodiac Segments (Middle Ring) */}
            {ZODIAC_SIGNS.map((sign, idx) => {
              // Sign starts from natal Lagna or Aries? Standard zodiac wheel: 0 is top
              const startAngle = idx * 30
              const endAngle = (idx + 1) * 30
              const midAngle = startAngle + 15
              const labelPos = polarToCartesian(320, 320, 185, midAngle)
              const houseNumber = ((idx - natalLagnaSign + 12) % 12) + 1
              const houseDef = data.dualWheelHouses.find((h) => h.signIndex === idx)
              const isMoonSign = idx === natalMoonSign
              const isLagnaSign = idx === natalLagnaSign

              // Segment divider line
              const lineStart = polarToCartesian(320, 320, 140, startAngle)
              const lineEnd = polarToCartesian(320, 320, 310, startAngle)

              return (
                <g key={sign.name}>
                  {/* Radial Divider */}
                  <line
                    x1={lineStart.x}
                    y1={lineStart.y}
                    x2={lineEnd.x}
                    y2={lineEnd.y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />

                  {/* Segment Arc Background for special highlights */}
                  {isMoonSign && (
                    <path
                      d={`${describeArc(320, 320, 230, startAngle, endAngle)} L ${polarToCartesian(320, 320, 140, startAngle).x} ${polarToCartesian(320, 320, 140, startAngle).y} A 140 140 0 0 1 ${polarToCartesian(320, 320, 140, endAngle).x} ${polarToCartesian(320, 320, 140, endAngle).y} Z`}
                      fill="rgba(56, 189, 248, 0.08)"
                    />
                  )}
                  {isLagnaSign && (
                    <path
                      d={`${describeArc(320, 320, 230, startAngle, endAngle)} L ${polarToCartesian(320, 320, 140, startAngle).x} ${polarToCartesian(320, 320, 140, startAngle).y} A 140 140 0 0 1 ${polarToCartesian(320, 320, 140, endAngle).x} ${polarToCartesian(320, 320, 140, endAngle).y} Z`}
                      fill="rgba(212, 167, 90, 0.1)"
                    />
                  )}

                  {/* Zodiac Sign Symbol & Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y - 6}
                    textAnchor="middle"
                    fill={isLagnaSign ? '#f6db9d' : isMoonSign ? '#38bdf8' : '#cbd5e1'}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {sign.symbol} {sign.short}
                  </text>
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 8}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="9"
                  >
                    H{houseNumber} • {houseDef?.savRekhas || 28}p
                  </text>

                  {/* Natal Planets inside this sign (Inner Orbit) */}
                  {houseDef && houseDef.natalPlanets.length > 0 && (
                    <g>
                      {houseDef.natalPlanets.map((np, npIdx) => {
                        const count = houseDef.natalPlanets.length
                        const offsetAngle = midAngle + (npIdx - (count - 1) / 2) * 8
                        const pPos = polarToCartesian(320, 320, 98, offsetAngle)
                        return (
                          <g key={np.name}>
                            <circle cx={pPos.x} cy={pPos.y} r="10" fill="#1e293b" stroke="#f6db9d" strokeWidth="1" />
                            <text
                              x={pPos.x}
                              y={pPos.y + 3.5}
                              textAnchor="middle"
                              fill="#f6db9d"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {np.name.slice(0, 2)}
                            </text>
                          </g>
                        )
                      })}
                    </g>
                  )}
                </g>
              )
            })}

            {/* Live Transiting Planets (Outer Ring 230 to 310) */}
            {data.transitingPlanets.map((tp) => {
              // Exact angle based on sidereal longitude
              const angle = tp.longitude
              const pPos = polarToCartesian(320, 320, 270, angle)
              const isSelected = selectedPlanet === tp.name
              const isGood = tp.ashtakavarga.finalVerdict === 'good' || tp.ashtakavarga.finalVerdict === 'favorable'
              const isBad = tp.ashtakavarga.finalVerdict === 'bad' || tp.ashtakavarga.finalVerdict === 'unfavorable'
              const strokeColor = isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b'
              const symbol = PLANET_SYMBOLS[tp.name] || '✦'

              return (
                <g
                  key={tp.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectPlanet?.(tp.name)}
                >
                  {/* Ray connecting planet position to zodiac ring */}
                  <line
                    x1={polarToCartesian(320, 320, 230, angle).x}
                    y1={polarToCartesian(320, 320, 230, angle).y}
                    x2={pPos.x}
                    y2={pPos.y}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    opacity="0.8"
                  />

                  {/* Planet Orbit Node */}
                  <circle
                    cx={pPos.x}
                    cy={pPos.y}
                    r={isSelected ? 16 : 14}
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />

                  {/* Planet Symbol */}
                  <text
                    x={pPos.x}
                    y={pPos.y + 4}
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize={isSelected ? '12' : '11'}
                    fontWeight="bold"
                  >
                    {symbol}
                  </text>

                  {/* Planet Name & Degree Pill */}
                  <text
                    x={pPos.x}
                    y={pPos.y + 19}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {tp.name.slice(0, 2)} {Math.floor(tp.degreesInSign)}°{tp.retrograde ? '℞' : ''}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* North Indian Diamond Overlay */}
      {chartMode === 'north' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {data.dualWheelHouses.map((house) => {
            const isHovered = hoveredHouse === house.houseNumber
            const hasTransit = house.transitPlanets.length > 0
            const hasNatal = house.natalPlanets.length > 0

            return (
              <div
                key={house.houseNumber}
                onMouseEnter={() => setHoveredHouse(house.houseNumber)}
                onMouseLeave={() => setHoveredHouse(null)}
                style={{
                  background: isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${isHovered ? '#d2a75a' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  padding: 14,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* House Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: '#f6db9d', fontSize: '0.95rem' }}>
                      House {house.houseNumber}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      ({house.signName})
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: house.savRekhas >= 30 ? '#34d399' : house.savRekhas <= 25 ? '#f87171' : '#e2e8f0',
                    }}
                  >
                    SAV: {house.savRekhas}
                  </span>
                </div>

                {/* Natal Occupants */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    Natal Grahas:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {hasNatal ? (
                      house.natalPlanets.map((np) => (
                        <span
                          key={np.name}
                          style={{
                            background: 'rgba(212, 167, 90, 0.15)',
                            color: '#f6db9d',
                            border: '1px solid rgba(212, 167, 90, 0.35)',
                            padding: '2px 7px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {np.name} {np.dms}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>None</span>
                    )}
                  </div>
                </div>

                {/* Live Transiting Occupants */}
                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 600 }}>
                    Live Transiting Grahas:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {hasTransit ? (
                      house.transitPlanets.map((tp) => {
                        const isGood = tp.verdict === 'good' || tp.verdict === 'favorable'
                        const isBad = tp.verdict === 'bad' || tp.verdict === 'unfavorable'
                        const color = isGood ? '#34d399' : isBad ? '#f87171' : '#fbbf24'
                        const bg = isGood ? 'rgba(16, 185, 129, 0.16)' : isBad ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.16)'

                        return (
                          <span
                            key={tp.name}
                            style={{
                              background: bg,
                              color,
                              border: `1px solid ${color}44`,
                              padding: '2px 7px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            Tr: {tp.name} {tp.dms} {tp.retrograde ? '[Rx]' : ''}
                          </span>
                        )
                      })
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>None</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* South Indian Grid Overlay */}
      {chartMode === 'south' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {ZODIAC_SIGNS.map((sign, idx) => {
            const houseDef = data.dualWheelHouses.find((h) => h.signIndex === idx)
            const isMoonSign = idx === natalMoonSign
            const isLagnaSign = idx === natalLagnaSign

            return (
              <div
                key={sign.name}
                style={{
                  minHeight: 110,
                  background: isLagnaSign ? 'rgba(212, 167, 90, 0.1)' : isMoonSign ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${isLagnaSign ? '#d2a75a' : isMoonSign ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: isLagnaSign ? '#f6db9d' : isMoonSign ? '#38bdf8' : '#e2e8f0', fontSize: '0.85rem' }}>
                    {sign.symbol} {sign.short}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {houseDef ? `H${houseDef.houseNumber}` : ''}
                  </span>
                </div>

                {/* Natal */}
                <div style={{ fontSize: '0.72rem', color: '#f6db9d', margin: '4px 0' }}>
                  {houseDef && houseDef.natalPlanets.length > 0 && (
                    <span>Nat: {houseDef.natalPlanets.map((p) => p.name.slice(0, 2)).join(', ')}</span>
                  )}
                </div>

                {/* Transits */}
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                  {houseDef && houseDef.transitPlanets.length > 0 ? (
                    <span>Tr: {houseDef.transitPlanets.map((p) => `${p.name.slice(0, 2)}${p.retrograde ? '℞' : ''}`).join(', ')}</span>
                  ) : (
                    <span style={{ color: '#475569', fontSize: '0.68rem' }}>No transits</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
