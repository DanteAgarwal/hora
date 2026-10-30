import React from 'react'
import { PlanetInspector } from './PlanetInspector'
import { HouseInspector } from './HouseInspector'
import { DashaInspector } from './DashaInspector'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import type { DashaChainItem } from '../timing/dashaUtils'

interface UniversalInspectorProps {
  chart: AstroChart
  selectedPlanetName?: string
  selectedHouseNumber?: number
  selectedDashaPeriod?: DashaPeriod | null
  dashaHierarchyChain?: DashaChainItem[]
  activeTab: 'planet' | 'house' | 'dasha'
  onChangeTab: (tab: 'planet' | 'house' | 'dasha') => void
  onSelectPlanet: (planetName: string) => void
  onSelectHouse: (houseNumber: number) => void
  onSelectPeriod?: (period: DashaPeriod) => void
  onOpenHelp?: (termId: string) => void
}

export const UniversalInspector: React.FC<UniversalInspectorProps> = ({
  chart,
  selectedPlanetName,
  selectedHouseNumber = 1,
  selectedDashaPeriod,
  dashaHierarchyChain = [],
  activeTab,
  onChangeTab,
  onSelectPlanet,
  onSelectHouse,
  onSelectPeriod,
  onOpenHelp,
}) => {
  const planet = chart.planets.find((p) => p.name === selectedPlanetName) || chart.planets[0]
  const house = chart.houses.find((h) => h.number === selectedHouseNumber) || chart.houses[0]
  const dashaLord = selectedDashaPeriod?.lord || chart.quickFacts?.currentMahadasha || 'Dasha'

  return (
    <aside className="inspector panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Inspector Header with Tabs */}
      <div className="inspector-header" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Object Inspector</p>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Context-Sensitive</span>
        </div>

        {/* 3-Tab Switcher: Planet | House | Dasha */}
        <div
          className="segmented-control"
          style={{
            display: 'flex',
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: 6,
            padding: 2,
            border: '1px solid rgba(148, 163, 184, 0.25)',
          }}
        >
          <button
            type="button"
            className={`segment-btn ${activeTab === 'planet' ? 'active' : ''}`}
            onClick={() => onChangeTab('planet')}
            style={{
              flex: 1,
              padding: '5px 4px',
              fontSize: '0.74rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: activeTab === 'planet' ? '#d97706' : 'transparent',
              color: activeTab === 'planet' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'planet' ? 700 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Planet ({planet?.short || 'Graha'})
          </button>
          <button
            type="button"
            className={`segment-btn ${activeTab === 'house' ? 'active' : ''}`}
            onClick={() => onChangeTab('house')}
            style={{
              flex: 1,
              padding: '5px 4px',
              fontSize: '0.74rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: activeTab === 'house' ? '#d97706' : 'transparent',
              color: activeTab === 'house' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'house' ? 700 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            House (H{house?.number || 1})
          </button>
          <button
            type="button"
            className={`segment-btn ${activeTab === 'dasha' ? 'active' : ''}`}
            onClick={() => onChangeTab('dasha')}
            style={{
              flex: 1,
              padding: '5px 4px',
              fontSize: '0.74rem',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: activeTab === 'dasha' ? '#d97706' : 'transparent',
              color: activeTab === 'dasha' ? '#fff' : '#94a3b8',
              fontWeight: activeTab === 'dasha' ? 700 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Dasha ({dashaLord.slice(0, 4)})
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="inspector-body" style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'planet' && planet && (
          <PlanetInspector
            planet={planet}
            chart={chart}
            onSelectHouse={(hNum) => {
              onSelectHouse(hNum)
              onChangeTab('house')
            }}
            onSelectPlanet={(pName) => {
              onSelectPlanet(pName)
              onChangeTab('planet')
            }}
            onOpenHelp={onOpenHelp}
          />
        )}

        {activeTab === 'house' && house && (
          <HouseInspector
            house={house}
            chart={chart}
            onSelectPlanet={(pName) => {
              onSelectPlanet(pName)
              onChangeTab('planet')
            }}
            onSelectHouse={(hNum) => {
              onSelectHouse(hNum)
              onChangeTab('house')
            }}
          />
        )}

        {activeTab === 'dasha' && (
          <DashaInspector
            chart={chart}
            selectedPeriod={selectedDashaPeriod || null}
            hierarchyChain={dashaHierarchyChain}
            onSelectPlanet={(pName) => {
              onSelectPlanet(pName)
              onChangeTab('planet')
            }}
            onSelectHouse={(hNum) => {
              onSelectHouse(hNum)
              onChangeTab('house')
            }}
            onSelectPeriod={onSelectPeriod}
            onOpenHelp={onOpenHelp}
          />
        )}
      </div>
    </aside>
  )
}
