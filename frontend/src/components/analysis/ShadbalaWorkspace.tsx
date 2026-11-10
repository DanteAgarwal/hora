import React, { useState, useMemo } from 'react'
import type { AstroChart, PlanetShadbala } from '../../types/astro'

interface ShadbalaWorkspaceProps {
  chart: AstroChart
  onSelectPlanet?: (planetName: string) => void
}

type FilterType = 'all' | 'strong' | 'deficient' | 'benefics' | 'malefics'
type SortType = 'rank' | 'rupas' | 'order'

export const ShadbalaWorkspace: React.FC<ShadbalaWorkspaceProps> = ({
  chart,
  onSelectPlanet,
}) => {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('rank')
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetShadbala | null>(null)

  const shadbala = chart.shadbala
  const planetsList: PlanetShadbala[] = useMemo(() => {
    if (!shadbala?.planets) return []
    return shadbala.planets
  }, [shadbala])

  const filteredPlanets = useMemo(() => {
    let list = [...planetsList]

    if (filter === 'strong') {
      list = list.filter((p) => p.isStrong)
    } else if (filter === 'deficient') {
      list = list.filter((p) => !p.isStrong)
    } else if (filter === 'benefics') {
      list = list.filter((p) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(p.name))
    } else if (filter === 'malefics') {
      list = list.filter((p) => ['Sun', 'Mars', 'Saturn'].includes(p.name))
    }

    if (sort === 'rank') {
      list.sort((a, b) => (a.rank || 99) - (b.rank || 99))
    } else if (sort === 'rupas') {
      list.sort((a, b) => b.totalRupas - a.totalRupas)
    } else if (sort === 'order') {
      const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
      list.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
    }

    return list
  }, [planetsList, filter, sort])

  if (!shadbala || planetsList.length === 0) {
    return (
      <div className="bg-[#12161f] border border-amber-500/20 rounded-xl p-8 text-center text-slate-300">
        <div className="text-3xl mb-3">⚖️</div>
        <h3 className="text-lg font-semibold text-amber-300 mb-2">Shadbala Data Calculating</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Six-fold planetary potency calculations are being processed for this chart. Please recalculate or refresh.
        </p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    if (status.includes('Exceptionally')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    if (status.includes('Strong')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    if (status.includes('Moderate')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  }

  const getBarColor = (ratio: number) => {
    if (ratio >= 1.25) return 'from-emerald-500 to-teal-400'
    if (ratio >= 1.0) return 'from-cyan-500 to-blue-500'
    if (ratio >= 0.85) return 'from-amber-500 to-yellow-400'
    return 'from-rose-500 to-red-400'
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Hero Banner */}
      <div className="bg-gradient-to-r from-[#171b26] via-[#1b2233] to-[#171b26] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Brihat Parashara Hora Shastra §27
              </span>
              <span className="text-xs text-slate-400">Six-Fold Planetary Potency Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>⚖️</span> Parashari Shadbala Overview
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Measures the authentic physical, positional, temporal, directional, motional, and aspectual strength of
              the 7 classical Grahas in Rupas & Virupas (1 Rupa = 60 Virupas).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-4 py-3 text-center min-w-[120px]">
              <div className="text-xs uppercase tracking-wider text-slate-400">Vitality Index</div>
              <div className="text-2xl font-extrabold text-amber-300">{shadbala.overallHealthScore}%</div>
              <div className="text-[11px] text-slate-400">Overall Ratio</div>
            </div>

            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-4 py-3 text-center min-w-[120px]">
              <div className="text-xs uppercase tracking-wider text-slate-400">Strong Grahas</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {shadbala.strongCount} <span className="text-sm text-slate-400">/ {shadbala.totalCount}</span>
              </div>
              <div className="text-[11px] text-slate-400">Above Threshold</div>
            </div>

            <div className="bg-[#0f131c]/80 border border-slate-700/60 rounded-xl px-4 py-3 text-center min-w-[130px]">
              <div className="text-xs uppercase tracking-wider text-slate-400">Supreme Graha</div>
              <div className="text-lg font-bold text-cyan-300 flex items-center justify-center gap-1.5 mt-1">
                <span>👑</span> {shadbala.strongestPlanet}
              </div>
              <div className="text-[11px] text-emerald-400">Rank #1 in Chart</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141824] p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-2">Filter:</span>
          {(
            [
              { key: 'all', label: 'All 7 Grahas' },
              { key: 'strong', label: 'Strong (≥100%)' },
              { key: 'deficient', label: 'Deficient (<100%)' },
              { key: 'benefics', label: 'Benefics' },
              { key: 'malefics', label: 'Malefics' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === t.key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="bg-[#0e121a] text-slate-300 text-xs rounded-lg px-3 py-1 border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="rank">By Rank (Highest Ratio)</option>
            <option value="rupas">By Total Rupas</option>
            <option value="order">Natural Order (Sun → Saturn)</option>
          </select>
        </div>
      </div>

      {/* 3. Graha Potency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlanets.map((p) => {
          const ratioPercent = p.percentage
          return (
            <div
              key={p.name}
              onClick={() => setSelectedPlanet(p)}
              className="group bg-[#161b27] hover:bg-[#1b2131] border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 shadow-lg cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg font-bold text-amber-300 shadow-inner">
                      {p.symbol || p.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                          {p.name}
                        </span>
                        {p.rank === 1 && <span title="Highest Strength in Chart">👑</span>}
                        {p.retrograde && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            R
                          </span>
                        )}
                        {p.combust && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.sign || "—"} • {p.houseOrdinal || "—"} House
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    #{p.rank}
                  </span>
                </div>

                {/* Score & Progress */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Total Strength:</span>
                    <span className="font-bold text-slate-100">
                      {p.totalRupas} <span className="text-slate-400 font-normal">/ {p.requiredRupas} Rupas</span>
                    </span>
                  </div>

                  <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    {/* 100% threshold marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                      style={{ left: `${Math.min(100, (100 / (p.requiredRupas * 1.5)) * p.requiredRupas)}%` }}
                    />
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getBarColor(p.strengthRatio)} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (p.totalRupas / (p.requiredRupas * 1.5)) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                    <span className="font-bold text-slate-200">{ratioPercent}%</span>
                  </div>
                </div>

                {/* Micro Component Balas */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="bg-[#10141f] p-1.5 rounded border border-slate-800/50 text-center">
                    <span className="block text-slate-400">Sthana</span>
                    <span className="font-semibold text-slate-200">{p.sthanaBala.totalRupas}R</span>
                  </div>
                  <div className="bg-[#10141f] p-1.5 rounded border border-slate-800/50 text-center">
                    <span className="block text-slate-400">Dig</span>
                    <span className="font-semibold text-slate-200">{p.digBala.rupas}R</span>
                  </div>
                  <div className="bg-[#10141f] p-1.5 rounded border border-slate-800/50 text-center">
                    <span className="block text-slate-400">Kaala</span>
                    <span className="font-semibold text-slate-200">{p.kaalaBala.totalRupas}R</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 text-right">
                <span className="text-[11px] text-amber-400 group-hover:underline inline-flex items-center gap-1 font-medium">
                  Detailed Breakdown <span>→</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. Complete Parashari Shadbala Master Table */}
      <div className="bg-[#141824] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-base">Comprehensive Shadbala Master Table</h3>
            <p className="text-xs text-slate-400">
              Detailed breakdown of the Six Potencies (Virupas) and comparison against classical requirements.
            </p>
          </div>
          <span className="text-xs text-slate-400 italic">Values in Virupas (60v = 1 Rupa)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0f131c] text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Graha</th>
                <th className="py-3 px-3 text-right">Sthana (Pos)</th>
                <th className="py-3 px-3 text-right">Dig (Dir)</th>
                <th className="py-3 px-3 text-right">Kaala (Temp)</th>
                <th className="py-3 px-3 text-right">Chesta (Mot)</th>
                <th className="py-3 px-3 text-right">Naisargika</th>
                <th className="py-3 px-3 text-right">Drik (Asp)</th>
                <th className="py-3 px-3 text-right font-bold text-amber-300">Total (V)</th>
                <th className="py-3 px-3 text-right font-bold text-cyan-300">Total (R)</th>
                <th className="py-3 px-3 text-right text-slate-400">Required</th>
                <th className="py-3 px-3 text-right font-bold">Ratio</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {planetsList.map((p) => {
                const ratioPercent = p.percentage
                return (
                  <tr
                    key={p.name}
                    onClick={() => setSelectedPlanet(p)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <span className="text-amber-400">{p.symbol || '✦'}</span>
                      <span>{p.name}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        ({(p.sign || "—").slice(0, 3)} H{p.houseNumber || 1})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-mono">
                      {p.sthanaBala.totalVirupas.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-mono">
                      {p.digBala.virupas.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-mono">
                      {p.kaalaBala.totalVirupas.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-mono">
                      {p.chestaBala.virupas.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-mono">
                      {p.naisargikaBala.virupas.toFixed(1)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono ${
                        p.drikBala.virupas >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {p.drikBala.virupas > 0 ? `+${p.drikBala.virupas.toFixed(1)}` : p.drikBala.virupas.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-300 font-mono">
                      {p.totalVirupas.toFixed(1)}v
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-cyan-300 font-mono">
                      {p.totalRupas.toFixed(2)}R
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {p.requiredRupas.toFixed(1)}R
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-100 font-mono">
                      {ratioPercent}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300 font-mono">
                      #{p.rank}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sub-Bala Detailed Drawer / Modal */}
      {selectedPlanet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161a25] border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300">
                  {selectedPlanet.symbol || selectedPlanet.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {selectedPlanet.name} ({selectedPlanet.sanskritName})
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Rank #{selectedPlanet.rank}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedPlanet.sign || "—"} • {selectedPlanet.houseOrdinal || "—"} House • Total Shadbala: {selectedPlanet.totalRupas} Rupas ({selectedPlanet.percentage}% of requirement)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanet(null)}
                className="text-slate-400 hover:text-slate-200 text-lg px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sthana Bala Deep Breakdown */}
            <div className="bg-[#11141e] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300 text-sm">1. Sthana Bala (Positional Strength)</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {selectedPlanet.sthanaBala.totalVirupas.toFixed(1)}v ({selectedPlanet.sthanaBala.totalRupas}R)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-[#181d2a] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Uchcha Bala (Exaltation)</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPlanet.sthanaBala.uchchaBala}v</span>
                </div>
                <div className="bg-[#181d2a] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Saptavargaja (7 Vargas)</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPlanet.sthanaBala.saptavargajaBala}v</span>
                </div>
                <div className="bg-[#181d2a] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Ojha-Yugma (Odd/Even)</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPlanet.sthanaBala.ojhayugmaBala}v</span>
                </div>
                <div className="bg-[#181d2a] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Kendra Bala (Angular)</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPlanet.sthanaBala.kendraBala}v</span>
                </div>
                <div className="bg-[#181d2a] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Drekkana (Decanate)</span>
                  <span className="font-mono font-bold text-slate-100">{selectedPlanet.sthanaBala.drekkanaBala}v</span>
                </div>
              </div>
            </div>

            {/* Other 5 Balas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Dig Bala */}
              <div className="bg-[#11141e] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>2. Dig Bala (Directional)</span>
                  <span className="text-amber-300 font-mono">{selectedPlanet.digBala.virupas}v</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Directional potency based on proximity to 100% directional station (House {selectedPlanet.digBala.peakHouse}).
                </p>
              </div>

              {/* Kaala Bala */}
              <div className="bg-[#11141e] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>3. Kaala Bala (Temporal)</span>
                  <span className="text-amber-300 font-mono">{selectedPlanet.kaalaBala.totalVirupas}v</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Includes Diurnal/Nocturnal ({selectedPlanet.kaalaBala.nathonatha}v), Lunar Paksha ({selectedPlanet.kaalaBala.paksha}v),
                  Tribhaga ({selectedPlanet.kaalaBala.tribhaga}v), and Ayana declination ({selectedPlanet.kaalaBala.ayana}v).
                </p>
              </div>

              {/* Chesta Bala */}
              <div className="bg-[#11141e] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>4. Chesta Bala (Motional)</span>
                  <span className="text-amber-300 font-mono">{selectedPlanet.chestaBala.virupas}v</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Motional vigor based on planetary speed and retrograde state ({selectedPlanet.chestaBala.status}).
                </p>
              </div>

              {/* Naisargika Bala */}
              <div className="bg-[#11141e] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>5. Naisargika Bala (Natural)</span>
                  <span className="text-amber-300 font-mono">{selectedPlanet.naisargikaBala.virupas}v</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fixed natural luminescence defined in Parashari hierarchy (Sun 60v → Saturn 8.57v).
                </p>
              </div>

              {/* Drik Bala */}
              <div className="bg-[#11141e] border border-slate-800 rounded-xl p-3.5 space-y-1.5 col-span-1 sm:col-span-2">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>6. Drik Bala (Aspectual Influence)</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedPlanet.drikBala.virupas >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedPlanet.drikBala.virupas > 0
                      ? `+${selectedPlanet.drikBala.virupas}v`
                      : `${selectedPlanet.drikBala.virupas}v`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Net aspectual radiation received from all other planets. Benefic aspects (Jupiter, Venus) add positive Virupas;
                  malefic aspects (Mars, Saturn, Sun) subtract Virupas.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
              {onSelectPlanet && (
                <button
                  onClick={() => {
                    onSelectPlanet(selectedPlanet.name)
                    setSelectedPlanet(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                >
                  Inspect {selectedPlanet.name} in Universal Inspector →
                </button>
              )}
              <button
                onClick={() => setSelectedPlanet(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Classical Interpretation Guide */}
      <div className="bg-[#121622] border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-2.5">
        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <span>📖</span> How to Read Shadbala in Practice
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#0e111a] p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-300 block mb-1">Above Minimum (≥ 100%)</span>
            <p className="text-[11px] text-slate-400">
              The planet is fully capable of giving its positive natural and functional fruits during its Mahadasha and
              Antardasha without obstruction.
            </p>
          </div>
          <div className="bg-[#0e111a] p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-300 block mb-1">Below Minimum (&lt; 100%)</span>
            <p className="text-[11px] text-slate-400">
              The planet struggles to materialize the affairs of the houses it rules. It requires conscious remediation or
              reliance on strong dispositors and friendly aspectors.
            </p>
          </div>
          <div className="bg-[#0e111a] p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-300 block mb-1">Supreme Graha (Rank #1)</span>
            <p className="text-[11px] text-slate-400">
              Serves as the primary pillar of the native's chart. In conflicts between opposing yogas, the Graha with
              highest Shadbala prevails.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
