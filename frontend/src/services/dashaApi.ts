import type { DashaPeriod, SambhandhaResult } from '../types/astro'
import type { DashaChainItem } from '../components/timing/dashaUtils'

// In-memory cache for expanded subperiods from the backend
const subperiodCache = new Map<string, DashaPeriod[]>()

/**
 * Requests backend Dasha sub-period expansion for a given parent period.
 * All mathematical calculations occur strictly on the backend.
 */
export async function fetchExpandedSubPeriods(
  parent: DashaPeriod,
  targetLevel?: number
): Promise<DashaPeriod[]> {
  if (!parent || !parent.lord) return []

  const nextLevel = targetLevel || (parent.level ? parent.level + 1 : 2)

  // 1. If parent already carries children from backend of the required level, return them
  if (parent.children && parent.children.length === 9) {
    if (!targetLevel || parent.children[0].level === nextLevel) {
      return parent.children
    }
  }

  // 2. Cache lookup
  const cacheKey = `${parent.lord}_${parent.level || 1}_${parent.start}_${nextLevel}`
  if (subperiodCache.has(cacheKey)) {
    return subperiodCache.get(cacheKey)!
  }

  // 3. Request from backend API
  try {
    const res = await fetch('/api/dasha/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent,
        targetLevel: nextLevel,
      }),
    })

    if (!res.ok) {
      throw new Error(`Backend Dasha expansion failed: ${res.statusText}`)
    }

    const data = await res.json()
    const subperiods: DashaPeriod[] = data.subperiods || []
    subperiodCache.set(cacheKey, subperiods)
    return subperiods
  } catch (err) {
    console.error('Failed to fetch expanded dasha subperiods from backend:', err)
    return []
  }
}

/**
 * Requests the 6-level active running dasha chain computed by the backend.
 */
export async function fetchRunningDashaChain(
  dashas: DashaPeriod[],
  targetTime: Date | number = new Date()
): Promise<DashaChainItem[]> {
  try {
    const res = await fetch('/api/dasha/running-chain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dashas,
        targetTime: typeof targetTime === 'number' ? targetTime : targetTime.getTime(),
      }),
    })

    if (!res.ok) {
      throw new Error(`Backend running dasha chain failed: ${res.statusText}`)
    }

    const data = await res.json()
    return data.chain || []
  } catch (err) {
    console.error('Failed to fetch running dasha chain from backend:', err)
    return []
  }
}

/**
 * Requests classical Sambhandha calculation between two lords from the backend.
 */
export async function fetchSambhandha(
  lordA: string,
  lordB: string,
  chart: any
): Promise<SambhandhaResult | null> {
  try {
    const res = await fetch('/api/relationship/sambhandha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lordA, lordB, chart }),
    })

    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch Sambhandha from backend:', err)
    return null
  }
}
