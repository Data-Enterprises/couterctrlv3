import { useAppDispatch, useAppSelector } from "../../../hooks";
import { toggleLpStore } from "../../../features/lpActionsSlice";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import CashierRow from "./CashierRow";
import WeekBars from "./WeekBars";
import { DOT, VALUE_TEXT, multipleLabel } from "./rosterTheme";
import type { RosterStore } from "./rosterModel";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * A store, and the operators under it.
 *
 * Collapsed to start. A group search can carry forty-odd cashiers, and the
 * store is the level people scan before they pick a person — opening all of
 * them by default turns the panel into a wall and buries the row that matters.
 *
 * The store's dot is the WORST of its cashiers, not its own aggregate grade. A
 * store's total movement can average out to steady while one operator inside
 * it is running three times their normal, and a green dot over a red row reads
 * as a bug rather than as arithmetic.
 */
interface Props {
  store: RosterStore;
  windows: WeekWindow[];
}

const StoreSection = ({ store, windows }: Props) => {
  const dispatch = useAppDispatch();
  const expandedStores = useAppSelector((s) => s.lpActions.expandedStores);

  const key = String(store.storeid);
  const open = expandedStores.includes(key);
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div>
      <button
        onClick={() => dispatch(toggleLpStore(key))}
        aria-expanded={open}
        className="w-full text-left flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <Chevron className="w-3.5 h-3.5 text-content/85 flex-shrink-0" />
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[store.severity]}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-content truncate">
            {store.storeName}
          </span>
          <span className="block text-[12px] text-content/85 truncate">
            {store.cashiers.length}{" "}
            {store.cashiers.length === 1 ? "cashier" : "cashiers"}
            {store.investigateCount > 0 &&
              ` · ${store.investigateCount} to investigate`}
          </span>
        </span>
        <WeekBars
          weeks={store.weeks}
          severity={store.severity}
          windows={windows}
        />
        <span
          className={`w-[58px] text-right flex-shrink-0 text-[12.5px] font-semibold ${VALUE_TEXT[store.severity]}`}
        >
          {multipleLabel(store.multiple, store.severity)}
        </span>
      </button>

      {open && (
        // A rule down the left, indented to the parent's chevron. Without a
        // guide a long list of operators stops reading as belonging to the
        // store above it.
        <div className="ml-[19px] border-l-2 border-gray-200">
          {store.cashiers.map((c) => (
            <CashierRow key={c.id} cashier={c} windows={windows} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreSection;
