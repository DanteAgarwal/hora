import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'
import { CONCEPTS_DATA, type ConceptSection } from './conceptsData'

interface ConceptsExplorerProps {
  chart: AstroChart
  onSelectConceptTerm?: (termId: string) => void
}

export const ConceptsExplorer: React.FC<ConceptsExplorerProps> = ({
  chart,
  onSelectConceptTerm,
}) => {
  const [activeConceptId, setActiveConceptId] = useState<string>('grahas')

  const activeConcept: ConceptSection =
    CONCEPTS_DATA.find((c) => c.id === activeConceptId) || CONCEPTS_DATA[0]

  const chartContext = activeConcept.resolveChartContext
    ? activeConcept.resolveChartContext(chart)
    : null

  return (
    <div className="concepts-explorer-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Concept Pillar Navigation Bar */}
      <div
        className="panel"
        style={{
          padding: '12px 16px',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
          Foundational Pillars:
        </span>
        {CONCEPTS_DATA.map((concept) => {
          const isActive = activeConceptId === concept.id
          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => setActiveConceptId(concept.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{concept.icon}</span>
              <span>{concept.title.split(' (')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Main Concept Header Card */}
      <div
        className="panel"
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.8rem' }}>{activeConcept.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                  {activeConcept.title}
                </h3>
                <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
                  {activeConcept.sanskrit}
                </span>
              </div>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, maxWidth: 850 }}>
              {activeConcept.summary}
            </p>
          </div>
        </div>

        {/* Live Chart Context Integration Banner */}
        {chartContext && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '0.9rem' }}>🔍</span>
              <strong style={{ fontSize: '0.82rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {chartContext.title} ({chart.name})
              </strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {chartContext.highlights.map((h) => (
                <div key={h.label} style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>{h.label}: </span>
                  <strong style={{ color: '#f8fafc' }}>{h.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Architectural Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Card 1: Core Jyotish Principle */}
        <div className="panel" style={{ padding: 18, borderRadius: 14 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: '#fbbf24', fontWeight: 700 }}>
            🧠 Governing Principle
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            {activeConcept.corePrinciple}
          </p>
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10 }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
              Classical Citation & Textual Origin:
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {activeConcept.traditionalContext}
            </span>
          </div>
        </div>

        {/* Card 2: How to Read in a Chart */}
        <div className="panel" style={{ padding: 18, borderRadius: 14 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: '#38bdf8', fontWeight: 700 }}>
            🧭 How to Analyze in Your Horoscope
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            {activeConcept.howToReadInChart}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Want deeper technical calculations?
            </span>
            <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600, cursor: 'pointer' }}>
              Check Research ➔ Calculation Provenance
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Elements Catalog Grid */}
      <div className="panel" style={{ padding: 20, borderRadius: 14 }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
          Constituent Elements ({activeConcept.keyElements.length})
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {activeConcept.keyElements.map((el) => (
            <div
              key={el.label}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ color: '#f8fafc', fontSize: '0.86rem' }}>{el.label}</strong>
                  {el.badge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(212, 171, 92, 0.15)',
                        color: '#fbbf24',
                        fontWeight: 600,
                      }}
                    >
                      {el.badge}
                    </span>
                  )}
                </div>
                {el.sanskrit && (
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: 4 }}>
                    {el.sanskrit}
                  </span>
                )}
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {el.description}
                </p>
              </div>

              {onSelectConceptTerm && (
                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => onSelectConceptTerm(el.label.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    View in Glossary ➔
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
