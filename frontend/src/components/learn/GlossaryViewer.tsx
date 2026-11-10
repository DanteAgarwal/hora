import React, { useState, useMemo } from 'react'
import type { AstroChart } from '../../types/astro'
import { GLOSSARY_TERMS, type GlossaryCategory } from './glossaryData'

interface GlossaryViewerProps {
  chart: AstroChart
  initialTermId?: string
}

const CATEGORIES: GlossaryCategory[] = [
  'All',
  'Planets & Dignity',
  'Houses (Bhavas)',
  'Nakshatras & Stars',
  'Vargas & Divisions',
  'Dashas & Timing',
  'Aspects & Relations',
  'Jaimini & Karakas',
  'Astronomical & Ephemeris',
]

export const GlossaryViewer: React.FC<GlossaryViewerProps> = ({
  chart,
  initialTermId,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory>('All')
  const [expandedTermId, setExpandedTermId] = useState<string | null>(initialTermId || GLOSSARY_TERMS[0].id)
  const [activeLetter, setActiveLetter] = useState<string>('All')

  // Available first letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    GLOSSARY_TERMS.forEach((t) => {
      letters.add(t.name[0].toUpperCase())
    })
    return ['All', ...Array.from(letters).sort()]
  }, [])

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return GLOSSARY_TERMS.filter((term) => {
      const matchCat = selectedCategory === 'All' || term.category === selectedCategory
      const matchLetter = activeLetter === 'All' || term.name[0].toUpperCase() === activeLetter
      const matchQuery =
        !q ||
        term.name.toLowerCase().includes(q) ||
        term.sanskrit.toLowerCase().includes(q) ||
        (term.devanagari && term.devanagari.includes(q)) ||
        term.shortDef.toLowerCase().includes(q) ||
        term.tags.some((tag) => tag.toLowerCase().includes(q))
      return matchCat && matchLetter && matchQuery
    })
  }, [searchQuery, selectedCategory, activeLetter])

  return (
    <div className="glossary-viewer-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search & Category Filter Header */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              📖 Classical Jyotish Glossary & Encyclopedia (PRD §39, §43)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Search classical Sanskrit terminology, technical definitions, and real-time values in your chart
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <input
              type="text"
              placeholder="Search terms: Digbala, Neecha, Vargottama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: 7, fontSize: '0.85rem', color: '#94a3b8' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 7,
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setActiveLetter('All')
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.06)',
                  background: isActive ? 'rgba(212, 171, 92, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#fbbf24' : '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* A-Z Quick Jump Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: 4 }}>Jump to:</span>
          {availableLetters.map((letter) => {
            const isActive = activeLetter === letter
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setActiveLetter(letter)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: 'none',
                  background: isActive ? '#38bdf8' : 'transparent',
                  color: isActive ? '#0f172a' : '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Count Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Showing <strong>{filteredTerms.length}</strong> terms
        </span>
        {expandedTermId && (
          <button
            type="button"
            onClick={() => setExpandedTermId(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.74rem',
              cursor: 'pointer',
            }}
          >
            Collapse All
          </button>
        )}
      </div>

      {/* Terms Accordion / Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredTerms.map((term) => {
          const isExpanded = expandedTermId === term.id
          const chartResult = term.resolveChartResult ? term.resolveChartResult(chart) : null

          return (
            <div
              key={term.id}
              className="panel"
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: isExpanded ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'border 0.15s ease',
              }}
            >
              {/* Term Header Row */}
              <div
                onClick={() => setExpandedTermId(isExpanded ? null : term.id)}
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isExpanded ? 'rgba(56, 189, 248, 0.06)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1rem', color: '#fbbf24', fontWeight: 800 }}>
                    {term.name}
                  </span>
                  {term.devanagari && (
                    <span style={{ fontSize: '0.84rem', color: '#94a3b8', fontStyle: 'normal' }}>
                      ({term.devanagari})
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                    }}
                  >
                    {term.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {isExpanded ? '▲ Close' : '▼ Expand'}
                  </span>
                </div>
              </div>

              {/* Collapsed Brief Preview */}
              {!isExpanded && (
                <div style={{ padding: '0 18px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {term.shortDef}
                </div>
              )}

              {/* Expanded Detailed View (PRD §23: The 4 Core Questions) */}
              {isExpanded && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* PRD §23 Question 1: What is it? */}
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      1. What is it?
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.5 }}>
                      {term.whatIsIt}
                    </p>
                  </div>

                  {/* PRD §23 Question 2: Why is it used? */}
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      2. Why is it used? (Traditional Jyotish Context)
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {term.whyUsed}
                    </p>
                  </div>

                  {/* PRD §23 Question 3: How is it calculated? */}
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      3. How is it calculated? (Technical Provenance)
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {term.howCalculated}
                    </p>
                  </div>

                  {/* PRD §23 Question 4: Your Result in This Chart */}
                  {chartResult && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      <h5 style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        4. Your Result in This Chart ({chart.name})
                      </h5>
                      <div style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 700 }}>
                        {chartResult.label}: <span style={{ color: '#fbbf24' }}>{chartResult.value}</span>
                      </div>
                      {chartResult.details && (
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 3 }}>
                          {chartResult.details}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6 }}>
                    {term.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#64748b',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredTerms.length === 0 && (
          <div className="panel" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
            No glossary terms match your search query "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  )
}
