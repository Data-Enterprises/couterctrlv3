import { useState, useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

const formatHour = (h: number) => {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
};

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

type HourRow = {
  hour: number;
  tw: number;
  ly: number;
  trans: number;
  lyTrans: number;
  qty: number;
  lyQty: number;
  vsLYPct: number;
  hasLY: boolean;
};

const TableRow = ({
  label,
  tw,
  ly,
  fmt,
}: {
  label: string;
  tw: number;
  ly: number;
  fmt: (v: number) => string;
}) => {
  const diff = ly > 0 ? ((tw - ly) / ly) * 100 : null;
  return (
    <div className="grid grid-cols-[1fr_80px_80px_56px] items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-content/60">{label}</span>
      <span className="text-[11px] font-medium text-content text-right">{fmt(tw)}</span>
      <span className="text-[11px] text-content/50 text-right">{ly > 0 ? fmt(ly) : "—"}</span>
      <span className={`text-[11px] font-medium text-right ${diff === null ? "text-content/30" : diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {diff !== null ? formatPct(diff) : "—"}
      </span>
    </div>
  );
};

const PopupHourlyView = () => {
  const { hourlySales, hourlySalesLastYear } = useAppSelector((s) => s.sales);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const hours = useMemo((): HourRow[] => {
    const twMap = hourlySales.reduce(
      (acc: Record<number, { net: number; trans: number; qty: number }>, h) => {
        const net = h.total_sales - h.total_tax;
        if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
        acc[h.hour].net += net;
        acc[h.hour].trans += h.transactions;
        acc[h.hour].qty += h.qty;
        return acc;
      },
      {},
    );

    const lyMap = hourlySalesLastYear.reduce(
      (acc: Record<number, { net: number; trans: number; qty: number }>, h) => {
        const net = h.total_sales - h.total_tax;
        if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
        acc[h.hour].net += net;
        acc[h.hour].trans += h.transactions;
        acc[h.hour].qty += h.qty;
        return acc;
      },
      {},
    );

    const allHours = Array.from(
      new Set([...Object.keys(twMap), ...Object.keys(lyMap)].map(Number)),
    ).sort((a, b) => a - b);

    return allHours.map((h) => {
      const tw = twMap[h]?.net ?? 0;
      const ly = lyMap[h]?.net ?? 0;
      return {
        hour: h,
        tw,
        ly,
        trans: twMap[h]?.trans ?? 0,
        lyTrans: lyMap[h]?.trans ?? 0,
        qty: twMap[h]?.qty ?? 0,
        lyQty: lyMap[h]?.qty ?? 0,
        hasLY: ly > 0,
        vsLYPct: ly ? ((tw - ly) / ly) * 100 : 0,
      };
    });
  }, [hourlySales, hourlySalesLastYear]);

  const chartMax = Math.max(...hours.map((h) => Math.max(h.tw, h.ly)), 1);
  const totalTrans = hours.reduce((acc, h) => acc + h.trans, 0);
  const totalLYTrans = hours.reduce((acc, h) => acc + h.lyTrans, 0);
  const transDiff = totalTrans - totalLYTrans;
  const peakHour = hours.reduce((best, h) => (h.tw > best.tw ? h : best), hours[0] ?? { hour: 0, tw: 0 });
  const worstHour = hours
    .filter((h) => h.hasLY)
    .reduce(
      (worst, h) => (h.vsLYPct < worst.vsLYPct ? h : worst),
      hours.find((h) => h.hasLY) ?? hours[0],
    );

  const selected = selectedHour !== null ? hours.find((h) => h.hour === selectedHour) : null;
  const avgBasket = selected && selected.trans > 0 ? selected.tw / selected.trans : 0;
  const lyAvgBasket = selected && selected.lyTrans > 0 ? selected.ly / selected.lyTrans : 0;

  if (!hours.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content/30 text-sm">
        No hourly data
      </div>
    );
  }

  const BAR_H = 100;

  return (
    <div className="flex flex-col">
      {/* Hour tiles */}
      <div className="grid grid-cols-7 gap-1 p-2 border-b border-gray-100">
        {hours.map((h) => {
          const isNeg = h.vsLYPct < 0;
          const isWorst = worstHour && h.hour === worstHour.hour && h.hasLY;
          const isSelected = selectedHour === h.hour;
          return (
            <button
              key={h.hour}
              onClick={() => setSelectedHour(isSelected ? null : h.hour)}
              className={`rounded-md py-1.5 text-center border transition-colors ${
                isSelected
                  ? "bg-[#1e2a4a] border-[#1e2a4a]"
                  : isWorst
                  ? "bg-red-100 border-red-400 hover:border-red-500"
                  : isNeg
                  ? "bg-red-50 border-red-200 hover:border-red-400"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`text-[10px] font-medium ${isSelected ? "text-white" : isNeg ? "text-red-800" : "text-content/80"}`}>
                {formatHour(h.hour)}
              </div>
              <div className={`text-[9px] mt-0.5 ${
                isSelected ? "text-white/70" : !h.hasLY ? "text-content/30" : isNeg ? "text-red-600" : "text-content/50"
              }`}>
                {h.hasLY ? formatPct(h.vsLYPct) : "—"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hour drill-down panel */}
      {selected && (
        <div className="mx-2 my-2 rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_56px] items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-[11px] font-medium text-content">{formatHour(selected.hour)}</span>
            <span className="text-[10px] font-medium text-content/50 text-right uppercase tracking-wide">TY</span>
            <span className="text-[10px] font-medium text-content/50 text-right uppercase tracking-wide">LY</span>
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-content/50 uppercase tracking-wide">vs LY</span>
              <button onClick={() => setSelectedHour(null)} className="text-content/30 hover:text-content/60 leading-none ml-1">✕</button>
            </div>
          </div>
          <div className="px-3">
            <TableRow label="Net sales" tw={selected.tw} ly={selected.ly} fmt={formatCurrency2} />
            <TableRow label="Transactions" tw={selected.trans} ly={selected.lyTrans} fmt={(v) => v.toLocaleString()} />
            <TableRow label="Qty" tw={selected.qty} ly={selected.lyQty} fmt={(v) => v.toLocaleString()} />
            <TableRow label="Avg basket" tw={avgBasket} ly={lyAvgBasket} fmt={formatCurrency2} />
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-end gap-[3px]" style={{ height: BAR_H }}>
          {hours.map((h) => {
            const isNeg = h.vsLYPct < 0;
            const isSelected = selectedHour === h.hour;
            const twH = Math.round((h.tw / chartMax) * BAR_H);
            const lyH = Math.round((h.ly / chartMax) * BAR_H);
            return (
              <button
                key={h.hour}
                onClick={() => setSelectedHour(isSelected ? null : h.hour)}
                className="flex-1 flex flex-col justify-end items-center relative cursor-pointer"
                style={{ height: BAR_H }}
              >
                {h.hasLY && (
                  <div
                    className="absolute w-full border-t-2 border-gray-500"
                    style={{ bottom: lyH }}
                  />
                )}
                <div
                  className={`w-full rounded-t-sm transition-opacity ${
                    isSelected ? "opacity-100 ring-1 ring-[#1e2a4a]" : "opacity-80 hover:opacity-100"
                  } ${isNeg ? "bg-red-300" : "bg-gray-300"}`}
                  style={{ height: twH, minHeight: 2 }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex gap-[3px] mt-1">
          {hours.map((h) => (
            <div key={h.hour} className="flex-1 text-center text-[8px] text-content/50">
              {formatHour(h.hour)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 pb-2">
        <div className="flex items-center gap-1">
          <div className="w-5 border-t-2 border-gray-500" />
          <span className="text-[9px] text-content/40">LY</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-300" />
          <span className="text-[9px] text-content/40">Above LY</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-300" />
          <span className="text-[9px] text-content/40">Below LY</span>
        </div>
      </div>

      {/* Footer summary */}
      <div className="px-3 py-2.5 border-t border-gray-200 grid grid-cols-3 gap-2">
        <div>
          <div className="text-[10px] font-medium text-content/60 mb-0.5">Peak hour</div>
          <div className="text-[12px] font-medium text-content">
            {formatHour(peakHour?.hour ?? 0)} · {formatCurrency2(peakHour?.tw ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-content/60 mb-0.5">Worst vs LY</div>
          <div className="text-[12px] font-medium text-red-600">
            {worstHour ? `${formatHour(worstHour.hour)} · ${formatPct(worstHour.vsLYPct)}` : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-content/60 mb-0.5">Transactions</div>
          <div className="text-[12px] font-medium text-content">
            {totalTrans.toLocaleString()}
            {totalLYTrans > 0 && (
              <span className={`text-[10px] font-normal ml-1 ${transDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {transDiff >= 0 ? "+" : ""}{transDiff} vs LY
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupHourlyView;
