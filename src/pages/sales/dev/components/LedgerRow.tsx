// Hooks
import { memo } from "react";
import { useStoreName } from "../../../../hooks";

// Utils
import { formatCurrencyCompact } from "../../../../utils";
import { severityDotClass } from "../utils/index";
import { selectionFor } from "../utils/storeComparison";
import {
  applyStoreNumberToName,
  isCompleteCoverage,
} from "../utils/ledgerUtils";

// Interfaces
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";
import type { StoreSelection } from "../../../../interfaces";
import type { LedgerRowData } from "../interfaces";

// Components
import DeltaPill from "./DeltaPill";

interface LedgerRowProps {
  row: LedgerRowData;
  isSelected: boolean;
  gradingMetric: GradingMetric;
  /** The grading cut, so the delta pills band the same way the row's severity
   *  dot does. Passed rather than selected here: the row is memoized against a
   *  threshold slider that moves every frame. */
  threshold: number;
  /** Clicking the row that is already open closes it — see SalesLedger. */
  onClick: (selection: StoreSelection) => void;
}

/**
 * Graded on the same three bands as the rest of the app, via the shared
 * `pillClass`.
 *
 * This used to be a local two-band rule: positive green, negative red, the
 * threshold ignored entirely. So a store down 2.19% against a 9% threshold —
 * comfortably inside tolerance, and graded Watch by `ledgerSeverity` a few
 * pixels to its left — wore a critical-red pill. Two colour systems on one row,
 * disagreeing about the same store.
 *
 * `pillClass` applies the identical cut `ledgerSeverity` does (below
 * -threshold critical, below zero watch, otherwise healthy), which is what
 * Categories and the other performance pages already use. Nothing new is being
 * invented here; Sales was the one page that had drifted off it.
 */
const LedgerRow = ({
  row,
  isSelected,
  gradingMetric,
  threshold,
  onClick,
}: LedgerRowProps) => {
  const storeName = useStoreName(row.storeid, row.store_name);
  // No-op unless this storeid is co-located; see applyStoreNumberToName.
  const displayName = applyStoreNumberToName(
    storeName,
    row.store_number,
    row.storeNumbersForId,
  );
  const isQty = gradingMetric === "qty";
  const fmtMetric = (dollars: number, qty: number) =>
    isQty ? qty.toLocaleString() : formatCurrencyCompact(dollars);
  // Built in shared/storeComparison so the group comparison opens a store the
  // same way this row does.
  const handleClick = () => onClick(selectionFor(row));

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
        isSelected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          // Grey: neither last week nor last year covers the whole week, so
          // there is nothing to grade on.
          row.severity ? severityDotClass[row.severity] : "bg-gray-400"
        }`}
        title={
          row.severity
            ? undefined
            : "Not graded — neither last week nor last year has every day"
        }
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-content truncate">
          {displayName}
        </div>
        <div className="text-[12px] text-content/95 truncate">
          LW{" "}
          <span className="font-semibold">
            {row.hasLW ? fmtMetric(row.lwTotal, row.lwQty) : "—"}
          </span>{" "}
          · LY{" "}
          <span className="font-semibold">
            {row.hasLY ? fmtMetric(row.lyTotal, row.lyQty) : "—"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-[14px]">
        <span
          className="text-[13px] font-semibold text-content flex-shrink-0 pl-2.5"
          style={{ width: 64 }}
        >
          {fmtMetric(row.twTotal, row.twQty)}
        </span>
        <DeltaPill
          has={row.hasLW}
          pct={row.vsLWPct}
          threshold={threshold}
          complete={isCompleteCoverage(row.lwDayCount, row.dayCount)}
          matched={row.lwDayCount}
          days={row.dayCount}
          period="last week"
        />
        <DeltaPill
          has={row.hasLY}
          pct={row.vsLYPct}
          threshold={threshold}
          complete={isCompleteCoverage(row.lyDayCount, row.dayCount)}
          matched={row.lyDayCount}
          days={row.dayCount}
          period="last year"
        />
      </div>
    </button>
  );
};

// Dragging the threshold slider re-grades on every frame. regradeLedgerRows
// preserves the object reference of any row whose severity didn't change, so
// memoizing here means only the few rows that actually flipped re-render
// instead of all ~390 — each of which otherwise re-sorts its own days array.
export default memo(LedgerRow);
