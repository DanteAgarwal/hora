import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'
import { ConceptsExplorer } from './ConceptsExplorer'
import { GlossaryViewer } from './GlossaryViewer'

interface LearnWorkspaceProps {
  chart: AstroChart
  initialTab?: 'concepts' | 'glossary'
  initialTermId?: string
}

export const LearnWorkspace: React.FC<LearnWorkspaceProps> = ({
  chart,
  initialTab = 'concepts',
  initialTermId,
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'glossary'>(initialTab)
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>(initialTermId)

  const handleSelectConceptTerm = (termId: string) => {
    setSelectedTermId(termId)
    setActiveTab('glossary')
  }

  return (
    <div className="learn-workspace-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Navigation & Workspace Header */}
      <div
        className="panel"
        style={{
          padding: '14px 20px',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
              border: '1px solid rgba(212, 171, 92, 0.35)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.25rem',
            }}
          >
            🎓
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>
              Learn & Knowledge Suite (PRD §10, §23, §39, §43)
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Understand classical Jyotish foundations, Sanskrit terminology, and how they apply directly to your chart
            </span>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
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
          <button
            type="button"
            onClick={() => setActiveTab('concepts')}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'concepts' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'concepts' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'concepts' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>📚 Concepts Explorer</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: 4,
                background: activeTab === 'concepts' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'concepts' ? '#f8fafc' : '#64748b',
              }}
            >
              7 Pillars
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('glossary')}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'glossary' ? 'rgba(212, 171, 92, 0.2)' : 'transparent',
              color: activeTab === 'glossary' ? '#fbbf24' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'glossary' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖 Jyotish Glossary</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: 4,
                background: activeTab === 'glossary' ? 'rgba(212, 171, 92, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'glossary' ? '#f8fafc' : '#64748b',
              }}
            >
              80+ Terms
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Views */}
      {activeTab === 'concepts' && (
        <ConceptsExplorer
          chart={chart}
          onSelectConceptTerm={handleSelectConceptTerm}
        />
      )}

      {activeTab === 'glossary' && (
        <GlossaryViewer
          chart={chart}
          initialTermId={selectedTermId}
        />
      )}
    </div>
  )
}
