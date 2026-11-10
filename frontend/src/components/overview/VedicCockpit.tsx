import React from 'react'
import type { AstroChart } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'
import { useNow } from '../../hooks/useNow'
import { parseDateMs } from '../timing/dashaUtils'

interface VedicCockpitProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onNavigateToAnalysis?: () => void
  onNavigateToTiming?: () => void
}

export const VedicCockpit: React.FC<VedicCockpitProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
  onNavigateToAnalysis,
  onNavigateToTiming,
}) => {
  const now = useNow(30000)
  const { quickFacts, metadata, panchanga, planets, houses, yogas } = chart

  // Lagna planet & lord details
  const lagnaHouse = houses.find((h) => h.number === 1) || houses[0]
  const lagnaLordPlanet = planets.find((p) => p.name === lagnaHouse?.lord)
  const lagnaSignInfo = ZODIAC_SIGNS.find((s) => s.name === lagnaHouse?.sign) || ZODIAC_SIGNS[0]

  // Moon planet details
  const moonPlanet = planets.find((p) => p.name === 'Moon')
  const moonSignInfo = ZODIAC_SIGNS.find((s) => s.name === moonPlanet?.sign) || ZODIAC_SIGNS[3]

  // Sun planet details
  const sunPlanet = planets.find((p) => p.name === 'Sun')
  const sunSignInfo = ZODIAC_SIGNS.find((s) => s.name === sunPlanet?.sign) || ZODIAC_SIGNS[4]

  // Jaimini Karakas At-a-Glance
  const atmakaraka = planets.find((p) => p.charaKarakaCode === 'AK')
  const amatyakaraka = planets.find((p) => p.charaKarakaCode === 'AmK')
  const darakaraka = planets.find((p) => p.charaKarakaCode === 'DK')

  // Dignity Counts
  const dignityCounts = planets.reduce(
    (acc, p) => {
      if (p.dignity === 'Exalted') acc.exalted++
      else if (p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona') acc.own++
      else if (p.dignity === 'Debilitated') acc.debilitated++
      else if (p.dignity === 'Great Friend' || p.dignity === 'Friend') acc.friend++
      return acc
    },
    { exalted: 0, own: 0, debilitated: 0, friend: 0 }
  )

  // Motion alerts
  const retroPlanets = planets.filter((p) => p.retrograde)
  const combustPlanets = planets.filter((p) => p.combust)

  // Active Dasha Progress (if available in dashaTree)
  const dashaPeriod = chart.dashaTree?.[0]
  let dashaProgressPct = 45 // fallback visual progress
  if (dashaPeriod && dashaPeriod.start && dashaPeriod.end) {
    const s = parseDateMs(dashaPeriod.start)
    const e = parseDateMs(dashaPeriod.end)
    if (!isNaN(s) && !isNaN(e) && e > s) {
      dashaProgressPct = Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)))
    }
  }

  return (
    <section className="vedic-cockpit-grid">
      {/* 1. LAGNA (ASCENDANT & SELF) */}
      <article className="cockpit-card lagna-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill lagna-pill">
            <span className="dot" />
            <span>Ascendant • Lagna</span>
          </div>
          <span className="sign-symbol" title={lagnaSignInfo.modality}>
            {lagnaSignInfo.symbol}
          </span>
        </div>

        <div className="cockpit-main-value">
          <h2
            className="sign-title"
            onClick={() => onSelectHouse?.(1)}
            style={{ cursor: 'pointer' }}
            title="Inspect 1st House (Lagna Bhava)"
          >
            {quickFacts.lagna}
          </h2>
          <span className="degree-badge">{quickFacts.lagnaDms}</span>
        </div>

        <div className="cockpit-sub-metrics">
          <div className="metric-row">
            <span className="label">Element</span>
            <span className={`element-badge element-${lagnaSignInfo.element.toLowerCase()}`}>
              {lagnaSignInfo.element === 'Fire' ? '🔥' : lagnaSignInfo.element === 'Earth' ? '🌍' : lagnaSignInfo.element === 'Air' ? '💨' : '💧'} {lagnaSignInfo.element}
            </span>
          </div>
          <div className="metric-row">
            <span className="label">Lagna Lord (L1)</span>
            {lagnaLordPlanet ? (
              <span
                className="interactive-value"
                onClick={() => onSelectPlanet?.(lagnaLordPlanet.name)}
                title={`Inspect Lagna Lord ${lagnaLordPlanet.name} in House ${lagnaLordPlanet.houseNumber}`}
              >
                {lagnaLordPlanet.symbol} {lagnaLordPlanet.name} in H{lagnaLordPlanet.houseNumber}
                <span className={`status-dot dot-${lagnaLordPlanet.dignity?.toLowerCase().replace(/\s+/g, '-')}`} />
              </span>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      </article>

      {/* 2. CHANDRA (MOON & MIND / NAKSHATRA) */}
      <article className="cockpit-card moon-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill moon-pill">
            <span className="dot" />
            <span>Chandra • Moon Sign</span>
          </div>
          <span className="sign-symbol">{moonSignInfo.symbol}</span>
        </div>

        <div className="cockpit-main-value">
          <h2 className="sign-title">{quickFacts.moonSign}</h2>
          <span className="degree-badge">{moonPlanet?.dms || quickFacts.moonDms || '—'}</span>
        </div>

        <div className="cockpit-sub-metrics">
          <div className="metric-row">
            <span className="label">Nakshatra</span>
            <span className="highlight-text" title={`Pada ${quickFacts.moonPada}`}>
              {quickFacts.moonNakshatra} • P{quickFacts.moonPada}
            </span>
          </div>
          <div className="metric-row">
            <span className="label">Panchanga Tithi</span>
            <span className="tithi-badge">
              🌔 {panchanga?.tithi?.name || 'Vedic Day'}
            </span>
          </div>
        </div>
      </article>

      {/* 3. SURYA (SUN & ATMA) */}
      <article className="cockpit-card sun-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill sun-pill">
            <span className="dot" />
            <span>Surya • Sun Sign</span>
          </div>
          <span className="sign-symbol">{sunSignInfo.symbol}</span>
        </div>

        <div className="cockpit-main-value">
          <h2 className="sign-title">{quickFacts.sunSign}</h2>
          <span className="degree-badge">{sunPlanet?.dms || '—'}</span>
        </div>

        <div className="cockpit-sub-metrics">
          <div className="metric-row">
            <span className="label">Sun Nakshatra</span>
            <span>{sunPlanet?.nakshatra || '—'} (P{sunPlanet?.pada || 1})</span>
          </div>
          <div className="metric-row">
            <span className="label">Ayanamsha</span>
            <span title={`${metadata.ayanamsaName}: ${metadata.ayanamsaDms}`}>
              {metadata.ayanamsaName} ({metadata.ayanamsaDms.split(' ')[0]})
            </span>
          </div>
        </div>
      </article>

      {/* 4. VIMSHOTTARI TIMING COCKPIT */}
      <article
        className="cockpit-card timing-card panel"
        onClick={onNavigateToTiming}
        style={{ cursor: onNavigateToTiming ? 'pointer' : 'default' }}
        title="Click to view full 6-Level Dasha Timeline"
      >
        <div className="cockpit-header">
          <div className="cockpit-pill timing-pill">
            <span className="dot" />
            <span>Active Vimshottari Dasha</span>
          </div>
          <span className="timing-action">Explore ↗</span>
        </div>

        <div className="dasha-flow-row">
          <div className="dasha-node md-node">
            <small>Mahadasha</small>
            <strong>{quickFacts.currentMahadasha || '—'}</strong>
          </div>
          {quickFacts.currentAntardasha && (
            <>
              <span className="flow-arrow">›</span>
              <div className="dasha-node ad-node">
                <small>Antardasha</small>
                <strong>{quickFacts.currentAntardasha}</strong>
              </div>
            </>
          )}
        </div>

        <div className="dasha-progress-wrap">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${dashaProgressPct}%` }} />
          </div>
          <div className="progress-labels">
            <span>Cycle elapsed: {dashaProgressPct}%</span>
            <span>6-Level Hierarchy Active</span>
          </div>
        </div>
      </article>

      {/* 5. JAIMINI & DIGNITY SCOREBOARD */}
      <article className="cockpit-card scoreboard-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill scoreboard-pill">
            <span className="dot" />
            <span>Graha Dignity & Karakas</span>
          </div>
          {yogas && yogas.length > 0 && (
            <span
              className="yogas-pill-action"
              onClick={(e) => {
                e.stopPropagation()
                onNavigateToAnalysis?.()
              }}
              title="Click to inspect all classical yogas"
            >
              {yogas.length} Yogas Active ⚡
            </span>
          )}
        </div>

        <div className="karaka-pills-row">
          {atmakaraka && (
            <div
              className="karaka-chip"
              onClick={() => onSelectPlanet?.(atmakaraka.name)}
              title={`Atmakaraka (Soul Planet): ${atmakaraka.name}`}
            >
              <span className="karaka-code">AK</span>
              <span className="karaka-name">{atmakaraka.symbol} {atmakaraka.name}</span>
            </div>
          )}
          {amatyakaraka && (
            <div
              className="karaka-chip"
              onClick={() => onSelectPlanet?.(amatyakaraka.name)}
              title={`Amatyakaraka (Career & Intellect): ${amatyakaraka.name}`}
            >
              <span className="karaka-code">AmK</span>
              <span className="karaka-name">{amatyakaraka.symbol} {amatyakaraka.name}</span>
            </div>
          )}
          {darakaraka && (
            <div
              className="karaka-chip"
              onClick={() => onSelectPlanet?.(darakaraka.name)}
              title={`Darakaraka (Partnership & Spouse): ${darakaraka.name}`}
            >
              <span className="karaka-code">DK</span>
              <span className="karaka-name">{darakaraka.symbol} {darakaraka.name}</span>
            </div>
          )}
        </div>

        <div className="dignity-badge-strip">
          {dignityCounts.exalted > 0 && (
            <span className="mini-dignity-badge badge-exalted" title={`${dignityCounts.exalted} Exalted Planets`}>
              👑 {dignityCounts.exalted} Exalted
            </span>
          )}
          {dignityCounts.own > 0 && (
            <span className="mini-dignity-badge badge-own" title={`${dignityCounts.own} Own / Moolatrikona Planets`}>
              🏰 {dignityCounts.own} Own
            </span>
          )}
          {dignityCounts.debilitated > 0 && (
            <span className="mini-dignity-badge badge-debilitated" title={`${dignityCounts.debilitated} Debilitated Planets`}>
              ⚡ {dignityCounts.debilitated} Debil
            </span>
          )}
          {retroPlanets.length > 0 && (
            <span className="mini-dignity-badge badge-retro" title={`Retrograde: ${retroPlanets.map((p) => p.name).join(', ')}`}>
              [R] {retroPlanets.length} Vakri
            </span>
          )}
          {combustPlanets.length > 0 && (
            <span className="mini-dignity-badge badge-combust" title={`Combust: ${combustPlanets.map((p) => p.name).join(', ')}`}>
              🔥 {combustPlanets.length} Asta
            </span>
          )}
        </div>
      </article>
    </section>
  )
}
