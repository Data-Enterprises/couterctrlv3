import { deptName, type TopItemCompared } from "../utils/topItems";

/** The selected item's code, sub dept, rank, and share of the list. */
const ItemIdentity = ({
  selected,
  rank,
  count,
  shareOfTop,
}: {
  selected: TopItemCompared;
  rank: number;
  /** How many rows are ranked. */
  count: number;
  shareOfTop: number | null;
}) => (
  <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
    <div className="min-w-0 flex-1 text-[11.5px] text-content/85 truncate">
      <span className="tabular-nums">
        {selected.ty.product_code}
      </span>{" "}
      &middot; {deptName(selected.ty)} &middot;{" "}
      <span className="font-semibold text-content tabular-nums">
        #{rank} of {count}
      </span>
    </div>
    <div className="flex-shrink-0 text-right">
      <div className="text-[13.5px] font-bold text-content tabular-nums leading-tight">
        {shareOfTop === null
          ? "\u2014"
          : `${shareOfTop.toFixed(1)}%`}
        <span className="text-[11px] font-normal text-content/85">
          {" "}
          of top 200
        </span>
      </div>
      <span className="block w-[120px] h-[3px] rounded bg-bkg mt-0.5">
        <span
          className="block h-full rounded bg-brand_navy"
          style={{ width: `${Math.min(100, shareOfTop ?? 0)}%` }}
        />
      </span>
    </div>
  </div>
);

export default ItemIdentity;
