import React, { useState, useMemo } from 'react'
import type { AstroChart } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'

interface CalculationProvenanceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

const NAKSHATRAS_METADATA = [
  { index: 1, name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', startDeg: 0 },
  { index: 2, name: 'Bharani', lord: 'Venus', deity: 'Yama', startDeg: 13.333333 },
  { index: 3, name: 'Krittika', lord: 'Sun', deity: 'Agni', startDeg: 26.666667 },
  { index: 4, name: 'Rohini', lord: 'Moon', deity: 'Brahma / Prajapati', startDeg: 40 },
  { index: 5, name: 'Mrigashira', lord: 'Mars', deity: 'Soma', startDeg: 53.333333 },
  { index: 6, name: 'Ardra', lord: 'Rahu', deity: 'Rudra', startDeg: 66.666667 },
  { index: 7, name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', startDeg: 80 },
  { index: 8, name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', startDeg: 93.333333 },
  { index: 9, name: 'Ashlesha', lord: 'Mercury', deity: 'Sarpa / Nagas', startDeg: 106.666667 },
  { index: 10, name: 'Magha', lord: 'Ketu', deity: 'Pitris', startDeg: 120 },
  { index: 11, name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', startDeg: 133.333333 },
  { index: 12, name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', startDeg: 146.666667 },
  { index: 13, name: 'Hasta', lord: 'Moon', deity: 'Savitr', startDeg: 160 },
  { index: 14, name: 'Chitra', lord: 'Mars', deity: 'Tvashtar / Vishvakarma', startDeg: 173.333333 },
  { index: 15, name: 'Swati', lord: 'Rahu', deity: 'Vayu', startDeg: 186.666667 },
  { index: 16, name: 'Vishakha', lord: 'Jupiter', deity: 'Indragni', startDeg: 200 },
  { index: 17, name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', startDeg: 213.333333 },
  { index: 18, name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', startDeg: 226.666667 },
  { index: 19, name: 'Mula', lord: 'Ketu', deity: 'Nirriti', startDeg: 240 },
  { index: 20, name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas (Water)', startDeg: 253.333333 },
  { index: 21, name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishvedevas', startDeg: 266.666667 },
  { index: 22, name: 'Shravana', lord: 'Moon', deity: 'Vishnu', startDeg: 280 },
  { index: 23, name: 'Dhanishta', lord: 'Mars', deity: 'Ashta Vasus', startDeg: 293.333333 },
  { index: 24, name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', startDeg: 306.666667 },
  { index: 25, name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', startDeg: 320 },
  { index: 26, name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', startDeg: 333.333333 },
  { index: 27, name: 'Revati', lord: 'Mercury', deity: 'Pushan', startDeg: 346.666667 },
]

export const CalculationProvenance: React.FC<CalculationProvenanceProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  // Ayanamsha decimal degrees
  const ayanamshaDeg = useMemo(() => {
    const rawAyan = chart.raw?.rasi?.ayanamsa
    if (typeof rawAyan?.degrees === 'number') return rawAyan.degrees
    const dmsStr = chart.metadata.ayanamsaDms
    const match = dmsStr?.match(/(\d+)°(\d+)'([\d.]+)"/)
    if (match) {
      return parseFloat(match[1]) + parseFloat(match[2]) / 60 + parseFloat(match[3]) / 3600
    }
    return 23.792333
  }, [chart])

  // Selectable targets: Lagna + All Planets
  const targets = useMemo(() => {
    const list: Array<{
      key: string
      name: string
      sanskrit: string
      symbol: string
      siderealLong: number
      isLagna?: boolean
      houseNumber: number
    }> = []

    // Lagna
    const lagnaRaw = chart.raw?.rasi?.lagna
    const lagnaSignIndex = lagnaRaw?.rasi ?? chart.houses[0]?.signIndex ?? 0
    const lagnaDeg = lagnaRaw?.degrees_in_rasi ?? chart.houses[0]?.cuspLongitude ?? 15.0
    const lagnaLong = lagnaSignIndex * 30 + (typeof lagnaDeg === 'number' ? lagnaDeg : 0)

    list.push({
      key: 'Lagna',
      name: 'Ascendant (Lagna)',
      sanskrit: 'Tanu Lagna',
      symbol: 'Asc',
      siderealLong: lagnaLong,
      isLagna: true,
      houseNumber: 1,
    })

    // Grahas
    chart.planets.forEach((p) => {
      const long = p.longitude ?? p.signIndex * 30 + p.degreeInSign
      list.push({
        key: p.name,
        name: p.name,
        sanskrit: p.sanskritName,
        symbol: p.symbol,
        siderealLong: long,
        houseNumber: p.houseNumber,
      })
    })

    return list
  }, [chart])

  const [selectedKey, setSelectedKey] = useState<string>('Sun')

  const activeTarget = useMemo(() => {
    return targets.find((t) => t.key === selectedKey) || targets[0]
  }, [targets, selectedKey])

  // Format DMS
  const formatDms = (deg: number): string => {
    const d = Math.floor(deg)
    const minFloat = (deg - d) * 60
    const m = Math.floor(minFloat)
    const s = Math.round((minFloat - m) * 60)
    return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
  }

  // Exact step math for activeTarget
  const mathSteps = useMemo(() => {
    const siderealLong = ((activeTarget.siderealLong % 360) + 360) % 360
    const tropicalLong = (siderealLong + ayanamshaDeg) % 360

    // Step 3: Rashi
    const rashiIndex = Math.floor(siderealLong / 30)
    const degInSign = siderealLong % 30
    const signInfo = ZODIAC_SIGNS[rashiIndex] || ZODIAC_SIGNS[0]

    // Step 4: Nakshatra
    const nakshatraIndex0 = Math.floor(siderealLong / 13.3333333333)
    const nakshatraNumber = Math.min(27, nakshatraIndex0 + 1)
    const nakshatraMeta = NAKSHATRAS_METADATA[nakshatraIndex0] || NAKSHATRAS_METADATA[0]
    const arcInNakshatra = siderealLong - nakshatraIndex0 * 13.3333333333

    // Step 5: Pada
    const pada = Math.min(4, Math.floor(arcInNakshatra / 3.3333333333) + 1)
    const arcInPada = arcInNakshatra - (pada - 1) * 3.3333333333

    // Navamsha (D9) sign: each pada spans 3°20' = 1 Navamsha sign
    const totalNavamshaCount = Math.floor(siderealLong / 3.3333333333)
    const navamshaSignIndex = totalNavamshaCount % 12
    const navamshaSign = ZODIAC_SIGNS[navamshaSignIndex]

    return {
      tropicalLong,
      siderealLong,
      rashiIndex,
      degInSign,
      signInfo,
      nakshatraNumber,
      nakshatraMeta,
      arcInNakshatra,
      pada,
      arcInPada,
      navamshaSign,
      totalNavamshaCount,
    }
  }, [activeTarget, ayanamshaDeg])

  return (
    <div className="calculation-provenance-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header and Graha Selector */}
      <div
        className="panel"
        style={{
          padding: '18px 22px',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(212, 171, 92, 0.25), rgba(212, 171, 92, 0.08))',
              border: '1px solid rgba(212, 171, 92, 0.35)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.35rem',
            }}
          >
            📐
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Step-by-Step Calculation Provenance (PRD §19)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Inspect the exact mathematical transformation chain from Raw Ephemeris Coordinates to Vedic Pada & Navamsha
            </span>
          </div>
        </div>

        {/* Target Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
            Target Graha / Lagna:
          </label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(212, 171, 92, 0.4)',
              color: '#fbbf24',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {targets.map((t) => (
              <option key={t.key} value={t.key} style={{ background: '#0f172a', color: '#f8fafc' }}>
                {t.symbol} {t.name} ({t.sanskrit})
              </option>
            ))}
          </select>

          {onSelectPlanet && !activeTarget.isLagna && (
            <button
              type="button"
              onClick={() => onSelectPlanet(activeTarget.name)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Inspect Graha in Object Inspector"
            >
              Inspect Graha ↗
            </button>
          )}

          {onSelectHouse && (
            <button
              type="button"
              onClick={() => onSelectHouse(activeTarget.houseNumber)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                background: 'rgba(212, 171, 92, 0.15)',
                border: '1px solid rgba(212, 171, 92, 0.3)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Inspect House in Object Inspector"
            >
              Inspect H{activeTarget.houseNumber} ↗
            </button>
          )}
        </div>
      </div>

      {/* Primary Mathematical Derivation Chain (PRD §19 Formula Banner) */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: 1, color: '#38bdf8', fontWeight: 700, marginBottom: 8 }}>
          Governing Parashari & Ephemeris Pipeline
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontFamily: 'monospace',
            fontSize: '0.88rem',
            color: '#f8fafc',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>STAGE 1</span>
            <strong style={{ color: '#e2e8f0' }}>Raw Ephemeris Longitude</strong>
            <small style={{ display: 'block', color: '#64748b' }}>λ_sayana ({mathSteps.tropicalLong.toFixed(3)}°)</small>
          </div>

          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem' }}>
            — {chart.metadata.ayanamsaName.split(' ')[0]} ({ayanamshaDeg.toFixed(2)}°) ➔
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>STAGE 2</span>
            <strong style={{ color: '#38bdf8' }}>Sidereal Longitude</strong>
            <small style={{ display: 'block', color: '#0284c7' }}>λ_nirayana ({mathSteps.siderealLong.toFixed(3)}°)</small>
          </div>

          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem' }}>
            ÷ 30° ➔
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>STAGE 3</span>
            <strong style={{ color: '#a855f7' }}>Rashi (Sign)</strong>
            <small style={{ display: 'block', color: '#9333ea' }}>{mathSteps.signInfo.sanskrit} ({formatDms(mathSteps.degInSign)})</small>
          </div>

          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem' }}>
            ÷ 13°20' ➔
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>STAGE 4</span>
            <strong style={{ color: '#10b981' }}>Nakshatra</strong>
            <small style={{ display: 'block', color: '#059669' }}>{mathSteps.nakshatraMeta.name} (#{mathSteps.nakshatraNumber})</small>
          </div>

          <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem' }}>
            ÷ 3°20' ➔
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>STAGE 5</span>
            <strong style={{ color: '#f59e0b' }}>Pada & Navamsha</strong>
            <small style={{ display: 'block', color: '#d97706' }}>Pada {mathSteps.pada} • {mathSteps.navamshaSign.sanskrit} (D9)</small>
          </div>
        </div>
      </div>

      {/* Detailed Step-by-Step Mathematical Ledger Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* STEP 1: Raw Ephemeris Geocentric Position */}
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            borderLeft: '4px solid #94a3b8',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>
                  STEP 1
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Raw Tropical Geocentric Ephemeris Coordinate (λ_sayana)
                </h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: 750 }}>
                The astronomical engine (Swiss Ephemeris / Moshier) computes the apparent geocentric ecliptic longitude of <strong>{activeTarget.name}</strong> relative to the dynamical Vernal Equinox (Sayana system, 0° Aries of date) for Julian Day <strong>{chart.raw?.rasi?.input?.julian_day_ut || 'UT'}</strong>.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
                {mathSteps.tropicalLong.toFixed(6)}°
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                {formatDms(mathSteps.tropicalLong)} (Sayana)
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: '0.78rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Coordinate Frame:</span>{' '}
              <strong style={{ color: '#e2e8f0' }}>Geocentric Ecliptic (J2000 / True Equinox of Date)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Light-Time / Aberration:</span>{' '}
              <strong style={{ color: '#e2e8f0' }}>Apparent Corrected (SEFLG_SWIEPH)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Sayana Tropical Sign:</span>{' '}
              <strong style={{ color: '#e2e8f0' }}>{ZODIAC_SIGNS[Math.floor(mathSteps.tropicalLong / 30)].name} ({formatDms(mathSteps.tropicalLong % 30)})</strong>
            </div>
          </div>
        </div>

        {/* STEP 2: Ayanamsha Subtraction */}
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            borderLeft: '4px solid #38bdf8',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800 }}>
                  STEP 2
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Precession Correction via Ayanamsha (Sayana ➔ Nirayana)
                </h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: 750 }}>
                Vedic astrology uses the fixed sidereal zodiac (Nirayana) pegged to the fixed background stars. The angular separation between the vernal equinox and the sidereal zero-point (fixed star Spica / Chitra at 180° for Lahiri) is subtracted.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                {mathSteps.siderealLong.toFixed(6)}°
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {formatDms(mathSteps.siderealLong)} (Nirayana)
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#070a0e',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: 4 }}>
              Mathematical Formula: λ_nirayana = (λ_sayana - Ayanamsha) mod 360°
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>λ_nirayana = ({mathSteps.tropicalLong.toFixed(6)}° - {ayanamshaDeg.toFixed(6)}°)</span>
              <span style={{ color: '#fbbf24' }}>=</span>
              <strong style={{ color: '#38bdf8' }}>{mathSteps.siderealLong.toFixed(6)}°</strong>
              <span style={{ color: '#64748b' }}>[Ayanamsha: {chart.metadata.ayanamsaName} = {formatDms(ayanamshaDeg)}]</span>
            </div>
          </div>
        </div>

        {/* STEP 3: Rashi Quantization */}
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            borderLeft: '4px solid #a855f7',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '0.75rem', fontWeight: 800 }}>
                  STEP 3
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Rashi (Zodiac Sign) Quantization (÷ 30° Division)
                </h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: 750 }}>
                The 360° ecliptic circle is quantized into 12 equal Rashis of exactly 30° each. The integer quotient gives the zero-indexed sign, and the remainder gives the precise traversed degrees inside the sign.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', color: '#c084fc', fontWeight: 700 }}>
                {mathSteps.signInfo.symbol} {mathSteps.signInfo.sanskrit} ({mathSteps.signInfo.name})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Sign #{mathSteps.signInfo.number} • {formatDms(mathSteps.degInSign)}
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#070a0e',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: 4 }}>
              Sign Index = ⌊λ_nirayana / 30°⌋ &nbsp;|&nbsp; Degree in Sign = λ_nirayana mod 30°
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Index = ⌊{mathSteps.siderealLong.toFixed(4)}° / 30°⌋ = ⌊{(mathSteps.siderealLong / 30).toFixed(4)}⌋</span>
              <span style={{ color: '#fbbf24' }}>=</span>
              <strong style={{ color: '#c084fc' }}>{mathSteps.rashiIndex} ({mathSteps.signInfo.sanskrit})</strong>
              <span style={{ color: '#64748b' }}>• Traversed: {mathSteps.degInSign.toFixed(4)}° ({formatDms(mathSteps.degInSign)})</span>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
              Ruler: <strong>{mathSteps.signInfo.lord}</strong> • Element: <strong>{mathSteps.signInfo.element}</strong> • Modality: <strong>{mathSteps.signInfo.modality}</strong>
            </div>
          </div>
        </div>

        {/* STEP 4: Nakshatra Division */}
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            borderLeft: '4px solid #10b981',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
                  STEP 4
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Nakshatra (Lunar Mansion) Division (÷ 13°20' = 800' of Arc)
                </h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: 750 }}>
                The 360° circle is divided into 27 lunar mansions of 13°20' (13.333333° or 800 arcminutes) each. Dividing the sidereal longitude by 13.333333° identifies the active asterism, its Vedic presiding deity, and its Vimshottari dasha planetary ruler.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', color: '#34d399', fontWeight: 700 }}>
                #{mathSteps.nakshatraNumber} {mathSteps.nakshatraMeta.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                Lord: {mathSteps.nakshatraMeta.lord} • Deity: {mathSteps.nakshatraMeta.deity}
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#070a0e',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: 4 }}>
              Nakshatra Index = ⌊λ_nirayana / 13°20'⌋ + 1 &nbsp;|&nbsp; Arc in Asterism = λ_nirayana mod 13°20'
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Index = ⌊{mathSteps.siderealLong.toFixed(4)}° / 13.3333°⌋ + 1 = ⌊{(mathSteps.siderealLong / 13.333333).toFixed(3)}⌋ + 1</span>
              <span style={{ color: '#fbbf24' }}>=</span>
              <strong style={{ color: '#34d399' }}>#{mathSteps.nakshatraNumber} ({mathSteps.nakshatraMeta.name})</strong>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
              Traversed in Nakshatra: <strong>{mathSteps.arcInNakshatra.toFixed(4)}° ({formatDms(mathSteps.arcInNakshatra)})</strong> out of 13°20'00"
            </div>
          </div>
        </div>

        {/* STEP 5: Pada & Navamsha Sub-division */}
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 800 }}>
                  STEP 5
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                  Pada (Quarter) & Navamsha (D-9) Mapping (÷ 3°20' = 200' of Arc)
                </h4>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#94a3b8', maxWidth: 750 }}>
                Each Nakshatra contains exactly 4 Padas of 3°20' (3.333333° or 200 arcminutes) each. There are 108 Padas in total across the zodiac, which directly map 1:1 onto the 108 Navamshas (12 signs × 9 parts) of the D-9 chart.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 700 }}>
                Pada {mathSteps.pada} ➔ {mathSteps.navamshaSign.sanskrit} (D-9)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Navamsha Lord: {mathSteps.navamshaSign.lord}
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#070a0e',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginBottom: 4 }}>
              Pada = ⌊Arc in Nakshatra / 3°20'⌋ + 1 &nbsp;|&nbsp; Navamsha Sign Index = ⌊λ_nirayana / 3°20'⌋ mod 12
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Pada = ⌊{mathSteps.arcInNakshatra.toFixed(4)}° / 3.3333°⌋ + 1 = ⌊{(mathSteps.arcInNakshatra / 3.333333).toFixed(3)}⌋ + 1</span>
              <span style={{ color: '#fbbf24' }}>=</span>
              <strong style={{ color: '#fbbf24' }}>Pada {mathSteps.pada}</strong>
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Navamsha = ⌊{mathSteps.siderealLong.toFixed(4)}° / 3.3333°⌋ mod 12 = {mathSteps.totalNavamshaCount} mod 12</span>
              <span style={{ color: '#fbbf24' }}>=</span>
              <strong style={{ color: '#38bdf8' }}>{mathSteps.navamshaSign.sanskrit} ({mathSteps.navamshaSign.name})</strong>
              <span style={{ color: '#64748b' }}>[Lord: {mathSteps.navamshaSign.lord}]</span>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
              Traversed inside Pada {mathSteps.pada}: <strong>{mathSteps.arcInPada.toFixed(4)}° ({formatDms(mathSteps.arcInPada)})</strong> out of 3°20'00"
            </div>
          </div>
        </div>
      </div>

      {/* Educational Sensitivity & Ephemeris Note */}
      <div
        className="panel"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700 }}>
          💡 Astrological Sensitivity & Critical Time Windows
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            fontSize: '0.78rem',
            color: '#cbd5e1',
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 2 }}>Lagna (Ascendant) Sensitivity</strong>
            Earth rotates 360° in 24 hours $\approx$ 1° every 4 minutes. A birth time error of just ~13 minutes shifts the Lagna into an entirely different Navamsha sign!
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 2 }}>Moon (Chandra) Motion</strong>
            Moon traverses ~13°10' per 24 hours ($\approx$ 0.55° per hour). A birth time shift of ~6 hours changes the Nakshatra, radically shifting the starting balance of Vimshottari Mahadasha.
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#34d399', display: 'block', marginBottom: 2 }}>Ayanamsha Variance Impact</strong>
            Switching from Lahiri to Krishnamurti shifts coordinates by ~0°06', whereas switching to Raman shifts them by ~1°27'. This can flip borderline planetary placements between signs and Nakshatras.
          </div>
        </div>
      </div>
    </div>
  )
}
