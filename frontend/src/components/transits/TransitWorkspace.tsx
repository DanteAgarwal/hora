import React, { useCallback, useEffect, useState } from 'react'
import type { AstroChart, LiveGocharaResult } from '../../types/astro'
import { DualWheelChart } from './DualWheelChart'
import { SadeSatiCard } from './SadeSatiCard'
import { TransitAshtakavargaTable } from './TransitAshtakavargaTable'

interface TransitWorkspaceProps {
  chart: AstroChart
  selectedPlanet?: string
  selectedHouse?: number
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

export const TransitWorkspace: React.FC<TransitWorkspaceProps> = ({
  chart,
  selectedPlanet,
  onSelectPlanet,
}) => {
  const [transitDate, setTransitDate] = useState<string>(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  })
  const [isLiveNow, setIsLiveNow] = useState<boolean>(true)
  const [transitData, setTransitData] = useState<LiveGocharaResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch live transits from API
  const fetchTransits = useCallback(
    async (dateStr?: string) => {
      setLoading(true)
      setError(null)
      try {
        const payload: Record<string, any> = {
          chartId: chart.id,
          chart,
          transitDate: isLiveNow ? new Date().toISOString() : dateStr ? new Date(dateStr).toISOString() : undefined,
          place: chart.birthData?.place || {
            name: chart.metadata.location || 'New Delhi',
            latitude: Number(chart.metadata.latitude) || 28.6139,
            longitude: Number(chart.metadata.longitude) || 77.209,
          },
          tz_name: chart.metadata.timezone || 'Asia/Kolkata',
        }

        const res = await fetch('/api/transits/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errDetail = await res.json().catch(() => ({}))
          throw new Error(errDetail.error || `Transit API failed (${res.status})`)
        }

        const data: LiveGocharaResult = await res.json()
        setTransitData(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch live transit calculation')
      } finally {
        setLoading(false)
      }
    },
    [chart, isLiveNow],
  )

  // Initial load
  useEffect(() => {
    void fetchTransits(isLiveNow ? undefined : transitDate)
  }, [fetchTransits, isLiveNow, transitDate])

  // Presets
  const applyPreset = (monthsDelta: number, setNow = false) => {
    if (setNow) {
      setIsLiveNow(true)
      const now = new Date()
      setTransitDate(now.toISOString().slice(0, 16))
      void fetchTransits()
      return
    }

    setIsLiveNow(false)
    const base = new Date(transitDate)
    base.setMonth(base.getMonth() + monthsDelta)
    const iso = base.toISOString().slice(0, 16)
    setTransitDate(iso)
    void fetchTransits(iso)
  }

  const formatEpoch = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Control Topbar */}
      <section className="panel" style={{ padding: 22, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🪐</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f6db9d' }}>
                Live Gochara (Transits) & Sade Sati Tracker
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>
              Real-time Swiss Ephemeris sidereal transits overlaid upon <strong>{chart.name}</strong>'s natal chart
            </p>
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={isLiveNow ? 'chip-button active' : 'chip-button'}
              onClick={() => applyPreset(0, true)}
              style={{ fontWeight: 700 }}
            >
              ● Live Real-Time
            </button>
            <button
              type="button"
              className="chip-button"
              onClick={() => applyPreset(1)}
              title="Forward 1 Month"
            >
              +1 Month
            </button>
            <button
              type="button"
              className="chip-button"
              onClick={() => applyPreset(6)}
              title="Forward 6 Months"
            >
              +6 Months
            </button>
            <button
              type="button"
              className="chip-button"
              onClick={() => applyPreset(12)}
              title="Forward 1 Year"
            >
              +1 Year
            </button>
            <button
              type="button"
              className="chip-button"
              onClick={() => applyPreset(-12)}
              title="Rewind 1 Year"
            >
              -1 Year
            </button>
          </div>
        </div>

        {/* Date / Time Inputs Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: 18,
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Transit Epoch:</span>
              <input
                type="datetime-local"
                value={transitDate}
                onChange={(e) => {
                  setIsLiveNow(false)
                  setTransitDate(e.target.value)
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                }}
              />
            </label>

            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              📍 {chart.birthData?.place?.name || chart.metadata.location || 'New Delhi'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {transitData && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                Epoch: {formatEpoch(transitData.transitEpoch.timestamp)}
              </span>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => fetchTransits(isLiveNow ? undefined : transitDate)}
              disabled={loading}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              {loading ? 'Recalculating...' : 'Refresh Transits'}
            </button>
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !transitData && (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <p className="eyebrow">ASTRONOMICAL CALCULATION</p>
          <h3>Calculating Swiss Ephemeris Gochara & Sade Sati...</h3>
          <div className="loading-bar" style={{ marginTop: 16 }}>
            <span />
          </div>
        </div>
      )}

      {/* Main Content */}
      {transitData && (
        <>
          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="panel" style={{ padding: '14px 18px', borderRadius: 12 }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Transit Health Rating
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <strong style={{ fontSize: '1.45rem', color: '#f6db9d' }}>
                  {transitData.summary.averageTransitScore}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ 100</span>
              </div>
            </div>

            <div className="panel" style={{ padding: '14px 18px', borderRadius: 12 }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Planetary Breakdown
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: '0.85rem' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>
                  ● {transitData.summary.favorableCount} Auspicious
                </span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                  ● {transitData.summary.neutralCount} Neutral
                </span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>
                  ● {transitData.summary.unfavorableCount} Challenging
                </span>
              </div>
            </div>

            <div className="panel" style={{ padding: '14px 18px', borderRadius: 12 }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Saturn Sade Sati
              </span>
              <div style={{ marginTop: 4 }}>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: transitData.sadeSati.isActive ? '#f59e0b' : '#34d399',
                  }}
                >
                  {transitData.sadeSati.isActive ? transitData.sadeSati.phaseName : 'Inactive (Free)'}
                </strong>
              </div>
            </div>

            <div className="panel" style={{ padding: '14px 18px', borderRadius: 12 }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Jupiter Gochara Shield
              </span>
              <div style={{ marginTop: 4 }}>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: transitData.guruGochara.isFavorable ? '#34d399' : '#cbd5e1',
                  }}
                >
                  {transitData.guruGochara.isFavorable ? '✨ Favorable Blessing' : 'Guarded Transit'}
                </strong>
              </div>
            </div>
          </div>

          {/* 1. Saturn Sade Sati & Afflictions Engine Card */}
          <SadeSatiCard
            sadeSati={transitData.sadeSati}
            ashtamaShani={transitData.ashtamaShani}
            ardhashtamaShani={transitData.ardhashtamaShani}
            kantakaShani={transitData.kantakaShani}
            guruGochara={transitData.guruGochara}
          />

          {/* 2. Real-Time Dual-Wheel & Overlay Visualizer */}
          <DualWheelChart
            data={transitData}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={onSelectPlanet}
          />

          {/* 3. Transit Ashtakavarga & Gochara Table */}
          <TransitAshtakavargaTable
            planets={transitData.transitingPlanets}
            onSelectPlanet={onSelectPlanet}
          />
        </>
      )}
    </div>
  )
}

