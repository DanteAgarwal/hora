import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetaryYoga } from '../../types/astro'

interface YogasEncyclopediaProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const YogasEncyclopedia: React.FC<YogasEncyclopediaProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'formed' | 'absent'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Full catalog of all classical yogas evaluated for this chart
  const catalog = useMemo(() => {
    return (
      (chart.allYogasCatalog && chart.allYogasCatalog.length > 0)
        ? chart.allYogasCatalog
        : (chart.yogas && chart.yogas.length > 0)
        ? chart.yogas
        : []
    )
  }, [chart.allYogasCatalog, chart.yogas])

  const formedCount = useMemo(() => {
    return catalog.filter((y) => y.present).length
  }, [catalog])

  const counts = useMemo(() => {
    const baseList =
      statusFilter === 'formed'
        ? catalog.filter((y) => y.present)
        : statusFilter === 'absent'
        ? catalog.filter((y) => !y.present)
        : catalog

    return {
      total: baseList.length,
      raja: baseList.filter((y) => y.group === 'Raja').length,
      dhana: baseList.filter((y) => y.group === 'Dhana').length,
      mahapurusha: baseList.filter((y) => y.group === 'Mahapurusha').length,
      chandra: baseList.filter((y) => y.group === 'Chandra').length,
      ravi: baseList.filter((y) => y.group === 'Ravi').length,
      nabhasa: baseList.filter((y) => y.group === 'Nabhasa').length,
      vipareeta: baseList.filter((y) => y.group === 'Vipareeta').length,
      general: baseList.filter((y) => y.group === 'General').length,
    }
  }, [catalog, statusFilter])

  const filteredYogas = useMemo(() => {
    let list = [...catalog]

    if (statusFilter === 'formed') {
      list = list.filter((y) => y.present)
    } else if (statusFilter === 'absent') {
      list = list.filter((y) => !y.present)
    }

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
  }, [catalog, statusFilter, selectedGroup, searchQuery])

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
    <div className="yogas-encyclopedia-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header and Controls */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
                border: '1px solid rgba(212, 171, 92, 0.35)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.3rem',
              }}
            >
              ⚜️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                Classical Yogas Encyclopedia (Brihat Parashara Hora Shastra)
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Exhaustive knowledge reference of all <strong>{catalog.length} classical yogas</strong>, Sanskrit sutras, manifestations, and chart verifications
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            placeholder="Search all 168 classical yogas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              width: 240,
            }}
          />
        </div>

        {/* Formation Status Filter in This Chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Filter by Kundli Status:</span>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: 3,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === 'all' ? '#d4ab5c' : 'transparent',
                  color: statusFilter === 'all' ? '#0f172a' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'all' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                All Catalog Yogas ({catalog.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('formed')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === 'formed' ? '#10b981' : 'transparent',
                  color: statusFilter === 'formed' ? '#0f172a' : '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'formed' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                ✨ Formed in this Kundli ({formedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === 'absent' ? '#475569' : 'transparent',
                  color: statusFilter === 'absent' ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'absent' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                ⚪ Absent ({catalog.length - formedCount})
              </button>
            </div>
          </div>

          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Showing {filteredYogas.length} of {catalog.length} classical yogas
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Categories', count: counts.total },
          { key: 'raja', label: '👑 Raja Yogas', count: counts.raja },
          { key: 'dhana', label: '💰 Dhana Yogas', count: counts.dhana },
          { key: 'mahapurusha', label: '🌟 Mahapurusha', count: counts.mahapurusha },
          { key: 'chandra', label: '🌙 Chandra Yogas', count: counts.chandra },
          { key: 'ravi', label: '☀️ Ravi Yogas', count: counts.ravi },
          { key: 'nabhasa', label: '🌀 Nabhasa Yogas', count: counts.nabhasa },
          { key: 'vipareeta', label: '⚡ Vipareeta Raja', count: counts.vipareeta },
          { key: 'general', label: '📜 General / Popular', count: counts.general },
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

      {/* Encyclopedia Yoga Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredYogas.map((yoga) => {
          const colors = getGroupBadgeColor(yoga.group)
          return (
            <div
              key={yoga.key}
              className="panel"
              style={{
                padding: '18px 20px',
                borderRadius: 14,
                border: yoga.present
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: yoga.present
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(0, 0, 0, 0.2))'
                  : 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
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

                {/* Kundli Formation Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {yoga.present ? (
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
                      Formed in this Kundli
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(148, 163, 184, 0.08)',
                        color: '#94a3b8',
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
                      Absent in this Kundli
                    </span>
                  )}

                  {yoga.strength === 'Killed by Kemadruma' && (
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
                    >
                      ⚠️ Cancelled by Kemadruma
                    </span>
                  )}
                </div>
              </div>

              {/* Classical Sutra / Rule */}
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#f8fafc' }}>Classical Rule (Sutra): </strong>
                {yoga.definition}
              </div>

              {/* Chart Placement Verification */}
              {yoga.reason && (
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: yoga.present ? '#fbbf24' : '#94a3b8',
                    background: yoga.present ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: yoga.present ? '1px solid rgba(251, 191, 36, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <strong>Chart Evaluation: </strong>
                  {yoga.reason}
                </div>
              )}

              {/* Astrological Manifestation (Phala) */}
              {yoga.effects && (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <strong style={{ color: '#e2e8f0' }}>Classical Manifestation (Phala): </strong>
                  {yoga.effects}
                </div>
              )}

              {/* Participants and Houses */}
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
        })}
      </div>
    </div>
  )
}

