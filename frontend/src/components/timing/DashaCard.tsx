import React from 'react'
import type { AstroChart, DashaPeriod } from '../../types/astro'
import {
  PLANET_COLORS,
  LEVEL_METADATA,
  type DashaChainItem,
} from './dashaUtils'
import { DashaInspector } from '../inspector/DashaInspector'

export { PLANET_COLORS, LEVEL_METADATA, type DashaChainItem }

export interface DashaCardProps {
  chart: AstroChart
  selectedPeriod: DashaPeriod | null
  levelLabel?: string
  hierarchyChain?: DashaChainItem[]
  onSelectPlanet?: (planetName: string) => void
  onSelectHouse?: (houseNumber: number) => void
  onSelectPeriod?: (period: DashaPeriod) => void
}

/**
 * DashaCard delegates directly to the comprehensive DashaInspector,
 * providing backwards compatibility while delivering the new high-density UI.
 */
export const DashaCard: React.FC<DashaCardProps> = ({
  chart,
  selectedPeriod,
  hierarchyChain,
  onSelectPlanet,
  onSelectHouse,
  onSelectPeriod,
}) => {
  return (
    <DashaInspector
      chart={chart}
      selectedPeriod={selectedPeriod}
      hierarchyChain={hierarchyChain}
      onSelectPlanet={onSelectPlanet}
      onSelectHouse={onSelectHouse}
      onSelectPeriod={onSelectPeriod}
    />
  )
}
