import React from 'react'
import type { AstroChart } from '../../types/astro'
import { useKundliStore } from '../../context/KundliContext'

export interface AstrologicalRadarProps {
  chart?: AstroChart
  tableTab?: 'planets' | 'houses'
  onSelectTableTab?: (tab: 'planets' | 'houses') => void
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onNavigateToNav?: (navKey: 'Charts' | 'Timing' | 'Analysis' | 'Research' | 'Learn') => void
}

export const AstrologicalRadar: React.FC<AstrologicalRadarProps> = (props) => {
  const store = useKundliStore()
  const chart = props.chart || store.chart
  if (!chart) return null

  const tableTab = props.tableTab ?? store.tableTab
  const onSelectTableTab = props.onSelectTableTab ?? store.setTableTab
  const onSelectPlanet = props.onSelectPlanet ?? store.selectPlanet
  const onSelectHouse = props.onSelectHouse ?? store.selectHouse
  const onNavigateToNav = props.onNavigateToNav ?? ((nav) => store.setSelectedNav(nav))

  const { planets, panchanga } = chart

  // Categorize planets by house groups
  const kendraHouses = [1, 4, 7, 10]
  const trikonaHouses = [1, 5, 9]
  const dusthanaHouses = [6, 8, 12]
  const upachayaHouses = [3, 6, 10, 11]

  const kendraPlanets = planets.filter((p) => kendraHouses.includes(p.houseNumber))
  const trikonaPlanets = planets.filter((p) => trikonaHouses.includes(p.houseNumber))
  const dusthanaPlanets = planets.filter((p) => dusthanaHouses.includes(p.houseNumber))
  const upachayaPlanets = planets.filter((p) => upachayaHouses.includes(p.houseNumber))

  // Motion alerts
  const retroPlanets = planets.filter((p) => p.retrograde)
  const combustPlanets = planets.filter((p) => p.combust)

  return (
    <div className="astrological-radar-panel">
      {/* 1. PILLARS OF LIFE (BHAVA DISTRIBUTIONS) */}
      <div className="radar-section">
        <div className="radar-header">
          <p className="eyebrow">Bhava Strength Distribution</p>
          <span className="info-tag">At a glance</span>
        </div>

        <div className="radar-pillars-grid">
          {/* Kendras */}
          <div className="pillar-card kendra-pillar">
            <div className="pillar-title">
              <span className="pillar-icon">🏛️</span>
              <div className="pillar-label">
                <strong>Kendras (1, 4, 7, 10)</strong>
                <small>Vishnu Sthanas • Pillars</small>
              </div>
              <span className="count-pill">{kendraPlanets.length}</span>
            </div>
            <div className="planet-tag-list">
              {kendraPlanets.length > 0 ? (
                kendraPlanets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="radar-planet-btn"
                    onClick={() => onSelectPlanet?.(p.name)}
                    title={`${p.name} in House ${p.houseNumber} (${p.dignity})`}
                  >
                    <span>{p.symbol}</span>
                    <span>{p.name}</span>
                    <small
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectHouse?.(p.houseNumber)
                      }}
                      title={`Inspect House ${p.houseNumber}`}
                      style={{ cursor: 'pointer' }}
                    >
                      H{p.houseNumber}
                    </small>
                  </button>
                ))
              ) : (
                <span className="empty-indicator">No grahas</span>
              )}
            </div>
          </div>

          {/* Trikonas */}
          <div className="pillar-card trikona-pillar">
            <div className="pillar-title">
              <span className="pillar-icon">🌟</span>
              <div className="pillar-label">
                <strong>Trikonas (1, 5, 9)</strong>
                <small>Lakshmi Sthanas • Fortune</small>
              </div>
              <span className="count-pill">{trikonaPlanets.length}</span>
            </div>
            <div className="planet-tag-list">
              {trikonaPlanets.length > 0 ? (
                trikonaPlanets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="radar-planet-btn"
                    onClick={() => onSelectPlanet?.(p.name)}
                    title={`${p.name} in House ${p.houseNumber} (${p.dignity})`}
                  >
                    <span>{p.symbol}</span>
                    <span>{p.name}</span>
                    <small
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectHouse?.(p.houseNumber)
                      }}
                      title={`Inspect House ${p.houseNumber}`}
                      style={{ cursor: 'pointer' }}
                    >
                      H{p.houseNumber}
                    </small>
                  </button>
                ))
              ) : (
                <span className="empty-indicator">No grahas</span>
              )}
            </div>
          </div>

          {/* Dusthanas */}
          <div className="pillar-card dusthana-pillar">
            <div className="pillar-title">
              <span className="pillar-icon">⚔️</span>
              <div className="pillar-label">
                <strong>Dusthanas (6, 8, 12)</strong>
                <small>Trials & Transformation</small>
              </div>
              <span className="count-pill">{dusthanaPlanets.length}</span>
            </div>
            <div className="planet-tag-list">
              {dusthanaPlanets.length > 0 ? (
                dusthanaPlanets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="radar-planet-btn"
                    onClick={() => onSelectPlanet?.(p.name)}
                    title={`${p.name} in House ${p.houseNumber} (${p.dignity})`}
                  >
                    <span>{p.symbol}</span>
                    <span>{p.name}</span>
                    <small
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectHouse?.(p.houseNumber)
                      }}
                      title={`Inspect House ${p.houseNumber}`}
                      style={{ cursor: 'pointer' }}
                    >
                      H{p.houseNumber}
                    </small>
                  </button>
                ))
              ) : (
                <span className="empty-indicator">Clear</span>
              )}
            </div>
          </div>

          {/* Upachayas */}
          <div className="pillar-card upachaya-pillar">
            <div className="pillar-title">
              <span className="pillar-icon">📈</span>
              <div className="pillar-label">
                <strong>Upachayas (3, 6, 10, 11)</strong>
                <small>Growth Over Time</small>
              </div>
              <span className="count-pill">{upachayaPlanets.length}</span>
            </div>
            <div className="planet-tag-list">
              {upachayaPlanets.length > 0 ? (
                upachayaPlanets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="radar-planet-btn"
                    onClick={() => onSelectPlanet?.(p.name)}
                    title={`${p.name} in House ${p.houseNumber} (${p.dignity})`}
                  >
                    <span>{p.symbol}</span>
                    <span>{p.name}</span>
                    <small
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectHouse?.(p.houseNumber)
                      }}
                      title={`Inspect House ${p.houseNumber}`}
                      style={{ cursor: 'pointer' }}
                    >
                      H{p.houseNumber}
                    </small>
                  </button>
                ))
              ) : (
                <span className="empty-indicator">No grahas</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPECIAL ASTRONOMICAL STATES */}
      {(retroPlanets.length > 0 || combustPlanets.length > 0) && (
        <div className="radar-section special-states-section">
          <p className="eyebrow">Active Motion & Combustion</p>
          <div className="alerts-row">
            {retroPlanets.map((p) => (
              <div
                key={p.name}
                className="state-alert-card retro-alert"
                onClick={() => onSelectPlanet?.(p.name)}
                title={`${p.name} is Vakri (Retrograde) with speed ${p.speed?.toFixed(2) || '0.00'}°/day`}
              >
                <div className="alert-badge">[R] Vakri</div>
                <strong>{p.symbol} {p.name}</strong>
                <small>H{p.houseNumber} • {p.sign}</small>
              </div>
            ))}
            {combustPlanets.map((p) => (
              <div
                key={p.name}
                className="state-alert-card combust-alert"
                onClick={() => onSelectPlanet?.(p.name)}
                title={`${p.name} is Asta (Combust), ${p.sunSeparation?.toFixed(1) || '0.0'}° from Sun`}
              >
                <div className="alert-badge">🔥 Asta</div>
                <strong>{p.symbol} {p.name}</strong>
                <small>{p.sunSeparation?.toFixed(1)}° from Sun</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PANCHANGA SUMMARY BANNER */}
      {panchanga && (() => {
        const vaaraText =
          typeof panchanga.vaara === 'object' && panchanga.vaara !== null
            ? (panchanga.vaara as any).name || (panchanga.vaara as any).lord || 'Solar Day'
            : (panchanga.vaara || 'Solar Day')

        const tithiText = Array.isArray(panchanga.tithi)
          ? panchanga.tithi[0]?.name || 'Sukla Paksha'
          : panchanga.tithi?.name || 'Sukla Paksha'

        const yogaText = Array.isArray(panchanga.yoga)
          ? panchanga.yoga[0]?.name || 'Siddha'
          : panchanga.yoga?.name || 'Siddha'

        const karanaText = Array.isArray(panchanga.karana)
          ? panchanga.karana[0]?.name || 'Bava'
          : panchanga.karana?.name || 'Bava'

        return (
          <div className="radar-section panchanga-section">
            <p className="eyebrow">Panchanga Coordinates</p>
            <div className="panchanga-capsule-grid">
              <div className="panchanga-capsule">
                <span className="cap-label">Vara (Day)</span>
                <strong>{vaaraText}</strong>
              </div>
              <div className="panchanga-capsule">
                <span className="cap-label">Tithi</span>
                <strong title={tithiText}>{tithiText}</strong>
              </div>
              <div className="panchanga-capsule">
                <span className="cap-label">Yoga</span>
                <strong title={yogaText}>{yogaText}</strong>
              </div>
              <div className="panchanga-capsule">
                <span className="cap-label">Karana</span>
                <strong title={karanaText}>{karanaText}</strong>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 4. WORKSPACE QUICK-NAV CHIPS */}
      <div className="radar-section quick-nav-section">
        <p className="eyebrow">Explore Modules</p>
        <div className="quick-nav-grid">
          <button
            type="button"
            className={`quick-nav-btn ${tableTab === 'planets' ? 'active' : ''}`}
            onClick={() => onSelectTableTab('planets')}
          >
            🪐 Planets Table
          </button>
          <button
            type="button"
            className={`quick-nav-btn ${tableTab === 'houses' ? 'active' : ''}`}
            onClick={() => onSelectTableTab('houses')}
          >
            🏛️ Houses Table
          </button>
          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => onNavigateToNav?.('Charts')}
          >
            📐 16 Vargas (D1–D60)
          </button>
          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => onNavigateToNav?.('Timing')}
          >
            ⏱️ 6-Level Dashas
          </button>
          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => onNavigateToNav?.('Analysis')}
          >
            ⚡ Classical Yogas
          </button>
        </div>
      </div>
    </div>
  )
}
