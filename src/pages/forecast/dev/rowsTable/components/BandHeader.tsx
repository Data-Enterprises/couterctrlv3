// Utils
import { TIER_LABEL, TIER_CHIP_ON_NAVY } from "../../utils/forecastRanking";

// Interfaces
import type { Tier } from "../../interfaces";

// Components
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface BandHeaderProps {
  band: Tier;
  collapsed: boolean;
  /** The band's item count and share of the forecast. */
  summary: { count: number; share: number };
  onToggle: () => void;
}

/** The navy row that opens a tier band, which collapses or shows its rows. */
const BandHeader = ({
  band,
  collapsed,
  summary,
  onToggle,
}: BandHeaderProps) => (
  <button
    onClick={onToggle}
    title={collapsed ? `Show the ${band} band` : `Collapse the ${band} band`}
    className="w-full flex items-center gap-2.5 px-2 py-2 bg-brand_navy/85 hover:bg-brand_navy transition-colors"
  >
    {collapsed ? (
      <ChevronRightIcon className="w-3.5 h-3.5 text-custom-white flex-shrink-0" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5 text-custom-white flex-shrink-0" />
    )}
    <span
      className={`w-6 h-6 rounded flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${TIER_CHIP_ON_NAVY[band]}`}
    >
      {band}
    </span>
    <span className="text-[12px] font-bold uppercase tracking-wide text-custom-white">
      {TIER_LABEL[band]}
    </span>
    <span className="flex-1 h-px bg-custom-white/20" />
    <span className="text-[12px] font-bold text-custom-white tabular-nums flex-shrink-0">
      {summary.count} item
      {summary.count === 1 ? "" : "s"} · {(summary.share * 100).toFixed(0)}%
    </span>
  </button>
);

export default BandHeader;
