import { useAppDispatch, useAppSelector } from "../../../hooks";
import { toggleLpStore, setLpCase } from "../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../utils";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ALL_TYPES } from "../case/caseModel";
import CashierRow from "./CashierRow";
import WeekBars from "./WeekBars";
import { DOT, VALUE_TEXT, multipleLabel } from "./rosterTheme";
import type { RosterStore } from "./rosterModel";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * A store, and the operators under it.
 *
 * Two controls in one row, deliberately. The chevron opens the store; the rest
 * of the row SELECTS it, and the case file on the right reports the whole site
 * — every operator's exceptions pooled. Picking a cashier underneath narrows
 * the same panel to them.
 *
 * That order matches the question a group search is asking. Which site is
 * moving comes before which person, and forcing a reader to open a store and
 * pick someone before the panel says anything made them guess at the first
 * question to answer the second.
 *
 * Collapsed to start. A group can carry forty-odd cashiers, and opening all of
 * them turns the panel into a wall.
 *
 * The store's dot is the WORST of its cashiers, not its own aggregate grade. A
 * store's movement can average out to steady while one operator inside it runs
 * three times their normal, and a green dot over a red row reads as a bug
 * rather than as arithmetic.
 */
interface Props {
  store: RosterStore;
  windows: WeekWindow[];
}

const StoreSection = ({ store, windows }: Props) => {
  const dispatch = useAppDispatch();
  const { expandedStores, caseSubject } = useAppSelector((s) => s.lpActions);

  const key = String(store.storeid);
  const open = expandedStores.includes(key);
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

  /** Selected only when the case is the WHOLE store — a cashier inside it is
   *  a different subject, and marking both would say the panel is showing two
   *  things at once. */
  const selected =
    caseSubject?.storeid === store.storeid &&
    caseSubject?.cashierNumber === null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 pl-2 pr-3 border-l-2 border-b border-gray-100 transition-colors ${
          selected
            ? "bg-row_selected border-row_selected_border"
            : "bg-gray-100 border-transparent"
        }`}
      >
        <button
          onClick={() => dispatch(toggleLpStore(key))}
          aria-expanded={open}
          aria-label={open ? "Collapse store" : "Expand store"}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <Chevron className="w-3.5 h-3.5 text-content/85" />
        </button>

        <button
          aria-pressed={selected}
          onClick={() =>
            dispatch(
              setLpCase({
                ref: { storeid: store.storeid, cashierNumber: null },
                type: ALL_TYPES,
              }),
            )
          }
          className="flex-1 min-w-0 flex items-center gap-2.5 py-2 text-left"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[store.severity]}`}
          />

          <span className="min-w-0 flex-1 truncate">
            <span className="text-[13px] font-semibold text-content">
              {store.storeName}
            </span>
            <span className="text-[12px] text-content/85">
              {" "}
              &middot; {store.cashiers.length}
            </span>
          </span>

          <WeekBars
            weeks={store.weeks}
            severity={store.severity}
            windows={windows}
          />

          <span className="w-[72px] text-right flex-shrink-0 text-[13px] font-semibold text-content">
            {formatCurrency2(store.latestValue)}
          </span>

          <span
            className={`w-[58px] text-right flex-shrink-0 text-[13px] font-semibold ${VALUE_TEXT[store.severity]}`}
          >
            {multipleLabel(store.multiple, store.severity)}
          </span>
        </button>
      </div>

      {open && (
        // Indented to the parent's chevron so a long list keeps reading as
        // belonging to the store above it.
        <div className="pl-[19px]">
          {store.cashiers.map((c) => (
            <CashierRow key={c.id} cashier={c} windows={windows} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreSection;
