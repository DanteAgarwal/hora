import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetaryYoga } from '../../types/astro'

interface PlanetaryYogasSummaryProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const PlanetaryYogasSummary: React.FC<PlanetaryYogasSummaryProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const allYogas = useMemo(() => {
    return chart.yogas || []
  }, [chart.yogas])

  // Count aggregates
  const counts = useMemo(() => {
    return {
      total: allYogas.length,
      raja: allYogas.filter((y) => y.group === 'Raja').length,
      dhana: allYogas.filter((y) => y.group === 'Dhana').length,
      mahapurusha: allYogas.filter((y) => y.group === 'Mahapurusha').length,
      chandra: allYogas.filter((y) => y.group === 'Chandra').length,
      ravi: allYogas.filter((y) => y.group === 'Ravi').length,
      vipareeta: allYogas.filter((y) => y.group === 'Vipareeta').length,
    }
  }, [allYogas])

  // Filtered yogas
  const filteredYogas = useMemo(() => {
    let list = [...allYogas]

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
          y.participants.some((p) => p.toLowerCase().includes(q))
      )
    }

    return list
  }, [allYogas, selectedGroup, searchQuery])

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
      case 'Vipareeta':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '#e11d48' }
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.2)' }
    }
  }

  return (
    <div className="planetary-yogas-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Overview Stat Strip */}
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
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
              border: '1px solid rgba(212, 171, 92, 0.3)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.25rem',
            }}
          >
            ⚜️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Classical Yogas Catalog (Brihat Parashara Hora Shastra)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Identified {counts.total} active planetary yogas in this Kundli chart
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search yogas, planets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.82rem',
              width: 200,
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Yogas', count: counts.total },
          { key: 'raja', label: '👑 Raja Yogas', count: counts.raja },
          { key: 'dhana', label: '💰 Dhana Yogas', count: counts.dhana },
          { key: 'mahapurusha', label: '🌟 Mahapurusha', count: counts.mahapurusha },
          { key: 'chandra', label: '🌙 Chandra Yogas', count: counts.chandra },
          { key: 'ravi', label: '☀️ Ravi Yogas', count: counts.ravi },
          { key: 'vipareeta', label: '⚡ Vipareeta Raja', count: counts.vipareeta },
        ].map((tab) => {
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

      {/* Yoga Cards List */}
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
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                      Active Formation
                    </span>
                    {yoga.strength && (
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
                        {yoga.strength}
                      </span>
                    )}
                  </div>
                </div>

                {/* Definition */}
                <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#f8fafc' }}>Rule (Sutra): </strong>
                  {yoga.definition}
                </div>

                {/* Specific reason in this chart */}
                {yoga.reason && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#fbbf24',
                      background: 'rgba(251, 191, 36, 0.06)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                    }}
                  >
                    <strong>Chart Placement: </strong>
                    {yoga.reason}
                  </div>
                )}

                {/* Effects / Phala */}
                {yoga.effects && (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    <strong style={{ color: '#e2e8f0' }}>Astrological Manifestation (Phala): </strong>
                    {yoga.effects}
                  </div>
                )}

                {/* Participant Grahas and Houses */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Participants:
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
              </div>
            )
          })
        ) : (
          <div
            className="panel"
            style={{
              padding: 40,
              textAlign: 'center',
              borderRadius: 14,
              color: '#94a3b8',
            }}
          >
            No classical yogas matched your current filter.
          </div>
        )}
      </div>
    </div>
  )
}
