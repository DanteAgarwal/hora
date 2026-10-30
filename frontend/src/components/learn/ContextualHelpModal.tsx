import React, { useState, useEffect } from 'react'
import type { AstroChart } from '../../types/astro'
import { GLOSSARY_TERMS, type GlossaryTerm } from './glossaryData'

interface ContextualHelpModalProps {
  termId?: string
  chart: AstroChart
  onClose: () => void
  onNavigateToGlossary?: () => void
}

export const ContextualHelpModal: React.FC<ContextualHelpModalProps> = ({
  termId,
  chart,
  onClose,
  onNavigateToGlossary,
}) => {
  const [currentId, setCurrentId] = useState<string>(termId || 'lagna')

  useEffect(() => {
    if (termId) setCurrentId(termId)
  }, [termId])

  const term: GlossaryTerm =
    GLOSSARY_TERMS.find((t) => t.id === currentId || t.name.toLowerCase().includes(currentId.toLowerCase())) ||
    GLOSSARY_TERMS[0]

  const chartResult = term.resolveChartResult ? term.resolveChartResult(chart) : null

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: 620,
          borderRadius: 16,
          background: '#0d1117',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(0, 0, 0, 0.3))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>ⓘ</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                Contextual Jyotish Knowledge (PRD §23)
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                {term.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body (The 4 Core Questions of PRD §23) */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Question 1: What is it? */}
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h5 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              1. What is it?
            </h5>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#f8fafc', lineHeight: 1.5 }}>
              {term.whatIsIt}
            </p>
          </div>

          {/* Question 2: Why is it used? */}
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h5 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              2. Why is it used? (Traditional Jyotish Context)
            </h5>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {term.whyUsed}
            </p>
          </div>

          {/* Question 3: How is it calculated? */}
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h5 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              3. How is it calculated? (Technical Provenance)
            </h5>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {term.howCalculated}
            </p>
          </div>

          {/* Question 4: Your Result in This Chart */}
          {chartResult && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
            >
              <h5 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                4. Your Result in This Chart ({chart.name})
              </h5>
              <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 800 }}>
                {chartResult.label}: <span style={{ color: '#fbbf24' }}>{chartResult.value}</span>
              </div>
              {chartResult.details && (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                  {chartResult.details}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          {onNavigateToGlossary && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onNavigateToGlossary()
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📖 View All Terms in Glossary ➔
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
