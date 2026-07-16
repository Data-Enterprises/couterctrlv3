import React, { useMemo, useState, useCallback } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { addDays } from "../../../../../utils";
import { computeUpcSalesCompStats, rowTotal, DAYS, DAY_SHORT } from "./salesCompStats";

const HEAT: { bg: string; color: string }[] = [
  { bg: "transparent", color: "#9ca3af" },
  { bg: "#e6f1fb", color: "#185fa5" },
  { bg: "#b5d4f4", color: "#0c447c" },
  { bg: "#85b7eb", color: "#0c447c" },
  { bg: "#378add", color: "#fff" },
  { bg: "#185fa5", color: "#fff" },
];

function heatStyle(value: number, max: number) {
  if (max === 0 || value === 0) return HEAT[0];
  const r = value / max;
  if (r < 0.15) return HEAT[1];
  if (r < 0.35) return HEAT[2];
  if (r < 0.55) return HEAT[3];
  if (r < 0.75) return HEAT[4];
  return HEAT[5];
}

function fmtWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = addDays(weekStart, 6);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} - ${endStr}`;
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtSmall(n: number): string {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function Sparkline({ weekTotals }: { weekTotals: number[] }) {
  const max = Math.max(...weekTotals, 1);
  const w = 48;
  const h = 18;
  const count = weekTotals.length;
  const barW = Math.max(2, Math.floor((w - (count - 1)) / count));
  const gap = count > 1 ? (w - barW * count) / (count - 1) : 0;

  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      {weekTotals.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * (h - 2)));
        const x = i * (barW + gap);
        return (
          <rect
            key={i}
            x={x}
            y={h - barH}
            width={barW}
            height={barH}
            rx={1}
            fill="#378add"
            opacity={0.6 + (i / count) * 0.4}
          />
        );
      })}
    </svg>
  );
}

type HeatMode = "global" | "per-item";
type CompareMode = "ty-only" | "ty-vs-ly" | "yoy-delta";

const COMPARE_MODES: { key: CompareMode; label: string }[] = [
  { key: "ty-only", label: "TY only" },
  { key: "ty-vs-ly", label: "TY vs LY" },
  { key: "yoy-delta", label: "YoY delta" },
];

const SalesCompTab = () => {
  const ctx = useUpcDevCtx();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [heatMode, setHeatMode] = useState<HeatMode>("global");
  const [compareMode, setCompareMode] = useState<CompareMode>("ty-vs-ly");

  const toggle = useCallback((code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesComp.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesComp;
  }, [ctx.salesComp, ctx.selectedUpcs]);

  const filteredLY = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.salesCompLY.filter((s) => ctx.selectedUpcs.includes(s.product_code))
      : ctx.salesCompLY;
  }, [ctx.salesCompLY, ctx.selectedUpcs]);

  const upcCodes = useMemo(
    () => [...new Set(filtered.map((r) => r.product_code))],
    [filtered],
  );

  const upcStats = useMemo(() => {
    return computeUpcSalesCompStats(upcCodes, filtered, filteredLY, ctx.endDate).map((s) => {
      const rowMax = Math.max(...s.dayAvgs, 1);
      const dayDeltaPcts = DAYS.map((_, di) =>
        s.hasLY && s.lyDayAvgs[di] > 0 ? ((s.dayAvgs[di] - s.lyDayAvgs[di]) / s.lyDayAvgs[di]) * 100 : null,
      );
      return { ...s, rowMax, dayDeltaPcts };
    });
  }, [upcCodes, filtered, filteredLY, ctx.endDate]);

  const heatMax = useMemo(() => {
    const tyMax = upcStats.flatMap((u) => u.dayAvgs);
    const lyMax = compareMode === "ty-vs-ly" ? upcStats.flatMap((u) => (u.hasLY ? u.lyDayAvgs : [])) : [];
    return Math.max(...tyMax, ...lyMax, 1);
  }, [upcStats, compareMode]);

  const dayTotals = useMemo(
    () => DAYS.map((_, di) => upcStats.reduce((acc, u) => acc + u.dayAvgs[di], 0)),
    [upcStats],
  );

  const dayTotalsLY = useMemo(
    () => DAYS.map((_, di) => upcStats.reduce((acc, u) => acc + (u.hasLY ? u.lyDayAvgs[di] : 0), 0)),
    [upcStats],
  );

  const periodTotalAll = useMemo(() => upcStats.reduce((acc, u) => acc + u.periodTotal, 0), [upcStats]);
  const periodTotalAllLY = useMemo(
    () => upcStats.reduce((acc, u) => acc + (u.hasLY ? u.lyPeriodTotal : 0), 0),
    [upcStats],
  );
  const footerVsLYPct = periodTotalAllLY > 0 ? ((periodTotalAll - periodTotalAllLY) / periodTotalAllLY) * 100 : null;

  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        No sales comparison data
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-100 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-content font-semibold">Compare</span>
          <div className="flex rounded overflow-hidden border border-gray-200">
            {COMPARE_MODES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCompareMode(key)}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  compareMode === key
                    ? "bg-[#1e2a4a] text-custom-white"
                    : "bg-custom-white text-content/50 hover:text-content/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-content font-semibold">Heat scale</span>
          <div className="flex rounded overflow-hidden border border-gray-200">
            {(["global", "per-item"] as HeatMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setHeatMode(mode)}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  heatMode === mode
                    ? "bg-[#1e2a4a] text-custom-white"
                    : "bg-custom-white text-content/50 hover:text-content/70"
                }`}
              >
                {mode === "global" ? "Global" : "Per item"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 24 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 60 }} />
            {DAYS.map((_, i) => <col key={i} style={{ width: 58 }} />)}
          </colgroup>
          <thead>
            <tr className="sticky top-0 bg-gray-50 z-10">
              <th />
              <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-content">Product</th>
              <th className="py-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content">Total</th>
              <th className="py-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content">vs LY</th>
              <th className="py-2 pr-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content">WoW</th>
              <th className="py-2 pr-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-content">Trend</th>
              {DAY_SHORT.map((d) => (
                <th key={d} className="py-2 pr-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-content">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcStats.map((u) => {
              const isOpen = expanded.has(u.code);
              const maxForRow = heatMode === "global" ? heatMax : u.rowMax;
              return (
                <React.Fragment key={u.code}>
                  <tr
                    className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer"
                    onClick={() => toggle(u.code)}
                  >
                    <td className="pl-2">
                      {isOpen
                        ? <ChevronDownIcon className="w-3 h-3 text-content/40" />
                        : <ChevronRightIcon className="w-3 h-3 text-content/30" />}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-[12px] font-medium text-content truncate leading-tight">{u.desc}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[12px] text-content font-mono">{u.code}</span>
                        <span
                          className="text-[12px] font-semibold px-1 py-px rounded"
                          style={{ background: "#e6f1fb", color: "#185fa5" }}
                        >
                          {DAY_SHORT[u.peakIdx]}
                        </span>
                        {u.peakShifted && (
                          <span className="text-[12px] font-medium text-severity_critical_text">
                            was {DAY_SHORT[u.lyPeakIdx]} LY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-[12px] font-semibold text-content">
                      {fmtSmall(u.periodTotal)}
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      {u.vsLYPct === null ? (
                        <span className="text-[12px] text-content/30">—</span>
                      ) : (
                        <span
                          className={`text-[12px] font-semibold px-1 py-px rounded ${
                            u.vsLYPct >= 0 ? "bg-severity_healthy_bg text-severity_healthy_text" : "bg-severity_critical_bg text-severity_critical_text"
                          }`}
                        >
                          {u.vsLYPct >= 0 ? "▲" : "▼"}{Math.abs(u.vsLYPct).toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      {u.wowPct === null ? (
                        <span className="text-[12px] text-content/30">—</span>
                      ) : u.wowPct > 1 ? (
                        <span className="text-[12px] font-semibold px-1 py-px rounded" style={{ background: "#eaf3de", color: "#3b6d11" }}>
                          ▲{u.wowPct.toFixed(2)}%
                        </span>
                      ) : u.wowPct < -1 ? (
                        <span className="text-[12px] font-semibold px-1 py-px rounded" style={{ background: "#fcebeb", color: "#a32d2d" }}>
                          ▼{Math.abs(u.wowPct).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-[12px] text-content/40 border border-gray-200 px-1 py-px rounded">flat</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-1.5">
                      <div className="flex justify-end">
                        <Sparkline weekTotals={u.weekTotals} />
                      </div>
                    </td>
                    {compareMode === "yoy-delta"
                      ? u.dayDeltaPcts.map((pct, di) => (
                          <td key={di} className="py-1.5 pr-1.5 text-right tabular-nums text-[12px]">
                            {pct === null ? (
                              <span className="text-content/30">—</span>
                            ) : (
                              <span className={pct >= 0 ? "text-severity_healthy_text font-medium" : "text-severity_critical_text font-medium"}>
                                {pct >= 0 ? "▲" : "▼"}{Math.abs(pct).toFixed(0)}%
                              </span>
                            )}
                          </td>
                        ))
                      : u.dayAvgs.map((val, di) => {
                          const hs = heatStyle(val, maxForRow);
                          return (
                            <td
                              key={di}
                              className="py-1.5 pr-1.5 text-right tabular-nums text-[12px]"
                              style={{ background: hs.bg, color: hs.color }}
                            >
                              {val > 0 ? fmtSmall(val) : "—"}
                            </td>
                          );
                        })}
                  </tr>

                  {isOpen && compareMode === "ty-vs-ly" && u.hasLY && (
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td />
                      <td className="pl-5 pr-2 py-1 text-[12px] text-content italic text-right">LY (same weeks)</td>
                      <td className="py-1 pr-2 text-right tabular-nums text-[12px] text-content">
                        {fmtSmall(u.lyPeriodTotal)}
                      </td>
                      <td />
                      <td />
                      <td />
                      {u.lyDayAvgs.map((val, di) => {
                        const hs = heatMode === "per-item" ? heatStyle(val, u.rowMax) : heatStyle(val, heatMax);
                        return (
                          <td
                            key={di}
                            className="py-1 pr-1.5 text-right tabular-nums text-[12px]"
                            style={{ background: hs.bg, color: hs.color, opacity: 0.85 }}
                          >
                            {val > 0 ? fmtSmall(val) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {isOpen && u.weekRows.map(({ week, row }) => {
                    const wt = rowTotal(row);
                    return (
                      <tr key={`${u.code}-${week}`} className="border-b border-gray-50 bg-blue-50/20">
                        <td />
                        <td className="pl-5 pr-2 py-1 text-[11px] text-content truncate text-right">{fmtWeekRange(week)}</td>
                        <td className="py-1 pr-2 text-right tabular-nums text-[11px] font-semibold text-content">
                          {fmt(wt)}
                        </td>
                        <td />
                        <td />
                        <td />
                        {DAYS.map((d) => {
                          const val = row[d] ?? 0;
                          return (
                            <td key={d} className="py-1 pr-1.5 text-right tabular-nums text-[11px] text-content">
                              {val > 0 ? fmt(val) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Day totals footer */}
            <tr className="sticky bottom-0 bg-gray-50 border-t border-gray-200">
              <td />
              <td className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-content">Day avg totals</td>
              <td className="py-1.5 pr-2 text-right tabular-nums text-[10px] font-semibold text-content">
                {fmtSmall(Math.round(dayTotals.reduce((a, b) => a + b, 0)))}
              </td>
              <td className="py-1.5 pr-2 text-right">
                {footerVsLYPct === null ? (
                  <span className="text-[10px] text-content/30">—</span>
                ) : (
                  <span className={`text-[10px] font-semibold ${footerVsLYPct >= 0 ? "text-severity_healthy_text" : "text-severity_critical_text"}`}>
                    {footerVsLYPct >= 0 ? "▲" : "▼"}{Math.abs(footerVsLYPct).toFixed(0)}%
                  </span>
                )}
              </td>
              <td />
              <td />
              {dayTotals.map((val, di) => (
                <td key={di} className="py-1.5 pr-1.5 text-right tabular-nums text-[10px] font-semibold text-content">
                  {fmtSmall(Math.round(val))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-[10px] text-content/40 italic flex-shrink-0">
        {dayTotalsLY.some((v) => v > 0)
          ? "LY rows show same calendar weeks, prior year. Peak day shift shown in red when changed vs LY."
          : "No LY data available for the selected UPCs — showing TY only."}
      </div>
    </div>
  );
};

export default SalesCompTab;
