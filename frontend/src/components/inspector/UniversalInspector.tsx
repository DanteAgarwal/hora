import React from 'react'
import { PlanetInspector } from './PlanetInspector'
import { HouseInspector } from './HouseInspector'
import { DashaInspector } from './DashaInspector'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import type { DashaChainItem } from '../timing/dashaUtils'
import { useKundliStore } from '../../context/KundliContext'

export interface UniversalInspectorProps {
  chart?: AstroChart
  selectedPlanetName?: string
  selectedHouseNumber?: number
  selectedDashaPeriod?: DashaPeriod | null
  dashaHierarchyChain?: DashaChainItem[]
  activeTab?: 'planet' | 'house' | 'dasha'
  onChangeTab?: (tab: 'planet' | 'house' | 'dasha') => void
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onSelectPeriod?: (period: DashaPeriod) => void
  onOpenHelp?: (termId: string) => void
  isDrawerOpen?: boolean
  onCloseDrawer?: () => void
}

export const UniversalInspector: React.FC<UniversalInspectorProps> = (props) => {
  const store = useKundliStore()
  const chart = props.chart || store.chart
  if (!chart) return null

  const selectedPlanetName = props.selectedPlanetName ?? store.selectedPlanet
  const selectedHouseNumber = props.selectedHouseNumber ?? store.selectedHouse
  const selectedDashaPeriod = props.selectedDashaPeriod !== undefined ? props.selectedDashaPeriod : store.selectedDashaPeriod
  const dashaHierarchyChain = props.dashaHierarchyChain ?? store.dashaHierarchyChain
  const activeTab = props.activeTab ?? store.inspectorTab
  const onChangeTab = props.onChangeTab ?? store.setInspectorTab
  const onSelectPlanet = props.onSelectPlanet ?? store.selectPlanet
  const onSelectHouse = props.onSelectHouse ?? store.selectHouse
  const onSelectPeriod = props.onSelectPeriod ?? store.selectDashaPeriod
  const onOpenHelp = props.onOpenHelp ?? store.setHelpTermId
  const isDrawerOpen = props.isDrawerOpen ?? store.isInspectorOpen
  const onCloseDrawer = props.onCloseDrawer ?? (() => store.setIsInspectorOpen(false))

  const planet = chart.planets.find((p) => p.name === selectedPlanetName) || chart.planets[0]
  const house = chart.houses.find((h) => h.number === selectedHouseNumber) || chart.houses[0]
  const dashaLord = selectedDashaPeriod?.lord || chart.quickFacts?.currentMahadasha || 'Dasha'

  const renderInspectorContent = () => (
    <>
      {/* Top Inspector Header with Tabs */}
      <div className="inspector-header" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Object Inspector</p>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Context-Sensitive</span>
        </div>

        <div className="inspector-tabs" style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`inspector-tab-btn ${activeTab === 'planet' ? 'active' : ''}`}
            onClick={() => onChangeTab('planet')}
          >
            🪐 Planet ({planet ? planet.name : '—'})
          </button>
          <button
            type="button"
            className={`inspector-tab-btn ${activeTab === 'house' ? 'active' : ''}`}
            onClick={() => onChangeTab('house')}
          >
            🏛️ House {selectedHouseNumber}
          </button>
          <button
            type="button"
            className={`inspector-tab-btn ${activeTab === 'dasha' ? 'active' : ''}`}
            onClick={() => onChangeTab('dasha')}
          >
            ⏳ Dasha ({dashaLord})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'planet' && (
        <PlanetInspector
          planet={planet}
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
          onOpenHelp={onOpenHelp}
        />
      )}

      {activeTab === 'house' && (
        <HouseInspector
          house={house}
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {activeTab === 'dasha' && (
        <DashaInspector
          selectedPeriod={selectedDashaPeriod}
          hierarchyChain={dashaHierarchyChain}
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
          onSelectPeriod={onSelectPeriod}
          onOpenHelp={onOpenHelp}
        />
      )}
    </>
  )

  return (
    <>
      {/* Desktop Persistent Inspector (>= 1280px) */}
      <aside className="universal-inspector desktop-inspector panel" aria-label="Universal Object Inspector">
        {renderInspectorContent()}
      </aside>

      {/* Tablet & Mobile Slide-in Drawer / Bottom Sheet (< 1280px) */}
      {isDrawerOpen && (
        <>
          <div
            className="inspector-drawer-backdrop open"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />
          <div
            className="inspector-drawer-content open"
            role="dialog"
            aria-label="Object Inspector Drawer"
            aria-modal="true"
          >
            <div className="drawer-drag-handle" />
            <div className="drawer-header-row">
              <div className="drawer-title-group">
                <span className="drawer-title-badge">{activeTab.toUpperCase()}</span>
                <h3>
                  {activeTab === 'planet'
                    ? `${planet?.name || 'Planet'} Details`
                    : activeTab === 'house'
                    ? `Bhava ${selectedHouseNumber} Analysis`
                    : `${dashaLord} Dasha Period`}
                </h3>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={onCloseDrawer}
                title="Close Inspector"
                aria-label="Close Inspector"
              >
                ✕
              </button>
            </div>
            <div className="drawer-body">
              {renderInspectorContent()}
            </div>
          </div>
        </>
      )}
    </>
  )
}
