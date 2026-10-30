import React, { useState, useMemo } from 'react'
import type { AstroChart } from '../../types/astro'
import { ZODIAC_SIGNS } from '../../types/astro'

interface TechnicalTablesProps {
  chart: AstroChart
  tableTab: 'planets' | 'houses'
  selectedPlanet?: string
  selectedHouse?: number
  onSelectTableTab: (tab: 'planets' | 'houses') => void
  onSelectPlanet: (planetName: string) => void
  onSelectHouse: (houseNumber: number) => void
}

type PlanetFilter = 'all' | 'benefics' | 'malefics' | 'special' | 'dignified' | 'kendras' | 'trikonas'

export const TechnicalTables: React.FC<TechnicalTablesProps> = ({
  chart,
  tableTab,
  selectedPlanet,
  selectedHouse,
  onSelectTableTab,
  onSelectPlanet,
  onSelectHouse,
}) => {
  const [planetFilter, setPlanetFilter] = useState<PlanetFilter>('all')

  // Natural benefics & malefics in classical Vedic Jyotish
  const naturalBenefics = ['Jupiter', 'Venus', 'Mercury', 'Moon']
  const naturalMalefics = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']

  // Filtered planets based on quick filter selection
  const filteredPlanets = useMemo(() => {
    switch (planetFilter) {
      case 'benefics':
        return chart.planets.filter((p) => naturalBenefics.includes(p.name))
      case 'malefics':
        return chart.planets.filter((p) => naturalMalefics.includes(p.name))
      case 'special':
        return chart.planets.filter((p) => p.retrograde || p.combust)
      case 'dignified':
        return chart.planets.filter(
          (p) => p.dignity === 'Exalted' || p.dignity === 'Own Sign' || p.dignity === 'Moolatrikona'
        )
      case 'kendras':
        return chart.planets.filter((p) => [1, 4, 7, 10].includes(p.houseNumber))
      case 'trikonas':
        return chart.planets.filter((p) => [1, 5, 9].includes(p.houseNumber))
      default:
        return chart.planets
    }
  }, [chart.planets, planetFilter])

  return (
    <section className="technical-tables-container panel">
      {/* Table Toolbar with Segment Switcher & Quick Filters */}
      <div className="table-toolbar">
        <div className="table-heading-group">
          <div className="table-title-row">
            <h3>{tableTab === 'planets' ? 'Planetary Positions & Astronomical Metrics' : 'House Placements (12 Classical Bhavas)'}</h3>
            <span className="table-count-badge">
              {tableTab === 'planets' ? `${filteredPlanets.length} of ${chart.planets.length} Grahas` : '12 Bhavas'}
            </span>
          </div>
          <p className="table-subtitle">
            {tableTab === 'planets'
              ? 'Comprehensive dignities, nakshatras, chara karakas, speed, and house rulerships'
              : 'Detailed bhava lords, occupants, aspects received, purushartha, and classifications'}
          </p>
        </div>

        {/* Tab & Filter Controls */}
        <div className="table-controls">
          <div className="segmented-control">
            <button
              type="button"
              className={`segment-btn ${tableTab === 'planets' ? 'active' : ''}`}
              onClick={() => onSelectTableTab('planets')}
            >
              🪐 Planets ({chart.planets.length})
            </button>
            <button
              type="button"
              className={`segment-btn ${tableTab === 'houses' ? 'active' : ''}`}
              onClick={() => onSelectTableTab('houses')}
            >
              🏛️ Houses (12)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters for Planets */}
      {tableTab === 'planets' && (
        <div className="planet-filter-strip">
          <span className="filter-label">Quick filter:</span>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('all')}
          >
            All Grahas ({chart.planets.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'benefics' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('benefics')}
          >
            ✨ Benefics
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'malefics' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('malefics')}
          >
            🔥 Malefics
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'special' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('special')}
          >
            ⚡ Vakri / Asta
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'dignified' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('dignified')}
          >
            👑 Exalted / Own
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'kendras' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('kendras')}
          >
            🏛️ Kendras
          </button>
          <button
            type="button"
            className={`filter-chip ${planetFilter === 'trikonas' ? 'active' : ''}`}
            onClick={() => setPlanetFilter('trikonas')}
          >
            🌟 Trikonas
          </button>
        </div>
      )}

      {/* 1. PLANETS TABLE */}
      {tableTab === 'planets' && (
        <div className="table-scroll-wrap">
          <table className="astro-data-table">
            <thead>
              <tr>
                <th>Planet (Graha)</th>
                <th>Longitude & Span</th>
                <th>Sign (Rashi)</th>
                <th>House (Bhava)</th>
                <th>Lord Of</th>
                <th>Dignity Status</th>
                <th>Nakshatra & Pada</th>
                <th>Chara Karaka</th>
                <th>Functional Role</th>
                <th>Motion & Speed</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlanets.map((planet) => {
                const isSelected = selectedPlanet === planet.name
                const signInfo = ZODIAC_SIGNS.find((s) => s.name === planet.sign) || ZODIAC_SIGNS[0]
                const degInSign = planet.degreeInSign || 0
                const progressPct = Math.min(100, Math.max(0, (degInSign / 30) * 100))

                return (
                  <tr
                    key={planet.name}
                    className={`table-row ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => onSelectPlanet(planet.name)}
                    title="Click to view complete details in Object Inspector"
                  >
                    {/* Planet Identity */}
                    <td className="cell-planet-id">
                      <div className="planet-id-wrap">
                        <span className="planet-glyph">{planet.symbol}</span>
                        <div>
                          <strong className="planet-name">{planet.name}</strong>
                          <span className="sanskrit-sub">({planet.sanskritName})</span>
                        </div>
                        {planet.retrograde && (
                          <span className="badge-flag flag-retro" title="Vakri (Retrograde motion)">
                            [R]
                          </span>
                        )}
                        {planet.combust && (
                          <span className="badge-flag flag-combust" title={`Asta (Combust with Sun, ${planet.sunSeparation?.toFixed(1)}°)`}>
                            🔥
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Longitude & 0-30° Visual Meter */}
                    <td className="cell-longitude">
                      <span className="dms-text">{planet.dms}</span>
                      <div className="degree-meter-bg" title={`${degInSign.toFixed(2)}° of 30°`}>
                        <div className="degree-meter-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </td>

                    {/* Sign & Element */}
                    <td className="cell-sign">
                      <div className="sign-cell-wrap">
                        <span className="sign-name-text">
                          {signInfo.symbol} {planet.sign}
                        </span>
                        <span className={`element-micro-pill elem-${signInfo.element.toLowerCase()}`}>
                          {signInfo.element}
                        </span>
                      </div>
                    </td>

                    {/* House Placement & Jump */}
                    <td className="cell-house">
                      <button
                        type="button"
                        className="house-jump-pill"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectHouse(planet.houseNumber)
                        }}
                        title={`Jump to House ${planet.houseNumber}`}
                      >
                        {planet.houseOrdinal}
                        {planet.houseLabels?.includes('kendra') && <span className="label-k">K</span>}
                        {planet.houseLabels?.includes('trikona') && <span className="label-t">T</span>}
                      </button>
                    </td>

                    {/* Lord of Houses */}
                    <td className="cell-lord-of">
                      {planet.lordOfHouses && planet.lordOfHouses.length > 0 ? (
                        <div className="lord-pills-row">
                          {planet.lordOfHouses.map((hNum) => (
                            <span
                              key={hNum}
                              className="lord-chip"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectHouse(hNum)
                              }}
                              title={`Inspect House ${hNum} ruled by ${planet.name}`}
                            >
                              L{hNum}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="subtle-dim">Nodal Axis</span>
                      )}
                    </td>

                    {/* Dignity */}
                    <td className="cell-dignity">
                      <span className={`dignity-badge dign-${planet.dignity?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {planet.dignity === 'Exalted' ? '👑' : planet.dignity === 'Own Sign' ? '🏰' : planet.dignity === 'Moolatrikona' ? '⚖️' : planet.dignity === 'Debilitated' ? '⚡' : '•'}{' '}
                        {planet.dignity}
                      </span>
                    </td>

                    {/* Nakshatra & Pada */}
                    <td className="cell-nakshatra">
                      <div className="nakshatra-wrap">
                        <span className="nak-name">{planet.nakshatra}</span>
                        <span className="nak-pada">Pada {planet.pada}</span>
                      </div>
                    </td>

                    {/* Jaimini Chara Karaka */}
                    <td className="cell-karaka">
                      {planet.charaKarakaCode ? (
                        <span className="karaka-badge" title={planet.charaKaraka}>
                          {planet.charaKarakaCode}
                        </span>
                      ) : (
                        <span className="subtle-dim">—</span>
                      )}
                    </td>

                    {/* Functional Role */}
                    <td className="cell-role">
                      <span className={`role-badge role-${planet.functionalType?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {planet.functionalType || 'Neutral'}
                      </span>
                    </td>

                    {/* Astronomical Motion & Speed */}
                    <td className="cell-speed">
                      <div className="speed-wrap">
                        <span className="speed-val">
                          {planet.speed !== undefined ? `${planet.speed > 0 ? '+' : ''}${planet.speed.toFixed(2)}°/d` : '—'}
                        </span>
                        {planet.retrograde && <span className="motion-tag-retro">Vakri</span>}
                        {planet.combust && <span className="motion-tag-combust">Asta</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. HOUSES (BHAVAS) TABLE */}
      {tableTab === 'houses' && (
        <div className="table-scroll-wrap">
          <table className="astro-data-table">
            <thead>
              <tr>
                <th>Bhava (House)</th>
                <th>Sign & Element</th>
                <th>House Lord (Swami)</th>
                <th>Lord Placement & Dignity</th>
                <th>Occupants (Grahas)</th>
                <th>Aspects Received (Drishti)</th>
                <th>Purushartha</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((house) => {
                const isSelected = selectedHouse === house.number
                const lordPlanet = chart.planets.find((p) => p.name === house.lord)
                const signInfo = ZODIAC_SIGNS.find((s) => s.name === house.sign) || ZODIAC_SIGNS[0]

                // Purushartha classification
                const purushartha =
                  [1, 5, 9].includes(house.number)
                    ? 'Dharma'
                    : [2, 6, 10].includes(house.number)
                    ? 'Artha'
                    : [3, 7, 11].includes(house.number)
                    ? 'Kama'
                    : 'Moksha'

                return (
                  <tr
                    key={house.number}
                    className={`table-row ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => onSelectHouse(house.number)}
                    title="Click to inspect this house in Object Inspector"
                  >
                    {/* Bhava Number & Sanskrit Name */}
                    <td className="cell-bhava-id">
                      <div className="bhava-id-wrap">
                        <span className="bhava-num">H{house.number}</span>
                        <div>
                          <strong className="bhava-name">{house.name.replace(' House', '')}</strong>
                          {house.sanskritName && (
                            <span className="sanskrit-sub">{house.sanskritName.split(' (')[0]}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sign & Element */}
                    <td className="cell-sign">
                      <div className="sign-cell-wrap">
                        <span className="sign-name-text">
                          {signInfo.symbol} {house.sign}
                        </span>
                        <span className={`element-micro-pill elem-${signInfo.element.toLowerCase()}`}>
                          {signInfo.element}
                        </span>
                      </div>
                    </td>

                    {/* House Lord */}
                    <td className="cell-lord">
                      {lordPlanet ? (
                        <button
                          type="button"
                          className="lord-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectPlanet(lordPlanet.name)
                          }}
                          title={`Inspect Lord ${lordPlanet.name}`}
                        >
                          <span>{lordPlanet.symbol}</span>
                          <strong>{house.lord}</strong>
                        </button>
                      ) : (
                        <strong>{house.lord}</strong>
                      )}
                    </td>

                    {/* Lord Placement & Dignity */}
                    <td className="cell-lord-placement">
                      {lordPlanet ? (
                        <div className="lord-placement-wrap">
                          <span>in H{lordPlanet.houseNumber} ({lordPlanet.sign})</span>
                          <span className={`dignity-micro-pill dign-${lordPlanet.dignity?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {lordPlanet.dignity}
                          </span>
                        </div>
                      ) : (
                        <span className="subtle-dim">—</span>
                      )}
                    </td>

                    {/* Occupants */}
                    <td className="cell-occupants">
                      {house.occupants && house.occupants.length > 0 ? (
                        <div className="occupants-pills-row">
                          {house.occupants.map((occName) => {
                            const p = chart.planets.find((pl) => pl.name === occName)
                            return (
                              <button
                                key={occName}
                                type="button"
                                className="occupant-chip"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectPlanet(occName)
                                }}
                                title={`${occName} (${p?.dignity || 'In House'})`}
                              >
                                <span>{p?.symbol || '✦'}</span>
                                <span>{occName}</span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="subtle-dim">Empty Bhava</span>
                      )}
                    </td>

                    {/* Aspects Received */}
                    <td className="cell-aspects">
                      {house.aspectsReceived && house.aspectsReceived.length > 0 ? (
                        <div className="aspects-chips-row">
                          {house.aspectsReceived.map((asp, idx) => (
                            <span key={idx} className="aspect-chip" title={asp}>
                              {asp.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="subtle-dim">None</span>
                      )}
                    </td>

                    {/* Purushartha */}
                    <td className="cell-purushartha">
                      <span className={`purushartha-badge puru-${purushartha.toLowerCase()}`}>
                        {purushartha}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="cell-classification">
                      <div className="classification-pills">
                        {[1, 4, 7, 10].includes(house.number) && <span className="class-pill pill-kendra">Kendra</span>}
                        {[1, 5, 9].includes(house.number) && <span className="class-pill pill-trikona">Trikona</span>}
                        {[6, 8, 12].includes(house.number) && <span className="class-pill pill-dusthana">Dusthana</span>}
                        {[3, 6, 10, 11].includes(house.number) && <span className="class-pill pill-upachaya">Upachaya</span>}
                        {[2, 7].includes(house.number) && <span className="class-pill pill-maraka">Maraka</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
