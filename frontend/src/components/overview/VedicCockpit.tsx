import React from 'react'
import type { AstroChart, PlanetPosition } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'
import { useNow } from '../../hooks/useNow'
import { parseDateMs } from '../timing/dashaUtils'
import { useKundliStore } from '../../context/KundliContext'

export interface VedicCockpitProps {
  chart?: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onNavigateToAnalysis?: () => void
  onNavigateToTiming?: () => void
  onNavigateToTransits?: () => void
}

// All 7 Jaimini Chara Karaka codes with display metadata
const KARAKA_META: { code: string; label: string; meaning: string; color: string }[] = [
  { code: 'AK',  label: 'Ātma',    meaning: 'Soul & Self',           color: '#f6db9d' },
  { code: 'AmK', label: 'Amātya',  meaning: 'Career & Intellect',    color: '#34d399' },
  { code: 'BK',  label: 'Bhrātru', meaning: 'Siblings & Courage',    color: '#38bdf8' },
  { code: 'MK',  label: 'Mātru',   meaning: 'Mother & Home',         color: '#c084fc' },
  { code: 'PK',  label: 'Putra',   meaning: 'Children & Creativity', color: '#fb923c' },
  { code: 'GK',  label: 'Jñāti',   meaning: 'Obstacles & Adversity', color: '#f87171' },
  { code: 'DK',  label: 'Dāra',    meaning: 'Spouse & Partnership',  color: '#a78bfa' },
]

export const VedicCockpit: React.FC<VedicCockpitProps> = (props) => {
  const store = useKundliStore()
  const chart = props.chart || store.chart
  if (!chart) return null

  const onSelectPlanet = props.onSelectPlanet ?? store.selectPlanet
  const onSelectHouse = props.onSelectHouse ?? store.selectHouse
  const onNavigateToAnalysis = props.onNavigateToAnalysis ?? (() => store.setSelectedNav('Analysis'))
  const onNavigateToTiming = props.onNavigateToTiming ?? (() => {
    store.setSelectedNav('Timing')
    store.setInspectorTab('dasha')
    store.setIsInspectorOpen(true)
  })
  const onNavigateToTransits = props.onNavigateToTransits ?? (() => store.setSelectedNav('Transits'))

  const now = useNow(30000)
  const { quickFacts, metadata, panchanga, planets, houses, yogas } = chart

  // ── Lagna ──────────────────────────────────────────────────────────────────
  const lagnaHouse    = houses.find((h) => h.number === 1) || houses[0]
  const lagnaLordPlanet = planets.find((p) => p.name === lagnaHouse?.lord)
  const lagnaSignInfo = ZODIAC_SIGNS.find((s) => s.name === lagnaHouse?.sign) || ZODIAC_SIGNS[0]

  // ── Moon ───────────────────────────────────────────────────────────────────
  const moonPlanet  = planets.find((p) => p.name === 'Moon')
  const moonSignInfo = ZODIAC_SIGNS.find((s) => s.name === moonPlanet?.sign) || ZODIAC_SIGNS[3]

  // ── Sun ────────────────────────────────────────────────────────────────────
  const sunPlanet   = planets.find((p) => p.name === 'Sun')
  const sunSignInfo = ZODIAC_SIGNS.find((s) => s.name === sunPlanet?.sign) || ZODIAC_SIGNS[4]

  // ── Dasha progress ─────────────────────────────────────────────────────────
  const dashaPeriod = chart.dashaTree?.[0]
  let dashaProgressPct = 45
  if (dashaPeriod?.start && dashaPeriod?.end) {
    const s = parseDateMs(dashaPeriod.start)
    const e = parseDateMs(dashaPeriod.end)
    if (!isNaN(s) && !isNaN(e) && e > s) {
      dashaProgressPct = Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)))
    }
  }

  // ── Jaimini Karakas map ────────────────────────────────────────────────────
  const karakaMap = new Map<string, PlanetPosition>()
  for (const p of planets) {
    if (p.charaKarakaCode) karakaMap.set(p.charaKarakaCode, p)
  }

  // ── Dignity & motion summary ───────────────────────────────────────────────
  const dignityCounts = planets.reduce(
    (acc, p) => {
      if      (p.dignity === 'Exalted')                                acc.exalted++
      else if (p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona') acc.own++
      else if (p.dignity === 'Debilitated')                            acc.debilitated++
      return acc
    },
    { exalted: 0, own: 0, debilitated: 0 },
  )

  const retroPlanets   = planets.filter((p) => p.retrograde)
  const combustPlanets = planets.filter((p) => p.combust)
  const activeYogas    = yogas ? yogas.filter((y) => y.present).length : 0

  return (
    <section className="vedic-cockpit-grid">

      {/* ── 1. LAGNA ─────────────────────────────────────────────────────── */}
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
            <span className="label">Nature & Quality</span>
            <span className="highlight-text">{lagnaSignInfo.modality} • {lagnaSignInfo.sanskrit}</span>
          </div>
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

      {/* ── 2. CHANDRA ───────────────────────────────────────────────────── */}
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
            <span className="label">Chandra Bhava</span>
            <span className="highlight-text">
              {moonPlanet ? `House ${moonPlanet.houseNumber} (${moonPlanet.dignity || 'Neutral'})` : '—'}
            </span>
          </div>
          <div className="metric-row">
            <span className="label">Panchanga Tithi</span>
            <span className="tithi-badge">
              🌔 {Array.isArray(panchanga?.tithi) ? panchanga.tithi[0]?.name : panchanga?.tithi?.name || 'Vedic Day'}
            </span>
          </div>
        </div>
      </article>

      {/* ── 3. SURYA ─────────────────────────────────────────────────────── */}
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
            <span className="label">Surya Bhava</span>
            <span className="highlight-text">
              {sunPlanet ? `House ${sunPlanet.houseNumber} (${sunPlanet.dignity || 'Neutral'})` : '—'}
            </span>
          </div>
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

      {/* ── 4. VIMSHOTTARI TIMING ────────────────────────────────────────── */}
      <article
        className="cockpit-card timing-card panel"
        onClick={onNavigateToTiming}
        style={{ cursor: 'pointer' }}
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
          {quickFacts.currentPratyantardasha && (
            <>
              <span className="flow-arrow">›</span>
              <div className="dasha-node pd-node">
                <small>Pratyantar</small>
                <strong>{quickFacts.currentPratyantardasha}</strong>
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

      {/* ── 5. JAIMINI CHARA KARAKAS ─────────────────────────────────────── */}
      <article className="cockpit-card karakas-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill karakas-pill">
            <span className="dot" />
            <span>Jaimini • Chara Karakas</span>
          </div>
          {karakaMap.has('AK') && (
            <span
              style={{ fontSize: '0.68rem', color: '#f6db9d', fontWeight: 700, opacity: 0.9 }}
              title="Ātmakaraka — the soul planet with the highest degrees in its sign"
            >
              AK: {karakaMap.get('AK')!.symbol} {karakaMap.get('AK')!.name}
            </span>
          )}
        </div>

        {/* 7-Karaka grid: AK as full-width hero, remaining 6 paired 2x3 */}
        <div className="karaka-grid">
          {KARAKA_META.map(({ code, label, meaning, color }) => {
            const planet = karakaMap.get(code)
            const isHero = code === 'AK'
            return (
              <div
                key={code}
                className={`karaka-grid-cell ${isHero ? 'karaka-cell-hero' : ''}`}
                onClick={() => planet && onSelectPlanet?.(planet.name)}
                style={{ cursor: planet ? 'pointer' : 'default', opacity: planet ? 1 : 0.35 }}
                title={planet ? `${label}karaka (${meaning}): ${planet.name} at ${planet.dms} in ${planet.sign}` : `${label}karaka — not assigned`}
              >
                <span className="karaka-code-sm" style={{ color }}>
                  {code}
                </span>
                <div className="karaka-cell-body">
                  <span className="karaka-cell-planet" style={{ color: planet ? '#f1f5f9' : '#475569' }}>
                    {planet ? `${planet.symbol} ${planet.name}` : '—'}
                  </span>
                  <span className="karaka-cell-meaning">{meaning}</span>
                </div>
                {planet && (
                  <span className="karaka-cell-house" title={`House ${planet.houseNumber}`}>
                    H{planet.houseNumber}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </article>

      {/* ── 6. GRAHA STATUS SCOREBOARD ───────────────────────────────────── */}
      <article className="cockpit-card scoreboard-card panel">
        <div className="cockpit-header">
          <div className="cockpit-pill scoreboard-pill">
            <span className="dot" />
            <span>Graha Status</span>
          </div>
          {/* Quick-nav shortcuts */}
          <div style={{ display: 'flex', gap: 5 }}>
            {onNavigateToTransits && (
              <span
                className="yogas-pill-action"
                style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                onClick={(e) => { e.stopPropagation(); onNavigateToTransits() }}
                title="Open Live Gochara (Transits) & Sade Sati Tracker"
              >
                🪐 Transits
              </span>
            )}
            {activeYogas > 0 && (
              <span
                className="yogas-pill-action"
                onClick={(e) => { e.stopPropagation(); onNavigateToAnalysis?.() }}
                title={`${activeYogas} active yogas out of ${yogas?.length || 0} evaluated`}
              >
                {activeYogas} Yogas ⚡
              </span>
            )}
          </div>
        </div>

        {/* Dignity counts — 3 big numbers in a row */}
        <div className="dignity-score-row">
          <div className="dignity-score-cell" title={`${dignityCounts.exalted} planets in exaltation`}>
            <span className="dignity-score-num" style={{ color: '#fbbf24' }}>{dignityCounts.exalted}</span>
            <span className="dignity-score-label">👑 Exalted</span>
          </div>
          <div className="dignity-score-cell" title={`${dignityCounts.own} planets in own sign or moolatrikona`}>
            <span className="dignity-score-num" style={{ color: '#34d399' }}>{dignityCounts.own}</span>
            <span className="dignity-score-label">🏰 Own / MTK</span>
          </div>
          <div className="dignity-score-cell" title={`${dignityCounts.debilitated} planets in debilitation`}>
            <span className="dignity-score-num" style={{ color: '#f87171' }}>{dignityCounts.debilitated}</span>
            <span className="dignity-score-label">⬇ Debilitated</span>
          </div>
        </div>

        {/* Motion & combustion alerts row */}
        <div className="dignity-badge-strip">
          {retroPlanets.length > 0 && (
            <span
              className="mini-dignity-badge badge-retro"
              title={`Retrograde (Vakri): ${retroPlanets.map((p) => p.name).join(', ')}`}
            >
              [R] {retroPlanets.length} Vakri — {retroPlanets.map((p) => p.name).join(', ')}
            </span>
          )}
          {combustPlanets.length > 0 && (
            <span
              className="mini-dignity-badge badge-combust"
              title={`Combust (Asta): ${combustPlanets.map((p) => p.name).join(', ')}`}
            >
              🔥 {combustPlanets.length} Combust — {combustPlanets.map((p) => p.name).join(', ')}
            </span>
          )}
          {chart.shadbala && (
            <span
              className="mini-dignity-badge"
              style={{ background: 'rgba(212, 171, 92, 0.15)', color: '#fbbf24', border: '1px solid rgba(212, 171, 92, 0.3)', cursor: 'pointer' }}
              onClick={() => onSelectPlanet?.(chart.shadbala!.strongestPlanet)}
              title={`Shadbala: ${chart.shadbala.overallHealthScore}% vitality • Supreme: ${chart.shadbala.strongestPlanet} (${chart.shadbala.strongCount}/7 above requirement)`}
            >
              ⚖️ Shadbala #1: {chart.shadbala.strongestPlanet} ({chart.shadbala.overallHealthScore}%)
            </span>
          )}
        </div>
      </article>

    </section>
  )
}
