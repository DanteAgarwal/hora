import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetaryYoga } from '../../types/astro'

interface PlanetaryYogasSummaryProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onNavigateToLearn?: () => void
}

export const PlanetaryYogasSummary: React.FC<PlanetaryYogasSummaryProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
  onNavigateToLearn,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Strictly only active / present yogas in this Kundli chart
  const activeYogas = useMemo(() => {
    return (chart.yogas || []).filter((y) => y.present)
  }, [chart.yogas])

  // Count aggregates of active yogas
  const counts = useMemo(() => {
    return {
      total: activeYogas.length,
      raja: activeYogas.filter((y) => y.group === 'Raja').length,
      dhana: activeYogas.filter((y) => y.group === 'Dhana').length,
      mahapurusha: activeYogas.filter((y) => y.group === 'Mahapurusha').length,
      chandra: activeYogas.filter((y) => y.group === 'Chandra').length,
      ravi: activeYogas.filter((y) => y.group === 'Ravi').length,
      nabhasa: activeYogas.filter((y) => y.group === 'Nabhasa').length,
      vipareeta: activeYogas.filter((y) => y.group === 'Vipareeta').length,
      general: activeYogas.filter((y) => y.group === 'General').length,
    }
  }, [activeYogas])

  // Filtered active yogas based on group or search query
  const filteredYogas = useMemo(() => {
    let list = [...activeYogas]

    if (selectedGroup !== 'all') {
      list = list.filter((y) => y.group.toLowerCase() === selectedGroup.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (y) =>
          y.name.toLowerCase().includes(q) ||
          (y.sanskritName && y.sanskritName.includes(q)) ||
          (y.definition && y.definition.toLowerCase().includes(q)) ||
          (y.effects && y.effects.toLowerCase().includes(q)) ||
          (y.participants && y.participants.some((p) => p.toLowerCase().includes(q)))
      )
    }

    return list
  }, [activeYogas, selectedGroup, searchQuery])

  const getGroupBadgeColor = (group: PlanetaryYoga['group']) => {
    switch (group) {
      case 'Raja':
        return { bg: 'rgba(212, 171, 92, 0.15)', text: '#fbbf24', border: '#d4ab5c' }
      case 'Dhana':
        return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#10b981' }
      case 'Mahapurusha':
        return { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc', border: '#a855f7' }
      case 'Chandra':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#0284c7' }
      case 'Ravi':
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: '#ea580c' }
      case 'Nabhasa':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '#9333ea' }
      case 'Vipareeta':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '#e11d48' }
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.2)' }
    }
  }

  return (
    <div className="planetary-yogas-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Active Yogas Header */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
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
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
              border: '1px solid rgba(212, 171, 92, 0.35)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.25rem',
            }}
          >
            ⚜️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Active Classical Yogas in Kundli
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing only <strong>{counts.total} active formations</strong> formed by planetary placements in this chart
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search active yogas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.82rem',
              width: 180,
            }}
          />
        </div>
      </div>

      {/* Filter Tabs by Category */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Active Yogas', count: counts.total },
          { key: 'raja', label: '👑 Raja Yogas', count: counts.raja },
          { key: 'dhana', label: '💰 Dhana Yogas', count: counts.dhana },
          { key: 'mahapurusha', label: '🌟 Mahapurusha', count: counts.mahapurusha },
          { key: 'chandra', label: '🌙 Chandra Yogas', count: counts.chandra },
          { key: 'ravi', label: '☀️ Ravi Yogas', count: counts.ravi },
          { key: 'nabhasa', label: '🌀 Nabhasa Yogas', count: counts.nabhasa },
          { key: 'vipareeta', label: '⚡ Vipareeta Raja', count: counts.vipareeta },
        ]
          .filter((tab) => tab.key === 'all' || tab.count > 0)
          .map((tab) => {
            const isActive = selectedGroup === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedGroup(tab.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: isActive ? '#d4ab5c' : 'rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'rgba(212, 171, 92, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#fbbf24' : '#cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontSize: '0.7rem',
                    background: isActive ? '#d4ab5c' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#0f172a' : '#94a3b8',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
      </div>

      {/* Active Yogas Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredYogas.length > 0 ? (
          filteredYogas.map((yoga) => {
            const colors = getGroupBadgeColor(yoga.group)
            return (
              <div
                key={yoga.key}
                className="panel"
                style={{
                  padding: '18px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>
                          {yoga.name}
                        </h4>
                        {yoga.sanskritName && (
                          <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontStyle: 'italic' }}>
                            ({yoga.sanskritName})
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}44`,
                          marginTop: 4,
                        }}
                      >
                        {yoga.group} Yoga
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.18)',
                        color: '#34d399',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      Active in Natal Chart (D1)
                    </span>

                    {yoga.strength === 'Killed by Kemadruma' ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                        title="Fruits cancelled by Kemadruma Yoga in this chart"
                      >
                        ⚠️ Cancelled by Kemadruma
                      </span>
                    ) : (
                      yoga.strength && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#e2e8f0',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                          }}
                        >
                          {yoga.strength} Strength
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Definition / Sutra */}
                <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#f8fafc' }}>Rule (Sutra): </strong>
                  {yoga.definition}
                </div>

                {/* Specific placement verification in this chart */}
                {yoga.reason && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: '#fbbf24',
                      background: 'rgba(251, 191, 36, 0.06)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                    }}
                  >
                    <strong>Chart Verification: </strong>
                    {yoga.reason}
                  </div>
                )}

                {/* Astrological Manifestation (Phala) */}
                {yoga.effects && (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    <strong style={{ color: '#e2e8f0' }}>Manifestation (Phala): </strong>
                    {yoga.effects}
                  </div>
                )}

                {/* Participant Grahas and Houses */}
                {((yoga.participants && yoga.participants.length > 0) || (yoga.housesInvolved && yoga.housesInvolved.length > 0)) && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingTop: 10,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {yoga.participants && yoga.participants.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                          Grahas:
                        </span>
                        {yoga.participants.map((pName) => (
                          <button
                            key={pName}
                            type="button"
                            onClick={() => onSelectPlanet && onSelectPlanet(pName)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#f8fafc',
                              padding: '2px 8px',
                              borderRadius: 5,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                            }}
                            title={`Inspect ${pName}`}
                          >
                            {pName} ↗
                          </button>
                        ))}
                      </div>
                    )}

                    {yoga.housesInvolved && yoga.housesInvolved.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                          Houses:
                        </span>
                        {yoga.housesInvolved.map((hNum) => (
                          <button
                            key={hNum}
                            type="button"
                            onClick={() => onSelectHouse && onSelectHouse(hNum)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              padding: '2px 7px',
                              borderRadius: 5,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              cursor: 'pointer',
                            }}
                            title={`Inspect House ${hNum}`}
                          >
                            {hNum}th House ↗
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div
            className="panel"
            style={{
              padding: '30px',
              textAlign: 'center',
              color: '#94a3b8',
              borderRadius: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              No active planetary yogas matched your current filter in this chart.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Card to Classical Yogas Encyclopedia in Learn/Glossary */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.08), rgba(0, 0, 0, 0.2))',
          border: '1px dashed rgba(212, 171, 92, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700 }}>
            📖 Classical Yogas Encyclopedia & Glossary
          </h4>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
            Want to study the complete library of all 168 classical BPHS yogas, their formulas, and absent combinations?
          </p>
        </div>
        {onNavigateToLearn && (
          <button
            type="button"
            onClick={onNavigateToLearn}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(212, 171, 92, 0.15)',
              border: '1px solid #d4ab5c',
              color: '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Open Yogas Encyclopedia in Learn Suite →
          </button>
        )}
      </div>
    </div>
  )
}
