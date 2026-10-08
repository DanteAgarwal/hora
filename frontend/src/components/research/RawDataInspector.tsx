import React, { useState, useMemo } from 'react'
import type { AstroChart } from '../../types/astro'

interface RawDataInspectorProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

type SubTab = 'planets' | 'houses' | 'metadata' | 'json'

export const RawDataInspector: React.FC<RawDataInspectorProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('planets')
  const [copied, setCopied] = useState<boolean>(false)
  const [jsonSearch, setJsonSearch] = useState<string>('')

  // Ayanamsha offset in decimal degrees
  const ayanamshaDeg = useMemo(() => {
    const rawAyan = chart.raw?.rasi?.ayanamsa
    if (typeof rawAyan?.degrees === 'number') return rawAyan.degrees
    // Fallback: parse from ayanamsaDms if available or default ~23.8°
    const dmsStr = chart.metadata.ayanamsaDms
    const match = dmsStr?.match(/(\d+)°(\d+)'([\d.]+)"/)
    if (match) {
      return parseFloat(match[1]) + parseFloat(match[2]) / 60 + parseFloat(match[3]) / 3600
    }
    return 23.7923 // Default Lahiri approximation
  }, [chart])

  // Julian Day UT
  const julianDay = useMemo(() => {
    return chart.raw?.rasi?.input?.julian_day_ut || chart.raw?.panchanga?.julian_day || 'Unavailable'
  }, [chart])

  // Complete JSON payload representation
  const jsonPayloadString = useMemo(() => {
    return JSON.stringify(chart, null, 2)
  }, [chart])

  const payloadSizeKb = useMemo(() => {
    return (new TextEncoder().encode(jsonPayloadString).length / 1024).toFixed(1)
  }, [jsonPayloadString])

  // Handle Copy to Clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonPayloadString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = jsonPayloadString
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Handle Download JSON
  const handleDownloadJson = () => {
    const blob = new Blob([jsonPayloadString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chart.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_raw_chart.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Decimal to DMS helper
  const formatDegDms = (deg: number): string => {
    const d = Math.floor(deg)
    const minFloat = (deg - d) * 60
    const m = Math.floor(minFloat)
    const s = Math.round((minFloat - m) * 60)
    return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
  }

  return (
    <div className="raw-data-inspector-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Action Header Strip */}
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
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.08))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.25rem',
            }}
          >
            🛰️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Raw Astronomical Data & Ephemeris Inspector
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Julian Day: <strong>{String(julianDay)}</strong> • Ayanamsha: <strong>{chart.metadata.ayanamsaDms}</strong> ({ayanamshaDeg.toFixed(5)}°)
            </span>
          </div>
        </div>

        {/* Copy & Download Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleCopyJson}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: copied ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: copied ? '#34d399' : '#f8fafc',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{copied ? '✓ Copied Payload!' : '📋 Copy JSON Payload'}</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({payloadSizeKb} KB)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(212, 171, 92, 0.3)',
              background: 'rgba(212, 171, 92, 0.12)',
              color: '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💾 Download JSON
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'planets', label: '🪐 Planetary Coordinates (Sayana vs Nirayana)', count: chart.planets.length },
          { id: 'houses', label: '🏛️ House Boundaries & Cusps', count: chart.houses.length },
          { id: 'metadata', label: '⏱️ Ephemeris & Astronomical Time', count: 'Metadata' },
          { id: 'json', label: '📄 Raw JSON Viewer', count: `${payloadSizeKb} KB` },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#38bdf8' : '#cbd5e1',
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
                  borderRadius: 8,
                  fontSize: '0.7rem',
                  background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
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

      {/* View 1: Planetary Coordinates Table */}
      {activeSubTab === 'planets' && (
        <div className="panel" style={{ padding: 20, borderRadius: 14, overflowX: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
              Sayana (Tropical) vs. Nirayana (Sidereal) Coordinate Ledger
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Formula: Tropical Longitude (λ_sayana) = Sidereal Longitude (λ_nirayana) + Ayanamsha ({ayanamshaDeg.toFixed(4)}°)
            </span>
          </div>

          <table
            style={{
              width: '100%',
              minWidth: 1000,
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Graha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Sidereal Longitude (λ)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Tropical Longitude (Sayana)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Speed (°/day)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Latitude (β)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Sign (Rashi)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Nakshatra & Pada</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#94a3b8' }}>Bhava</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((planet) => {
                const siderealLong = planet.longitude ?? planet.signIndex * 30 + planet.degreeInSign
                const tropicalLong = (siderealLong + ayanamshaDeg) % 360
                const speed = planet.speed !== undefined ? planet.speed : planet.retrograde ? -0.5 : 0.95
                const latitude = planet.latitude !== undefined ? planet.latitude : 0.0

                return (
                  <tr
                    key={planet.name}
                    onClick={() => onSelectPlanet && onSelectPlanet(planet.name)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Graha */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{planet.symbol}</span>
                        <div>
                          <strong style={{ color: '#f8fafc' }}>{planet.name}</strong>
                          <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                            {planet.sanskritName}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Sidereal Longitude */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>{siderealLong.toFixed(6)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{formatDegDms(siderealLong)}</small>
                    </td>

                    {/* Tropical Longitude */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{tropicalLong.toFixed(6)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{formatDegDms(tropicalLong)}</small>
                    </td>

                    {/* Speed */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: planet.retrograde ? '#38bdf8' : '#cbd5e1' }}>
                        {speed > 0 ? `+${speed.toFixed(4)}` : speed.toFixed(4)}°/d
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: planet.retrograde ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: planet.retrograde ? '#38bdf8' : '#94a3b8',
                        }}
                      >
                        {planet.retrograde ? 'Vakri [R]' : 'Direct'}
                      </span>
                    </td>

                    {/* Latitude */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#cbd5e1' }}>{latitude.toFixed(4)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {latitude > 0 ? 'North' : latitude < 0 ? 'South' : 'Ecliptic'}
                      </small>
                    </td>

                    {/* Sign */}
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#f8fafc' }}>{planet.sign}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{planet.dms}</div>
                    </td>

                    {/* Nakshatra */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#f8fafc', fontWeight: 600 }}>{planet.nakshatra}</div>
                      <small style={{ color: '#fbbf24', fontSize: '0.72rem' }}>
                        Pada {planet.pada} • Lord {planet.nakshatraLord}
                      </small>
                    </td>

                    {/* Bhava */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSelectHouse) onSelectHouse(planet.houseNumber)
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8',
                          padding: '2px 8px',
                          borderRadius: 5,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        H{planet.houseNumber} ↗
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: House Boundaries & Cusps */}
      {activeSubTab === 'houses' && (
        <div className="panel" style={{ padding: 20, borderRadius: 14, overflowX: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
              Bhava Chalita Boundaries & Cusp Coordinates
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Raw starting boundary (Arambha), Cusp/Center (Madhya), and ending boundary (Virama) for each house
            </span>
          </div>

          <table
            style={{
              width: '100%',
              minWidth: 850,
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>House</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Sign (Rashi)</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Lord</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Start Boundary</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Cusp / Madhya</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>End Boundary</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8' }}>Occupants</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((house) => {
                const rawBhava = chart.raw?.rasi?.bhavas?.[house.number - 1]
                const startDeg = rawBhava?.start ?? (house.signIndex * 30)
                const midDeg = rawBhava?.middle ?? (house.signIndex * 30 + 15)
                const endDeg = rawBhava?.end ?? ((house.signIndex + 1) * 30)

                return (
                  <tr
                    key={house.number}
                    onClick={() => onSelectHouse && onSelectHouse(house.number)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#f8fafc' }}>{house.name}</strong>
                      <small style={{ display: 'block', color: '#fbbf24', fontSize: '0.7rem' }}>
                        {house.sanskritName || `Bhava ${house.number}`}
                      </small>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#e2e8f0' }}>{house.sign}</strong>
                      <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                        Sign #{house.signNumber}
                      </small>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSelectPlanet) onSelectPlanet(house.lord)
                        }}
                        style={{ color: '#fbbf24', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {house.lord} ↗
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#cbd5e1' }}>{startDeg.toFixed(4)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{formatDegDms(startDeg)}</small>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#38bdf8', fontWeight: 700 }}>{midDeg.toFixed(4)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{formatDegDms(midDeg)}</small>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ color: '#cbd5e1' }}>{endDeg.toFixed(4)}°</div>
                      <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{formatDegDms(endDeg)}</small>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {house.occupants.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {house.occupants.map((occ) => (
                            <span
                              key={occ}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSelectPlanet) onSelectPlanet(occ)
                              }}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#f8fafc',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              {occ}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.74rem' }}>Vacant</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View 3: Astronomical Metadata */}
      {activeSubTab === 'metadata' && (
        <div className="panel" style={{ padding: 20, borderRadius: 14 }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
              Astronomical Epoch, Geodetics & Time Systems
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Precision time conversions and geodetic reference parameters utilized for this calculation
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {[
              { label: 'Julian Day (UT)', value: String(julianDay), desc: 'Continuous astronomical day count from Jan 1, 4713 BC' },
              { label: 'Local Civil Time', value: chart.metadata.dateFormatted + ' ' + chart.metadata.timeFormatted, desc: 'Civil clock time entered for birth event' },
              { label: 'Timezone / Offset', value: chart.metadata.timezone, desc: 'IANA timezone database identifier' },
              { label: 'Geographic Latitude', value: chart.metadata.latitude, desc: 'WGS84 ellipsoidal latitude' },
              { label: 'Geographic Longitude', value: chart.metadata.longitude, desc: 'WGS84 ellipsoidal longitude' },
              { label: 'Ayanamsha System', value: chart.metadata.ayanamsaName, desc: 'Chitrapaksha / Lahiri sidereal precession reference' },
              { label: 'Ayanamsha Angle', value: `${chart.metadata.ayanamsaDms} (${ayanamshaDeg.toFixed(6)}°)`, desc: 'Exact angular distance between Sayana & Nirayana zero points' },
              { label: 'House System', value: chart.metadata.calculationSettings.split('•')[1]?.trim() || 'Whole Sign', desc: 'Bhava division system for chart quadrants' },
              { label: 'Calculation Engine', value: chart.metadata.source, desc: 'Computational backend ephemeris engine' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 4: Raw JSON Viewer */}
      {activeSubTab === 'json' && (
        <div className="panel" style={{ padding: 20, borderRadius: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                Live Normalized AstroChart JSON Payload
              </h4>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Complete normalized domain model ({payloadSizeKb} KB, {jsonPayloadString.split('\n').length} lines)
              </span>
            </div>

            <input
              type="text"
              placeholder="Search in JSON payload..."
              value={jsonSearch}
              onChange={(e) => setJsonSearch(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.78rem',
                width: 220,
              }}
            />
          </div>

          <pre
            style={{
              background: '#070a0e',
              padding: 16,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#38bdf8',
              fontSize: '0.76rem',
              fontFamily: 'monospace',
              maxHeight: 520,
              overflowY: 'auto',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {jsonSearch.trim()
              ? jsonPayloadString
                .split('\n')
                .filter((line) => line.toLowerCase().includes(jsonSearch.toLowerCase()))
                .join('\n') || `// No lines match "${jsonSearch}"`
              : jsonPayloadString}
          </pre>
        </div>
      )}
    </div>
  )
}
