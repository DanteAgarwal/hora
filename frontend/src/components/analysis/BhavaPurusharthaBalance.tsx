import React, { useMemo } from 'react'
import type { AstroChart, PlanetPosition } from '../../types/astro'

interface BhavaPurusharthaBalanceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

interface PurusharthaGroup {
  name: 'Dharma' | 'Artha' | 'Kama' | 'Moksha'
  sanskrit: string
  houses: number[]
  theme: string
  color: string
  bgGradient: string
  planets: PlanetPosition[]
  percentage: number
}

interface StanzaGroup {
  name: string
  sanskrit: string
  houses: number[]
  description: string
  planets: PlanetPosition[]
  count: number
}

export const BhavaPurusharthaBalance: React.FC<BhavaPurusharthaBalanceProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const validPlanets = useMemo(() => {
    return chart.planets.filter((p) => !['Lagna'].includes(p.name))
  }, [chart.planets])

  const totalPlanets = validPlanets.length || 9

  // 1. Purushartha Distribution (Dharma 1,5,9; Artha 2,6,10; Kama 3,7,11; Moksha 4,8,12)
  const purusharthas: PurusharthaGroup[] = useMemo(() => {
    const dharmaPlanets = validPlanets.filter((p) => [1, 5, 9].includes(p.houseNumber))
    const arthaPlanets = validPlanets.filter((p) => [2, 6, 10].includes(p.houseNumber))
    const kamaPlanets = validPlanets.filter((p) => [3, 7, 11].includes(p.houseNumber))
    const mokshaPlanets = validPlanets.filter((p) => [4, 8, 12].includes(p.houseNumber))

    return [
      {
        name: 'Dharma',
        sanskrit: 'धर्म',
        houses: [1, 5, 9],
        theme: 'Duty, purpose, creative intelligence, self-identity, divine grace & righteous trajectory.',
        color: '#fbbf24',
        bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(17, 21, 28, 0.8))',
        planets: dharmaPlanets,
        percentage: Math.round((dharmaPlanets.length / totalPlanets) * 100),
      },
      {
        name: 'Artha',
        sanskrit: 'अर्थ',
        houses: [2, 6, 10],
        theme: 'Material resources, accumulated wealth, professional duties, executive status & tangible manifestations.',
        color: '#34d399',
        bgGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(17, 21, 28, 0.8))',
        planets: arthaPlanets,
        percentage: Math.round((arthaPlanets.length / totalPlanets) * 100),
      },
      {
        name: 'Kama',
        sanskrit: 'काम',
        houses: [3, 7, 11],
        theme: 'Desires, passionate initiatives, partnerships, public interfaces, social networks & realization of gains.',
        color: '#38bdf8',
        bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(17, 21, 28, 0.8))',
        planets: kamaPlanets,
        percentage: Math.round((kamaPlanets.length / totalPlanets) * 100),
      },
      {
        name: 'Moksha',
        sanskrit: 'मोक्ष',
        houses: [4, 8, 12],
        theme: 'Emotional sanctuary, transformation, occult insight, detachment, spiritual transcendence & inner release.',
        color: '#c084fc',
        bgGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.12), rgba(17, 21, 28, 0.8))',
        planets: mokshaPlanets,
        percentage: Math.round((mokshaPlanets.length / totalPlanets) * 100),
      },
    ]
  }, [validPlanets, totalPlanets])

  // Determine dominant Purushartha
  const dominantPurushartha = useMemo(() => {
    const sorted = [...purusharthas].sort((a, b) => b.planets.length - a.planets.length)
    return sorted[0]
  }, [purusharthas])

  // 2. House Stanzas & Quadrant Classifications
  const stanzas: StanzaGroup[] = useMemo(() => {
    const kendraPlanets = validPlanets.filter((p) => [1, 4, 7, 10].includes(p.houseNumber))
    const trikonaPlanets = validPlanets.filter((p) => [1, 5, 9].includes(p.houseNumber))
    const panapharaPlanets = validPlanets.filter((p) => [2, 5, 8, 11].includes(p.houseNumber))
    const apoklimaPlanets = validPlanets.filter((p) => [3, 6, 9, 12].includes(p.houseNumber))
    const upachayaPlanets = validPlanets.filter((p) => [3, 6, 10, 11].includes(p.houseNumber))
    const dusthanaPlanets = validPlanets.filter((p) => [6, 8, 12].includes(p.houseNumber))

    return [
      {
        name: 'Kendra Sthanas',
        sanskrit: 'केन्द्र (Quadrants: 1, 4, 7, 10)',
        houses: [1, 4, 7, 10],
        description: 'Vishnu Sthana — The four foundational pillars of active manifest life and direct worldly capacity.',
        planets: kendraPlanets,
        count: kendraPlanets.length,
      },
      {
        name: 'Trikona Sthanas',
        sanskrit: 'त्रिकोण (Trines: 1, 5, 9)',
        houses: [1, 5, 9],
        description: 'Lakshmi Sthana — Holy trines of past-life blessings (Purva Punya), fortune, virtue, and wisdom.',
        planets: trikonaPlanets,
        count: trikonaPlanets.length,
      },
      {
        name: 'Panaphara',
        sanskrit: 'पणफर (Succedent: 2, 5, 8, 11)',
        houses: [2, 5, 8, 11],
        description: 'Houses of material maintenance, accumulation, resource consolidation, and continuous sustaining support.',
        planets: panapharaPlanets,
        count: panapharaPlanets.length,
      },
      {
        name: 'Apoklima',
        sanskrit: 'आपोक्लिम (Cadent: 3, 6, 9, 12)',
        houses: [3, 6, 9, 12],
        description: 'Houses of effort, transition, endurance, service, and detachment.',
        planets: apoklimaPlanets,
        count: apoklimaPlanets.length,
      },
      {
        name: 'Upachaya Sthanas',
        sanskrit: 'उपचय (Growth: 3, 6, 10, 11)',
        houses: [3, 6, 10, 11],
        description: 'Houses of progressive expansion where planets improve with age, willpower, and disciplined effort.',
        planets: upachayaPlanets,
        count: upachayaPlanets.length,
      },
      {
        name: 'Dusthana Sthanas',
        sanskrit: 'दुस्थान (Challenging: 6, 8, 12)',
        houses: [6, 8, 12],
        description: 'Houses of struggle, karmic debts, transformative crises, and eventual spiritual emancipation.',
        planets: dusthanaPlanets,
        count: dusthanaPlanets.length,
      },
    ]
  }, [validPlanets])

  return (
    <div className="purushartha-balance-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Executive Synthesis Card */}
      <div
        className="panel"
        style={{
          padding: '18px 22px',
          borderRadius: 14,
          border: '1px solid rgba(212, 171, 92, 0.25)',
          background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.08), rgba(17, 21, 28, 0.85))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: '1.4rem' }}>⚖️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Purushartha & Bhava Energy Distribution
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Dominant Aim:{' '}
              <strong style={{ color: dominantPurushartha.color }}>
                {dominantPurushartha.name} ({dominantPurushartha.sanskrit})
              </strong>{' '}
              with {dominantPurushartha.planets.length} grahas ({dominantPurushartha.percentage}%)
            </span>
          </div>
        </div>

        {/* Segmented Distribution Bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              height: 18,
              borderRadius: 8,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: 2,
              gap: 2,
            }}
          >
            {purusharthas.map((group) => {
              if (group.percentage === 0) return null
              return (
                <div
                  key={group.name}
                  style={{
                    width: `${group.percentage}%`,
                    height: '100%',
                    background: group.color,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    transition: 'all 0.3s ease',
                  }}
                  title={`${group.name}: ${group.planets.length} grahas (${group.percentage}%)`}
                >
                  {group.percentage > 15 ? `${group.name} ${group.percentage}%` : `${group.percentage}%`}
                </div>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: 6,
            }}
          >
            {purusharthas.map((group) => (
              <span key={group.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} />
                <strong style={{ color: '#e2e8f0' }}>{group.name}</strong> ({group.planets.length})
              </span>
            ))}
          </div>
        </div>

        {/* Astrological Synthesis Paragraph */}
        <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          According to classical Jyotish, this chart exhibits a prominent{' '}
          <strong style={{ color: dominantPurushartha.color }}>{dominantPurushartha.name} orientation</strong>. The native's
          innate focus gravitates toward{' '}
          {dominantPurushartha.name === 'Dharma'
            ? 'purposeful self-actualization, philosophical principles, creative integrity, and spiritual legacy.'
            : dominantPurushartha.name === 'Artha'
            ? 'tangible material building, professional leadership, resource management, and diligent practical service.'
            : dominantPurushartha.name === 'Kama'
            ? 'collaborative alliances, relationship vitality, entrepreneurial ambition, and real-world networking.'
            : 'internal spiritual inquiry, psychological liberation, detachment, and higher mystical understanding.'}
        </p>
      </div>

      {/* 4 Purushartha Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {purusharthas.map((group) => {
          const isDominant = group.name === dominantPurushartha.name
          return (
            <div
              key={group.name}
              className="panel"
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                border: isDominant ? `1px solid ${group.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                background: group.bgGradient,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: 0.8, color: group.color }}>
                      {group.sanskrit}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                      {group.name} Bhava Trio
                    </h4>
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: `${group.color}22`,
                      color: group.color,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: `1px solid ${group.color}44`,
                    }}
                  >
                    {group.planets.length} Grahas ({group.percentage}%)
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong>Houses:</strong>
                  {group.houses.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => onSelectHouse && onSelectHouse(h)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: group.color,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      title={`Inspect House ${h}`}
                    >
                      {h}th ↗
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  {group.theme}
                </p>
              </div>

              {/* Occupying Planets */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10 }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Occupants:</span>
                {group.planets.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {group.planets.map((p) => (
                      <span
                        key={p.name}
                        onClick={() => onSelectPlanet && onSelectPlanet(p.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#f8fafc',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.15s ease',
                        }}
                        title={`Inspect ${p.name} in House ${p.houseNumber}`}
                      >
                        <span style={{ color: group.color }}>{p.symbol}</span>
                        {p.short} (H{p.houseNumber})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                    No occupying planets
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pillars & Quadrants Balance (Stanzas) */}
      <div className="panel" style={{ padding: 20, borderRadius: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
            Bhava Classification & Quadrant Distribution (Sthanas)
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Balance between Kendra (Pillars), Trikona (Fortune), Upachaya (Growth), and Dusthana (Obstacles)
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {stanzas.map((stanza) => {
            return (
              <div
                key={stanza.name}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>{stanza.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{stanza.sanskrit}</div>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#38bdf8',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                    }}
                  >
                    {stanza.count} Grahas
                  </span>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.35 }}>
                  {stanza.description}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  {stanza.planets.length > 0 ? (
                    stanza.planets.map((p) => (
                      <span
                        key={p.name}
                        onClick={() => onSelectPlanet && onSelectPlanet(p.name)}
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#cbd5e1',
                          padding: '2px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {p.short} (H{p.houseNumber})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>Vacant</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
