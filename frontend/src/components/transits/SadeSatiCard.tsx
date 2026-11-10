import React, { useState } from 'react'
import type { GuruGocharaReport, SadeSatiReport, ShaniAffliction } from '../../types/astro'

interface SadeSatiCardProps {
  sadeSati: SadeSatiReport
  ashtamaShani: ShaniAffliction
  ardhashtamaShani: ShaniAffliction
  kantakaShani: ShaniAffliction
  guruGochara: GuruGocharaReport
}

export const SadeSatiCard: React.FC<SadeSatiCardProps> = ({
  sadeSati,
  ashtamaShani,
  ardhashtamaShani,
  kantakaShani,
  guruGochara,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'remedies' | 'afflictions'>('overview')

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'peak':
        return '#ef4444' // Red / Alert
      case 'rising':
        return '#f59e0b' // Amber
      case 'setting':
        return '#3b82f6' // Blue
      default:
        return '#10b981' // Emerald / Serene
    }
  }

  const phaseColor = getPhaseColor(sadeSati.phase)

  return (
    <div className="sade-sati-container panel" style={{ padding: 24, borderRadius: 16 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🪐</span>
            <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#f6db9d' }}>
              Saturn Sade Sati & Transit Tracker
            </h3>
            <span
              style={{
                background: sadeSati.isActive ? `${phaseColor}26` : 'rgba(16, 185, 129, 0.15)',
                color: sadeSati.isActive ? phaseColor : '#10b981',
                border: `1px solid ${sadeSati.isActive ? phaseColor : '#10b981'}55`,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {sadeSati.isActive ? `● ${sadeSati.phaseName}` : '○ Inactive (Free)'}
            </span>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>
            Saturn in <strong>{sadeSati.saturnSign}</strong> • Janma Moon in <strong>{sadeSati.natalMoonSign}</strong>
            {sadeSati.isActive && (
              <span style={{ marginLeft: 10, color: '#e2e8f0' }}>
                (Separation Orb: <strong>{sadeSati.degreeOrb}°</strong>)
              </span>
            )}
          </p>
        </div>

        {/* Quick Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={activeTab === 'overview' ? 'chip-button active' : 'chip-button'}
            onClick={() => setActiveTab('overview')}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            Phase Overview
          </button>
          <button
            type="button"
            className={activeTab === 'afflictions' ? 'chip-button active' : 'chip-button'}
            onClick={() => setActiveTab('afflictions')}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            Special Shani Afflictions
          </button>
          <button
            type="button"
            className={activeTab === 'remedies' ? 'chip-button active' : 'chip-button'}
            onClick={() => setActiveTab('remedies')}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            Remedies & Guidance
          </button>
        </div>
      </div>

      {/* Visual Phase Progress Stepper */}
      <div
        style={{
          marginTop: 20,
          padding: '16px 20px',
          background: 'rgba(0,0,0,0.28)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {/* Phase 1: Rising */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background:
                sadeSati.phase === 'rising'
                  ? 'rgba(245, 158, 11, 0.16)'
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                sadeSati.phase === 'rising' ? '#f59e0b' : 'rgba(255,255,255,0.08)'
              }`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Phase 1 • 12th from Moon
              </span>
              {sadeSati.phase === 'rising' && (
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                  ACTIVE NOW
                </span>
              )}
            </div>
            <strong style={{ fontSize: '0.95rem', color: sadeSati.phase === 'rising' ? '#fcd34d' : '#e2e8f0' }}>
              Aardha Sade Sati (Rising)
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.35 }}>
              Mental cleansing, sudden expenditures, sleep recalibration, foreign travels.
            </p>
          </div>

          {/* Phase 2: Peak */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background:
                sadeSati.phase === 'peak'
                  ? 'rgba(239, 68, 68, 0.18)'
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                sadeSati.phase === 'peak' ? '#ef4444' : 'rgba(255,255,255,0.08)'
              }`,
              boxShadow: sadeSati.isExactOrb ? '0 0 16px rgba(239, 68, 68, 0.35)' : undefined,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Phase 2 • Janma Rasi (1st)
              </span>
              {sadeSati.phase === 'peak' && (
                <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>
                  {sadeSati.isExactOrb ? 'CRITICAL ORB (≤5°)' : 'ACTIVE NOW'}
                </span>
              )}
            </div>
            <strong style={{ fontSize: '0.95rem', color: sadeSati.phase === 'peak' ? '#fca5a5' : '#e2e8f0' }}>
              Janma Shani (Peak Crest)
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.35 }}>
              Maximum intensity, identity restructuring, physical stamina tests, heavy burdens.
            </p>
          </div>

          {/* Phase 3: Setting */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background:
                sadeSati.phase === 'setting'
                  ? 'rgba(59, 130, 246, 0.16)'
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                sadeSati.phase === 'setting' ? '#3b82f6' : 'rgba(255,255,255,0.08)'
              }`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                Phase 3 • 2nd from Moon
              </span>
              {sadeSati.phase === 'setting' && (
                <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700 }}>
                  ACTIVE NOW
                </span>
              )}
            </div>
            <strong style={{ fontSize: '0.95rem', color: sadeSati.phase === 'setting' ? '#93c5fd' : '#e2e8f0' }}>
              Antya Sade Sati (Setting)
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.35 }}>
              Financial consolidation, speech restraint, family obligations, gradual relief.
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              padding: 18,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 8px', color: '#f6db9d', fontSize: '1.05rem' }}>
              Classical Evaluation: {sadeSati.sanskritName} ({sadeSati.phaseName})
            </h4>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {sadeSati.description}
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Impact Intensity: </span>
                <strong style={{ color: phaseColor, fontSize: '0.85rem' }}>{sadeSati.intensity}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Natal Moon Sign: </span>
                <strong style={{ color: '#f6db9d', fontSize: '0.85rem' }}>{sadeSati.natalMoonSign}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transit Saturn Sign: </span>
                <strong style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{sadeSati.saturnSign}</strong>
              </div>
              {guruGochara.isFavorable && (
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 14px', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>✨ Jupiter Blessing: </span>
                  <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>Favorable Protection Active</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Special Afflictions */}
      {activeTab === 'afflictions' && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Ashtama Shani */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: ashtamaShani.isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${ashtamaShani.isActive ? '#ef4444' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: ashtamaShani.isActive ? '#f87171' : '#94a3b8', fontSize: '0.95rem' }}>
                Ashtama Shani (8th from Moon)
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: ashtamaShani.isActive ? '#ef444433' : 'rgba(255,255,255,0.05)',
                  color: ashtamaShani.isActive ? '#fca5a5' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {ashtamaShani.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              {ashtamaShani.description}
            </p>
          </div>

          {/* Ardhashtama Shani */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: ardhashtamaShani.isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${ardhashtamaShani.isActive ? '#f59e0b' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: ardhashtamaShani.isActive ? '#fbbf24' : '#94a3b8', fontSize: '0.95rem' }}>
                Ardhashtama Shani (4th from Moon)
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: ardhashtamaShani.isActive ? '#f59e0b33' : 'rgba(255,255,255,0.05)',
                  color: ardhashtamaShani.isActive ? '#fde68a' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {ardhashtamaShani.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              {ardhashtamaShani.description}
            </p>
          </div>

          {/* Kantaka Shani */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: kantakaShani.isActive ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${kantakaShani.isActive ? '#a855f7' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: kantakaShani.isActive ? '#c084fc' : '#94a3b8', fontSize: '0.95rem' }}>
                Kantaka Shani (Kendra Thorn)
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: kantakaShani.isActive ? '#a855f733' : 'rgba(255,255,255,0.05)',
                  color: kantakaShani.isActive ? '#e9d5ff' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {kantakaShani.isActive ? `ACTIVE (${kantakaShani.activeFrom})` : 'INACTIVE'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              {kantakaShani.description}
            </p>
          </div>

          {/* Guru Gochara Counter-Shield */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: guruGochara.isFavorable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${guruGochara.isFavorable ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: guruGochara.isFavorable ? '#34d399' : '#94a3b8', fontSize: '0.95rem' }}>
                Guru Gochara (Jupiter Blessing)
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: guruGochara.isFavorable ? '#10b98133' : 'rgba(255,255,255,0.05)',
                  color: guruGochara.isFavorable ? '#a7f3d0' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {guruGochara.isFavorable ? 'PROTECTIVE' : 'NEUTRAL'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              {guruGochara.description}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Remedies & Guidance */}
      {activeTab === 'remedies' && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div
            style={{
              padding: 18,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 10px', color: '#f6db9d', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🧭</span> Strategic Behavioral Advice
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {sadeSati.advice.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: 18,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 10px', color: '#6ee7b7', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🕉️</span> Classical Astrological Remedies
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {sadeSati.remedies.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

