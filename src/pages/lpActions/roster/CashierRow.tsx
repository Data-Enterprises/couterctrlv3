import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase } from "../../../features/lpActionsSlice";
import { ALL_TYPES } from "../case/caseModel";
import { hueFor } from "../typeColour";
import WeekBars from "./WeekBars";
import { DOT, VALUE_TEXT, multipleLabel } from "./rosterTheme";
import type { RosterCashier } from "./rosterModel";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * One operator, and whether they moved.
 *
 * Clicking opens their case file on the right. It opens on `All` rather than
 * on a type, because the first question of a case is "is this person an
 * outlier", and only the second is "at what".
 *
 * The swatches are the one thing worth explaining. Rooting this list on the
 * cashier means it no longer answers "which exception type moved across the
 * group" the way the old type-rooted list did. Carrying each operator's types
 * on their own row recovers most of that for the price of nine pixels, and
 * doubles as the legend for the cards and charts on the right.
 */
interface Props {
  cashier: RosterCashier;
  windows: WeekWindow[];
}

/** Enough to say "this is a voids problem, not a general one" without turning
 *  the row into a chart. Beyond three the swatches stop being scannable. */
const MAX_SWATCHES = 3;

const CashierRow = ({ cashier, windows }: Props) => {
  const dispatch = useAppDispatch();
  const caseCashier = useAppSelector((s) => s.lpActions.caseCashier);

  const selected =
    caseCashier?.storeid === cashier.storeid &&
    caseCashier?.cashierNumber === cashier.cashierNumber;

  const shown = cashier.types.slice(0, MAX_SWATCHES);
  const extra = cashier.types.length - shown.length;

  return (
    <button
      aria-pressed={selected}
      onClick={() =>
        dispatch(
          setLpCase({
            ref: {
              storeid: cashier.storeid,
              cashierNumber: cashier.cashierNumber,
            },
            type: ALL_TYPES,
          }),
        )
      }
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 transition-colors ${
        selected ? "bg-row_selected" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[cashier.severity]}`}
      />

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-content truncate">
          {cashier.cashierName} &middot; {cashier.cashierNumber}
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-content/85">
          <span className="flex gap-[3px] flex-shrink-0">
            {shown.map((t) => (
              <span
                key={t.saleType}
                title={`${t.saleType} — ${t.count}`}
                style={{ background: hueFor(t.saleType) }}
                className="w-3 h-[3px] rounded-[1px]"
              />
            ))}
          </span>
          <span className="truncate">
            {cashier.latest} this week
            {extra > 0 && ` · +${extra} more`}
          </span>
        </span>
      </span>

      <WeekBars
        weeks={cashier.weeks}
        severity={cashier.severity}
        windows={windows}
      />

      <span
        className={`w-[58px] text-right flex-shrink-0 text-[12.5px] font-semibold ${VALUE_TEXT[cashier.severity]}`}
      >
        {multipleLabel(cashier.multiple, cashier.severity)}
      </span>
    </button>
  );
};

export default CashierRow;
