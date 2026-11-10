import { useState, useEffect } from 'react'

/**
 * Shared application clock hook. Updates on an interval (default: 30s)
 * ensuring all timing components, live markers, and running period evaluations
 * share the exact same timestamp simultaneously without render-time drift.
 */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
