import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpFocusedType } from "../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../utils";
import { hueFor } from "../typeColour";
import { VALUE_TEXT, multipleLabel } from "../roster/rosterTheme";
import DeviationBar from "./DeviationBar";
import type { CaseCard } from "./caseFileModel";

/**
 * One exception type, for this operator, this week.
 *
 * Also the type selector: clicking one carries that type into the transactions
 * half as its opening filter. Zero-count cards stay clickable — "show me the
 * no-sales" answering "there are none" is a useful thing to be able to ask.
 *
 * The swatch carries the type and the multiple carries the grade. Two channels
 * doing two jobs: someone who has learned that violet means Voided keeps that
 * whatever the severity, and the red on the number always means the same thing
 * whatever the type.
 */
interface Props {
  card: CaseCard;
}

const DeviationCard = ({ card }: Props) => {
  const dispatch = useAppDispatch();
  const focusedType = useAppSelector((s) => s.lpActions.focusedType);

  const selected = focusedType === card.saleType;
  const zero = card.count === 0;

  return (
    <button
      aria-pressed={selected}
      onClick={() =>
        dispatch(setLpFocusedType(selected ? null : card.saleType))
      }
      className={`text-left flex flex-col gap-2 rounded-lg border p-3 transition-colors ${
        selected
          ? "border-row_selected_border bg-row_selected"
          : "border-gray-200 hover:border-row_selected_border"
      } ${zero ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ background: hueFor(card.saleType) }}
        />
        <span className="flex-1 min-w-0 text-[11.5px] font-semibold text-content truncate">
          {card.saleType}
        </span>
        <span className="flex-shrink-0 text-[9.5px] text-content/85">
          {card.daysActive}/{card.daysWorked} days
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-semibold leading-none text-content">
          {card.count}
        </span>
        <span className="text-[9px] uppercase tracking-wide leading-tight text-content/85">
          occurrences
          <br />
          {zero
            ? "none this week"
            : `across ${card.receipts} ${card.receipts === 1 ? "receipt" : "receipts"}`}
        </span>
      </div>

      <div className="flex gap-3.5 border-t border-gray-100 pt-1.5 text-[10.5px] text-content/85">
        <span>
          Total{" "}
          <b className="font-semibold text-content">
            {zero ? "—" : formatCurrency2(card.total)}
          </b>
        </span>
        <span>
          Avg{" "}
          <b className="font-semibold text-content">
            {zero ? "—" : formatCurrency2(card.average)}
          </b>
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between text-[9px] uppercase tracking-wide text-content/85">
          <span>vs. their baseline</span>
          <span
            className={`text-[13px] font-semibold normal-case tracking-normal ${VALUE_TEXT[card.severity]}`}
          >
            {multipleLabel(card.multiple, card.severity)}
          </span>
        </div>
        <DeviationBar
          multiple={card.multiple}
          colour={hueFor(card.saleType)}
        />
      </div>
    </button>
  );
};

export default DeviationCard;
