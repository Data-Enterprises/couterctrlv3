// Interfaces
import type { CategoryTier } from "../../../../../interfaces";

// Components
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import TierChip from "./TierChip";

interface ListFilterRowProps {
  counts: Record<CategoryTier, number>;
  tierFilter: CategoryTier | "all";
  onTier: (tier: CategoryTier | "all") => void;
  textFilter: string;
  onText: (value: string) => void;
}

/** The grade chips (Ungraded only when there are any) and the text filter. */
const ListFilterRow = ({
  counts,
  tierFilter,
  onTier,
  textFilter,
  onText,
}: ListFilterRowProps) => {
  const chip = (tier: CategoryTier, label: string) => (
    <TierChip
      key={tier}
      tier={tier}
      label={label}
      count={counts[tier]}
      active={tierFilter === tier}
      onClick={() => onTier(tierFilter === tier ? "all" : tier)}
    />
  );

  return (
    <div className="flex items-center justify-between gap-1.5 px-4 py-2 bg-custom-white border-x border-line_hair">
      <div
        data-help="severity-chips"
        className="flex items-center gap-1.5 flex-wrap"
      >
        {chip("critical", "Crit")}
        {chip("watch", "Watch")}
        {chip("healthy", "OK")}
        {counts.ungraded > 0 && chip("ungraded", "Ungraded")}
      </div>
      <TextFilter
        value={textFilter}
        onChange={onText}
        placeholder="Filter categories…"
        className="max-w-[230px]"
      />
    </div>
  );
};

export default ListFilterRow;
