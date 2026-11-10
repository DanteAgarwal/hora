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
    <div className="space-y-6">
      {/* 1. Hero Summary Header */}
      <div className="bg-gradient-to-r from-[#171b26] via-[#1b2233] to-[#171b26] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                BPHS Chapters 4 & 5
              </span>
              <span className="text-xs text-slate-400">Sensitive Focal Points & Shadow Grahas</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>🎯</span> Special Lagnas & Upagrahas
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              High-precision astronomical reference points and shadow sub-planets that reveal specialized life themes:
              wealth (HL & IL), political authority (GL), divine fortune (SL), karmic destination (BB), and chronic
              afflictions (Gulika & Maandi).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-center min-w-[115px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Hora Lagna (HL)</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {horaLagna ? `${horaLagna.sign.slice(0, 3)} H${horaLagna.houseNumber}` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Wealth</div>
            </div>

            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-center min-w-[115px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Ghati Lagna (GL)</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {ghatiLagna ? `${ghatiLagna.sign.slice(0, 3)} H${ghatiLagna.houseNumber}` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Power & Rank</div>
            </div>

            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-center min-w-[115px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Sree Lagna (SL)</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {sreeLagna ? `${sreeLagna.sign.slice(0, 3)} H${sreeLagna.houseNumber}` : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Lakshmi Grace</div>
            </div>

            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-center min-w-[115px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Gulika / Maandi</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                {gulika ? `H${gulika.houseNumber}` : '—'} {maandi ? `/ H${maandi.houseNumber}` : ''}
              </div>
              <div className="text-[10px] text-slate-400">Saturn Nodes</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. View Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141824] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                viewMode === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-normal">{tab.badge}</span>
            </button>
          ))}
        </div>

        {viewMode === 'upagrahas' && (
          <div className="flex items-center gap-1.5">
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
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  upagrahaFilter === f.id
                    ? 'bg-amber-500/30 text-amber-200 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. VIEW 1: Special Lagnas Cards Grid */}
      {viewMode === 'lagnas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialLagnas.map((lagna) => {
              const isSelected = selectedLagna?.code === lagna.code
              return (
                <div
                  key={lagna.code}
                  onClick={() => setSelectedLagna(lagna)}
                  className={`group bg-[#161b27] hover:bg-[#1b2131] border rounded-xl p-5 transition-all duration-200 shadow-lg cursor-pointer flex flex-col justify-between ${
                    isSelected ? 'border-amber-500 bg-[#1e2538]' : 'border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center font-extrabold text-amber-300 text-base shadow-inner">
                          {lagna.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors text-base">
                            {lagna.name}
                          </h4>
                          <span className="text-xs text-slate-400">{lagna.sanskritName}</span>
                        </div>
                      </div>

                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectHouse?.(lagna.houseNumber)
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                        title={`Click to inspect House ${lagna.houseNumber}`}
                      >
                        {lagna.houseOrdinal} House
                      </span>
                    </div>

                    <div className="bg-[#0f131c] rounded-lg p-3 border border-slate-800/80 my-3 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Position:</span>
                        <span className="font-bold text-slate-200">
                          {lagna.sign} ({lagna.dms})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Longitude:</span>
                        <span className="text-slate-300">{lagna.longitude.toFixed(2)}°</span>
                      </div>
                      {lagna.rate && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Motion Rate:</span>
                          <span className="text-slate-400 text-[11px]">{lagna.rate}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{lagna.signifies}</p>

                    {lagna.occupants && lagna.occupants.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400">Conjoined Grahas:</span>
                        {lagna.occupants.map((occ) => (
                          <span
                            key={occ}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectPlanet?.(occ)
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/25 cursor-pointer border border-amber-500/30"
                          >
                            {occ}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2.5 text-right">
                    <span className="text-xs text-amber-400 group-hover:underline font-semibold inline-flex items-center gap-1">
                      Classical Interpretation <span>→</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal / Detailed Drawer for Selected Special Lagna */}
          {selectedLagna && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#161a25] border border-amber-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-extrabold text-amber-300 text-xl">
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
                    className="text-slate-400 hover:text-slate-200 text-lg px-2 py-1 rounded hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#10141f] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-amber-300 font-bold block text-sm">Classical BPHS Principles</span>
                  <p className="text-slate-300 leading-relaxed">{selectedLagna.signifies}</p>
                  {selectedLagna.code === 'HL' && (
                    <p className="text-slate-400 mt-2">
                      💡 <strong>Wealth Principle:</strong> Benefic planets in Hora Lagna or aspecting it signify abundant
                      cash flow and business gains. If the 2nd lord from Lagna aspects HL, the native becomes immensely
                      wealthy.
                    </p>
                  )}
                  {selectedLagna.code === 'GL' && (
                    <p className="text-slate-400 mt-2">
                      💡 <strong>Power Principle:</strong> Ghati Lagna is the pivot for royal favor, executive power, and
                      public influence. Planets associated with both Lagna and Ghati Lagna produce prominent political leaders.
                    </p>
                  )}
                  {selectedLagna.code === 'SL' && (
                    <p className="text-slate-400 mt-2">
                      💡 <strong>Lakshmi Principle:</strong> Sree Lagna is the residence of auspicious fortune. Benefics in
                      SL protect the native against poverty even during unfavorable periods.
                    </p>
                  )}
                  {selectedLagna.code === 'IL' && (
                    <p className="text-slate-400 mt-2">
                      💡 <strong>Indu Lagna Principle:</strong> Evaluated using the ray kalas of the 9th lords from Lagna and
                      Moon. An exalted planet in Indu Lagna indicates a multi-millionaire, while un-afflicted benefics guarantee
                      steady opulence.
                    </p>
                  )}
                  {selectedLagna.code === 'BB' && (
                    <p className="text-slate-400 mt-2">
                      💡 <strong>Bhrigu Bindu Principle:</strong> The fateful midpoint between Moon and Rahu. Transits of
                      Jupiter or Saturn across this exact degree trigger irreversible karmic milestones, career breakthroughs,
                      or marriages.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      onSelectHouse?.(selectedLagna.houseNumber)
                      setSelectedLagna(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold"
                  >
                    Inspect {selectedLagna.houseOrdinal} House →
                  </button>
                  <button
                    onClick={() => setSelectedLagna(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW 2: Upagrahas (11 Sub-Planets) */}
      {viewMode === 'upagrahas' && (
        <div className="space-y-4">
          <div className="bg-[#141824] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-100 text-base">The Eleven Classical Upagrahas (Sub-Planets)</h3>
                <p className="text-xs text-slate-400">
                  Five Sun-based (Aprakasha) shadow nodes + Six Time-based (Prahara) portions of day and night.
                </p>
              </div>
              <span className="text-xs text-slate-400 italic">BPHS Chapter 4</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f131c] text-slate-400 font-semibold border-b border-slate-800">
                    <th className="py-3 px-4">Upagraha</th>
                    <th className="py-3 px-3">Classification</th>
                    <th className="py-3 px-3">Zodiac Sign</th>
                    <th className="py-3 px-3 text-right">DMS Degree</th>
                    <th className="py-3 px-3 text-center">House</th>
                    <th className="py-3 px-3">Ruling Graha</th>
                    <th className="py-3 px-3">Nature / Effect</th>
                    <th className="py-3 px-4">Conjoined Grahas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUpagrahas.map((u) => {
                    const isGulikaOrMaandi = u.name === 'Gulika' || u.name === 'Maandi'
                    return (
                      <tr
                        key={u.name}
                        onClick={() => setSelectedUpagraha(u)}
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          isGulikaOrMaandi ? 'bg-rose-500/[0.03]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] ${
                              isGulikaOrMaandi
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-amber-300 border border-slate-700'
                            }`}
                          >
                            {u.code}
                          </span>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
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
                        <td className="py-3 px-3 text-slate-200 font-medium">{u.sign}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">{u.dms}</td>
                        <td className="py-3 px-3 text-center">
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
                        <td className="py-3 px-3 text-slate-300 font-medium">{u.ruler}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={u.nature}>
                          {u.nature}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
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
          </div>

          {/* Modal for Selected Upagraha */}
          {selectedUpagraha && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#161a25] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedUpagraha.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {selectedUpagraha.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedUpagraha.group} • {selectedUpagraha.sign} ({selectedUpagraha.dms}) • {selectedUpagraha.houseOrdinal} House
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUpagraha(null)}
                    className="text-slate-400 hover:text-slate-200 text-lg px-2 py-1 rounded hover:bg-slate-800"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-[#10141f] p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block text-[11px]">Nature & Effect</span>
                    <span className="font-semibold text-rose-300 text-sm block">{selectedUpagraha.nature}</span>
                    <p className="text-slate-300 mt-1">{selectedUpagraha.description}</p>
                  </div>

                  {selectedUpagraha.risesAt && (
                    <div className="bg-[#10141f] p-3 rounded-lg border border-slate-800 flex justify-between text-slate-300">
                      <span className="text-slate-400">Rising Time at Birth:</span>
                      <span className="font-mono">{selectedUpagraha.risesAt}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      onSelectHouse?.(selectedUpagraha.houseNumber)
                      setSelectedUpagraha(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold"
                  >
                    Inspect {selectedUpagraha.houseOrdinal} House →
                  </button>
                  <button
                    onClick={() => setSelectedUpagraha(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW 3: House Sensitivity Matrix (All 12 Houses) */}
      {viewMode === 'houseMap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
              const data = housePointsMap[hNum] || { lagnas: [], upagrahas: [] }
              const hasItems = data.lagnas.length > 0 || data.upagrahas.length > 0
              const houseSign = chart.houses?.[hNum - 1]?.sign || '—'

              return (
                <div
                  key={hNum}
                  onClick={() => onSelectHouse?.(hNum)}
                  className={`bg-[#141824] hover:bg-[#1a2030] border rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    hasItems ? 'border-slate-700/80' : 'border-slate-800/40 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-100 text-sm">
                        {hNum}
                        <span className="text-slate-400 text-xs font-normal">
                          {hNum === 1 ? 'st (Lagna)' : hNum === 2 ? 'nd' : hNum === 3 ? 'rd' : 'th'} House
                        </span>
                      </span>
                      <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {houseSign}
                      </span>
                    </div>

                    {/* Special Lagnas in this house */}
                    {data.lagnas.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block mb-1">
                          Special Lagnas
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {data.lagnas.map((l) => (
                            <span
                              key={l.code}
                              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-xs font-bold border border-amber-500/30 flex items-center gap-1"
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
                        <span className="text-[10px] text-rose-300 uppercase tracking-wider font-bold block mb-1">
                          Upagrahas
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {data.upagrahas.map((u) => (
                            <span
                              key={u.name}
                              className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center gap-1"
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
          </div>
        </div>
      )}
    </div>
  )
}
