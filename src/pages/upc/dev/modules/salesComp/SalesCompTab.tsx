import React, { useMemo, useState, useCallback } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import type { UpcSalesComp } from "../../../../../interfaces";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

function rowTotal(row: UpcSalesComp): number {
  return DAYS.reduce((acc, d) => acc + (row[d] ?? 0), 0);
}

function sortWeeks(weeks: string[]): string[] {
  return [...weeks].sort((a, b) => a.localeCompare(b));
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

const SalesCompTab = () => {
  const ctx = useUpcDevCtx();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [heatMode, setHeatMode] = useState<HeatMode>("global");

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

  const upcCodes = useMemo(
    () => [...new Set(filtered.map((r) => r.product_code))],
    [filtered],
  );

  const upcStats = useMemo(() => {
    return upcCodes.map((code) => {
      const rows = filtered.filter((r) => r.product_code === code);
      const desc = rows[0]?.description ?? code;
      const sortedWeeks = sortWeeks(rows.map((r) => r.week));
      const weekCount = rows.length;

      const dayAvgs = DAYS.map((d) =>
        rows.reduce((acc, r) => acc + (r[d] ?? 0), 0) / (weekCount || 1),
      );

      const peakIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
      const periodTotal = rows.reduce((acc, r) => acc + rowTotal(r), 0);

      const weekTotals = sortedWeeks.map(
        (wk) => rowTotal(rows.find((r) => r.week === wk)!),
      );

      // Compare most recent week to period average — more stable than last-vs-prior
      let wowPct: number | null = null;
      if (weekTotals.length >= 2) {
        const lw = weekTotals[weekTotals.length - 1];
        const avg = periodTotal / weekTotals.length;
        wowPct = avg === 0 ? null : ((lw - avg) / avg) * 100;
      }

      const weekRows = sortedWeeks.map((wk) => ({
        week: wk,
        row: rows.find((r) => r.week === wk)!,
      }));

      const rowMax = Math.max(...dayAvgs, 1);

      return { code, desc, dayAvgs, peakIdx, periodTotal, wowPct, weekTotals, weekRows, rowMax };
    });
  }, [upcCodes, filtered]);

  const heatMax = useMemo(
    () => Math.max(...upcStats.flatMap((u) => u.dayAvgs), 1),
    [upcStats],
  );

  const dayTotals = useMemo(
    () => DAYS.map((_, di) => upcStats.reduce((acc, u) => acc + u.dayAvgs[di], 0)),
    [upcStats],
  );

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
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
        <span className="text-[9px] uppercase tracking-wide text-content/40 font-semibold">Heat scale</span>
        <div className="flex rounded overflow-hidden border border-gray-200">
          {(["global", "per-item"] as HeatMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setHeatMode(mode)}
              className={`px-2 py-0.5 text-[9px] font-medium transition-colors ${
                heatMode === mode
                  ? "bg-[#1e2a4a] text-white"
                  : "bg-white text-content/50 hover:text-content/70"
              }`}
            >
              {mode === "global" ? "Global" : "Per item"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 24 }} />
            <col style={{ width: 170 }} />
            {DAYS.map((_, i) => <col key={i} style={{ width: 58 }} />)}
            <col style={{ width: 60 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 64 }} />
          </colgroup>
          <thead>
            <tr className="sticky top-0 bg-gray-50 z-10">
              <th />
              <th className="px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40">Product</th>
              {DAY_SHORT.map((d) => (
                <th key={d} className="py-2 pr-1.5 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">{d}</th>
              ))}
              <th className="py-2 pr-1.5 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Trend</th>
              <th className="py-2 pr-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">Total</th>
              <th className="py-2 pr-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40">WoW</th>
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
                      <div className="text-[10px] font-medium text-content truncate leading-tight">{u.desc}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] text-content/35 font-mono">{u.code}</span>
                        <span
                          className="text-[8px] font-semibold px-1 py-px rounded"
                          style={{ background: "#e6f1fb", color: "#185fa5" }}
                        >
                          {DAY_SHORT[u.peakIdx]}
                        </span>
                      </div>
                    </td>
                    {u.dayAvgs.map((val, di) => {
                      const hs = heatStyle(val, maxForRow);
                      return (
                        <td
                          key={di}
                          className="py-1.5 pr-1.5 text-right tabular-nums text-[10px]"
                          style={{ background: hs.bg, color: hs.color }}
                        >
                          {val > 0 ? fmtSmall(val) : "—"}
                        </td>
                      );
                    })}
                    <td className="py-1.5 pr-1.5">
                      <div className="flex justify-end">
                        <Sparkline weekTotals={u.weekTotals} />
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-[10px] font-semibold text-content">
                      {fmtSmall(u.periodTotal)}
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      {u.wowPct === null ? (
                        <span className="text-[8px] text-content/30">—</span>
                      ) : u.wowPct > 1 ? (
                        <span className="text-[8px] font-semibold px-1 py-px rounded" style={{ background: "#eaf3de", color: "#3b6d11" }}>
                          ▲{u.wowPct.toFixed(1)}%
                        </span>
                      ) : u.wowPct < -1 ? (
                        <span className="text-[8px] font-semibold px-1 py-px rounded" style={{ background: "#fcebeb", color: "#a32d2d" }}>
                          ▼{Math.abs(u.wowPct).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[8px] text-content/40 border border-gray-200 px-1 py-px rounded">flat</span>
                      )}
                    </td>
                  </tr>

                  {isOpen && u.weekRows.map(({ week, row }) => {
                    const wt = rowTotal(row);
                    return (
                      <tr key={`${u.code}-${week}`} className="border-b border-gray-50 bg-blue-50/20">
                        <td />
                        <td className="pl-5 pr-2 py-1 text-[9px] text-content/50 truncate">{week}</td>
                        {DAYS.map((d) => {
                          const val = row[d] ?? 0;
                          return (
                            <td key={d} className="py-1 pr-1.5 text-right tabular-nums text-[9px] text-content/70">
                              {val > 0 ? fmt(val) : "—"}
                            </td>
                          );
                        })}
                        <td />
                        <td className="py-1 pr-2 text-right tabular-nums text-[9px] font-semibold text-content/70">
                          {fmt(wt)}
                        </td>
                        <td />
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Day totals footer */}
            <tr className="sticky bottom-0 bg-gray-50 border-t border-gray-200">
              <td />
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-content/50">Day avg totals</td>
              {dayTotals.map((val, di) => (
                <td key={di} className="py-1.5 pr-1.5 text-right tabular-nums text-[10px] font-semibold text-content/70">
                  {fmtSmall(Math.round(val))}
                </td>
              ))}
              <td />
              <td className="py-1.5 pr-2 text-right tabular-nums text-[10px] font-semibold text-content">
                {fmtSmall(Math.round(dayTotals.reduce((a, b) => a + b, 0)))}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesCompTab;
