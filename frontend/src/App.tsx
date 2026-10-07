import { useEffect, useMemo, useState } from 'react'
import './App.css'

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
}

const navItems: NavKey[] = ['Overview', 'Charts', 'Timing', 'Analysis', 'Research', 'Learn']

const birthRequest = {
  year: 1972,
  month: 10,
  day: 1,
  hour: 13,
  minute: 30,
  tz_name: 'Asia/Kolkata',
  place: {
    latitude: 16.2,
    longitude: 81.13,
    name: 'Machilipatnam',
  },
}

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

const ordinal = (value: number) => {
  const remainder = value % 100
  if (remainder >= 11 && remainder <= 13) return `${value}th`
  return `${value}${['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'}`
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
      detail?.detail ?? detail?.error ?? `Hora API request failed (${response.status})`,
    )
    if (response.status < 500 || attempt === 2) throw lastError
    await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)))
  }

  throw lastError ?? new Error('Hora API request failed')
}

function buildChartFromHora(
  rasiChart: any,
  panchanga: any,
  dasha: any,
  vargaCatalog: any,
): Chart {
  const planets = (rasiChart?.grahas ?? []).map((planet: any) => ({
    name: planet.name,
    sign: planet.rasi_name,
    degree: planet.dms ?? `${planet.degrees_in_rasi.toFixed(0)}°`,
    nakshatra: `${planet.nakshatra_name} • Pada ${planet.pada}`,
    house: ordinal(planet.house),
    houseNumber: planet.house,
    retrograde: Boolean(planet.retrograde),
    combust: Boolean(planet.combust),
    status: planet.dignity ?? 'Calculated',
  }))

  const houses = (rasiChart?.bhavas ?? []).map((bhava: any) => ({
    number: bhava.house,
    name: `${ordinal(bhava.house)} House`,
    sign: bhava.rasi_name,
    lord: '—',
    occupants: planets
      .filter((planet: Planet) => planet.houseNumber === bhava.house)
      .map((planet: Planet) => planet.name),
  }))

  const lagna = rasiChart?.lagna
  const moon = (rasiChart?.grahas ?? []).find((planet: any) => planet.name === 'Moon')
  const sun = (rasiChart?.grahas ?? []).find((planet: any) => planet.name === 'Sun')
  const firstDasha = dasha?.periods?.[0]
  const runningDasha = (dasha?.running ?? []).map((period: any) => period.lord_name)
  const currentDasha = runningDasha.length
    ? runningDasha.join(' / ')
    : firstDasha
      ? `${firstDasha.lord_name} • ${firstDasha.start.slice(0, 4)}–${firstDasha.end.slice(0, 4)}`
      : 'Unavailable'

  return {
    id: 1,
    name: 'Live chart',
    date: formatDisplayDate(rasiChart?.input?.local_time),
    time: formatDisplayTime(rasiChart?.input?.local_time),
    location: rasiChart?.input?.place?.name ?? birthRequest.place.name,
    latitude: `${rasiChart?.input?.place?.latitude ?? birthRequest.place.latitude}°`,
    longitude: `${rasiChart?.input?.place?.longitude ?? birthRequest.place.longitude}°`,
    timezone: rasiChart?.input?.timezone ?? 'Local zone',
    lagna: lagna ? `${lagna.rasi_name} ${lagna.dms}` : 'Unavailable',
    moon: moon ? `${moon.rasi_name} ${moon.dms}` : 'Unavailable',
    moonNakshatra: moon ? `${moon.nakshatra_name} • Pada ${moon.pada}` : 'Unavailable',
    sunSign: sun?.rasi_name ?? 'Unavailable',
    currentMahadasha: currentDasha,
    ayanamsa: rasiChart?.ayanamsa?.dms ?? 'Unavailable',
    calculationSettings: `${rasiChart?.settings?.ayanamsa ?? 'Unknown'} ayanamsha • ${rasiChart?.settings?.house_system ?? 'Unknown'} houses`,
    planets,
    houses,
    vargas: (vargaCatalog?.named ?? []).slice(0, 5).map((item: any) => ({
      code: item.code,
      title: item.name,
      purpose: `${item.divisions} divisions`,
      status: 'Available',
    })),
    dashas: (dasha?.periods ?? []).slice(0, 3).map((segment: any, index: number) => ({
      period: segment.lord_name,
      label: index === 0 ? 'Mahadasha' : index === 1 ? 'Antardasha' : 'Pratyantardasha',
      start: formatDisplayDate(segment.start),
      end: formatDisplayDate(segment.end),
      color: ['#c9a66b', '#7ec8c9', '#ed9e7a'][index % 3],
    })),
    source: `${panchanga?.date_local ?? 'Hora'} • ${panchanga?.tithi?.[0]?.name ?? 'Panchanga'}`,
  }
}

function App() {
  const [selectedNav, setSelectedNav] = useState<NavKey>('Overview')
  const [selectedPlanet, setSelectedPlanet] = useState('')
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChart = async () => {
      try {
        setLoading(true)
        setError(null)

        const [rasi, panchanga, dasha, vargaCatalog] = await Promise.all([
          fetchJsonWithRetry('/api/v1/chart/rasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...birthRequest }),
          }),
          fetchJsonWithRetry('/api/v1/panchanga', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...birthRequest }),
          }),
          fetchJsonWithRetry('/api/v1/dasha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...birthRequest, system: 'vimshottari', levels: 3, cycles: 1, reckon_from: 'moon', as_of: new Date().toISOString() }),
          }),
          fetchJsonWithRetry('/api/v1/chart/varga-catalog'),
        ])

        const nextChart = buildChartFromHora(rasi, panchanga, dasha, vargaCatalog)
        setChart(nextChart)
        setSelectedPlanet(nextChart.planets[0]?.name ?? '')
      } catch (loadError) {
        console.error(loadError)
        const detail = loadError instanceof Error ? loadError.message : 'Unknown network error'
        setError(`${detail}. Check that the Hora API is running on port 8000, then retry.`)
      } finally {
        setLoading(false)
      }
    }

    void loadChart()
  }, [])

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
          <h1>Hora API unavailable</h1>
          <p>{error}</p>
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
          <p>{loading ? 'Requesting data from Hora...' : 'Preparing chart workspace...'}</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Retry connection
          </button>
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
              <span className="nav-count">{item === 'Overview' ? '01' : '—'}</span>
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <p className="eyebrow">Working engine</p>
          <strong>Hora API</strong>
          <span>Live calculation service</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">Chart session</p>
            <h1>{chart.name}</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="ghost-button">Create chart</button>
            <button type="button" className="primary-button">Save workspace</button>
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
            <span>Swati • Pada 2</span>
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
    </div>
  )
}

export default App
