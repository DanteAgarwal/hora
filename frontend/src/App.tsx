import { Suspense, lazy } from 'react'
import './App.css'
import {
  KundliProvider,
  useKundliStore,
  navItems,
  fetchJsonWithRetry,
  DEFAULT_BIRTH,
} from './context/KundliContext'
import { VedicChart } from './components/chart/VedicChart'
import { UniversalInspector } from './components/inspector/UniversalInspector'
import { VedicCockpit } from './components/overview/VedicCockpit'
import { AstrologicalRadar } from './components/overview/AstrologicalRadar'
import { TechnicalTables } from './components/overview/TechnicalTables'
import type { CalculationSettingsConfig } from './components/research/ConfigurationPanel'

// ---------------------------------------------------------------------------
// Route & Tab Code-Splitting: Lazy-Loaded Heavy Workspaces
// ---------------------------------------------------------------------------

const VargaWorkspace = lazy(() =>
  import('./components/vargas/VargaWorkspace').then((m) => ({ default: m.VargaWorkspace })),
)
const DashaTimeline = lazy(() =>
  import('./components/timing/DashaTimeline').then((m) => ({ default: m.DashaTimeline })),
)
const TransitWorkspace = lazy(() =>
  import('./components/transits/TransitWorkspace').then((m) => ({ default: m.TransitWorkspace })),
)
const AnalysisWorkspace = lazy(() =>
  import('./components/analysis/AnalysisWorkspace').then((m) => ({ default: m.AnalysisWorkspace })),
)
const ResearchWorkspace = lazy(() =>
  import('./components/research/ResearchWorkspace').then((m) => ({ default: m.ResearchWorkspace })),
)
const LearnWorkspace = lazy(() =>
  import('./components/learn/LearnWorkspace').then((m) => ({ default: m.LearnWorkspace })),
)
const CreateChartModal = lazy(() =>
  import('./components/modals/CreateChartModal').then((m) => ({ default: m.CreateChartModal })),
)
const ContextualHelpModal = lazy(() =>
  import('./components/learn/ContextualHelpModal').then((m) => ({ default: m.ContextualHelpModal })),
)

// ---------------------------------------------------------------------------
// Workspace Skeleton Loader (Suspense Fallback)
// ---------------------------------------------------------------------------

function WorkspaceSkeleton({ title }: { title?: string }) {
  return (
    <div
      className="panel workspace-skeleton"
      style={{
        padding: '32px 24px',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 140, height: 16, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 4 }} />
        <div style={{ width: 80, height: 16, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 4 }} />
      </div>
      <div style={{ width: '40%', height: 24, background: 'rgba(217, 119, 6, 0.2)', borderRadius: 4 }} />
      <div style={{ width: '70%', height: 14, background: 'rgba(148, 163, 184, 0.1)', borderRadius: 4 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 12,
        }}
      >
        <div
          style={{
            height: 180,
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        />
        <div
          style={{
            height: 180,
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        />
      </div>
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: 16 }}>
        Loading {title || 'workspace'}...
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main App Workspace Shell (Reads from Centralized Kundli Store)
// ---------------------------------------------------------------------------

function AppShell() {
  const {
    selectedNav,
    setSelectedNav,
    selectedPlanet,
    selectedHouse,
    inspectorTab,
    setIsInspectorOpen,
    chart,
    savedCharts,
    setSavedCharts,
    loading,
    setLoading,
    error,
    backendStatus,
    applyChart,
    recalculateCurrent,
    showCreateModal,
    setShowCreateModal,
    helpTermId,
    setHelpTermId,
  } = useKundliStore()

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
      {/* Primary Sidebar Navigation */}
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
              }}
            >
              <span>{item}</span>
              <span className="nav-count">
                {item === 'Overview'
                  ? '01'
                  : item === 'Charts'
                  ? String(savedCharts.length).padStart(2, '0')
                  : item === 'Timing'
                  ? '03'
                  : item === 'Transits'
                  ? '🪐'
                  : item === 'Analysis'
                  ? '04'
                  : item === 'Research'
                  ? '05'
                  : item === 'Learn'
                  ? '02'
                  : '—'}
              </span>
            </button>
          ))}
        </nav>

        <div className="mini-card">
          <p className="eyebrow">System status</p>
          <strong>Hora API</strong>
          <span className={backendStatus === 'online' ? 'status-online' : 'status-offline'}>
            {backendStatus === 'online'
              ? '● Connected'
              : backendStatus === 'checking'
              ? '◌ Checking...'
              : '○ Disconnected'}
          </span>
        </div>
      </aside>

      {/* Main Analysis Workspace */}
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
            <button
              type="button"
              className="ghost-button mobile-inspect-btn"
              onClick={() => setIsInspectorOpen(true)}
              title="Open Object Inspector"
            >
              🔍 Inspect
            </button>
            <button type="button" className="ghost-button" onClick={() => setShowCreateModal(true)}>
              + Cast New Chart
            </button>
            <button type="button" className="primary-button" onClick={recalculateCurrent} disabled={loading}>
              {loading ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>
        </header>

        {/* Central Vedic Cockpit - Reads directly from store */}
        <VedicCockpit />

        {/* 1. Overview Tab */}
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
                  <VedicChart defaultStyle="north" />
                </div>
                <AstrologicalRadar />
              </div>
            </section>

            <TechnicalTables />
          </>
        )}

        {/* 2. Charts / Vargas Tab (Lazy-Loaded) */}
        {selectedNav === 'Charts' && (
          <Suspense fallback={<WorkspaceSkeleton title="Varga Divisional Charts" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <VargaWorkspace />

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
          </Suspense>
        )}

        {/* 3. Timing / Dasha Timeline Tab (Lazy-Loaded) */}
        {selectedNav === 'Timing' && (
          <Suspense fallback={<WorkspaceSkeleton title="Vimshottari Dasha Engine" />}>
            <DashaTimeline />
          </Suspense>
        )}

        {/* 4. Transits / Gochara Tab (Lazy-Loaded) */}
        {selectedNav === 'Transits' && (
          <Suspense fallback={<WorkspaceSkeleton title="Live Gochara & Sade Sati Tracker" />}>
            <TransitWorkspace />
          </Suspense>
        )}

        {/* 5. Analysis / Shadbala & Yogas Tab (Lazy-Loaded) */}
        {selectedNav === 'Analysis' && (
          <Suspense fallback={<WorkspaceSkeleton title="Dignity & Shadbala Analysis" />}>
            <AnalysisWorkspace />
          </Suspense>
        )}

        {/* 6. Research & Provenance Tab (Lazy-Loaded) */}
        {selectedNav === 'Research' && (
          <Suspense fallback={<WorkspaceSkeleton title="Research Workbench & Raw Data" />}>
            <ResearchWorkspace onApplySettings={handleApplySettings} />
          </Suspense>
        )}

        {/* 7. Learn & Encyclopedia Tab (Lazy-Loaded) */}
        {selectedNav === 'Learn' && (
          <Suspense fallback={<WorkspaceSkeleton title="Classical Vedic Encyclopedia" />}>
            <LearnWorkspace />
          </Suspense>
        )}
      </main>

      {/* Persistent / Responsive Universal Inspector - Reads directly from store */}
      <UniversalInspector />

      {/* Floating Inspector Trigger Pill for Tablets & Mobile (screen <= 1280px) */}
      <button
        type="button"
        className="floating-inspector-pill"
        onClick={() => setIsInspectorOpen(true)}
        title="Open Object Inspector"
        aria-label="Open Object Inspector"
      >
        <span className="pill-dot" />
        <span className="pill-icon">🔍</span>
        <span className="pill-label">
          {inspectorTab === 'planet'
            ? `${selectedPlanet || 'Planet'}`
            : inspectorTab === 'house'
            ? `House ${selectedHouse}`
            : 'Dasha'}
        </span>
        <span className="pill-badge">{inspectorTab}</span>
      </button>

      {/* Lazy-Loaded Modals */}
      {showCreateModal && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {helpTermId && chart && (
        <Suspense fallback={null}>
          <ContextualHelpModal
            termId={helpTermId}
            chart={chart}
            onClose={() => setHelpTermId(null)}
            onNavigateToGlossary={() => {
              setHelpTermId(null)
              setSelectedNav('Learn')
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root App with Context Provider Wrapper
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <KundliProvider>
      <AppShell />
    </KundliProvider>
  )
}
