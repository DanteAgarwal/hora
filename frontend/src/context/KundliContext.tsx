/**
 * Centralized Kundli UI & Chart Store (React Context)
 * Kundli Workbench • React 19 State Architecture
 * 
 * Eliminates prop-drilling across App.tsx and nested workspaces.
 * Manages active chart, inspector selection, active navigation tabs, and system state.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { AstroChart, BirthData, DashaPeriod } from '../types/astro'
import type { DashaChainItem } from '../components/timing/dashaUtils'
import { normalizeChartPayload } from '../adapters/horaAdapter'

export type NavKey = 'Overview' | 'Charts' | 'Timing' | 'Transits' | 'Analysis' | 'Research' | 'Learn'

export const navItems: NavKey[] = ['Overview', 'Charts', 'Timing', 'Transits', 'Analysis', 'Research', 'Learn']

export const DEFAULT_BIRTH: BirthData = {
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

export interface KundliStoreState {
  // Navigation & Tabs
  selectedNav: NavKey
  setSelectedNav: (nav: NavKey) => void

  // Selection state
  selectedPlanet: string
  selectedHouse: number
  selectedDashaPeriod: DashaPeriod | null
  dashaHierarchyChain: DashaChainItem[]
  inspectorTab: 'planet' | 'house' | 'dasha'
  tableTab: 'planets' | 'houses'
  isInspectorOpen: boolean

  // Actions
  selectPlanet: (planetName: string) => void
  selectHouse: (houseNumber: number) => void
  selectDashaPeriod: (period: DashaPeriod, chain?: DashaChainItem[]) => void
  setInspectorTab: (tab: 'planet' | 'house' | 'dasha') => void
  setTableTab: (tab: 'planets' | 'houses') => void
  setIsInspectorOpen: (open: boolean) => void

  // Chart & Persistence State
  chart: AstroChart | null
  savedCharts: any[]
  loading: boolean
  error: string | null
  backendStatus: 'checking' | 'online' | 'offline'
  setChart: React.Dispatch<React.SetStateAction<AstroChart | null>>
  setSavedCharts: React.Dispatch<React.SetStateAction<any[]>>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  applyChart: (targetChart: any) => void
  recalculateCurrent: () => Promise<void>

  // Modals & Contextual Help
  showCreateModal: boolean
  setShowCreateModal: (show: boolean) => void
  helpTermId: string | null
  setHelpTermId: (termId: string | null) => void
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

const KundliContext = createContext<KundliStoreState | null>(null)

export function KundliProvider({ children }: { children: React.ReactNode }) {
  const [selectedNav, setSelectedNav] = useState<NavKey>('Overview')
  const [selectedPlanet, setSelectedPlanet] = useState<string>('Sun')
  const [selectedHouse, setSelectedHouse] = useState<number>(1)
  const [selectedDashaPeriod, setSelectedDashaPeriod] = useState<DashaPeriod | null>(null)
  const [dashaHierarchyChain, setDashaHierarchyChain] = useState<DashaChainItem[]>([])
  const [inspectorTab, setInspectorTab] = useState<'planet' | 'house' | 'dasha'>('planet')
  const [tableTab, setTableTab] = useState<'planets' | 'houses'>('planets')
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)

  const [chart, setChart] = useState<AstroChart | null>(null)
  const [savedCharts, setSavedCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [helpTermId, setHelpTermId] = useState<string | null>(null)

  // Actions with automatic tab switching and drawer opening (on small screens)
  const selectPlanet = useCallback((pName: string) => {
    setSelectedPlanet(pName)
    setInspectorTab('planet')
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsInspectorOpen(true)
    }
  }, [])

  const selectHouse = useCallback((hNum: number) => {
    setSelectedHouse(hNum)
    setInspectorTab('house')
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsInspectorOpen(true)
    }
  }, [])

  const selectDashaPeriod = useCallback((period: DashaPeriod, chain?: DashaChainItem[]) => {
    setSelectedDashaPeriod(period)
    if (chain) setDashaHierarchyChain(chain)
    setInspectorTab('dasha')
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsInspectorOpen(true)
    }
  }, [])

  // Apply chart and update active selections
  const applyChart = useCallback((targetChart: any) => {
    const normalized = normalizeChartPayload(targetChart)
    setChart(normalized)
    setSelectedPlanet(normalized.planets[0]?.name ?? 'Sun')
    setSelectedHouse(1)
    if (targetChart.id) {
      localStorage.setItem('hora_active_chart_id', String(targetChart.id))
    }
  }, [])

  // Recalculate currently active chart
  const recalculateCurrent = useCallback(async () => {
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
      console.error('Failed to recalculate chart:', e)
    } finally {
      setLoading(false)
    }
  }, [chart, applyChart])

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
  }, [applyChart])

  const store = useMemo<KundliStoreState>(() => ({
    selectedNav,
    setSelectedNav,
    selectedPlanet,
    selectedHouse,
    selectedDashaPeriod,
    dashaHierarchyChain,
    inspectorTab,
    tableTab,
    isInspectorOpen,
    selectPlanet,
    selectHouse,
    selectDashaPeriod,
    setInspectorTab,
    setTableTab,
    setIsInspectorOpen,
    chart,
    savedCharts,
    loading,
    error,
    backendStatus,
    setChart,
    setSavedCharts,
    setLoading,
    setError,
    applyChart,
    recalculateCurrent,
    showCreateModal,
    setShowCreateModal,
    helpTermId,
    setHelpTermId,
  }), [
    selectedNav,
    selectedPlanet,
    selectedHouse,
    selectedDashaPeriod,
    dashaHierarchyChain,
    inspectorTab,
    tableTab,
    isInspectorOpen,
    selectPlanet,
    selectHouse,
    selectDashaPeriod,
    chart,
    savedCharts,
    loading,
    error,
    backendStatus,
    applyChart,
    recalculateCurrent,
    showCreateModal,
    helpTermId,
  ])

  return (
    <KundliContext.Provider value={store}>
      {children}
    </KundliContext.Provider>
  )
}

export function useKundliStore(): KundliStoreState {
  const context = useContext(KundliContext)
  if (!context) {
    throw new Error('useKundliStore must be used within a KundliProvider')
  }
  return context
}

export { fetchJsonWithRetry }
