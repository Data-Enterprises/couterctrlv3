import { formatCurrency2, formatBigNumber } from "../../../utils";
import type { LedgerRowData, StoreSelection } from "./LedgerRow";
import { SEVERITY_CONFIG, formatPct, type SeverityKey } from "./tierColumnUtils";
import type { GradingMetric } from "../../../features/salesLedgerSlice";
import { useStoreName } from "../../../hooks";
import UniversalTierColumn from "../../../components/TierColumn";

const StoreRowItem = ({
  row,
  isSel,
  shadowColor,
  gradingMetric,
  onClick,
}: {
  row: LedgerRowData;
  isSel: boolean;
  shadowColor: string;
  gradingMetric: GradingMetric;
  onClick: () => void;
}) => {
  const storeName = useStoreName(row.storeid, row.store_name);
  return (
    <button
      onClick={onClick}
      className={`flex flex-col w-full px-3 py-2.5 transition-colors gap-1.5 text-left ${isSel ? "" : "hover:bg-gray-50"}`}
      style={isSel ? { boxShadow: `inset 0 0 8px ${shadowColor}` } : undefined}
    >
      <div className="text-[11px] font-medium text-content truncate w-full text-center">{storeName}</div>
      <div className="grid grid-cols-3">
        <div className="px-2 py-1 text-center">
          <div className="text-[7px] text-content uppercase tracking-wide">TY</div>
          <div className="text-[10px] font-medium text-content mt-0.5">
            {gradingMetric === "qty" ? formatBigNumber(row.twQty, 0) : formatCurrency2(row.twTotal)}
          </div>
        </div>
        <div className="px-2 py-1 text-center">
          <div className="text-[7px] text-content uppercase tracking-wide">LW</div>
          <div className="text-[10px] font-medium text-content mt-0.5">
            {row.hasLW ? (gradingMetric === "qty" ? formatBigNumber(row.lwQty, 0) : formatCurrency2(row.lwTotal)) : "—"}
          </div>
          {row.hasLW && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLWPct >= 0 ? "text-severity_healthy_text" : "text-severity_critical_text"}`}>{formatPct(row.vsLWPct)}</div>}
        </div>
        <div className="px-2 py-1 text-center">
          <div className="text-[7px] text-content uppercase tracking-wide">LY</div>
          <div className="text-[10px] font-medium text-content mt-0.5">
            {row.hasLY ? (gradingMetric === "qty" ? formatBigNumber(row.lyQty, 0) : formatCurrency2(row.lyTotal)) : "—"}
          </div>
          {row.hasLY && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLYPct >= 0 ? "text-severity_healthy_text" : "text-severity_critical_text"}`}>{formatPct(row.vsLYPct)}</div>}
        </div>
      </div>
    </button>
  );
};

const TierColumn = ({
  severity,
  rows,
  onSelect,
  selectedStoreId,
  gradingMetric = "sales",
}: {
  severity: SeverityKey;
  rows: LedgerRowData[];
  onSelect: (selection: StoreSelection) => void;
  selectedStoreId?: number;
  gradingMetric?: GradingMetric;
}) => {
  const cfg = SEVERITY_CONFIG[severity];

  const handleClick = (row: LedgerRowData) => {
    const sorted = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    const weekStart = sorted[0]?.sale_date.split("T")[0] ?? "";
    const weekEnd = sorted[sorted.length - 1]?.sale_date.split("T")[0] ?? "";
    onSelect({
      storeId: row.storeid,
      storeName: row.store_name,
      storeNumber: row.store_number,
      start: weekStart,
      end: weekEnd,
      mode: "weekly",
      days: sorted,
      severity: row.severity,
    });
  };

  return (
    <div className="flex flex-col min-h-0">
      <UniversalTierColumn emptyText="None this week">
        {rows.length > 0
          ? rows.map((row) => (
              <StoreRowItem
                key={row.storeid}
                row={row}
                isSel={row.storeid === selectedStoreId}
                shadowColor={cfg.shadowColor}
                gradingMetric={gradingMetric}
                onClick={() => handleClick(row)}
              />
            ))
          : undefined}
      </UniversalTierColumn>
    </div>
  );
};

export default TierColumn;
