// Utils
import { CHIP_BASE, CHIP_ON } from "../../utils";

// Interfaces
import type { CategoryTier } from "../../../../../interfaces";

interface TierChipProps {
  tier: CategoryTier;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

/** One grade filter chip with its count; re-clicking the active one clears
 *  the filter, so "all" needs no chip. */
const TierChip = ({ tier, label, count, active, onClick }: TierChipProps) => (
  <button
    onClick={onClick}
    className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${CHIP_BASE[tier]} ${
      active ? CHIP_ON[tier] : ""
    }`}
  >
    {label} ({count})
  </button>
);

export default TierChip;
