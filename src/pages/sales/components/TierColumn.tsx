import { formatCurrency2 } from "../../../utils";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import type { LedgerRowData, StoreSelection } from "./LedgerRow";
import { SEVERITY_CONFIG, formatPct, type SeverityKey } from "./tierColumnUtils";

const TierColumn = ({
  severity,
  rows,
  onSelect,
  selectedStoreId,
}: {
  severity: SeverityKey;
  rows: LedgerRowData[];
  onSelect: (selection: StoreSelection) => void;
  selectedStoreId?: number;
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
    });
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="overflow-y-auto thin-scrollbar" style={{ maxHeight: "calc(100vh - 18rem)" }}>
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/25">
            None this week
          </div>
        ) : (
          rows.map((row) => {
            const isSel = row.storeid === selectedStoreId;
            return (
            <button
              key={row.storeid}
              onClick={() => handleClick(row)}
              className={`flex flex-col w-full px-3 py-2.5 transition-colors gap-1.5 text-left ${isSel ? "" : "hover:bg-gray-50"}`}
              style={isSel ? { boxShadow: `inset 0 0 8px ${cfg.shadowColor}` } : undefined}
            >
              <div className="flex items-center justify-center">
                {/* <div
                  className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.badgeBg }}
                >
                  <cfg.Icon className="w-3 h-3" style={{ color: cfg.iconColor }} />
                </div> */}
                <div className="text-[11px] font-medium text-content truncate">{row.store_name}</div>
              </div>
              <div className="grid grid-cols-3">
                <div className="px-2 py-1">
                  <div className="text-[7px] text-content/45 uppercase tracking-wide">TY</div>
                  <div className="text-[10px] font-medium text-content mt-0.5">{formatCurrency2(row.twTotal)}</div>
                </div>
                <div className="px-2 py-1">
                  <div className="text-[7px] text-content/45 uppercase tracking-wide">LW</div>
                  <div className="text-[10px] font-medium text-content mt-0.5">{row.hasLW ? formatCurrency2(row.lwTotal) : "—"}</div>
                  {row.hasLW && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(row.vsLWPct)}</div>}
                </div>
                <div className="px-2 py-1">
                  <div className="text-[7px] text-content/45 uppercase tracking-wide">LY</div>
                  <div className="text-[10px] font-medium text-content mt-0.5">{row.hasLY ? formatCurrency2(row.lyTotal) : "—"}</div>
                  {row.hasLY && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(row.vsLYPct)}</div>}
                </div>
              </div>
            </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TierColumn;
