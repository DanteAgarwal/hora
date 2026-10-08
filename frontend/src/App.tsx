import { useEffect, useMemo, useState } from 'react'
import './App.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavKey = 'Overview' | 'Charts' | 'Timing' | 'Analysis' | 'Research' | 'Learn'

type Planet = {
  name: string
  sign: string
  degree: string
  nakshatra: string
  house: string
  houseNumber: number
  retrograde?: boolean
  combust: boolean
  status: string
}

type House = {
  number: number
  name: string
  sign: string
  lord: string
  occupants: string[]
}

type Varga = {
  code: string
  title: string
  purpose: string
  status: string
}

type DashaSegment = {
  period: string
  label: string
  start: string
  end: string
  color: string
}

type BirthData = {
  name?: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
  tz_name: string
  utc_offset_hours?: number
  place: {
    latitude: number
    longitude: number
    altitude?: number
    name: string
  }
}

type Chart = {
  id: number
  name: string
  date: string
  time: string
  location: string
  latitude: string
  longitude: string
  timezone: string
  lagna: string
  moon: string
  moonNakshatra: string
  sunSign: string
  currentMahadasha: string
  ayanamsa: string
  calculationSettings: string
  planets: Planet[]
  houses: House[]
  vargas: Varga[]
  dashas: DashaSegment[]
  source: string
  birthData?: BirthData
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const navItems: NavKey[] = ['Overview', 'Charts', 'Timing', 'Analysis', 'Research', 'Learn']

const DEFAULT_BIRTH: BirthData = {
  name: 'Sample Natal (Agra)',
  year: 1995,
  month: 8,
  day: 24,
  hour: 10,
  minute: 30,
  second: 0,
  tz_name: 'Asia/Kolkata',
  place: {
    latitude: 27.1767,
    longitude: 78.0081,
    name: 'Agra',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDisplayDate = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatDisplayTime = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatChartPayload(computed: any): Chart {
  return {
    id: computed.id ?? 0,
    name: computed.name ?? 'Live chart',
    date: formatDisplayDate(computed.date || (computed.birthData ? `${computed.birthData.year}-${String(computed.birthData.month).padStart(2, '0')}-${String(computed.birthData.day).padStart(2, '0')}` : undefined)),
    time: formatDisplayTime(computed.time || (computed.birthData ? `${String(computed.birthData.hour).padStart(2, '0')}:${String(computed.birthData.minute).padStart(2, '0')}` : undefined)),
    location: computed.location ?? computed.birthData?.place?.name ?? 'Agra',
    latitude: computed.latitude ?? (computed.birthData?.place?.latitude !== undefined ? `${computed.birthData.place.latitude}°` : '27.1767°'),
    longitude: computed.longitude ?? (computed.birthData?.place?.longitude !== undefined ? `${computed.birthData.place.longitude}°` : '78.0081°'),
    timezone: computed.timezone ?? computed.birthData?.tz_name ?? 'Asia/Kolkata',
    lagna: computed.lagna ?? 'Unavailable',
    moon: computed.moon ?? 'Unavailable',
    moonNakshatra: computed.moonNakshatra ?? 'Unavailable',
    sunSign: computed.sunSign ?? 'Unavailable',
    currentMahadasha: computed.currentMahadasha ?? 'Unavailable',
    ayanamsa: computed.ayanamsa ?? 'Unavailable',
    calculationSettings: computed.calculationSettings ?? 'Unknown',
    planets: computed.planets ?? [],
    houses: computed.houses ?? [],
    vargas: computed.vargas ?? [],
    dashas: (computed.dashas ?? []).map((d: DashaSegment) => ({
      ...d,
      start: formatDisplayDate(d.start),
      end: formatDisplayDate(d.end),
    })),
    source: computed.source ?? 'Hora Engine',
    birthData: computed.birthData,
  }
}

async function fetchJsonWithRetry(path: string, init?: RequestInit) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response
    try {
      response = await fetch(path, init)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network request failed')
      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)))
        continue
      }
      throw lastError
    }

    if (response.ok) return response.json()

    const detail = await response.json().catch(() => null)
    lastError = new Error(
      detail?.detail ?? detail?.error ?? `API request failed (${response.status})`,
    )
    if (response.status < 500 || attempt === 2) throw lastError
    await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)))
  }

  throw lastError ?? new Error('API request failed')
}

// ---------------------------------------------------------------------------
// City Database & Presets
// ---------------------------------------------------------------------------

import { CITIES_DATABASE, POPULAR_QUICK_CITIES, type CityOption } from './cities'

const SAMPLE_PRESETS: { label: string; name: string; year: number; month: number; day: number; hour: number; minute: number; second: number; cityName: string }[] = [
  { label: 'Sample Natal (Agra)', name: 'Sample Natal (Agra)', year: 1995, month: 8, day: 24, hour: 10, minute: 30, second: 0, cityName: 'Agra' },
  { label: 'Lord Rama', name: 'Sri Rama (Chaitra Navami)', year: -5000, month: 1, day: 10, hour: 12, minute: 0, second: 0, cityName: 'Ayodhya' },
  { label: 'Lord Krishna', name: 'Sri Krishna (Janmashtami)', year: -3228, month: 7, day: 19, hour: 0, minute: 0, second: 0, cityName: 'Mathura' },
  { label: 'Mahatma Gandhi', name: 'Mahatma Gandhi', year: 1869, month: 10, day: 2, hour: 7, minute: 12, second: 0, cityName: 'Ahmedabad' },
]

// ---------------------------------------------------------------------------
// Create chart modal
// ---------------------------------------------------------------------------

function CreateChartModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (chart: Chart) => void
}) {
  const [form, setForm] = useState<BirthData>({
    name: '',
    year: 1995,
    month: 8,
    day: 24,
    hour: 10,
    minute: 30,
    second: 0,
    tz_name: 'Asia/Kolkata',
    place: { latitude: 27.1767, longitude: 78.0081, altitude: 0, name: 'Agra' },
  })

  const [citySearchQuery, setCitySearchQuery] = useState<string>('Agra')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showManualCoords, setShowManualCoords] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Date format string (YYYY-MM-DD)
  const dateString = `${String(form.year).padStart(4, '0')}-${String(form.month).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`

  // Time format string (HH:MM)
  const timeString = `${String(form.hour).padStart(2, '0')}:${String(form.minute).padStart(2, '0')}`

  const handleDateChange = (val: string) => {
    if (!val) return
    const [y, m, d] = val.split('-').map(Number)
    if (y && m && d) {
      setForm((prev) => ({ ...prev, year: y, month: m, day: d }))
    }
  }

  const handleTimeChange = (val: string) => {
    if (!val) return
    const [h, m] = val.split(':').map(Number)
    if (h !== undefined && m !== undefined) {
      setForm((prev) => ({ ...prev, hour: h, minute: m, second: 0 }))
    }
  }

  const handleSetCurrentTime = () => {
    const now = new Date()
    setForm((prev) => ({
      ...prev,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
    }))
  }

  const handleSelectCity = (city: CityOption) => {
    setCitySearchQuery(city.name)
    setShowDropdown(false)
    setForm((prev) => ({
      ...prev,
      tz_name: city.tz,
      place: {
        ...prev.place,
        name: city.name,
        latitude: city.lat,
        longitude: city.lon,
      },
    }))
  }

  const filteredCities = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase()
    if (!q) return CITIES_DATABASE.slice(0, 10)
    return CITIES_DATABASE.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.stateOrCountry.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q))
    ).slice(0, 12)
  }, [citySearchQuery])

  const applyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    const match = CITIES_DATABASE.find((c) => c.name === preset.cityName)
    const lat = match ? match.lat : 27.1767
    const lon = match ? match.lon : 78.0081
    const tz = match ? match.tz : 'Asia/Kolkata'

    setForm({
      name: preset.name,
      year: preset.year,
      month: preset.month,
      day: preset.day,
      hour: preset.hour,
      minute: preset.minute,
      second: preset.second,
      tz_name: tz,
      place: { name: preset.cityName, latitude: lat, longitude: lon, altitude: 0 },
    })
    setCitySearchQuery(preset.cityName)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedName = (form.name || '').trim()
    if (!trimmedName) {
      setErr('Please enter a name for the chart')
      return
    }
    if (isNaN(form.place.latitude) || form.place.latitude < -90 || form.place.latitude > 90) {
      setErr('Latitude must be between -90 and 90')
      return
    }
    if (isNaN(form.place.longitude) || form.place.longitude < -180 || form.place.longitude > 180) {
      setErr('Longitude must be between -180 and 180')
      return
    }

    setSaving(true)
    setErr('')
    try {
      const chart = await fetchJsonWithRetry('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, birthData: { ...form, name: trimmedName } }),
      })
      onCreated(chart)
    } catch (errCatch) {
      setErr(errCatch instanceof Error ? errCatch.message : 'Failed to create chart')
    } finally {
      setSaving(false)
    }
  }

  // Readable preview string
  const formattedPreviewDate = `${String(form.day).padStart(2, '0')}/${String(form.month).padStart(2, '0')}/${form.year}`
  const formattedPreviewTime = `${String(form.hour).padStart(2, '0')}:${String(form.minute).padStart(2, '0')}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content panel modal-friendly" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Cast New Kundli Chart</h3>
            <p className="modal-subtitle">Enter birth details or select a quick preset below</p>
          </div>
          <button type="button" className="ghost-button modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="preset-bar">
          <span className="preset-label">⚡ Quick Presets:</span>
          <button
            type="button"
            className="preset-chip chip-now"
            onClick={handleSetCurrentTime}
            title="Set date and time to Right Now"
          >
            🕒 Right Now
          </button>
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="preset-chip"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="form-friendly-grid">
          {/* Section 1: Chart Identity */}
          <div className="form-card-section">
            <label className="field-group">
              <span className="field-label">Chart Name / Person</span>
              <input
                autoFocus
                type="text"
                className="input-enhanced"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Doe, Prashna Chart, etc."
                required
              />
            </label>
          </div>

          {/* Section 2: Date & Time */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="field-label">Date & Time of Birth</span>
              <button
                type="button"
                className="mini-text-btn"
                onClick={handleSetCurrentTime}
              >
                Set to Present Moment
              </button>
            </div>

            <div className="datetime-split-grid">
              <label className="field-group">
                <span className="field-sublabel">Date</span>
                <input
                  type="date"
                  className="input-enhanced"
                  value={dateString}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </label>

              <label className="field-group">
                <span className="field-sublabel">Time (24h)</span>
                <input
                  type="time"
                  step="1"
                  className="input-enhanced"
                  value={timeString}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          {/* Section 3: Place & Location */}
          <div className="form-card-section">
            <div className="section-title-row">
              <span className="field-label">Birth Place / City (India & Global)</span>
              <button
                type="button"
                className="mini-text-btn"
                onClick={() => setShowManualCoords(!showManualCoords)}
              >
                {showManualCoords ? 'Hide Lat/Lon Fields' : '✏️ Fine-tune Coordinates'}
              </button>
            </div>

            {/* Quick City Shortcut Chips */}
            <div className="quick-city-chips">
              <span style={{ fontSize: '0.74rem', color: '#e5c07b', fontWeight: 600 }}>Quick:</span>
              {POPULAR_QUICK_CITIES.map((cityName) => {
                const city = CITIES_DATABASE.find((c) => c.name === cityName)
                if (!city) return null
                const isSelected = form.place.name.toLowerCase() === cityName.toLowerCase()
                return (
                  <button
                    key={cityName}
                    type="button"
                    className={`quick-city-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectCity(city)}
                  >
                    📍 {cityName}
                  </button>
                )
              })}
            </div>

            {/* Searchable City Input with Autocomplete Dropdown */}
            <div className="city-search-box">
              <div className="city-search-input-wrap">
                <span className="city-search-icon">🔍</span>
                <input
                  type="text"
                  className="input-enhanced city-search-input"
                  value={citySearchQuery}
                  placeholder="Search city: Agra, Hathras, Aligarh, Mathura, Lucknow..."
                  onChange={(e) => {
                    setCitySearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {citySearchQuery && (
                  <button
                    type="button"
                    className="city-search-clear"
                    onClick={() => {
                      setCitySearchQuery('')
                      setShowDropdown(true)
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && (
                <div className="city-dropdown-menu">
                  {filteredCities.map((c) => (
                    <div
                      key={c.label}
                      className={`city-dropdown-item ${form.place.name === c.name ? 'selected' : ''}`}
                      onClick={() => handleSelectCity(c)}
                    >
                      <div className="city-item-main">
                        <span className="city-item-name">
                          📍 {c.name}
                        </span>
                        <span className="city-item-state">
                          {c.label}
                        </span>
                      </div>
                      <span className="city-item-coords">
                        {c.lat.toFixed(2)}° N, {c.lon.toFixed(2)}° E
                      </span>
                    </div>
                  ))}

                  {/* Custom city option */}
                  {citySearchQuery.trim() && (
                    <div
                      className="city-dropdown-custom"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          place: { ...prev.place, name: citySearchQuery.trim() },
                        }))
                        setShowDropdown(false)
                        setShowManualCoords(true)
                      }}
                    >
                      ➕ Use "<strong>{citySearchQuery.trim()}</strong>" as custom location (click to set coordinates)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Location Pill & Google Maps Helper */}
            <div className="coords-helper-bar">
              <div className="location-badge-pill" style={{ margin: 0 }}>
                <span>📍 {form.place.name || 'Custom'}</span>
                <span>•</span>
                <span>{form.place.latitude.toFixed(4)}° N, {form.place.longitude.toFixed(4)}° E</span>
                <span>•</span>
                <span>⏱️ {form.tz_name}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.place.name ? `${form.place.name}, India` : 'Agra, India')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="google-maps-btn"
                title="Search this city on Google Maps in a new tab"
              >
                🗺️ Find on Google Maps ↗
              </a>
            </div>

            {/* Manual Lat/Lon/Timezone Fields */}
            {showManualCoords && (
              <div className="advanced-location-drawer">
                <div className="coords-grid-enhanced">
                  <label className="field-group">
                    <span className="field-sublabel">Latitude (° N for India)</span>
                    <input
                      type="number"
                      step="0.0001"
                      className="input-enhanced"
                      value={form.place.latitude}
                      onChange={(e) => setForm({ ...form, place: { ...form.place, latitude: parseFloat(e.target.value) || 0 } })}
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-sublabel">Longitude (° E for India)</span>
                    <input
                      type="number"
                      step="0.0001"
                      className="input-enhanced"
                      value={form.place.longitude}
                      onChange={(e) => setForm({ ...form, place: { ...form.place, longitude: parseFloat(e.target.value) || 0 } })}
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-sublabel">Timezone</span>
                    <input
                      type="text"
                      className="input-enhanced"
                      value={form.tz_name}
                      onChange={(e) => setForm({ ...form, tz_name: e.target.value })}
                      placeholder="Asia/Kolkata"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Collapsible Coordinates Finder Guide */}
            <div className="coords-guide-box">
              <button
                type="button"
                className="coords-guide-header"
                onClick={() => setShowGuide(!showGuide)}
              >
                <span>💡 How to get Latitude & Longitude for ANY village or city in India?</span>
                <span>{showGuide ? '▲' : '▼'}</span>
              </button>
              {showGuide && (
                <div className="coords-guide-body">
                  <div className="coords-guide-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Google Maps (Fastest & Accurate to any street/hospital):</strong>
                      <p>
                        Open Google Maps on your phone or PC. Search for your village, mohalla, or hospital (e.g. <em>Sadabad</em>, <em>Sasni</em>, <em>Dayalbagh</em>, or <em>Khandari</em>). <strong>Right-click</strong> on the map (or <strong>tap & hold</strong> on phone screen). The top item shows coordinates like <code>27.5968, 78.0519</code>. Click to copy and paste directly into Latitude & Longitude above!
                      </p>
                    </div>
                  </div>
                  <div className="coords-guide-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Google Search:</strong>
                      <p>
                        Simply search on Google: <code>latitude of [City/Village name]</code>. Example: searching <em>latitude of Hathras</em> immediately displays <strong>27.5968° N, 78.0519° E</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="india-bounds-box">
                    <strong>🇮🇳 Quick Rules for India Coordinates:</strong>
                    <div>• <strong>Latitude:</strong> Always positive (+) between <strong>8.4° N and 37.6° N</strong></div>
                    <div>• <strong>Longitude:</strong> Always positive (+) between <strong>68.7° E and 97.25° E</strong></div>
                    <div>• <strong>Timezone:</strong> Always <code>Asia/Kolkata</code> (Indian Standard Time, UTC +5:30) for all of India</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="chart-preview-card">
            <div className="preview-indicator">
              <span className="preview-dot" />
              <strong>Preview:</strong> {(form.name || '').trim() || 'New Chart'}
            </div>
            <div className="preview-summary">
              📅 {formattedPreviewDate} at {formattedPreviewTime} • 📍 {form.place.name || 'Location'} ({form.tz_name})
            </div>
          </div>

          {err && <div className="form-error-banner">⚠️ {err}</div>}

          {saving && (
            <div className="loading-bar">
              <span />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button submit-btn-enhanced" disabled={saving}>
              {saving ? 'Computing Vedic Chart...' : '✨ Calculate & Generate Kundli'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [selectedNav, setSelectedNav] = useState<NavKey>('Overview')
  const [selectedPlanet, setSelectedPlanet] = useState('')
  const [chart, setChart] = useState<Chart | null>(null)
  const [savedCharts, setSavedCharts] = useState<Chart[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await fetchJsonWithRetry('/api/health')
        setBackendStatus(health.hora_status === 'ok' ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }
    void checkHealth()
  }, [])

  // Apply a chart to active state and persist selection
  const applyChart = (targetChart: any) => {
    const formatted = formatChartPayload(targetChart)
    setChart(formatted)
    setSelectedPlanet(formatted.planets[0]?.name ?? '')
    if (targetChart.id) {
      localStorage.setItem('hora_active_chart_id', String(targetChart.id))
    }
  }

  // Load initial chart on mount: checks database first, then localStorage, then default
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch saved charts from backend database
        let savedList: any[] = []
        try {
          savedList = await fetchJsonWithRetry('/api/charts')
          setSavedCharts(savedList)
        } catch {
          savedList = []
        }

        // 2. Determine which chart to display
        const storedId = localStorage.getItem('hora_active_chart_id')
        const matched = storedId ? savedList.find((c) => String(c.id) === storedId) : null
        const targetChart = matched || (savedList.length > 0 ? savedList[0] : null)

        if (targetChart) {
          applyChart(targetChart)
        } else {
          // If no charts exist in database yet, compute default natal chart (Agra)
          const computed = await fetchJsonWithRetry('/api/compute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(DEFAULT_BIRTH),
          })
          applyChart({ ...computed, name: computed.name ?? DEFAULT_BIRTH.name, birthData: DEFAULT_BIRTH })
        }
      } catch (loadError) {
        console.error(loadError)
        const detail = loadError instanceof Error ? loadError.message : 'Unknown error'
        setError(`${detail}. Make sure both the Node server (port 4000) and the Hora Python API (port 8000) are running.`)
      } finally {
        setLoading(false)
      }
    }

    void initApp()
  }, [])

  // Recalculate currently active chart without reloading the page
  const handleRecalculateCurrent = async () => {
    if (!chart) return
    const birth = chart.birthData || DEFAULT_BIRTH
    try {
      setLoading(true)
      const computed = await fetchJsonWithRetry('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birth),
      })
      applyChart({ ...computed, id: chart.id, name: chart.name, birthData: birth })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const activePlanet = useMemo(
    () => chart?.planets.find((planet) => planet.name === selectedPlanet) ?? chart?.planets[0] ?? null,
    [chart, selectedPlanet],
  )

  const activePlanetDetail = activePlanet ?? {
    name: 'Unavailable',
    sign: '—',
    degree: '—',
    nakshatra: '—',
    house: '—',
    status: 'Awaiting chart',
  }

  if (error) {
    return (
      <div className="app-shell app-error">
        <div className="panel error-panel">
          <p className="eyebrow">Engine status</p>
          <h1>Service connection error</h1>
          <p>{error}</p>
          <div className="status-badges">
            <span className={`badge ${backendStatus === 'online' ? 'badge-ok' : 'badge-err'}`}>
              Node server: {backendStatus === 'checking' ? '…' : backendStatus}
            </span>
            <span className={`badge ${backendStatus === 'online' ? 'badge-ok' : 'badge-err'}`}>
              Hora engine: {backendStatus === 'checking' ? '…' : backendStatus}
            </span>
          </div>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Retry connection
          </button>
        </div>
      </div>
    )
  }

  if (!chart) {
    return (
      <div className="app-shell app-error">
        <div className="panel error-panel">
          <p className="eyebrow">Loading</p>
          <h1>Building live chart</h1>
          <p>{loading ? 'Computing chart via Hora engine...' : 'Preparing workspace...'}</p>
          <div className="loading-bar"><span /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar panel">
        <div className="brand-box">
          <div className="brand-mark">K</div>
          <div>
            <p className="eyebrow">Kundli</p>
            <h2>Workbench</h2>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={selectedNav === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setSelectedNav(item)}
            >
              <span>{item}</span>
              <span className="nav-count">
                {item === 'Overview' ? '01' : item === 'Charts' ? String(savedCharts.length).padStart(2, '0') : '—'}
              </span>
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <p className="eyebrow">System status</p>
          <strong>Hora API</strong>
          <span className={backendStatus === 'online' ? 'status-online' : 'status-offline'}>
            {backendStatus === 'online' ? '● Connected' : backendStatus === 'checking' ? '◌ Checking...' : '○ Disconnected'}
          </span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">Active Kundli Chart</p>
            <div className="chart-title-row">
              <h1>{chart.name}</h1>
              {savedCharts.length > 1 && (
                <select
                  className="chart-quick-switcher"
                  value={chart.id}
                  onChange={(e) => {
                    const found = savedCharts.find((c) => c.id === Number(e.target.value))
                    if (found) applyChart(found)
                  }}
                  title="Switch to another saved chart"
                >
                  {savedCharts.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.location || sc.birthData?.place?.name || 'Vedic'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="ghost-button" onClick={() => setShowCreateModal(true)}>
              + Cast New Chart
            </button>
            <button type="button" className="primary-button" onClick={handleRecalculateCurrent} disabled={loading}>
              {loading ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card panel">
            <p className="eyebrow">Lagna</p>
            <strong>{chart.lagna}</strong>
            <span>Ascendant</span>
          </article>
          <article className="summary-card panel">
            <p className="eyebrow">Moon</p>
            <strong>{chart.moon}</strong>
            <span>{chart.moonNakshatra}</span>
          </article>
          <article className="summary-card panel">
            <p className="eyebrow">Current Dasha</p>
            <strong>{chart.currentMahadasha}</strong>
            <span>Vimshottari</span>
          </article>
          <article className="summary-card panel">
            <p className="eyebrow">Source</p>
            <strong>{chart.source}</strong>
            <span>{loading ? 'Refreshing' : 'Ready'}</span>
          </article>
        </section>

        {selectedNav === 'Overview' && (
          <>
            <section className="main-panel panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Birth information</p>
                  <h3>{chart.date}</h3>
                </div>
                <div className="meta-block">
                  <span>{chart.time}</span>
                  <span>{chart.location}</span>
                  <span>{chart.timezone}</span>
                </div>
              </div>

              <div className="chart-layout">
                <div className="chart-board">
                  <div className="chart-grid">
                    {chart.houses.map((house) => (
                      <div key={house.number} className="chart-cell">
                        <span className="cell-sign">House {house.number} · {house.sign}</span>
                        <strong>{house.occupants.length ? house.occupants.join(', ') : '—'}</strong>
                        <small>{house.number === 1 ? 'Lagna' : 'House occupants'}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="facts-column">
                  <div className="facts-box">
                    <p className="eyebrow">Quick facts</p>
                    <ul>
                      <li><span>Ascendant</span><strong>{chart.lagna}</strong></li>
                      <li><span>Moon sign</span><strong>{chart.moon.split(' ').slice(0, -1).join(' ')}</strong></li>
                      <li><span>Sun sign</span><strong>{chart.sunSign}</strong></li>
                      <li><span>Moon Nakshatra</span><strong>{chart.moonNakshatra}</strong></li>
                    </ul>
                  </div>
                  <div className="facts-box">
                    <p className="eyebrow">Explore</p>
                    <div className="chip-grid">
                      {['Houses', 'Planets', 'Nakshatras', 'Vargas', 'Dashas', 'Strength'].map((item) => (
                        <button key={item} type="button" className="chip-button">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="lower-grid">
              <div className="panel">
                <div className="section-header">
                  <h3>Planetary positions</h3>
                  <button type="button" className="text-button">View raw</button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Longitude</th>
                      <th>Sign</th>
                      <th>House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.planets.map((planet) => (
                      <tr key={planet.name} onClick={() => setSelectedPlanet(planet.name)}>
                        <td>{planet.name}</td>
                        <td>{planet.degree}</td>
                        <td>{planet.sign}</td>
                        <td>{planet.house}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <div className="section-header">
                  <h3>Vimshottari</h3>
                  <button type="button" className="text-button">Timeline</button>
                </div>
                <div className="dasha-stack">
                  {chart.dashas.map((dasha) => (
                    <div key={dasha.period} className="dasha-item">
                      <span className="dot" style={{ background: dasha.color }} />
                      <div>
                        <strong>{dasha.period}</strong>
                        <small>{dasha.label}</small>
                      </div>
                      <span>{dasha.start}–{dasha.end}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {selectedNav === 'Charts' && (
          <section className="panel">
            <div className="section-header">
              <h3>Divisional charts</h3>
              <div className="varga-selector">
                {chart.vargas.map((varga) => (
                  <button key={varga.code} type="button" className="chip-button selected">
                    {varga.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="varga-layout">
              {chart.vargas.map((varga) => (
                <article key={varga.code} className="varga-card">
                  <div className="varga-header">
                    <strong>{varga.code}</strong>
                    <span>{varga.status}</span>
                  </div>
                  <h4>{varga.title}</h4>
                  <p>{varga.purpose}</p>
                </article>
              ))}
            </div>

            {savedCharts.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 24 }}>
                  <h3>Saved charts</h3>
                  <span className="eyebrow">{savedCharts.length} saved</span>
                </div>
                <div className="saved-charts-list">
                  {savedCharts.map((sc) => {
                    const isActive = chart.id === sc.id
                    return (
                      <div
                        key={sc.id}
                        className={`saved-chart-row ${isActive ? 'active-chart' : ''}`}
                        onClick={() => {
                          applyChart(sc)
                          setSelectedNav('Overview')
                        }}
                        title="Click to view this Kundli chart in Overview"
                      >
                        <div>
                          <strong>{sc.name}</strong> {isActive && <span className="active-tag">● Active</span>}
                        </div>
                        <span>📍 {sc.location || sc.birthData?.place?.name || '—'}</span>
                        <span>🕉️ Lagna: {sc.lagna || '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {selectedNav === 'Timing' && (
          <section className="panel">
            <div className="section-header">
              <h3>Timing cycle</h3>
              <button type="button" className="text-button">Current Mahadasha</button>
            </div>
            <div className="timeline">
              {chart.dashas.map((dasha) => (
                <div key={dasha.period} className="timeline-row">
                  <div className="timeline-label">
                    <span>{dasha.label}</span>
                    <strong>{dasha.period}</strong>
                  </div>
                  <div className="timeline-bar">
                    <span style={{ width: '65%', background: dasha.color }} />
                  </div>
                  <div className="timeline-range">{dasha.start} → {dasha.end}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="inspector panel">
        <div className="inspector-header">
          <p className="eyebrow">Inspector</p>
          <h3>Planet details</h3>
        </div>

        <div className="planet-summary">
          <div className="planet-name-row">
            <span className="planet-symbol">{activePlanetDetail.name.slice(0, 1)}</span>
            <div>
              <h4>{activePlanetDetail.name}</h4>
              <small>{activePlanetDetail.sign}</small>
            </div>
          </div>
          <p className="planet-degree">{activePlanetDetail.degree}</p>
          <div className="planet-meta">
            <span>{activePlanetDetail.house} house</span>
            <span>{activePlanetDetail.nakshatra}</span>
          </div>
        </div>

        <div className="inspector-section">
          <p className="eyebrow">Basic</p>
          <ul>
            <li><span>Sign</span><strong>{activePlanetDetail.sign}</strong></li>
            <li><span>Degree</span><strong>{activePlanetDetail.degree}</strong></li>
            <li><span>House</span><strong>{activePlanetDetail.house}</strong></li>
            <li><span>Status</span><strong>{activePlanetDetail.status}</strong></li>
          </ul>
        </div>

        <div className="inspector-section">
          <p className="eyebrow">Dignity</p>
          <ul>
            <li><span>Dignity</span><strong>{activePlanetDetail.status}</strong></li>
            <li><span>Retrograde</span><strong>{activePlanet?.retrograde ? 'Yes' : 'No'}</strong></li>
            <li><span>Combust</span><strong>{activePlanet?.combust ? 'Yes' : 'No'}</strong></li>
          </ul>
        </div>

        <div className="inspector-section">
          <p className="eyebrow">Calculation</p>
          <ul>
            <li><span>Longitude</span><strong>{activePlanetDetail.degree}</strong></li>
            <li><span>Ayanamsha</span><strong>{chart.ayanamsa}</strong></li>
            <li><span>Settings</span><strong>{chart.calculationSettings}</strong></li>
          </ul>
        </div>
      </aside>

      {showCreateModal && (
        <CreateChartModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newChart) => {
            setSavedCharts((prev) => [newChart, ...prev.filter((c) => c.id !== newChart.id)])
            applyChart(newChart)
            setSelectedNav('Overview')
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

export default App
