import { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setHourlyThreshold } from "../../../features/salesLedgerSlice";
import { formatCurrency2 } from "../../../utils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import { SEVERITY_CONFIG } from "./tierColumnUtils";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

const formatHourRange = (h: number) =>
  `${ampm(h)} – ${ampm(h + 1 <= 23 ? h + 1 : 0)}`;

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

const pillClass = (pct: number | null, threshold: number) => {
  if (pct === null) return "bg-gray-100 text-gray-500";
  if (pct < -threshold) return "bg-red-100 text-red-800";
  if (pct < 0) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
};

const hourSeverity = (r: HourRow, threshold: number): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
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
      <ExclamationTriangleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "watch" && (
      <ExclamationCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
    {severity === "healthy" && (
      <CheckCircleIcon
        className="w-3 h-3"
        style={{ color: BADGE_COLOR[severity] }}
      />
    )}
  </div>
);

const getCta = (
  row: HourRow,
  threshold: number,
): { text: string; severity: Severity } => {
  const sev = hourSeverity(row, threshold);
  const primaryPeriod = row.hasLY ? "LY" : "LW";
  const primaryPct = row.hasLY ? row.vsLYPct : row.vsLWPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(1)}%`;
  const avgBasket = row.trans > 0 ? row.tw / row.trans : 0;
  const refTrans = row.hasLY ? row.lyTrans : row.lwTrans;
  const refBasket = row.hasLY
    ? row.lyTrans > 0
      ? row.ly / row.lyTrans
      : 0
    : row.lwTrans > 0
      ? row.lw / row.lwTrans
      : 0;

  if (sev === "critical") {
    const transDrop =
      refTrans > 0 ? ((row.trans - refTrans) / refTrans) * 100 : null;
    const basketDiff =
      refBasket > 0 ? ((avgBasket - refBasket) / refBasket) * 100 : null;
    const isTrafficLoss = transDrop !== null && transDrop < -5;
    const isSpendDrop = basketDiff !== null && basketDiff < -3;
    if (isTrafficLoss && !isSpendDrop)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — traffic loss is the driver. Transactions down ${Math.abs(transDrop!).toFixed(1)}% while basket is holding. Check staffing and flow.`,
      };
    if (isSpendDrop && !isTrafficLoss)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — spend compression is the driver. Traffic held but avg basket dropped. Look at mix shift or promoted item performance.`,
      };
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold. Both traffic and spend show pressure. Investigate staffing, promotions, and item availability.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct >= 0
          ? ` Recovering vs LW — may be stabilizing.`
          : ` LW also soft — monitor before escalating.`
        : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}`,
    };
  }
  const secondaryHealthNote =
    row.hasLY && row.hasLW
      ? row.vsLWPct < 0
        ? ` LW is softer — watch for a developing trend.`
        : ` LW also positive.`
      : "";
  return {
    severity: "healthy",
    text: `At or above ${primaryPeriod}.${secondaryHealthNote} Traffic and spend contributing positively.`,
  };
};

interface PopupHourlyViewProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

const PopupHourlyView = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: PopupHourlyViewProps) => {
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } =
    useAppSelector((s) => s.sales);
  const threshold = useAppSelector((s) => s.salesLedger.hourlyThreshold);
  const dispatch = useAppDispatch();
  const [thresholdInput, setThresholdInput] = useState(String(threshold));
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const hours = useMemo((): HourRow[] => {
    const buildMap = (src: typeof hourlySales) =>
      src.reduce(
        (
          acc: Record<number, { net: number; trans: number; qty: number }>,
          h,
        ) => {
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
      new Set(
        [
          ...Object.keys(twMap),
          ...Object.keys(lwMap),
          ...Object.keys(lyMap),
        ].map(Number),
      ),
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
        const rankDiff =
          rank[hourSeverity(a, threshold)] - rank[hourSeverity(b, threshold)];
        if (rankDiff !== 0) return rankDiff;
        const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
        const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
        return aPct - bPct;
      });
  }, [hourlySales, hourlySalesLastWeek, hourlySalesLastYear]);

  const critCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "critical",
  ).length;
  const watchCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "watch",
  ).length;
  const healthyCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "healthy",
  ).length;

  const visible = hours.filter((h) => {
    if (sevFilter === "critical")
      return hourSeverity(h, threshold) === "critical";
    if (sevFilter === "watch") return hourSeverity(h, threshold) === "watch";
    if (sevFilter === "healthy")
      return hourSeverity(h, threshold) === "healthy";
    return true;
  });

  const selected =
    selectedHour !== null
      ? (hours.find((h) => h.hour === selectedHour) ?? null)
      : null;
  const cta = selected ? getCta(selected, threshold) : null;

  const avgBasket =
    selected && selected.trans > 0 ? selected.tw / selected.trans : 0;
  const lwAvgBasket =
    selected && selected.lwTrans > 0 ? selected.lw / selected.lwTrans : 0;
  const lyAvgBasket =
    selected && selected.lyTrans > 0 ? selected.ly / selected.lyTrans : 0;

  if (!hours.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content/45 text-sm">
        No hourly data
      </div>
    );
  }

  const chipClass = (active: boolean, sev?: Severity) => {
    if (!active)
      return "bg-white border border-gray-200 text-content/65 hover:border-gray-400";
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
      <div
        className="flex flex-col border-r border-gray-100"
        style={{ width: "40%" }}
      >
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-100">
          <button
            onClick={() => setSevFilter("all")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "all")}`}
          >
            All ({hours.length})
          </button>
          <button
            onClick={() => setSevFilter("critical")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "critical", "critical")}`}
          >
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Crit ({critCount})
          </button>
          <button
            onClick={() => setSevFilter("watch")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "watch", "watch")}`}
          >
            <ExclamationCircleIcon className="w-2.5 h-2.5" />
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter("healthy")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(sevFilter === "healthy", "healthy")}`}
          >
            <CheckCircleIcon className="w-2.5 h-2.5" />
            OK ({healthyCount})
          </button>
        </div>

        {/* Signal list */}
        <div className="overflow-y-auto thin-scrollbar flex-1">
          {visible.map((r) => {
            const sev = hourSeverity(r, threshold);
            const isSel = selectedHour === r.hour;
            return (
              <button
                key={r.hour}
                onClick={() => setSelectedHour(isSel ? null : r.hour)}
                className={`w-full px-3 py-2 border-b border-gray-100 last:border-0 gap-2 text-left transition-colors ${isSel ? "bg-white" : "hover:bg-gray-50"}`}
                style={isSel ? { boxShadow: `inset 0 0 8px ${SEVERITY_CONFIG[sev].shadowColor}` } : undefined}
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={sev} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-content">
                      {ampm(r.hour)}
                    </div>
                    <div
                      className={`text-[9px] ${isSel ? "text-content/50" : "text-content/45"}`}
                    >
                      {formatHourRange(r.hour)}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-shrink-0">
                    <span className="text-[12px] font-semibold text-content">
                      {formatCurrency2(r.tw)}
                    </span>
                    <span className="text-[10px] text-content/60">
                      {r.qty.toLocaleString()} u
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1 justify-end">
                  {r.hasLW && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.vsLWPct, threshold)}`}
                    >
                      LW {formatPct(r.vsLWPct)}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pillClass(r.hasLY ? r.vsLYPct : null, threshold)}`}
                  >
                    LY {r.hasLY ? formatPct(r.vsLYPct) : "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header row: selected hour */}
        {selected && (
          <div className="flex items-baseline gap-1.5 px-3 py-1.5 bg-gray-100 border-b border-gray-100">
            <span className="text-[12px] font-semibold text-content">{ampm(selected.hour)}</span>
            <span className="text-[10px] text-content/45 italic flex-shrink-0">{formatHourRange(selected.hour)} · {twDateLabel}</span>
          </div>
        )}

        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              {/* 3-col net sales KPI grid */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">
                    TY
                  </div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">
                    {twDateLabel}
                  </div>
                  <div className="text-[13px] font-semibold text-content mt-0.5">
                    {formatCurrency2(selected.tw)}
                  </div>
                  <div className="text-[11px] text-content/60 mt-0.5">
                    {selected.qty.toLocaleString()} u
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">
                    LW
                  </div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">
                    {lwDateLabel}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">
                      {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                    </span>
                    {selected.hasLW && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLWPct, threshold)}`}
                      >
                        {formatPct(selected.vsLWPct)}
                      </span>
                    )}
                  </div>
                  {selected.lwQty > 0 && (
                    <div className="text-[11px] text-content/60 mt-0.5">
                      {selected.lwQty.toLocaleString()} u
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">
                    LY
                  </div>
                  <div className="text-[8px] italic text-content/55 mt-0.5">
                    {lyDateLabel}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[13px] font-semibold text-content">
                      {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                    </span>
                    {selected.hasLY && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(selected.vsLYPct, threshold)}`}
                      >
                        {formatPct(selected.vsLYPct)}
                      </span>
                    )}
                  </div>
                  {selected.lyQty > 0 && (
                    <div className="text-[11px] text-content/60 mt-0.5">
                      {selected.lyQty.toLocaleString()} u
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions — 3-col */}
              <div className="border-b border-gray-100">
                <div className="px-4 py-1.5 bg-gray-100 text-[10px] font-medium uppercase tracking-wide text-content/55">
                  Transactions
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-4 py-2.5">
                    <div className="text-[13px] font-semibold text-content">
                      {selected.trans.toLocaleString()}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {selected.lwTrans > 0
                          ? selected.lwTrans.toLocaleString()
                          : "—"}
                      </span>
                      {selected.lwTrans > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((selected.trans - selected.lwTrans) / selected.lwTrans) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((selected.trans - selected.lwTrans) /
                              selected.lwTrans) *
                              100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {selected.lyTrans > 0
                          ? selected.lyTrans.toLocaleString()
                          : "—"}
                      </span>
                      {selected.lyTrans > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((selected.trans - selected.lyTrans) / selected.lyTrans) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((selected.trans - selected.lyTrans) /
                              selected.lyTrans) *
                              100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Avg basket — 3-col */}
              <div className="border-b border-gray-100">
                <div className="px-4 py-1.5 bg-gray-100 text-[10px] font-medium uppercase tracking-wide text-content/55">
                  Avg basket
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-4 py-2.5">
                    <div className="text-[13px] font-semibold text-content">
                      {formatCurrency2(avgBasket)}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {lwAvgBasket > 0 ? formatCurrency2(lwAvgBasket) : "—"}
                      </span>
                      {lwAvgBasket > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((avgBasket - lwAvgBasket) / lwAvgBasket) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((avgBasket - lwAvgBasket) / lwAvgBasket) * 100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {lyAvgBasket > 0 ? formatCurrency2(lyAvgBasket) : "—"}
                      </span>
                      {lyAvgBasket > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((avgBasket - lyAvgBasket) / lyAvgBasket) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((avgBasket - lyAvgBasket) / lyAvgBasket) * 100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA insight strip */}
            {cta && (
              <div
                className={`mx-3 mb-3 mt-1 rounded-md p-2.5 flex items-start gap-2 ${cta.severity === "critical" ? "bg-orange-50 border border-orange-200" : cta.severity === "watch" ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}
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
                  className={`text-[11px] leading-relaxed ${cta.severity === "critical" ? "text-orange-900" : cta.severity === "watch" ? "text-amber-900" : "text-emerald-900"}`}
                >
                  {cta.text}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content/35">
            Select an hour
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupHourlyView;
