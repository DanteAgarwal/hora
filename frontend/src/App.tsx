import { useEffect, useState } from 'react'
import './App.css'
import type { AstroChart, BirthData, DashaPeriod } from './types/astro'
import type { DashaChainItem } from './components/timing/dashaUtils'
import { normalizeChartPayload } from './adapters/horaAdapter'
import { VedicChart } from './components/chart/VedicChart'
import { UniversalInspector } from './components/inspector/UniversalInspector'
import { VargaWorkspace } from './components/vargas/VargaWorkspace'
import { DashaTimeline } from './components/timing/DashaTimeline'
import { AnalysisWorkspace } from './components/analysis/AnalysisWorkspace'
import { ResearchWorkspace } from './components/research/ResearchWorkspace'
import { LearnWorkspace } from './components/learn/LearnWorkspace'
import { ContextualHelpModal } from './components/learn/ContextualHelpModal'
import { CreateChartModal } from './components/modals/CreateChartModal'
import { VedicCockpit } from './components/overview/VedicCockpit'
import { AstrologicalRadar } from './components/overview/AstrologicalRadar'
import { TechnicalTables } from './components/overview/TechnicalTables'
import type { CalculationSettingsConfig } from './components/research/ConfigurationPanel'

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type NavKey = 'Overview' | 'Charts' | 'Timing' | 'Analysis' | 'Research' | 'Learn'

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
// App
// ---------------------------------------------------------------------------

function App() {
  const [selectedNav, setSelectedNav] = useState<NavKey>('Overview')
  const [selectedPlanet, setSelectedPlanet] = useState<string>('Sun')
  const [selectedHouse, setSelectedHouse] = useState<number>(1)
  const [selectedDashaPeriod, setSelectedDashaPeriod] = useState<DashaPeriod | null>(null)
  const [dashaHierarchyChain, setDashaHierarchyChain] = useState<DashaChainItem[]>([])
  const [inspectorTab, setInspectorTab] = useState<'planet' | 'house' | 'dasha'>('planet')
  const [tableTab, setTableTab] = useState<'planets' | 'houses'>('planets')
  const [chart, setChart] = useState<AstroChart | null>(null)
  const [savedCharts, setSavedCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [helpTermId, setHelpTermId] = useState<string | null>(null)
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
    const normalized = normalizeChartPayload(targetChart)
    setChart(normalized)
    setSelectedPlanet(normalized.planets[0]?.name ?? 'Sun')
    setSelectedHouse(1)
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

  // Recalculate chart with updated engine calculation parameters (PRD §20)
  const handleApplySettings = async (newSettings: CalculationSettingsConfig) => {
    if (!chart) return
    const birth = chart.birthData || DEFAULT_BIRTH
    try {
      setLoading(true)
      const requestPayload = {
        ...birth,
        settings: {
          ayanamsa: newSettings.ayanamsa,
          house_system: newSettings.house_system,
          node_type: newSettings.node_type,
          topocentric: newSettings.topocentric,
          apparent_positions: newSettings.apparent_positions,
          sunrise_mode: newSettings.sunrise_mode,
          dasha_year_length: newSettings.dasha_year_length,
        },
      }
      const computed = await fetchJsonWithRetry('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })
      applyChart({
        ...computed,
        id: chart.id,
        name: chart.name,
        birthData: { ...birth, settings: requestPayload.settings },
      })
    } catch (e) {
      console.error('Failed to recalculate with settings:', e)
      throw e
    } finally {
      setLoading(false)
    }
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
              onClick={() => {
                setSelectedNav(item)
                if (item === 'Timing') {
                  setInspectorTab('dasha')
                }
              }}
            >
              <span>{item}</span>
              <span className="nav-count">
                {item === 'Overview' ? '01' : item === 'Charts' ? String(savedCharts.length).padStart(2, '0') : item === 'Analysis' ? '04' : item === 'Research' ? '03' : item === 'Learn' ? '02' : '—'}
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

        <VedicCockpit
          chart={chart}
          onSelectPlanet={(pName) => {
            setSelectedPlanet(pName)
            setInspectorTab('planet')
          }}
          onSelectHouse={(hNum) => {
            setSelectedHouse(hNum)
            setInspectorTab('house')
          }}
          onNavigateToAnalysis={() => setSelectedNav('Analysis')}
          onNavigateToTiming={() => {
            setSelectedNav('Timing')
            setInspectorTab('dasha')
          }}
        />

        {selectedNav === 'Overview' && (
          <>
            <section className="main-panel panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Astronomical Epoch & Coordinates</p>
                  <h3>{chart.metadata.dateFormatted} • {chart.metadata.timeFormatted}</h3>
                </div>
                <div className="meta-block">
                  <span>📍 {chart.metadata.location} ({chart.metadata.latitude}, {chart.metadata.longitude})</span>
                  <span>🌐 {chart.metadata.timezone} • {chart.metadata.ayanamsaName} ({chart.metadata.ayanamsaDms})</span>
                </div>
              </div>

              <div className="chart-layout">
                <div className="chart-board" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <VedicChart
                    chart={chart}
                    selectedPlanet={selectedPlanet}
                    selectedHouse={selectedHouse}
                    defaultStyle="north"
                    onSelectPlanet={(pName) => {
                      setSelectedPlanet(pName)
                      setInspectorTab('planet')
                    }}
                    onSelectHouse={(hNum) => {
                      setSelectedHouse(hNum)
                      setInspectorTab('house')
                    }}
                  />
                </div>

                <AstrologicalRadar
                  chart={chart}
                  tableTab={tableTab}
                  onSelectTableTab={(tab) => {
                    setTableTab(tab)
                    setInspectorTab(tab === 'planets' ? 'planet' : 'house')
                  }}
                  onSelectPlanet={(pName) => {
                    setSelectedPlanet(pName)
                    setInspectorTab('planet')
                  }}
                  onSelectHouse={(hNum) => {
                    setSelectedHouse(hNum)
                    setInspectorTab('house')
                  }}
                  onNavigateToNav={(nav) => setSelectedNav(nav)}
                />
              </div>
            </section>

            <TechnicalTables
              chart={chart}
              tableTab={tableTab}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              onSelectTableTab={(tab) => {
                setTableTab(tab)
                setInspectorTab(tab === 'planets' ? 'planet' : 'house')
              }}
              onSelectPlanet={(pName) => {
                setSelectedPlanet(pName)
                setInspectorTab('planet')
              }}
              onSelectHouse={(hNum) => {
                setSelectedHouse(hNum)
                setInspectorTab('house')
              }}
            />
          </>
        )}

        {selectedNav === 'Charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VargaWorkspace
              chart={chart}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              onSelectPlanet={(pName) => {
                setSelectedPlanet(pName)
                setInspectorTab('planet')
              }}
              onSelectHouse={(hNum) => {
                setSelectedHouse(hNum)
                setInspectorTab('house')
              }}
            />

            {savedCharts.length > 0 && (
              <section className="panel" style={{ marginTop: 8 }}>
                <div className="section-header">
                  <h3>Saved Charts Archive</h3>
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
              </section>
            )}
          </div>
        )}

        {selectedNav === 'Timing' && (
          <DashaTimeline
            chart={chart}
            onSelectPlanet={(pName) => {
              setSelectedPlanet(pName)
              setInspectorTab('planet')
            }}
            onSelectHouse={(hNum) => {
              setSelectedHouse(hNum)
              setInspectorTab('house')
            }}
            onSelectPeriod={(period, chain) => {
              setSelectedDashaPeriod(period)
              setDashaHierarchyChain(chain)
              setInspectorTab('dasha')
            }}
          />
        )}

        {selectedNav === 'Analysis' && (
          <AnalysisWorkspace
            chart={chart}
            onSelectPlanet={(pName) => {
              setSelectedPlanet(pName)
              setInspectorTab('planet')
            }}
            onSelectHouse={(hNum) => {
              setSelectedHouse(hNum)
              setInspectorTab('house')
            }}
          />
        )}

        {selectedNav === 'Research' && (
          <ResearchWorkspace
            chart={chart}
            onSelectPlanet={(pName) => {
              setSelectedPlanet(pName)
              setInspectorTab('planet')
            }}
            onSelectHouse={(hNum) => {
              setSelectedHouse(hNum)
              setInspectorTab('house')
            }}
            onApplySettings={handleApplySettings}
            isRecalculating={loading}
          />
        )}

        {selectedNav === 'Learn' && (
          <LearnWorkspace chart={chart} />
        )}
      </main>

      <UniversalInspector
        chart={chart}
        selectedPlanetName={selectedPlanet}
        selectedHouseNumber={selectedHouse}
        selectedDashaPeriod={selectedDashaPeriod}
        dashaHierarchyChain={dashaHierarchyChain}
        activeTab={inspectorTab}
        onChangeTab={setInspectorTab}
        onSelectPlanet={(pName) => {
          setSelectedPlanet(pName)
          setInspectorTab('planet')
        }}
        onSelectHouse={(hNum) => {
          setSelectedHouse(hNum)
          setInspectorTab('house')
        }}
        onSelectPeriod={(period) => {
          setSelectedDashaPeriod(period)
          setInspectorTab('dasha')
        }}
        onOpenHelp={setHelpTermId}
      />

      {showCreateModal && (
        <CreateChartModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newChart) => {
            setSavedCharts((prev) => [newChart, ...prev.filter((c) => c.id !== newChart.id)])
            applyChart(newChart)
            setSelectedNav('Overview')
            setShowCreateModal(false)
          }}
          fetchJsonWithRetry={fetchJsonWithRetry}
        />
      )}

      {helpTermId && chart && (
        <ContextualHelpModal
          termId={helpTermId}
          chart={chart}
          onClose={() => setHelpTermId(null)}
          onNavigateToGlossary={() => {
            setHelpTermId(null)
            setSelectedNav('Learn')
          }}
        />
      )}
    </div>
  )
}

export default App
