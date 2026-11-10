import type { DashaPeriod } from '../types/astro'

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
