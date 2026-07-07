import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";

const HEAT: { bg: string; color: string }[] = [
  { bg: "transparent", color: "#9ca3af" },
  { bg: "#e6f1fb", color: "#0c447c" },
  { bg: "#b5d4f4", color: "#0c447c" },
  { bg: "#85b7eb", color: "#042c53" },
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

function parseDateLocal(dateStr: string): Date {
  // MM/DD/YYYY
  const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]));
  // YYYY-MM-DD
  const ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  return new Date(dateStr);
}

function toYMD(dateStr: string): string {
  const d = parseDateLocal(dateStr);
  if (isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtColDate(dateStr: string): { dow: string; date: string } {
  const d = parseDateLocal(dateStr);
  if (isNaN(d.getTime())) return { dow: "—", date: "—" };
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: `${d.getMonth() + 1}/${d.getDate()}`,
  };
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

type ViewMode = "forecast" | "history";

const VIEW_OPTIONS: [ViewMode, string][] = [
  ["forecast", "7-day forecast"],
  ["history", "Historical"],
];

const ForecastTab = () => {
  const ctx = useUpcDevCtx();
  const [viewMode, setViewMode] = useState<ViewMode>("forecast");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {}, []);

  const filtered = useMemo(() => {
    return ctx.selectedUpcs.length > 0
      ? ctx.forecastQtyData.filter((f) => ctx.selectedUpcs.includes(f.product_code))
      : ctx.forecastQtyData;
  }, [ctx.forecastQtyData, ctx.selectedUpcs]);

  const dateCols = useMemo(() => {
    if (!filtered.length) return [];
    const source =
      viewMode === "forecast"
        ? filtered[0].data.forecast.slice(0, 7)
        : filtered[0].data.history.slice(-7);
    return source.map((p) => p.date);
  }, [filtered, viewMode]);

  const rows = useMemo(() => {
    return filtered.map((item) => {
      const source =
        viewMode === "forecast"
          ? item.data.forecast.slice(0, 7)
          : item.data.history.slice(-7);

      const dayMap = new Map(source.map((p) => [p.date, p.value]));
      const dayCells = dateCols.map((d) => dayMap.get(d) ?? 0);
      const total = dayCells.reduce((a, b) => a + b, 0);
      const activeDayCells = dayCells.filter((v) => v > 0);
      const forecastAvgDay = activeDayCells.length > 0 ? total / activeDayCells.length : 0;
      const peakDayIdx = dayCells.indexOf(Math.max(...dayCells));
      const peakDayLabel = dateCols[peakDayIdx]
        ? parseDateLocal(dateCols[peakDayIdx]).toLocaleDateString("en-US", { weekday: "short" })
        : "—";

      const prices = item.data.metrics.prices as { price: string; qty: number }[];
      const sortedPrices = [...prices].sort((a, b) => b.qty - a.qty);
      const topPrice = sortedPrices.length > 0 ? sortedPrices[0].price : null;

      return {
        code: item.product_code,
        desc: item.data.metrics.description,
        dayCells,
        total,
        forecastAvgDay,
        peakDayLabel,
        topPrice,
        histAvgDaily: item.data.metrics.avg_daily_qty,
        daysActive: item.data.metrics.days_active,
        allPrices: sortedPrices,
      };
    });
  }, [filtered, dateCols, viewMode]);

  const heatMax = useMemo(
    () => Math.max(...rows.flatMap((r) => r.dayCells), 1),
    [rows],
  );

  const dayTotals = useMemo(
    () => dateCols.map((_, di) => rows.reduce((acc, r) => acc + r.dayCells[di], 0)),
    [rows, dateCols],
  );

  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  if (ctx.forecastLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/40">
        Loading forecast…
      </div>
    );
  }

  if (!ctx.forecastLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        Navigate here to load forecast data
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/30">
        No forecast data
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
        <span className="text-[9px] uppercase tracking-wide text-content/40 font-semibold">View</span>
        <div className="flex rounded overflow-hidden border border-gray-200">
          {VIEW_OPTIONS.map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 text-[9px] font-medium transition-colors ${
                viewMode === mode
                  ? "bg-[#1e2a4a] text-white"
                  : "bg-white text-content/50 hover:text-content/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="border-collapse" style={{ tableLayout: "auto", minWidth: "100%" }}>
          <thead>
            <tr className="sticky top-0 bg-gray-50 z-10">
              <th
                className="px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap"
                style={{ minWidth: 150 }}
              >
                Product
              </th>
              {dateCols.map((d) => {
                const { dow, date } = fmtColDate(d);
                const isToday = toYMD(d) === today;
                return (
                  <th
                    key={d}
                    className="py-2 px-1 text-right text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{
                      minWidth: 52,
                      color: isToday ? "#185fa5" : undefined,
                      background: isToday ? "#e6f1fb" : undefined,
                    }}
                  >
                    {dow}<br />{date}
                  </th>
                );
              })}
              <th
                className="py-2 px-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap"
                style={{ minWidth: 54 }}
              >
                Peak day
              </th>
              <th
                className="py-2 px-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap"
                style={{ minWidth: 56 }}
              >
                Avg / day
              </th>
              <th
                className="py-2 px-2 text-right text-[9px] font-semibold uppercase tracking-wide text-content/40 whitespace-nowrap"
                style={{ minWidth: 66 }}
              >
                {viewMode === "forecast" ? "7-day total" : "Period total"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expanded.has(row.code);
              const colSpanAll = 7 + 4; // 7 day cols + product + peak day + avg/day + total
              const priceTotal = row.allPrices.reduce((a, b) => a + b.qty, 0);
              return (
                <React.Fragment key={row.code}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                    onClick={() => toggle(row.code)}
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-start gap-1">
                        <span className="mt-0.5 flex-shrink-0 text-content/30">
                          {isExpanded
                            ? <ChevronDownIcon className="h-3 w-3" />
                            : <ChevronRightIcon className="h-3 w-3" />}
                        </span>
                        <div>
                          <div
                            className="text-[10px] font-medium text-content truncate"
                            style={{ maxWidth: 136 }}
                          >
                            {row.desc}
                          </div>
                          <div className="text-[8px] text-content/35 font-mono mt-0.5">{row.code}</div>
                        </div>
                      </div>
                    </td>
                    {row.dayCells.map((val, di) => {
                      const hs = heatStyle(val, heatMax);
                      const isToday = toYMD(dateCols[di]) === today;
                      return (
                        <td
                          key={di}
                          className="py-1.5 px-1 text-right tabular-nums text-[10px]"
                          style={{
                            background: val > 0 ? hs.bg : isToday ? "#f0f6fd" : undefined,
                            color: val > 0 ? hs.color : "#d1d5db",
                          }}
                        >
                          {val > 0 ? fmtNum(val) : "—"}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-right">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-px rounded"
                        style={{ background: "#e6f1fb", color: "#185fa5" }}
                      >
                        {row.peakDayLabel}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-[9px] text-content/60">
                      {row.forecastAvgDay.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-[10px] font-semibold text-content">
                      {fmtNum(row.total)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-gray-200">
                      <td colSpan={colSpanAll} className="p-0">
                        <div style={{ background: "#f4f6f9" }}>
                          {/* Stat pills */}
                          <div className="flex gap-5 px-3.5 pt-2.5 pb-2">
                            <div className="flex flex-col gap-px">
                              <span className="text-[7.5px] font-semibold uppercase tracking-wide text-content/40">Top price</span>
                              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#185fa5" }}>
                                {row.topPrice ? `$${Number(row.topPrice).toFixed(2)}` : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-px">
                              <span className="text-[7.5px] font-semibold uppercase tracking-wide text-content/40">Hist avg / day</span>
                              <span className="text-[11px] font-semibold tabular-nums text-content">{row.histAvgDaily.toFixed(1)}</span>
                            </div>
                            <div className="flex flex-col gap-px">
                              <span className="text-[7.5px] font-semibold uppercase tracking-wide text-content/40">Days active</span>
                              <span className="text-[11px] font-semibold tabular-nums text-content">{row.daysActive}</span>
                            </div>
                          </div>
                          {/* Divider */}
                          <div style={{ height: "0.5px", background: "#e4e8ee", margin: "0 14px" }} />
                          {/* Ranked table */}
                          <table className="w-full border-collapse" style={{ fontSize: 9, fontVariantNumeric: "tabular-nums" }}>
                            <thead>
                              <tr>
                                <td className="py-1.5" style={{ paddingLeft: 14, fontSize: 7.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8492a6", width: 22 }}>#</td>
                                <td className="py-1.5" style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8492a6", width: 52 }}>Price</td>
                                <td className="py-1.5" style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8492a6", paddingLeft: 14 }}>Volume</td>
                                <td className="py-1.5 text-right" style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8492a6", width: 52, paddingRight: 14 }}>Units</td>
                                <td className="py-1.5 text-right" style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8492a6", width: 44, paddingRight: 14 }}>Share</td>
                              </tr>
                            </thead>
                            <tbody>
                              {row.allPrices.map((p, idx) => {
                                const sharePct = priceTotal > 0 ? (p.qty / priceTotal) * 100 : 0;
                                const barWidth = priceTotal > 0 ? (p.qty / row.allPrices[0].qty) * 100 : 0;
                                return (
                                  <tr key={p.price} style={{ borderTop: "0.5px solid #eaedf1" }}>
                                    <td style={{ paddingLeft: 14, paddingTop: 4, paddingBottom: 4, fontSize: 8, fontWeight: 600, color: "#b0bac8", width: 22, textAlign: "right" }}>{idx + 1}</td>
                                    <td style={{ paddingTop: 4, paddingBottom: 4, fontSize: 9, fontWeight: 600, color: "#185fa5", width: 52 }}>${Number(p.price).toFixed(2)}</td>
                                    <td style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 14, paddingRight: 8 }}>
                                      <div style={{ background: "#e4e8ee", borderRadius: 2, height: 5, overflow: "hidden" }}>
                                        <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 2, background: "#185fa5", opacity: 0.4 + 0.6 * (p.qty / row.allPrices[0].qty) }} />
                                      </div>
                                    </td>
                                    <td style={{ paddingTop: 4, paddingBottom: 4, paddingRight: 14, textAlign: "right", color: "#3d4f68", width: 52 }}>{fmtNum(p.qty)}</td>
                                    <td style={{ paddingTop: 4, paddingBottom: 4, paddingRight: 14, textAlign: "right", color: "#8492a6", fontSize: 8, width: 44 }}>{sharePct.toFixed(0)}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="sticky bottom-0 border-t border-gray-200 bg-gray-50">
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-content/50">
                {viewMode === "forecast" ? "Daily forecast" : "Daily total"}
              </td>
              {dayTotals.map((val, di) => {
                const isToday = dateCols[di] === today;
                return (
                  <td
                    key={di}
                    className="py-1.5 px-1 text-right tabular-nums text-[10px] font-semibold text-content/70"
                    style={isToday ? { background: "#e6f1fb", color: "#185fa5" } : undefined}
                  >
                    {fmtNum(val)}
                  </td>
                );
              })}
              <td />
              <td />
              <td className="py-1.5 px-2 text-right tabular-nums text-[10px] font-semibold text-content">
                {fmtNum(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ForecastTab;
