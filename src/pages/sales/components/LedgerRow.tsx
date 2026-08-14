import { memo } from "react";
import { formatCurrencyCompact } from "../../../utils";
import { useStoreName } from "../../../hooks";
import { severityDotClass, pillClass, PCT_COL_W } from "./utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import type { Severity } from "../../../utils/severity";
import type { GradingMetric } from "../../../features/salesLedgerSlice";

export type { Severity };

export type DayDot = {
  sale_date: string;
  twNet: number;
  // null means no matching LW/LY row for this day — not the same as a
  // genuine $0 sales day. See computeDayMatchedTotals in shared/ledgerUtils.
  lwNet: number | null;
  lyNet: number | null;
  lwQty: number | null;
  lyQty: number | null;
  twQty: number;
};

export type LedgerRowData = {
  storeid: number;
  store_name: string;
  store_number: string;
  /** Every store_number this storeid returned. Length > 1 means co-located
   * stores sharing one id — the name resolves by storeid and is identical for
   * both, so the number is what tells them apart. Feeds
   * applyStoreNumberToName, which needs the full set to know which digits in
   * the name are the store number. */
  storeNumbersForId: string[];
  twTotal: number;
  lwTotal: number;
  lyTotal: number;
  twQty: number;
  lwQty: number;
  lyQty: number;
  vsLWPct: number;
  vsLYPct: number;
  vsLYDollar: number;
  hasLW: boolean;
  hasLY: boolean;
  severity: Severity;
  days: DayDot[];
};

export type StoreSelection = {
  storeId: number;
  storeName: string;
  storeNumber: string;
  /** Mirrors LedgerRowData.storeNumbersForId — lets the detail panel label
   * which of the co-located locations it's showing. */
  storeNumbersForId: string[];
  start: string;
  end: string;
  mode: "weekly" | "daily";
  days: DayDot[];
  severity: Severity;
};

interface LedgerRowProps {
  row: LedgerRowData;
  isSelected: boolean;
  gradingMetric: GradingMetric;
  /** The grading cut, so the delta pills band the same way the row's severity
   *  dot does. Passed rather than selected here: the row is memoized against a
   *  threshold slider that moves every frame. */
  threshold: number;
  onClick: (selection: StoreSelection) => void;
}

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

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
const DeltaPill = ({
  has,
  pct,
  threshold,
}: {
  has: boolean;
  pct: number;
  threshold: number;
}) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${pillClass(
      // Null is the shared helper's own "no comparison" case, and it renders
      // the same grey this used to hard-code.
      has ? pct : null,
      threshold,
    )}`}
    style={{ minWidth: PCT_COL_W }}
  >
    {has ? formatPct(pct) : "—"}
  </span>
);

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
  const sortedDays = [...row.days].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );
  const weekStart = sortedDays[0]?.sale_date.split("T")[0] ?? "";
  const weekEnd =
    sortedDays[sortedDays.length - 1]?.sale_date.split("T")[0] ?? "";

  const handleClick = () => {
    onClick({
      storeId: row.storeid,
      storeName: row.store_name,
      storeNumber: row.store_number,
      storeNumbersForId: row.storeNumbersForId,
      start: weekStart,
      end: weekEnd,
      mode: "weekly",
      days: sortedDays,
      severity: row.severity,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
        isSelected
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-gray-50"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[row.severity]}`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-content truncate">
          {displayName}
        </div>
        <div className="text-[12px] text-content/85 truncate">
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
        <DeltaPill has={row.hasLW} pct={row.vsLWPct} threshold={threshold} />
        <DeltaPill has={row.hasLY} pct={row.vsLYPct} threshold={threshold} />
      </div>
    </button>
  );
};

// Dragging the threshold slider re-grades on every frame. regradeLedgerRows
// preserves the object reference of any row whose severity didn't change, so
// memoizing here means only the few rows that actually flipped re-render
// instead of all ~390 — each of which otherwise re-sorts its own days array.
export default memo(LedgerRow);
