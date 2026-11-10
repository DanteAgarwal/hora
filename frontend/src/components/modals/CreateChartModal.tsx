import React, { useState, useEffect, useMemo } from 'react'
import type { BirthData } from '../../types/astro'
import { CITIES_DATABASE, POPULAR_QUICK_CITIES, type CityOption } from '../../cities'

const SAMPLE_PRESETS: { label: string; name: string; year: number; month: number; day: number; hour: number; minute: number; second: number; cityName: string }[] = [
  { label: 'Sample Natal (Agra)', name: 'Sample Natal (Agra)', year: 1995, month: 8, day: 24, hour: 10, minute: 30, second: 0, cityName: 'Agra' },
  { label: 'Lord Rama', name: 'Sri Rama (Chaitra Navami)', year: -5000, month: 1, day: 10, hour: 12, minute: 0, second: 0, cityName: 'Ayodhya' },
  { label: 'Lord Krishna', name: 'Sri Krishna (Janmashtami)', year: -3228, month: 7, day: 19, hour: 0, minute: 0, second: 0, cityName: 'Mathura' },
  { label: 'Mahatma Gandhi', name: 'Mahatma Gandhi', year: 1869, month: 10, day: 2, hour: 7, minute: 12, second: 0, cityName: 'Ahmedabad' },
]

interface CreateChartModalProps {
  onClose: () => void
  onCreated: (chart: any) => void
  fetchJsonWithRetry: (path: string, init?: RequestInit) => Promise<any>
}

export const CreateChartModal: React.FC<CreateChartModalProps> = ({
  onClose,
  onCreated,
  fetchJsonWithRetry,
}) => {
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
