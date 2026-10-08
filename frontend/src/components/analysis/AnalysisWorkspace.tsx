import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'
import { AspectsMatrix } from './AspectsMatrix'
import { DignityStrengthOverview } from './DignityStrengthOverview'
import { BhavaPurusharthaBalance } from './BhavaPurusharthaBalance'
import { PlanetaryYogasSummary } from './PlanetaryYogasSummary'

interface AnalysisWorkspaceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

type AnalysisTab = 'overview' | 'aspects' | 'dignity' | 'purushartha' | 'yogas'

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview')

  const yogasCount = chart.yogas?.length || 0

  return (
    <div className="analysis-workspace-root" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner with Navigation Tabs */}
      <section
        className="panel"
        style={{
          padding: '20px 24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(17, 21, 28, 0.95), rgba(11, 14, 19, 0.9))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#fbbf24',
                }}
              >
                PRD §10 & §39 • Vedic Astrology Analysis Suite
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.45rem', color: '#f8fafc', fontWeight: 800 }}>
              Comprehensive Chart Analysis & Classical Synthesis
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Deep astronomical & astrological evaluation for {chart.name} • Lagna in {chart.quickFacts.lagna} ({chart.quickFacts.lagnaDms}) • Moon in {chart.quickFacts.moonSign}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(212, 171, 92, 0.15)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid rgba(212, 171, 92, 0.3)',
              }}
            >
              {yogasCount} Classical Yogas Detected
            </span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 14,
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: '📊 Executive Overview', badge: 'Summary' },
            { id: 'aspects', label: '👁️ Aspects Matrix (Drishti)', badge: '9×12 Grid' },
            { id: 'dignity', label: '👑 Planetary Dignity & Strength', badge: 'Ledger' },
            { id: 'purushartha', label: '⚖️ Purushartha & Bhava Balance', badge: '4 Aims' },
            { id: 'yogas', label: '⚜️ Classical Yogas', badge: String(yogasCount) },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AnalysisTab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: isActive ? '#d4ab5c' : 'rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'linear-gradient(135deg, rgba(212, 171, 92, 0.22), rgba(212, 171, 92, 0.08))' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#fbbf24' : '#cbd5e1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: isActive ? '#d4ab5c' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#0f172a' : '#94a3b8',
                  }}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tab 1: Executive Overview Dashboard */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top row: Dignity overview & Purushartha Balance side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  👑 Planetary Dignity Snapshot
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('dignity')}
                  className="text-button"
                  style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'none', border: 0, cursor: 'pointer' }}
                >
                  Full Dignity Ledger →
                </button>
              </div>
              <DignityStrengthOverview
                chart={chart}
                onSelectPlanet={onSelectPlanet}
                onSelectHouse={onSelectHouse}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  ⚖️ Purushartha & Bhava Allocation
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('purushartha')}
                  className="text-button"
                  style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'none', border: 0, cursor: 'pointer' }}
                >
                  Deep Balance Analysis →
                </button>
              </div>
              <BhavaPurusharthaBalance
                chart={chart}
                onSelectPlanet={onSelectPlanet}
                onSelectHouse={onSelectHouse}
              />
            </div>
          </div>

          {/* Middle: Aspects Matrix Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                👁️ Graha Drishti Matrix (9 Grahas × 12 Bhavas)
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('aspects')}
                className="text-button"
                style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'none', border: 0, cursor: 'pointer' }}
              >
                Expand Drishti Grid →
              </button>
            </div>
            <AspectsMatrix
              chart={chart}
              onSelectPlanet={onSelectPlanet}
              onSelectHouse={onSelectHouse}
            />
          </div>

          {/* Bottom: Classical Yogas Top Highlight */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                ⚜️ Foundational Classical Yogas
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('yogas')}
                className="text-button"
                style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'none', border: 0, cursor: 'pointer' }}
              >
                View All {yogasCount} Yogas →
              </button>
            </div>
            <PlanetaryYogasSummary
              chart={chart}
              onSelectPlanet={onSelectPlanet}
              onSelectHouse={onSelectHouse}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Full Aspects Matrix */}
      {activeTab === 'aspects' && (
        <AspectsMatrix
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Tab 3: Dignity & Strength */}
      {activeTab === 'dignity' && (
        <DignityStrengthOverview
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Tab 4: Purushartha & Bhavas */}
      {activeTab === 'purushartha' && (
        <BhavaPurusharthaBalance
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}

      {/* Tab 5: Classical Yogas */}
      {activeTab === 'yogas' && (
        <PlanetaryYogasSummary
          chart={chart}
          onSelectPlanet={onSelectPlanet}
          onSelectHouse={onSelectHouse}
        />
      )}
    </div>
  )
}
