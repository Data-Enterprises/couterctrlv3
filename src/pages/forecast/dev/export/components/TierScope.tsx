// Utils
import { TIER_LABEL } from "../../utils/forecastRanking";

// Interfaces
import type { Tier } from "../../interfaces";

interface TierScopeProps {
  tiers: Tier[];
  counts: Record<Tier, number>;
  onToggle: (tier: Tier) => void;
}

/** The export's contribution scope: a chip per tier; none ticked means all. */
const TierScope = ({ tiers, counts, onToggle }: TierScopeProps) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {(["A", "B", "C"] as const).map((tier) => {
      const on = tiers.includes(tier);
      return (
        <button
          key={tier}
          onClick={() => onToggle(tier)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            on
              ? "bg-brand_navy border-brand_navy text-custom-white"
              : "bg-custom-white border-line_field text-content"
          }`}
        >
          {TIER_LABEL[tier]} ({counts[tier]})
        </button>
      );
    })}
    <span className="text-[10px] text-content">
      {tiers.length === 0 ? "All tiers" : `${tiers.join(" + ")} only`}
    </span>
  </div>
);

export default TierScope;
