import { formatCurrencyCompact } from "../../../utils";
import { useStoreName } from "../../../hooks";
import { severityDotClass } from "./utils";
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
  onClick: (selection: StoreSelection) => void;
}

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

const deltaPillClass = (pct: number) =>
  pct >= 0
    ? "bg-severity_healthy_bg text-severity_healthy_text"
    : "bg-severity_critical_bg text-severity_critical_text";

const DeltaPill = ({ has, pct }: { has: boolean; pct: number }) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
      has ? deltaPillClass(pct) : "bg-gray-100 text-gray-400"
    }`}
    style={{ width: 58 }}
  >
    {has ? formatPct(pct) : "—"}
  </span>
);

const LedgerRow = ({ row, isSelected, gradingMetric, onClick }: LedgerRowProps) => {
  const storeName = useStoreName(row.storeid, row.store_name);
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
          {storeName}
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
        <DeltaPill has={row.hasLW} pct={row.vsLWPct} />
        <DeltaPill has={row.hasLY} pct={row.vsLYPct} />
      </div>
    </button>
  );
};

export default LedgerRow;
