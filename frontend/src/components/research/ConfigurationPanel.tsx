import React, { useState } from 'react'
import type { AstroChart } from '../../types/astro'

export interface CalculationSettingsConfig {
  ayanamsa: string
  house_system: string
  node_type: string
  topocentric: boolean
  apparent_positions: boolean
  sunrise_mode: string
  dasha_year_length: string
}

interface ConfigurationPanelProps {
  chart: AstroChart
  onApplySettings?: (newSettings: CalculationSettingsConfig) => Promise<void> | void
  isRecalculating?: boolean
}

export const AYANAMSHA_OPTIONS = [
  { value: 'lahiri', label: 'Lahiri (Chitrapaksha)', desc: 'Standard Indian Calendar Reform Committee default (JHora 8.0)' },
  { value: 'krishnamurti', label: 'Krishnamurti (KP)', desc: 'Used extensively in KP astrology; ~0°06\' lower than Lahiri' },
  { value: 'raman', label: 'B.V. Raman', desc: 'Dr. B.V. Raman ayanamsha; ~1°27\' lower than Lahiri' },
  { value: 'yukteshwar', label: 'Sri Yukteshwar', desc: 'Swami Sri Yukteshwar Giri system (The Holy Science)' },
  { value: 'fagan_bradley', label: 'Fagan-Bradley', desc: 'Western Sidereal benchmark standard' },
  { value: 'true_citra', label: 'True Chitra (Citra Star)', desc: 'Chitra star set to exact 180° sidereal longitude' },
  { value: 'suryasiddhanta', label: 'Surya Siddhanta', desc: 'Traditional astronomical treatise precession value' },
  { value: 'tropical', label: 'Tropical (Sayana)', desc: '0° Ayanamsha (Western Tropical Zodiac relative to equinox)' },
]

export const HOUSE_SYSTEM_OPTIONS = [
  { value: 'whole_sign', label: 'Whole Sign (Parashari)', desc: 'Rashi = Bhava; 1st house is entire rising sign (Vedic default)' },
  { value: 'equal_lagna', label: 'Equal from Lagna Degree', desc: 'Each house is exactly 30° centered on or starting at Lagna' },
  { value: 'sripati', label: 'Sripati (Classical Indian)', desc: 'Unequal bhava division based on Lagna & Midheaven (MC)' },
  { value: 'kp', label: 'KP (Placidus Cusps)', desc: 'Krishnamurti Padhdhati Placidus house division' },
  { value: 'placidus', label: 'Placidus', desc: 'Time-proportional semi-arc division' },
  { value: 'koch', label: 'Koch', desc: 'Birthplace house division system' },
  { value: 'porphyry', label: 'Porphyry', desc: 'Trisection of quadrant arcs between angles' },
]

export const NODE_OPTIONS = [
  { value: 'true', label: 'True Node (Osculating)', desc: 'Instantaneous lunar orbital node including wobbles & nutation' },
  { value: 'mean', label: 'Mean Node (Averaged)', desc: 'Linear uniform precession at 19.34° per year (JHora default)' },
]

export const SUNRISE_OPTIONS = [
  { value: 'disc_upper_limb', label: 'Upper Limb of Solar Disc', desc: 'IAU standard with atmospheric refraction (Recommended by BPHS)' },
  { value: 'traditional_hindu', label: 'Traditional Hindu (Center, No Refraction)', desc: 'Swiss Ephemeris SE_BIT_HINDU_RISING' },
  { value: 'disc_center', label: 'Disc Center (With Refraction)', desc: 'Center of solar disc on true horizon' },
  { value: 'geometric_center', label: 'Geometric Center (No Refraction)', desc: 'Geometric horizon crossing' },
]

export const DASHA_YEAR_OPTIONS = [
  { value: 'sidereal', label: 'Sidereal Year (365.25636 d)', desc: 'Astronomical sidereal solar return year (Standard)' },
  { value: 'tropical', label: 'Tropical Year (365.24219 d)', desc: 'Equinoctial year cycle' },
  { value: 'civil', label: 'Civil Year (365.25 d)', desc: 'Standard Julian 365.25 day calendar year' },
  { value: 'savana', label: 'Savana Year (360 days)', desc: 'Traditional 360-day Vedic solar year (12 months of 30 days)' },
]

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  chart,
  onApplySettings,
  isRecalculating = false,
}) => {
  // Infer active settings from chart.raw or metadata
  const currentSettings = chart.raw?.rasi?.settings || {}

  const [ayanamsa, setAyanamsa] = useState<string>(currentSettings.ayanamsa || 'lahiri')
  const [houseSystem, setHouseSystem] = useState<string>(currentSettings.house_system || 'whole_sign')
  const [nodeType, setNodeType] = useState<string>(currentSettings.node_type || 'true')
  const [topocentric, setTopocentric] = useState<boolean>(Boolean(currentSettings.topocentric))
  const [apparentPositions, setApparentPositions] = useState<boolean>(Boolean(currentSettings.apparent_positions))
  const [sunriseMode, setSunriseMode] = useState<string>(currentSettings.sunrise_mode || 'disc_upper_limb')
  const [dashaYearLength, setDashaYearLength] = useState<string>(currentSettings.dasha_year_length || 'sidereal')

  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const isModified =
    ayanamsa !== (currentSettings.ayanamsa || 'lahiri') ||
    houseSystem !== (currentSettings.house_system || 'whole_sign') ||
    nodeType !== (currentSettings.node_type || 'true') ||
    topocentric !== Boolean(currentSettings.topocentric) ||
    apparentPositions !== Boolean(currentSettings.apparent_positions) ||
    sunriseMode !== (currentSettings.sunrise_mode || 'disc_upper_limb') ||
    dashaYearLength !== (currentSettings.dasha_year_length || 'sidereal')

  const handleApply = async () => {
    if (!onApplySettings) return
    setSaveStatus('Applying settings...')
    try {
      await onApplySettings({
        ayanamsa,
        house_system: houseSystem,
        node_type: nodeType,
        topocentric,
        apparent_positions: apparentPositions,
        sunrise_mode: sunriseMode,
        dasha_year_length: dashaYearLength,
      })
      setSaveStatus('✓ Calculation settings updated!')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err: any) {
      setSaveStatus(`Failed: ${err.message || 'Error updating settings'}`)
    }
  }

  const handleResetDefaults = () => {
    setAyanamsa('lahiri')
    setHouseSystem('whole_sign')
    setNodeType('true')
    setTopocentric(false)
    setApparentPositions(false)
    setSunriseMode('disc_upper_limb')
    setDashaYearLength('sidereal')
  }

  return (
    <div className="configuration-panel-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Panel */}
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.35rem',
            }}
          >
            ⚙️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Calculation Engine & Ephemeris Configuration (PRD §20)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Control astronomical parameters, sidereal reference planes, bhava algorithms, and nodal definitions
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isRecalculating}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↺ Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isRecalculating || !isModified}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: isModified ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              background: isModified
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(255, 255, 255, 0.05)',
              color: isModified ? '#ffffff' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isModified && !isRecalculating ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isModified ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {isRecalculating ? '⏳ Recomputing...' : '⚡ Apply & Recompute Chart'}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: saveStatus.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${saveStatus.startsWith('✓') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
            color: saveStatus.startsWith('✓') ? '#34d399' : '#38bdf8',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          {saveStatus}
        </div>
      )}

      {/* Configuration Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        {/* Setting 1: Ayanamsha System */}
        <div className="panel" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700 }}>
                1. Ayanamsha (Precession Model)
              </label>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(212, 171, 92, 0.15)',
                  color: '#fbbf24',
                  fontWeight: 600,
                }}
              >
                Active: {chart.metadata.ayanamsaName}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              Defines the angular offset between the moving vernal equinox and the fixed sidereal stars.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AYANAMSHA_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: ayanamsa === opt.value ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${ayanamsa === opt.value ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.04)'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="ayanamsa"
                  value={opt.value}
                  checked={ayanamsa === opt.value}
                  onChange={() => setAyanamsa(opt.value)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: '0.84rem', color: ayanamsa === opt.value ? '#38bdf8' : '#f8fafc', fontWeight: 600 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Setting 2: House System */}
        <div className="panel" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700 }}>
                2. House System (Bhava Chalita)
              </label>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 600,
                }}
              >
                Current: {houseSystem}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              Algorithm used to demarcate house boundaries (Arambha, Madhya, Virama).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {HOUSE_SYSTEM_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: houseSystem === opt.value ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${houseSystem === opt.value ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255, 255, 255, 0.04)'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="houseSystem"
                  value={opt.value}
                  checked={houseSystem === opt.value}
                  onChange={() => setHouseSystem(opt.value)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: '0.84rem', color: houseSystem === opt.value ? '#c084fc' : '#f8fafc', fontWeight: 600 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Setting 3: Lunar Node Mode (Rahu / Ketu) */}
        <div className="panel" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, display: 'block' }}>
              3. Lunar Node Type (Rahu & Ketu)
            </label>
            <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              True nodes account for instantaneous gravitational perturbation by the Sun.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NODE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: nodeType === opt.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${nodeType === opt.value ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.04)'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="nodeType"
                  value={opt.value}
                  checked={nodeType === opt.value}
                  onChange={() => setNodeType(opt.value)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: '0.84rem', color: nodeType === opt.value ? '#34d399' : '#f8fafc', fontWeight: 600 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Dasha Year Length */}
          <div style={{ marginTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 14 }}>
            <label style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 700, display: 'block' }}>
              Vimshottari Dasha Year Reckoning
            </label>
            <select
              value={dashaYearLength}
              onChange={(e) => setDashaYearLength(e.target.value)}
              style={{
                width: '100%',
                marginTop: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '0.82rem',
              }}
            >
              {DASHA_YEAR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ background: '#0f172a' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Setting 4: Sunrise & Ephemeris Flags */}
        <div className="panel" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, display: 'block' }}>
              4. Sunrise Definition & Ephemeris Flags
            </label>
            <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              Determines Ahargana, Vaara boundary, and day/night birth distinction.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SUNRISE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: sunriseMode === opt.value ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  border: `1px solid ${sunriseMode === opt.value ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: '#cbd5e1',
                }}
              >
                <input
                  type="radio"
                  name="sunriseMode"
                  value={opt.value}
                  checked={sunriseMode === opt.value}
                  onChange={() => setSunriseMode(opt.value)}
                  style={{ marginTop: 2 }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={topocentric}
                onChange={(e) => setTopocentric(e.target.checked)}
              />
              <span>Topocentric positions (surface observer parallax)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={apparentPositions}
                onChange={(e) => setApparentPositions(e.target.checked)}
              />
              <span>Apparent positions (light-time & stellar aberration)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ephemeris Metadata & Benchmark Specifications */}
      <div
        className="panel"
        style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700 }}>
          🏛️ Computational Engine Specifications & Benchmark Parity
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            fontSize: '0.78rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: 2 }}>Ephemeris Kernel</strong>
            Swiss Ephemeris (SWEPH) / NASA JPL DE431 integration. High precision planetary ephemerides accurate to ±0.001 arcseconds over historical millennia.
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: 2 }}>Precession & Nutation Model</strong>
            IAU 2006 / 2000A precession formulations with complete short-period nutation series in longitude ($\Delta\psi$) and obliquity ($\Delta\epsilon$).
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
            <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: 2 }}>Jagannatha Hora (JHora) Parity</strong>
            Settings defaults mirror JHora 8.0 factory configuration (Chitrapaksha Lahiri, Whole Sign, True Rahu, DISC_UPPER_LIMB sunrise).
          </div>
        </div>
      </div>
    </div>
  )
}
