import React, { useState, useMemo } from 'react'
import type { AstroChart, SpecialLagnaPoint, UpagrahaPoint } from '../../types/astro'

interface SpecialLagnasWorkspaceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
}

type ViewMode = 'lagnas' | 'upagrahas' | 'houseMap'
type UpagrahaFilter = 'all' | 'sunBased' | 'timeBased' | 'malefic' | 'benefic'

export const SpecialLagnasWorkspace: React.FC<SpecialLagnasWorkspaceProps> = ({
  chart,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('lagnas')
  const [upagrahaFilter, setUpagrahaFilter] = useState<UpagrahaFilter>('all')
  const [selectedLagna, setSelectedLagna] = useState<SpecialLagnaPoint | null>(null)
  const [selectedUpagraha, setSelectedUpagraha] = useState<UpagrahaPoint | null>(null)

  const specialLagnas: SpecialLagnaPoint[] = useMemo(() => {
    return chart.specialLagnas || []
  }, [chart.specialLagnas])

  const upagrahasResult = chart.upagrahas
  const allUpagrahas: UpagrahaPoint[] = useMemo(() => {
    return upagrahasResult?.all || []
  }, [upagrahasResult])

  const horaLagna = useMemo(() => specialLagnas.find((l) => l.code === 'HL'), [specialLagnas])
  const ghatiLagna = useMemo(() => specialLagnas.find((l) => l.code === 'GL'), [specialLagnas])
  const sreeLagna = useMemo(() => specialLagnas.find((l) => l.code === 'SL'), [specialLagnas])
  const gulika = useMemo(() => allUpagrahas.find((u) => u.name === 'Gulika'), [allUpagrahas])
  const maandi = useMemo(() => allUpagrahas.find((u) => u.name === 'Maandi'), [allUpagrahas])

  const filteredUpagrahas = useMemo(() => {
    if (upagrahaFilter === 'sunBased') {
      return allUpagrahas.filter((u) => u.group.includes('Sun-Based'))
    }
    if (upagrahaFilter === 'timeBased') {
      return allUpagrahas.filter((u) => u.group.includes('Time-Based'))
    }
    if (upagrahaFilter === 'benefic') {
      return allUpagrahas.filter((u) => u.name === 'Yama Ghantaka')
    }
    if (upagrahaFilter === 'malefic') {
      return allUpagrahas.filter((u) => u.name !== 'Yama Ghantaka')
    }
    return allUpagrahas
  }, [allUpagrahas, upagrahaFilter])

  // Map all points by house for the House Sensitivity Matrix
  const housePointsMap = useMemo(() => {
    const map: Record<number, { lagnas: SpecialLagnaPoint[]; upagrahas: UpagrahaPoint[] }> = {}
    for (let h = 1; h <= 12; h++) {
      map[h] = { lagnas: [], upagrahas: [] }
    }
    specialLagnas.forEach((l) => {
      if (map[l.houseNumber]) map[l.houseNumber].lagnas.push(l)
    })
    allUpagrahas.forEach((u) => {
      if (map[u.houseNumber]) map[u.houseNumber].upagrahas.push(u)
    })
    return map
  }, [specialLagnas, allUpagrahas])

  return (
    <div className="sl-workspace-root">
      {/* 1. Hero Summary Header */}
      <section className="sl-hero-panel">
        <div className="sl-hero-content">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="sl-hero-badge">
                BPHS Chapters 4 & 5
              </span>
              <span className="text-xs text-slate-400">Sensitive Focal Points & Shadow Grahas</span>
            </div>
            <h2 className="sl-hero-title">
              <span>🎯</span> Special Lagnas & Upagrahas
            </h2>
            <p className="sl-hero-desc">
              High-precision astronomical reference points and shadow sub-planets that reveal specialized life themes:
              wealth (HL & IL), political authority (GL), divine fortune (SL), karmic destination (BB), and chronic
              afflictions (Gulika & Maandi).
            </p>
          </div>

          <div className="sl-stats-grid">
            <div className="sl-stat-tile">
              <span className="sl-stat-title">Hora Lagna (HL)</span>
              <span className="sl-stat-val text-amber-300">
                {horaLagna ? `${horaLagna.sign.slice(0, 3)} H${horaLagna.houseNumber}` : '—'}
              </span>
              <span className="sl-stat-sub">Wealth & Assets</span>
            </div>

            <div className="sl-stat-tile">
              <span className="sl-stat-title">Ghati Lagna (GL)</span>
              <span className="sl-stat-val text-cyan-300">
                {ghatiLagna ? `${ghatiLagna.sign.slice(0, 3)} H${ghatiLagna.houseNumber}` : '—'}
              </span>
              <span className="sl-stat-sub">Power & Rank</span>
            </div>

            <div className="sl-stat-tile">
              <span className="sl-stat-title">Sree Lagna (SL)</span>
              <span className="sl-stat-val text-emerald-400">
                {sreeLagna ? `${sreeLagna.sign.slice(0, 3)} H${sreeLagna.houseNumber}` : '—'}
              </span>
              <span className="sl-stat-sub">Lakshmi Grace</span>
            </div>

            <div className="sl-stat-tile">
              <span className="sl-stat-title">Gulika / Maandi</span>
              <span className="sl-stat-val text-rose-400">
                {gulika ? `H${gulika.houseNumber}` : '—'} {maandi ? `/ H${maandi.houseNumber}` : ''}
              </span>
              <span className="sl-stat-sub">Saturn Nodes</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. View Mode Navigation Tabs */}
      <nav className="sl-nav-ribbon">
        <div className="sl-tab-group">
          {(
            [
              { id: 'lagnas', label: `🌟 Special Lagnas (${specialLagnas.length})`, badge: 'Wealth & Power' },
              { id: 'upagrahas', label: `☄️ Upagrahas (${allUpagrahas.length})`, badge: 'Shadow Grahas' },
              { id: 'houseMap', label: '🏛️ House Sensitivity Map', badge: '12 Bhavas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`sl-tab-btn ${viewMode === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="sl-tab-badge">{tab.badge}</span>
            </button>
          ))}
        </div>

        {viewMode === 'upagrahas' && (
          <div className="sl-filter-group">
            <span className="text-xs text-slate-400 mr-1">Filter:</span>
            {(
              [
                { id: 'all', label: 'All 11' },
                { id: 'sunBased', label: 'Sun-Based (5)' },
                { id: 'timeBased', label: 'Time-Based (6)' },
                { id: 'malefic', label: 'Malefics' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setUpagrahaFilter(f.id)}
                className={`sl-filter-btn ${upagrahaFilter === f.id ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 3. VIEW 1: Special Lagnas Cards Grid */}
      {viewMode === 'lagnas' && (
        <section className="sl-lagna-grid">
          {specialLagnas.map((lagna) => {
            const isSelected = selectedLagna?.code === lagna.code
            return (
              <article
                key={lagna.code}
                onClick={() => setSelectedLagna(lagna)}
                className={`sl-lagna-card ${isSelected ? 'selected' : ''}`}
              >
                <div>
                  <div className="sl-card-header">
                    <div className="sl-card-identity">
                      <div className="sl-code-avatar">
                        {lagna.code}
                      </div>
                      <div className="sl-card-names">
                        <h4>{lagna.name}</h4>
                        <span className="sl-card-sanskrit">{lagna.sanskritName}</span>
                      </div>
                    </div>

                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectHouse?.(lagna.houseNumber)
                      }}
                      className="sl-house-chip"
                      title={`Click to inspect House ${lagna.houseNumber}`}
                    >
                      {lagna.houseOrdinal} House
                    </span>
                  </div>

                  <div className="sl-data-box my-3">
                    <div className="sl-data-row">
                      <span className="sl-data-label">Position:</span>
                      <span className="sl-data-val">
                        {lagna.sign} ({lagna.dms})
                      </span>
                    </div>
                    <div className="sl-data-row">
                      <span className="sl-data-label">Longitude:</span>
                      <span className="text-slate-300">{lagna.longitude.toFixed(2)}°</span>
                    </div>
                    {lagna.rate && (
                      <div className="sl-data-row">
                        <span className="sl-data-label">Motion Rate:</span>
                        <span className="text-slate-400 text-[11px]">{lagna.rate}</span>
                      </div>
                    )}
                  </div>

                  <p className="sl-card-signifies">{lagna.signifies}</p>

                  {lagna.occupants && lagna.occupants.length > 0 && (
                    <div className="sl-occupants-row">
                      <span className="text-[11px] text-slate-400">Conjoined Grahas:</span>
                      {lagna.occupants.map((occ) => (
                        <span
                          key={occ}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectPlanet?.(occ)
                          }}
                          className="sl-occupant-pill"
                        >
                          {occ}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sl-card-footer">
                  <span className="sl-details-link">
                    Classical Interpretation <span>→</span>
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* 4. VIEW 2: Upagrahas (11 Sub-Planets Table) */}
      {viewMode === 'upagrahas' && (
        <section className="sl-table-wrap">
          <div className="sl-table-header">
            <div>
              <h3>The Eleven Classical Upagrahas (Sub-Planets)</h3>
              <p className="text-xs text-slate-400">
                Five Sun-based (Aprakasha) shadow nodes + Six Time-based (Prahara) portions of day and night.
              </p>
            </div>
            <span className="text-xs text-slate-400 italic">BPHS Chapter 4</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sl-upagraha-table">
              <thead>
                <tr>
                  <th>Upagraha</th>
                  <th>Classification</th>
                  <th>Zodiac Sign</th>
                  <th style={{ textAlign: 'right' }}>DMS Degree</th>
                  <th style={{ textAlign: 'center' }}>House</th>
                  <th>Ruling Graha</th>
                  <th>Nature / Effect</th>
                  <th>Conjoined Grahas</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpagrahas.map((u) => {
                  const isGulikaOrMaandi = u.name === 'Gulika' || u.name === 'Maandi'
                  return (
                    <tr
                      key={u.name}
                      onClick={() => setSelectedUpagraha(u)}
                      className={`sl-upagraha-row ${isGulikaOrMaandi ? 'malefic-node' : ''}`}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] ${
                              isGulikaOrMaandi
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-amber-300 border border-slate-700'
                            }`}
                          >
                            {u.code}
                          </span>
                          <span className="font-bold text-slate-100">{u.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            u.group.includes('Sun-Based')
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                          }`}
                        >
                          {u.group.includes('Sun-Based') ? 'Sun-Based' : 'Time-Based'}
                        </span>
                      </td>
                      <td className="text-slate-200 font-medium">{u.sign}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono text-slate-300">{u.dms}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectHouse?.(u.houseNumber)
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 font-bold text-cyan-300 hover:underline cursor-pointer border border-slate-700 text-[11px]"
                        >
                          H{u.houseNumber}
                        </span>
                      </td>
                      <td className="text-slate-300 font-medium">{u.ruler}</td>
                      <td className="text-slate-400 text-[11px] max-w-xs truncate" title={u.nature}>
                        {u.nature}
                      </td>
                      <td>
                        {u.occupants && u.occupants.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {u.occupants.map((o) => (
                              <span
                                key={o}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectPlanet?.(o)
                                }}
                                className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 text-[10px] hover:underline"
                              >
                                {o}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. VIEW 3: House Sensitivity Matrix (All 12 Bhavas) */}
      {viewMode === 'houseMap' && (
        <section className="sl-house-matrix-grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
            const data = housePointsMap[hNum] || { lagnas: [], upagrahas: [] }
            const hasItems = data.lagnas.length > 0 || data.upagrahas.length > 0
            const houseSign = chart.houses?.[hNum - 1]?.sign || '—'

            return (
              <div
                key={hNum}
                onClick={() => onSelectHouse?.(hNum)}
                className={`sl-house-cell ${!hasItems ? 'empty-house' : ''}`}
              >
                <div>
                  <div className="sl-house-cell-header mb-2">
                    <span className="sl-house-num">
                      {hNum}
                      <span className="text-slate-400 text-xs font-normal">
                        {hNum === 1 ? 'st (Lagna)' : hNum === 2 ? 'nd' : hNum === 3 ? 'rd' : 'th'} House
                      </span>
                    </span>
                    <span className="sl-house-sign-badge">
                      {houseSign}
                    </span>
                  </div>

                  {/* Special Lagnas in this house */}
                  {data.lagnas.length > 0 && (
                    <div className="mb-2">
                      <span className="sl-points-label text-amber-300 block mb-1">
                        Special Lagnas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.lagnas.map((l) => (
                          <span
                            key={l.code}
                            className="sl-point-pill sl-lagna-pill-accent"
                            title={`${l.name} (${l.dms})`}
                          >
                            <span>{l.code}</span>
                            <span className="text-[10px] font-normal text-amber-300/80 font-mono">({l.dms.split('°')[0]}°)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upagrahas in this house */}
                  {data.upagrahas.length > 0 && (
                    <div>
                      <span className="sl-points-label text-rose-300 block mb-1">
                        Upagrahas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.upagrahas.map((u) => (
                          <span
                            key={u.name}
                            className="sl-point-pill sl-upagraha-pill-accent"
                            title={`${u.name} (${u.nature})`}
                          >
                            <span>{u.code}</span>
                            <span className="text-[10px] font-normal text-rose-400/80">{u.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasItems && (
                    <span className="text-xs text-slate-400 italic block py-2">No special points in this house</span>
                  )}
                </div>

                <div className="pt-2 text-right">
                  <span className="text-[11px] text-cyan-400 hover:underline">Inspect Bhava →</span>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Modal / Detailed Drawer for Selected Special Lagna */}
      {selectedLagna && (
        <div className="sl-modal-backdrop">
          <div className="sl-modal-dialog">
            <div className="sl-modal-top">
              <div className="flex items-center gap-3">
                <div className="sl-code-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                  {selectedLagna.code}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedLagna.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedLagna.sign} • {selectedLagna.houseOrdinal} House • {selectedLagna.dms}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLagna(null)}
                className="sl-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="sl-modal-commentary">
              <span className="text-amber-300 font-bold block text-sm">Classical BPHS Principles</span>
              <p className="leading-relaxed">{selectedLagna.signifies}</p>
              {selectedLagna.code === 'HL' && (
                <div className="sl-commentary-principle">
                  💡 <strong>Wealth Principle:</strong> Benefic planets in Hora Lagna or aspecting it signify abundant
                  cash flow and business gains. If the 2nd lord from Lagna aspects HL, the native becomes immensely
                  wealthy.
                </div>
              )}
              {selectedLagna.code === 'GL' && (
                <div className="sl-commentary-principle">
                  💡 <strong>Power Principle:</strong> Ghati Lagna is the pivot for royal favor, executive power, and
                  public influence. Planets associated with both Lagna and Ghati Lagna produce prominent political leaders.
                </div>
              )}
              {selectedLagna.code === 'SL' && (
                <div className="sl-commentary-principle">
                  💡 <strong>Lakshmi Principle:</strong> Sree Lagna is the residence of auspicious fortune. Benefics in
                  SL protect the native against poverty even during unfavorable periods.
                </div>
              )}
              {selectedLagna.code === 'IL' && (
                <div className="sl-commentary-principle">
                  💡 <strong>Indu Lagna Principle:</strong> Evaluated using the ray kalas of the 9th lords from Lagna and
                  Moon. An exalted planet in Indu Lagna indicates a multi-millionaire, while un-afflicted benefics guarantee
                  steady opulence.
                </div>
              )}
              {selectedLagna.code === 'BB' && (
                <div className="sl-commentary-principle">
                  💡 <strong>Bhrigu Bindu Principle:</strong> The fateful midpoint between Moon and Rahu. Transits of
                  Jupiter or Saturn across this exact degree trigger irreversible karmic milestones, career breakthroughs,
                  or marriages.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectHouse?.(selectedLagna.houseNumber)
                  setSelectedLagna(null)
                }}
                className="primary-button"
                style={{ fontSize: '0.78rem' }}
              >
                Inspect {selectedLagna.houseOrdinal} House →
              </button>
              <button
                onClick={() => setSelectedLagna(null)}
                className="ghost-button"
                style={{ fontSize: '0.78rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Selected Upagraha */}
      {selectedUpagraha && (
        <div className="sl-modal-backdrop">
          <div className="sl-modal-dialog">
            <div className="sl-modal-top">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>{selectedUpagraha.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    {selectedUpagraha.code}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedUpagraha.group} • {selectedUpagraha.sign} ({selectedUpagraha.dms}) • {selectedUpagraha.houseOrdinal} House
                </p>
              </div>
              <button
                onClick={() => setSelectedUpagraha(null)}
                className="sl-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="sl-modal-commentary">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Nature & Effect</span>
                <span className="font-semibold text-rose-300 text-sm block mt-0.5">{selectedUpagraha.nature}</span>
                <p className="mt-1">{selectedUpagraha.description}</p>
              </div>

              {selectedUpagraha.risesAt && (
                <div className="sl-commentary-principle flex justify-between items-center">
                  <span>Rising Time at Birth:</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedUpagraha.risesAt}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectHouse?.(selectedUpagraha.houseNumber)
                  setSelectedUpagraha(null)
                }}
                className="primary-button"
                style={{ fontSize: '0.78rem' }}
              >
                Inspect {selectedUpagraha.houseOrdinal} House →
              </button>
              <button
                onClick={() => setSelectedUpagraha(null)}
                className="ghost-button"
                style={{ fontSize: '0.78rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
