// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";

// Redux
import { setLedgerTab } from "../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { LABELS } from "../utils";

// Interfaces
import type { PopupTab } from "../interfaces";

interface StorePopupTabsProps {
  /** A search of more than one store: only then is Compare offered. */
  hasGroup: boolean;
}

/**
 * The store panel's tab bar. Sub depts leads: it answers the question the page
 * was opened with. Compare sits beside it as the place that chooses a
 * counterpart, and shows only when there are other stores to compare with.
 */
const StorePopupTabs = ({ hasGroup }: StorePopupTabsProps) => {
  const dispatch = useAppDispatch();
  const { tab } = useSalesCtx();
  const tabs: PopupTab[] = hasGroup
    ? ["dailyrecap", "subdept", "comparison", "hourly", "topitems"]
    : ["dailyrecap", "subdept", "hourly", "topitems"];

  return (
    <div
      data-help="store-tabs"
      className="flex items-center border-b border-line_hair px-3 flex-shrink-0"
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => dispatch(setLedgerTab(t))}
          className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
            tab === t ? "border-brand_navy text-content" : "border-transparent text-content"
          }`}
        >
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
};

export default StorePopupTabs;
