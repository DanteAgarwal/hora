import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'
import { RawDataInspector } from './RawDataInspector'
import { CalculationProvenance } from './CalculationProvenance'
import { ConfigurationPanel, type CalculationSettingsConfig } from './ConfigurationPanel'

interface ResearchWorkspaceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onApplySettings?: (newSettings: CalculationSettingsConfig) => Promise<void> | void
  isRecalculating?: boolean
}

type ResearchTab = 'raw' | 'provenance' | 'config'

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
  onApplySettings,
  isRecalculating = false,
}) => {
  const [activeTab, setActiveTab] = useState<ResearchTab>('raw')

  return (
    <div className="research-workspace-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Workspace Sub-Navigation Bar */}
      <div
        className="panel"
        style={{
          padding: '12px 18px',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(212, 171, 92, 0.2))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.1rem',
            }}
          >
            🔬
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
              Research & Calculation Transparency Suite
            </h2>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Full technical auditability • Astronomical ephemeris coordinates • Mathematical provenance • Engine knobs
            </span>
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 4,
          }}
        >
          {[
            { id: 'raw', label: '🛰️ Raw Data Inspector', prd: '§21' },
            { id: 'provenance', label: '📐 Calculation Provenance', prd: '§19' },
            { id: 'config', label: '⚙️ Engine Configuration', prd: '§20' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ResearchTab)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: 'none',
                  background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: isActive ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#f8fafc' : '#64748b',
                  }}
                >
                  {tab.prd}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab 1: Raw Data Inspector (PRD §21) */}
      {activeTab === 'raw' && (
        <RawDataInspector
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Tab 2: Calculation Provenance (PRD §19) */}
      {activeTab === 'provenance' && (
        <CalculationProvenance
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Tab 3: Configuration Panel (PRD §20) */}
      {activeTab === 'config' && (
        <ConfigurationPanel
          chart={chart}
          onApplySettings={onApplySettings}
          isRecalculating={isRecalculating}
        />
      )}
    </div>
  )
}
