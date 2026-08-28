import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase } from "../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../utils";
import { ALL_TYPES } from "../case/caseModel";
import WeekBars from "./WeekBars";
import { DOT, VALUE_TEXT, multipleLabel } from "./rosterTheme";
import type { RosterCashier } from "./rosterModel";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * One operator, and whether they moved.
 *
 * A single line of four columns, so the list reads down as a table rather than
 * as a stack of paragraphs. The second line this row used to carry — type
 * swatches and a repeated count — became the Total column: money is the thing
 * a manager sorts by when deciding what to open first, and it was the one
 * figure the row did not have.
 *
 * Clicking opens their case file on the right, on `All` rather than on a type.
 * The first question of a case is "is this person an outlier", and only the
 * second is "at what".
 */
interface Props {
  cashier: RosterCashier;
  windows: WeekWindow[];
}

const CashierRow = ({ cashier, windows }: Props) => {
  const dispatch = useAppDispatch();
  const caseSubject = useAppSelector((s) => s.lpActions.caseSubject);

  const selected =
    caseSubject?.storeid === cashier.storeid &&
    caseSubject?.cashierNumber === cashier.cashierNumber;

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
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 border-l-2 border-b border-b-[#1e2a4a]/15 transition-colors ${
        selected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[cashier.severity]}`}
      />

      <span className="min-w-0 flex-1 text-[13px] font-medium text-content truncate">
        {cashier.cashierName} &middot; {cashier.cashierNumber}
      </span>

      <WeekBars
        weeks={cashier.weeks}
        severity={cashier.severity}
        windows={windows}
      />

      <span className="w-[72px] text-right flex-shrink-0 text-[13px] font-semibold text-content">
        {formatCurrency2(cashier.latestValue)}
      </span>

      <span
        className={`w-[58px] text-right flex-shrink-0 text-[13px] font-semibold ${VALUE_TEXT[cashier.severity]}`}
      >
        {multipleLabel(cashier.multiple, cashier.severity)}
      </span>
    </button>
  );
};

export default CashierRow;
