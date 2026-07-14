import { formatPct } from "../../shared/ledgerUtils";
import { formatCurrency2 } from "../../../../utils";
import type { LedgerRowData } from "../../components/LedgerRow";
import SevBadge from "./SevBadge";

interface StoreRowProps {
  row: LedgerRowData;
  onClick: (row: LedgerRowData) => void;
}

const StoreRow = ({ row, onClick }: StoreRowProps) => {
  const sortedDays = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));

  return (
    <button
      onClick={() => onClick(row)}
      className="flex items-start w-full px-3 py-3 gap-3 bg-white border-b border-gray-300 last:border-0 text-left active:bg-gray-50"
    >
      <SevBadge sev={row.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-content truncate mb-1.5">{row.store_name}</div>
        <div className="grid grid-cols-3 mb-1.5">
          <div className="px-1.5 py-1">
            <div className="text-[7px] text-content/45 uppercase tracking-wide">TY</div>
            <div className="text-[11px] font-medium text-content mt-0.5">{formatCurrency2(row.twTotal)}</div>
            <div className="text-[9px] text-content/35 mt-0.5">—</div>
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[7px] text-content/45 uppercase tracking-wide">LW</div>
            <div className="text-[11px] font-medium text-content mt-0.5">{row.hasLW ? formatCurrency2(row.lwTotal) : "—"}</div>
            {row.hasLW && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(row.vsLWPct)}</div>}
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[7px] text-content/45 uppercase tracking-wide">LY</div>
            <div className="text-[11px] font-medium text-content mt-0.5">{row.hasLY ? formatCurrency2(row.lyTotal) : "—"}</div>
            {row.hasLY && <div className={`text-[9px] font-medium mt-0.5 ${row.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatPct(row.vsLYPct)}</div>}
          </div>
        </div>
        <div className="flex gap-0.5">
          {sortedDays.map((d) => {
            const dateStr = d.sale_date.split("T")[0];
            const dayLabel = new Date(dateStr + "T12:00:00")
              .toLocaleDateString("en-US", { weekday: "short" })
              .slice(0, 1);
            const hasLY = d.lyNet !== null && d.lyNet > 0;
            const hasLW = d.lwNet !== null && d.lwNet > 0;
            const ref = hasLY ? (d.lyNet as number) : hasLW ? (d.lwNet as number) : 0;
            const hasRef = hasLY || hasLW;
            const isPos = hasRef ? d.twNet >= ref : true;
            return (
              <div
                key={d.sale_date}
                className={`w-6 h-[18px] rounded text-[8px] font-bold flex items-center justify-center ${
                  !hasRef ? "bg-gray-200 text-gray-400" : isPos ? "bg-emerald-400 text-white" : "bg-red-400 text-white"
                }`}
              >
                {dayLabel}
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
};

export default StoreRow;
