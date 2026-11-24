// Utils
import {
  TIER_LABEL,
  TIER_CHIP_BASE,
  TIER_CHIP_ON,
} from "../../utils/forecastRanking";

// Interfaces
import type { Tier } from "../../interfaces";

interface BandChipsProps {
  counts: Record<Tier, number>;
  tierFilter: Tier[];
  onToggle: (tier: Tier) => void;
  onClear: () => void;
  /** The A band's item count and share of the forecast. */
  coverage: { count: number; share: number };
}

/** The contribution bands as filter chips, with how much of the forecast the
 *  A band carries. Contribution tiers, not a grade: A items are the ones the
 *  ad's numbers rest on. */
const BandChips = ({
  counts,
  tierFilter,
  onToggle,
  onClear,
  coverage,
}: BandChipsProps) => (
  <div
    data-help="bands"
    className="flex items-center gap-1.5 px-3 py-2 bg-custom-white border-b border-line_hair flex-shrink-0"
  >
    {(
      [
        ["A", counts.A],
        ["B", counts.B],
        ["C", counts.C],
      ] as const
    ).map(([tier, n]) => {
      const on = tierFilter.includes(tier);
      return (
        <button
          key={tier}
          onClick={() => onToggle(tier)}
          title={
            tier === "A"
              ? "Together the first 80% of the forecast"
              : tier === "B"
                ? "The next 15%"
                : "The tail — the last 5%"
          }
          className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${
            TIER_CHIP_BASE[tier]
          } ${on ? TIER_CHIP_ON[tier] : ""}`}
        >
          {TIER_LABEL[tier]} ({n})
        </button>
      );
    })}
    {tierFilter.length > 0 && (
      <button
        onClick={onClear}
        className="text-[11px] font-medium text-brand_navy hover:underline px-1"
      >
        Clear
      </button>
    )}
    <span className="ml-auto text-[11px] text-content/95">
      {coverage.count} item{coverage.count === 1 ? "" : "s"} ={" "}
      {(coverage.share * 100).toFixed(0)}% of the forecast
    </span>
  </div>
);

export default BandChips;
