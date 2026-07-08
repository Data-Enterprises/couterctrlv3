import { ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";

export type DayDot = {
  sale_date: string;
  twNet: number;
  lwNet: number;
  lyNet: number;
};

export type Severity = "critical" | "watch" | "healthy";

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
};

interface LedgerRowProps {
  row: LedgerRowData;
  onClick: (selection: StoreSelection) => void;
}

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;


const SeverityIcon = ({ severity }: { severity: Severity }) => {
  if (severity === "critical")
    return <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mx-auto" />;
  if (severity === "watch")
    return <ExclamationCircleIcon className="w-6 h-6 text-amber-400 mx-auto" />;
  return <CheckCircleIcon className="w-6 h-6 text-emerald-500 mx-auto" />;
};

const dayCellColor = (twNet: number, lyNet: number) => {
  if (!lyNet) return "bg-gray-100 text-gray-400";
  return twNet >= lyNet ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600";
};

const W = 200;
const H = 32;

const Sparkline = ({ days, hasLW, hasLY }: { days: DayDot[]; hasLW: boolean; hasLY: boolean }) => {
  const sorted = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  const n = sorted.length;
  if (n < 2) return null;

  const allVals = sorted.flatMap((d) => [
    d.twNet,
    hasLW ? d.lwNet : 0,
    hasLY ? d.lyNet : 0,
  ]).filter((v) => v > 0);
  const max = Math.max(...allVals, 1);
  const min = Math.min(...allVals);
  const range = max - min || 1;

  const xOf = (i: number) => (i / (n - 1)) * W;
  const yOf = (v: number) => H - ((v - min) / range) * (H - 4) - 2;

  const pts = (vals: number[]) =>
    vals.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");

  const twPts = pts(sorted.map((d) => d.twNet));
  const lwPts = hasLW ? pts(sorted.map((d) => d.lwNet)) : null;
  const lyPts = hasLY ? pts(sorted.map((d) => d.lyNet)) : null;

  const isDown = sorted[sorted.length - 1].twNet < sorted[0].twNet;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full overflow-visible"
      style={{ height: H }}
    >
      {lyPts && (
        <polyline
          points={lyPts}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
      )}
      {lwPts && (
        <polyline
          points={lwPts}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
      )}
      <polyline
        points={twPts}
        fill="none"
        stroke={isDown ? "#f87171" : "#4a6fa5"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* endpoint dot */}
      <circle
        cx={xOf(n - 1)}
        cy={yOf(sorted[n - 1].twNet)}
        r="2.5"
        fill={isDown ? "#f87171" : "#4a6fa5"}
      />
    </svg>
  );
};

const severityBorder = {
  critical: "border-l-4 border-red-500",
  watch: "border-l-4 border-amber-400",
  healthy: "border-l-4 border-emerald-500",
} as const;

const LedgerRow = ({ row, onClick }: LedgerRowProps) => {
  const sortedDays = [...row.days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  const weekStart = sortedDays[0]?.sale_date.split("T")[0] ?? "";
  const weekEnd = sortedDays[sortedDays.length - 1]?.sale_date.split("T")[0] ?? "";

  const handleRowClick = () => {
    onClick({ storeId: row.storeid, storeName: row.store_name, storeNumber: row.store_number, start: weekStart, end: weekEnd, mode: "weekly", days: sortedDays });
  };

  const handleDayClick = (e: React.MouseEvent, sale_date: string) => {
    e.stopPropagation();
    const day = sale_date.split("T")[0];
    onClick({ storeId: row.storeid, storeName: row.store_name, storeNumber: row.store_number, start: day, end: day, mode: "daily", days: sortedDays });
  };

  return (
    <tr
      onClick={handleRowClick}
      className="border-b border-gray-200 last:border-0 cursor-pointer transition-colors hover:bg-blue-50"
    >
      {/* Severity icon column */}
      <td className={`py-3 pl-3 pr-2 text-center align-middle ${severityBorder[row.severity]}`}>
        <SeverityIcon severity={row.severity} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-[13px] mb-1.5">
          {row.store_number} · {row.store_name}
        </div>
        <div className="mb-1.5">
          <Sparkline days={sortedDays} hasLW={row.hasLW} hasLY={row.hasLY} />
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {sortedDays.map((d) => {
            const date = new Date(d.sale_date.split("T")[0] + "T12:00:00");
            const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
            const label = date.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
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
        <div className={`text-xs font-medium mt-0.5 ${row.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {formatPct(row.vsLYPct)} vs LY
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium">{formatCurrency2(row.lwTotal)}</div>
        {row.hasLW && (
          <div className={`text-xs font-medium mt-0.5 ${row.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatPct(row.vsLWPct)} vs TW
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-content">{formatCurrency2(row.lyTotal)}</div>
      </td>
    </tr>
  );
};

export default LedgerRow;
