import { useState, useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

const formatHourRange = (h: number) => `${ampm(h)} – ${ampm(h + 1 <= 23 ? h + 1 : 0)}`;

type HourRow = {
  hour: number;
  tw: number;
  lw: number;
  ly: number;
  trans: number;
  lwTrans: number;
  lyTrans: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  vsLWPct: number;
  vsLYPct: number;
  hasLW: boolean;
  hasLY: boolean;
};

type SevFilter = "all" | "critical" | "watch" | "healthy";

const THRESHOLD = 9;

const hourSeverity = (r: HourRow): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -THRESHOLD) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};

const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};

const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[severity] }}
  >
    {severity === "critical" && (
      <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />
    )}
    {severity === "watch" && (
      <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />
    )}
    {severity === "healthy" && (
      <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />
    )}
  </div>
);

const getCta = (row: HourRow): { text: string; severity: Severity } => {
  const sev = hourSeverity(row);
  const avgBasket = row.trans > 0 ? row.tw / row.trans : 0;
  const lyAvgBasket = row.lyTrans > 0 ? row.ly / row.lyTrans : 0;

  if (sev === "critical") {
    const transDrop = row.lyTrans > 0 ? ((row.trans - row.lyTrans) / row.lyTrans) * 100 : null;
    const basketDiff = lyAvgBasket > 0 ? ((avgBasket - lyAvgBasket) / lyAvgBasket) * 100 : null;
    const isTrafficLoss = transDrop !== null && transDrop < -5;
    const isSpendDrop = basketDiff !== null && basketDiff < -3;
    if (isTrafficLoss && !isSpendDrop)
      return { severity: "critical", text: `Traffic loss driving the decline — basket is holding but transactions are down ${Math.abs(transDrop!).toFixed(1)}%. Check staffing and flow.` };
    if (isSpendDrop && !isTrafficLoss)
      return { severity: "critical", text: `Spend compression this hour — traffic held but avg basket dropped. Look at mix shift or promoted item performance.` };
    return { severity: "critical", text: `Down vs both periods. Both traffic and spend show pressure. Investigate staffing, promotions, and item availability.` };
  }
  if (sev === "watch") {
    if (row.hasLY && row.vsLYPct < 0)
      return { severity: "watch", text: `Below last year but recovering vs last week. Emerging trend — watch for a second consecutive week.` };
    return { severity: "watch", text: `Soft vs last week while ahead of last year. Recent dip — may normalize. Monitor before acting.` };
  }
  return { severity: "healthy", text: `Ahead of both comparison periods. Traffic and spend contributing positively.` };
};

interface PopupHourlyViewProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

const PopupHourlyView = ({ twDateLabel, lwDateLabel, lyDateLabel }: PopupHourlyViewProps) => {
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } = useAppSelector((s) => s.sales);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const hours = useMemo((): HourRow[] => {
    const buildMap = (src: typeof hourlySales) =>
      src.reduce(
        (acc: Record<number, { net: number; trans: number; qty: number }>, h) => {
          if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
          acc[h.hour].net += h.total_sales - h.total_tax;
          acc[h.hour].trans += h.transactions;
          acc[h.hour].qty += h.qty;
          return acc;
        },
        {},
      );

    const twMap = buildMap(hourlySales);
    const lwMap = buildMap(hourlySalesLastWeek);
    const lyMap = buildMap(hourlySalesLastYear);

    const allHours = Array.from(
      new Set([...Object.keys(twMap), ...Object.keys(lwMap), ...Object.keys(lyMap)].map(Number)),
    ).sort((a, b) => a - b);

    return allHours
      .map((h) => {
        const tw = twMap[h]?.net ?? 0;
        const lw = lwMap[h]?.net ?? 0;
        const ly = lyMap[h]?.net ?? 0;
        return {
          hour: h,
          tw,
          lw,
          ly,
          trans: twMap[h]?.trans ?? 0,
          lwTrans: lwMap[h]?.trans ?? 0,
          lyTrans: lyMap[h]?.trans ?? 0,
          qty: twMap[h]?.qty ?? 0,
          lwQty: lwMap[h]?.qty ?? 0,
          lyQty: lyMap[h]?.qty ?? 0,
          hasLW: lw > 0,
          hasLY: ly > 0,
          vsLWPct: lw ? ((tw - lw) / lw) * 100 : 0,
          vsLYPct: ly ? ((tw - ly) / ly) * 100 : 0,
        };
      })
      .sort((a, b) => {
        const rank = { critical: 0, watch: 1, healthy: 2 } as const;
        const rankDiff = rank[hourSeverity(a)] - rank[hourSeverity(b)];
        if (rankDiff !== 0) return rankDiff;
        const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
        const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
        return aPct - bPct;
      });
  }, [hourlySales, hourlySalesLastWeek, hourlySalesLastYear]);

  const critCount = hours.filter((h) => hourSeverity(h) === "critical").length;
  const watchCount = hours.filter((h) => hourSeverity(h) === "watch").length;
  const healthyCount = hours.filter((h) => hourSeverity(h) === "healthy").length;

  const visible = hours.filter((h) => {
    if (sevFilter === "critical") return hourSeverity(h) === "critical";
    if (sevFilter === "watch") return hourSeverity(h) === "watch";
    if (sevFilter === "healthy") return hourSeverity(h) === "healthy";
    return true;
  });

  const selected = selectedHour !== null ? hours.find((h) => h.hour === selectedHour) ?? null : null;
  const cta = selected ? getCta(selected) : null;

  const avgBasket = selected && selected.trans > 0 ? selected.tw / selected.trans : 0;
  const lwAvgBasket = selected && selected.lwTrans > 0 ? selected.lw / selected.lwTrans : 0;
  const lyAvgBasket = selected && selected.lyTrans > 0 ? selected.ly / selected.lyTrans : 0;

  if (!hours.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content/30 text-sm">
        No hourly data
      </div>
    );
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active) return "bg-white border border-gray-200 text-content/50 hover:border-gray-400";
    if (!sev) return "bg-[#1e2a4a] border-[#1e2a4a] text-white";
    const map: Record<Severity, string> = {
      critical: "bg-red-600 border-red-600 text-white",
      watch: "bg-amber-500 border-amber-500 text-white",
      healthy: "bg-emerald-600 border-emerald-600 text-white",
    };
    return map[sev];
  };

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="flex flex-col border-r border-gray-100" style={{ width: "40%" }}>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setSevFilter("all")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "all")}`}
          >
            All ({hours.length})
          </button>
          <button
            onClick={() => setSevFilter("critical")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "critical", "critical")}`}
          >
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Crit ({critCount})
          </button>
          <button
            onClick={() => setSevFilter("watch")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "watch", "watch")}`}
          >
            <ExclamationCircleIcon className="w-2.5 h-2.5" />
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter("healthy")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors border ${chipClass(sevFilter === "healthy", "healthy")}`}
          >
            <CheckCircleIcon className="w-2.5 h-2.5" />
            OK ({healthyCount})
          </button>
        </div>

        {/* Column header */}
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[9px] font-medium text-content/40 uppercase tracking-wide">
          Hours
        </div>

        {/* Signal list */}
        <div className="overflow-y-auto thin-scrollbar flex-1">
          {visible.map((r) => {
            const sev = hourSeverity(r);
            const isSel = selectedHour === r.hour;
            return (
              <button
                key={r.hour}
                onClick={() => setSelectedHour(isSel ? null : r.hour)}
                className={`flex items-center w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${
                  isSel ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
                }`}
              >
                <SeverityBadge severity={sev} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[11px] font-medium ${isSel ? "text-white" : "text-content"}`}
                  >
                    {ampm(r.hour)}
                  </div>
                  <div
                    className={`text-[8px] ${isSel ? "text-white/40" : "text-content/30"}`}
                  >
                    {formatHourRange(r.hour)}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-semibold flex-shrink-0 ${
                    isSel
                      ? r.vsLYPct >= 0
                        ? "text-emerald-300"
                        : "text-red-300"
                      : r.vsLYPct >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {r.hasLY ? formatPct(r.vsLYPct) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {selected ? (
          <>
            {/* Panel header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-baseline gap-2">
              <span className="text-[12px] font-semibold text-content">{ampm(selected.hour)}</span>
              <span className="text-[9px] text-content/30 italic">{twDateLabel}</span>
            </div>

            {/* Metrics */}
            <div className="px-4 py-1 flex-1 overflow-y-auto thin-scrollbar">
              {/* TY net */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">TY net sales</span>
                <span className="text-[12px] font-semibold text-content">
                  {formatCurrency2(selected.tw)}
                </span>
              </div>

              {/* ↳ vs LW */}
              <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-content/50">↳ vs last week</span>
                  <span className="text-[8px] text-content/30 italic">{lwDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-content/60">
                    {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selected.vsLWPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {selected.hasLW ? formatPct(selected.vsLWPct) : "—"}
                  </span>
                </div>
              </div>

              {/* ↳ vs LY */}
              <div className="flex items-start justify-between py-2 pl-3 border-b border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-content/50">↳ vs last year</span>
                  <span className="text-[8px] text-content/30 italic">{lyDateLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-content/60">
                    {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      selected.vsLYPct >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {selected.hasLY ? formatPct(selected.vsLYPct) : "—"}
                  </span>
                </div>
              </div>

              {/* Transactions */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">Transactions</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] font-medium text-content">
                    {selected.trans.toLocaleString()}
                  </span>
                  {selected.lyTrans > 0 && (
                    <span
                      className={`text-[10px] ${
                        selected.trans >= selected.lyTrans ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatPct(((selected.trans - selected.lyTrans) / selected.lyTrans) * 100)} vs
                      LY
                    </span>
                  )}
                </div>
              </div>

              {/* Avg basket */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">Avg basket</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] font-medium text-content">
                    {formatCurrency2(avgBasket)}
                  </span>
                  {lyAvgBasket > 0 && (
                    <span
                      className={`text-[10px] ${
                        avgBasket >= lyAvgBasket ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatPct(((avgBasket - lyAvgBasket) / lyAvgBasket) * 100)} vs LY
                    </span>
                  )}
                </div>
              </div>

              {/* Units */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[11px] text-content/70">Units sold</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[11px] font-medium text-content">
                    {selected.qty.toLocaleString()}
                  </span>
                  {selected.lyQty > 0 && (
                    <span
                      className={`text-[10px] ${
                        selected.qty >= selected.lyQty ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatPct(((selected.qty - selected.lyQty) / selected.lyQty) * 100)} vs LY
                    </span>
                  )}
                </div>
              </div>

              {lwAvgBasket > 0 && (
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <span className="text-[11px] text-content/70">Avg basket vs LW</span>
                  <span
                    className={`text-[11px] font-medium ${
                      avgBasket >= lwAvgBasket ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {formatPct(((avgBasket - lwAvgBasket) / lwAvgBasket) * 100)}
                  </span>
                </div>
              )}
            </div>

            {/* CTA insight strip */}
            {cta && (
              <div
                className={`mx-3 mb-3 mt-1 rounded-md p-2.5 flex items-start gap-2 ${
                  cta.severity === "critical"
                    ? "bg-orange-50 border border-orange-200"
                    : cta.severity === "watch"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-emerald-50 border border-emerald-200"
                }`}
              >
                {cta.severity === "critical" && (
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {cta.severity === "watch" && (
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                {cta.severity === "healthy" && (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-[10px] leading-relaxed ${
                    cta.severity === "critical"
                      ? "text-orange-900"
                      : cta.severity === "watch"
                      ? "text-amber-900"
                      : "text-emerald-900"
                  }`}
                >
                  {cta.text}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[11px] text-content/20">
            Select an hour
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupHourlyView;
