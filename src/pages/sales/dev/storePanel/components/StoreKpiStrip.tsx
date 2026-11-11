// Hooks
import { useSalesCtx } from "../../hooks";
import { useDateLabels } from "../hooks";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { PARTIAL_PILL_CLASS } from "../../utils/ledgerUtils";
import { formatPct, pillClass } from "../../utils/index";
import { buildHeaderTotals, THRESHOLD } from "../utils";

// Interfaces
import type { DayDot } from "../../../../../interfaces";

interface StoreKpiStripProps {
  days: DayDot[];
}

/** The open store's three figures (TY, vs LW, vs LY) for the week or the
 *  picked day, with how many days each comparison matched. */
const StoreKpiStrip = ({ days }: StoreKpiStripProps) => {
  const { selectedDate, gradingMetric } = useSalesCtx();
  const isQty = gradingMetric === "qty";
  const { twDateLabel, lwDateLabel, lyDateLabel } = useDateLabels();
  const {
    headerTwTotal,
    headerLwTotal,
    headerLyTotal,
    headerVsLWPct,
    headerVsLYPct,
    headerLYDays,
    headerLWDays,
    headerDays,
    noLyHistory,
  } = buildHeaderTotals(days, selectedDate, gradingMetric);

  return (
    <div className="grid grid-cols-3 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
      <div className="px-4 pt-2.5 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wide text-content">
          {isQty ? "TY Qty" : "TY Net Sales"}
        </div>
        <div className="text-[10px] font-bold text-content mb-0.5">{twDateLabel}</div>
        <div className="text-[14px] font-bold text-content">
          {isQty ? formatBigNumber(headerTwTotal, 0) : formatCurrency2(headerTwTotal)}
        </div>
      </div>
      <div className="px-4 pt-2.5 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wide text-content">
          vs Last Week
        </div>
        <div className="text-[10px] font-bold text-content mb-0.5">{lwDateLabel}</div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-[14px] font-bold text-content">
            {headerLwTotal !== null
              ? isQty
                ? formatBigNumber(headerLwTotal, 0)
                : formatCurrency2(headerLwTotal)
              : "—"}
          </span>
          {headerVsLWPct !== null && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                headerLWDays < headerDays
                  ? PARTIAL_PILL_CLASS
                  : pillClass(headerVsLWPct, THRESHOLD)
              }`}
            >
              {formatPct(headerVsLWPct)}
            </span>
          )}
        </div>
        {headerLWDays < headerDays && (
          <div className="text-[10px] font-semibold text-content pb-0.5">
            {headerLWDays} of {headerDays} days matched
          </div>
        )}
      </div>
      <div className="px-4 pt-2.5 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wide text-content">
          vs Last Year
        </div>
        <div className="text-[10px] font-bold text-content mb-0.5">{lyDateLabel}</div>
        <div className="flex items-baseline justify-center gap-2">
          {/* No day of the week has a matching date on file. $0.00 would read
              as a store that sold nothing; it simply has no history there. */}
          <span
            className={`text-[14px] font-bold ${noLyHistory ? "text-content/95" : "text-content"}`}
          >
            {noLyHistory
              ? "No history"
              : headerLyTotal !== null
                ? isQty
                  ? formatBigNumber(headerLyTotal, 0)
                  : formatCurrency2(headerLyTotal)
                : "—"}
          </span>
          {!noLyHistory && headerVsLYPct !== null && (
            <span
              /* Grey, not red or green, when days are missing: right over the
                 days it has, but not enough for a verdict. */
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                headerLYDays < headerDays
                  ? PARTIAL_PILL_CLASS
                  : pillClass(headerVsLYPct, THRESHOLD)
              }`}
              title={
                headerLYDays < headerDays
                  ? `Compares only the ${headerLYDays} day${headerLYDays === 1 ? "" : "s"} with a matching date last year. The total beside it is those days too — not the ${headerDays}-day week above.`
                  : undefined
              }
            >
              {formatPct(headerVsLYPct)}
            </span>
          )}
        </div>
        {!noLyHistory && headerLYDays < headerDays && (
          <div className="text-[10px] font-semibold text-content pb-0.5">
            {headerLYDays} of {headerDays} days matched
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreKpiStrip;
