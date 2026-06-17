import { formatCurrency2 } from "../../../utils";

export type DayDot = {
  sale_date: string;
  twNet: number;
  lyNet: number;
};

export type LedgerRowData = {
  storeid: number;
  store_name: string;
  store_number: string;
  twTotal: number;
  lwTotal: number;
  lyTotal: number;
  vsLYPct: number;
  vsLYDollar: number;
  days: DayDot[];
};

export type StoreSelection = {
  storeId: number;
  storeName: string;
  start: string;
  end: string;
  mode: "weekly" | "daily";
  days: DayDot[];
};

interface LedgerRowProps {
  row: LedgerRowData;
  rank: number;
  onClick: (selection: StoreSelection) => void;
}

const dayCellColor = (twNet: number, lyNet: number) => {
  if (!lyNet) return "bg-gray-100 text-gray-400";
  return twNet >= lyNet
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-600";
};

const statusDot = (vsLYPct: number) => {
  return vsLYPct >= 0 ? "bg-emerald-500" : "bg-red-500";
};

const formatPct = (pct: number) => {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
};

const LedgerRow = ({ row, rank, onClick }: LedgerRowProps) => {
  const isNegative = row.vsLYPct < 0;

  const sortedDays = [...row.days].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );
  const weekStart = sortedDays[0]?.sale_date.split("T")[0] ?? "";
  const weekEnd = sortedDays[sortedDays.length - 1]?.sale_date.split("T")[0] ?? "";

  const handleRowClick = () => {
    onClick({ storeId: row.storeid, storeName: row.store_name, start: weekStart, end: weekEnd, mode: "weekly", days: sortedDays });
  };

  const handleDayClick = (e: React.MouseEvent, sale_date: string) => {
    e.stopPropagation();
    const day = sale_date.split("T")[0];
    onClick({ storeId: row.storeid, storeName: row.store_name, start: day, end: day, mode: "daily", days: sortedDays });
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-gray-200 last:border-0 cursor-pointer transition-colors hover:bg-blue-50 ${
        isNegative ? "bg-red-50" : ""
      }`}
    >
      <td className="px-4 py-3 text-content/30 text-xs font-medium">{rank}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-[13px] mb-1.5">
          {row.store_number} · {row.store_name}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {row.days.map((d) => {
            const date = new Date(d.sale_date.split("T")[0] + "T12:00:00");
            const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
            const label = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            });
            return (
              <div
                key={d.sale_date}
                title={`${label}: ${formatCurrency2(d.twNet)} TW`}
                onClick={(e) => handleDayClick(e, d.sale_date)}
                className={`flex items-center justify-center rounded text-[9px] font-semibold py-0.5 cursor-pointer hover:opacity-75 transition-opacity ${dayCellColor(d.twNet, d.lyNet)}`}
              >
                {dayLabel}
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium">{formatCurrency2(row.twTotal)}</div>
        <div
          className={`text-xs font-medium mt-0.5 ${row.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
        >
          {formatPct(row.vsLYPct)} vs LY
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium">{formatCurrency2(row.lwTotal)}</div>
        {row.lwTotal > 0 && (
          <div
            className={`text-xs font-medium mt-0.5 ${row.twTotal >= row.lwTotal ? "text-emerald-600" : "text-red-500"}`}
          >
            {formatPct(((row.twTotal - row.lwTotal) / row.lwTotal) * 100)} vs TW
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-content/50">
          {formatCurrency2(row.lyTotal)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`w-2.5 h-2.5 rounded-full mx-auto ${statusDot(row.vsLYPct)}`} />
      </td>
    </tr>
  );
};

export default LedgerRow;
