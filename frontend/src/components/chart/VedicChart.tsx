import React, { useState } from 'react'
import { NorthIndianChart } from './NorthIndianChart'
import { SouthIndianChart } from './SouthIndianChart'
import type { AstroChart, ChartStyle, PlanetPosition, VargaGrahaPlacement } from '../../types/astro'

interface VedicChartProps {
  chart: AstroChart
  selectedPlanet?: string
  selectedHouse?: number
  defaultStyle?: ChartStyle
  forcedVarga?: string
  hideVargaSelector?: boolean
  title?: string
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const VedicChart: React.FC<VedicChartProps> = ({
  chart,
  selectedPlanet,
  selectedHouse,
  defaultStyle = 'north',
  forcedVarga,
  hideVargaSelector = false,
  title,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [style, setStyle] = useState<ChartStyle>(defaultStyle)
  const [activeVarga, setActiveVarga] = useState<string>(forcedVarga || 'D1')
  const [showDegrees, setShowDegrees] = useState<boolean>(true)

  const effectiveVarga = forcedVarga || activeVarga

  // Determine current chart data according to active Varga
  const vargaData = chart.vargas[effectiveVarga] || chart.vargas['D1']
  const lagnaSignIndex = vargaData ? vargaData.lagnaSignIndex : chart.planets[0]?.signIndex || 0
  const planets: (PlanetPosition | VargaGrahaPlacement)[] = effectiveVarga === 'D1' ? chart.planets : vargaData?.grahas || chart.planets

  const availableVargas = Object.keys(chart.vargas).length > 0 ? Object.keys(chart.vargas) : ['D1', 'D9']

  return (
    <div className="vedic-chart-wrapper panel" style={{ padding: 16 }}>
      {/* Chart Control Toolbar */}
      <div className="chart-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        {/* Left: Active Varga selector pills or Title */}
        {hideVargaSelector ? (
          <div className="chart-custom-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f1f5f9' }}>{title || `${vargaData?.name || 'Chart'} (${effectiveVarga})`}</h4>
            <span className="varga-tag" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', borderRadius: 4, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              D{vargaData?.divisions || 1}
            </span>
          </div>
        ) : (
          <div className="varga-quick-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['D1', 'D9', 'D10'].map((code) => {
              const hasVarga = Boolean(chart.vargas[code])
              const isActive = effectiveVarga === code
              return (
                <button
                  key={code}
                  type="button"
                  className={`chip-button ${isActive ? 'selected' : ''}`}
                  onClick={() => setActiveVarga(code)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    opacity: hasVarga || code === 'D1' ? 1 : 0.6,
                  }}
                >
                  {code} {code === 'D1' ? 'Rashi' : code === 'D9' ? 'Navamsha' : 'Dashamsha'}
                </button>
              )
            })}

            {availableVargas.length > 3 && (
              <select
                value={effectiveVarga}
                onChange={(e) => setActiveVarga(e.target.value)}
                className="chart-quick-switcher"
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: 28 }}
              >
                {availableVargas.map((code) => (
                  <option key={code} value={code}>
                    {code} ({chart.vargas[code]?.name || code})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Right: Chart Style & Degrees Controls */}
        <div className="chart-view-options" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="chip-button"
            onClick={() => setShowDegrees(!showDegrees)}
            title="Toggle planet degrees in chart"
            style={{
              padding: '4px 8px',
              fontSize: '0.74rem',
              background: showDegrees ? 'rgba(217, 119, 6, 0.2)' : undefined,
              borderColor: showDegrees ? '#d97706' : undefined,
            }}
          >
            {showDegrees ? '✓ Degrees' : 'Degrees'}
          </button>

          <div className="segmented-control" style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', borderRadius: 6, padding: 2, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
            <button
              type="button"
              className={`segment-btn ${style === 'north' ? 'active' : ''}`}
              onClick={() => setStyle('north')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: style === 'north' ? '#d97706' : 'transparent',
                color: style === 'north' ? '#fff' : '#94a3b8',
                fontWeight: style === 'north' ? 600 : 400,
              }}
            >
              North (Diamond)
            </button>
            <button
              type="button"
              className={`segment-btn ${style === 'south' ? 'active' : ''}`}
              onClick={() => setStyle('south')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: style === 'south' ? '#d97706' : 'transparent',
                color: style === 'south' ? '#fff' : '#94a3b8',
                fontWeight: style === 'south' ? 600 : 400,
              }}
            >
              South (Square)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div className="chart-stage" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {style === 'north' ? (
          <NorthIndianChart
            lagnaSignIndex={lagnaSignIndex}
            planets={planets}
            selectedPlanet={selectedPlanet}
            selectedHouse={selectedHouse}
            showDegrees={showDegrees}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        ) : (
          <SouthIndianChart
            lagnaSignIndex={lagnaSignIndex}
            planets={planets}
            selectedPlanet={selectedPlanet}
            selectedHouse={selectedHouse}
            showDegrees={showDegrees}
            chartTitle={`${vargaData?.name || 'Rashi'} (${activeVarga})`}
            ayanamsaText={chart.metadata.ayanamsaDms}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        )}
      </div>

      {/* Sub-chart Caption */}
      <div className="chart-caption" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#94a3b8', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: 8 }}>
        <span>
          Showing <strong>{vargaData?.name || 'Rashi'} ({activeVarga})</strong> • Lagna in <strong>{vargaData?.lagnaSignName || 'Leo'}</strong>
        </span>
        <span style={{ color: '#e5c07b' }}>
          💡 Click any planet or house to inspect
        </span>
      </div>
    </div>
  )
}
