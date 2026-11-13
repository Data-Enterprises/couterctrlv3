// Hooks
import { useAppDispatch } from "../../../hooks";

// Redux
import { selectPerfItem, setRecentsOpen } from "../../../features/dev/devItemPerfSlice";

// Utils
import { formatCurrency2 } from "../../../utils";
import { pct } from "../utils";

// Interfaces
import type { MarginRow } from "../utils/itemPerfData";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface RecentRowProps {
  row: MarginRow;
}

/** One recent item. No bars: recents are a shortcut, not a comparison. */
const RecentRow = ({ row: r }: RecentRowProps) => {
  const dispatch = useAppDispatch();
  return (
    <button
      type="button"
      onClick={() => {
        dispatch(setRecentsOpen(false));
        dispatch(selectPerfItem(r.key));
      }}
      className="block w-full border-t border-brand_line px-3.5 py-3 text-left active:bg-bkg"
    >
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
          {r.label}
        </span>
        <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
          {pct(r.gpm)}
        </span>
        <ChevronRightIcon className="h-4 w-4 flex-none text-content/95" />
      </div>
      <div className="mt-0.5 truncate text-[11px] tabular-nums text-content/95">
        {r.sub} · {formatCurrency2(r.sales)}
      </div>
    </button>
  );
};

export default RecentRow;
