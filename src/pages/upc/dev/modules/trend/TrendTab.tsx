import React, { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevTrendLoaded,
  setDevTrendLoading,
  setDevTrendPeriods,
  setDevUpcTrends,
  setDevTopFiveTrends,
  setDevBottomFiveTrends,
  setDevUpcItems,
} from "../../../../../features/upcDevSlice";
import { getTrendDetect } from "../../../../../api/upc";
import type { UpcTrend, UpcItem } from "../../../../../interfaces";
import {
  getTrendStatus,
  accelerationFactor,
  type TrendStatus,
} from "./trendStats";

const WINDOW_OPTIONS = [30, 60, 90, 120, 180, 365];

const STATUS_LABEL: Record<TrendStatus, string> = {
  accelerating: "Accelerating",
  declining: "Declining",
  "reduced-availability": "Reduced availability",
  growing: "Growing",
};

const STATUS_CLASS: Record<TrendStatus, string> = {
  accelerating: "bg-severity_critical_bg text-severity_critical_text",
  declining: "bg-severity_watch_bg text-severity_watch_text",
  "reduced-availability": "bg-blue-50 text-blue-700",
  growing: "bg-severity_healthy_bg text-severity_healthy_text",
};

function buildInsight(t: UpcTrend, status: TrendStatus): string {
  const confidencePct = Math.round(t["r2-after"] * 100);
  const reliability =
    t["r2-after"] >= 0.5 ? "consistent" : "not very consistent";
  const factor = accelerationFactor(t);
  const availabilityDrop =
    t.active_days_before > 0 &&
    t.active_days_after / t.active_days_before < 0.5;
  const availabilityNote = availabilityDrop
    ? " Fewer active selling days may indicate availability issues."
    : "";

  switch (status) {
    case "accelerating":
      return `Sales declining at ${t.slope_after.toFixed(2)} units/day — trend has accelerated${factor !== null ? ` ${factor.toFixed(1)}×` : ""} and is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    case "declining":
      return `Sales declining at ${t.slope_after.toFixed(2)} units/day, but slower than before — the decline is ${reliability} (${confidencePct}% confidence).${availabilityNote}`;
    case "reduced-availability":
      return `Per-day sales rate held steady or improved (${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}%), but total volume fell because this item was only actively sold ${t.active_days_after} of ${t.active_days_before} prior active days. This looks like a stocking or availability issue, not weaker demand.`;
    case "growing":
      return `Sales are up ${t.pct_change_mean >= 0 ? "+" : ""}${t.pct_change_mean.toFixed(1)}% per day, ${t.impact_units.toLocaleString()} more units than before.`;
  }
}

const TrendTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchTrends = async (periods: number) => {
    dispatch(setDevTrendLoading(true));
    const upcParam = ctx.upcs.join(",");
    const upcItemsMap = new Map<string, UpcItem>();

    const res = await getTrendDetect(
      ctx.url,
      ctx.token,
      ctx.storeids,
      ctx.startDate,
      ctx.endDate,
      periods,
      upcParam,
    );
    const j = res.data;
    if (j.error === 0 && j.trends?.length > 0) {
      dispatch(setDevUpcTrends(j.trends));
      dispatch(setDevTopFiveTrends(j.top_5));
      dispatch(setDevBottomFiveTrends(j.bottom_5));
      for (const item of j.trends as UpcTrend[]) {
        upcItemsMap.set(item.product_code, {
          product_code: item.product_code,
          description: item.product_description,
        });
      }
    }

    if (upcItemsMap.size)
      dispatch(setDevUpcItems(Array.from(upcItemsMap.values())));
    dispatch(setDevTrendLoaded(true));
    dispatch(setDevTrendLoading(false));
  };

  useEffect(() => {
    if (
      ctx.trendLoaded ||
      ctx.trendLoading ||
      !ctx.upcs.length ||
      !ctx.storeids
    )
      return;
    fetchTrends(ctx.trendPeriods);
    // ctx.searchVersion: see the same note in PriceOptTab.tsx — without it
    // this effect would never re-fire on a re-search.
  }, [ctx.searchVersion]);

  const handleWindowChange = (periods: number) => {
    dispatch(setDevTrendPeriods(periods));
    fetchTrends(periods);
  };

  const toggle = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const rows = useMemo(() => {
    const src =
      ctx.selectedUpcs.length > 0
        ? ctx.upcTrends.filter((t) => ctx.selectedUpcs.includes(t.product_code))
        : ctx.upcTrends;
    return [...src]
      .map((t) => ({ t, status: getTrendStatus(t) }))
      .sort((a, b) => a.t.impact_units - b.t.impact_units);
  }, [ctx.upcTrends, ctx.selectedUpcs]);

  if (ctx.trendLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Loading trend detection…
      </div>
    );
  }

  if (!ctx.trendLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Navigate here to load trend data
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        No trend data
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <label className="flex items-center gap-1.5 text-[10px] text-content">
          Window
          <select
            value={ctx.trendPeriods}
            onChange={(e) => handleWindowChange(Number(e.target.value))}
            className="text-[10px] pl-1.5 pr-4 py-1 rounded border border-content/20 bg-custom-white"
            style={{ outline: "none", boxShadow: "none" }}
          >
            {WINDOW_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}d
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar min-h-0">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="sticky top-0 bg-gray-100 z-10">
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-content/85"
                style={{ width: 220 }}
              >
                Product
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Units lost
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Daily rate
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Slope change
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Confidence
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, status }) => {
              const isOpen = expanded.has(t.product_code);
              const confidencePct = Math.round(t["r2-after"] * 100);
              return (
                <React.Fragment key={t.product_code}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                    onClick={() => toggle(t.product_code)}
                  >
                    <td className="px-3 py-[7px]">
                      <div className="flex items-center gap-1.5">
                        {isOpen ? (
                          <ChevronDownIcon className="w-3 h-3 text-content/85 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-3 h-3 text-content/85 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-content font-medium truncate">
                            {t.product_description}
                          </div>
                          <div className="text-content/85 font-mono">
                            {t.product_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-3 py-[7px] text-right tabular-nums font-semibold ${t.impact_units < 0 ? "text-severity_critical_text" : "text-severity_healthy_text"}`}
                    >
                      {t.impact_units >= 0 ? "+" : ""}
                      {t.impact_units.toLocaleString()}
                    </td>
                    <td className="px-3 py-[7px] text-right tabular-nums text-content/85">
                      {t.mean_before.toFixed(1)} → {t.mean_after.toFixed(1)}
                    </td>
                    <td className="px-3 py-[7px] text-right tabular-nums text-content/85">
                      {t.slope_change >= 0 ? "+" : ""}
                      {t.slope_change.toFixed(2)}/day
                    </td>
                    <td className="px-3 py-[7px] text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-10 h-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-[#1e2a4a]"
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <span className="text-content/85 tabular-nums">
                          {confidencePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-[7px] text-right">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_CLASS[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td colSpan={6} className="px-3 py-2">
                        <div className="grid grid-cols-6 gap-2 mb-2">
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              Before daily avg
                            </div>
                            <div className="text-content font-semibold">
                              {t.mean_before.toFixed(1)} units
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              After daily avg
                            </div>
                            <div className="text-content font-semibold">
                              {t.mean_after.toFixed(1)} units
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              Avg change
                            </div>
                            <div
                              className={`font-semibold ${t.pct_change_mean < 0 ? "text-severity_critical_text" : "text-severity_healthy_text"}`}
                            >
                              {t.pct_change_mean >= 0 ? "+" : ""}
                              {t.pct_change_mean.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              Volatility before
                            </div>
                            <div className="text-content font-semibold">
                              {t.volatility_before.toFixed(1)}
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              Volatility after
                            </div>
                            <div className="text-content font-semibold">
                              {t.volatility_after.toFixed(1)}
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded px-2.5 py-1.5">
                            <div className="text-[11px] text-content/85">
                              Active days
                            </div>
                            <div className="text-content font-semibold">
                              {t.active_days_before} → {t.active_days_after}
                            </div>
                          </div>
                        </div>
                        <div className="text-[12px] text-content/85 font-medium leading-relaxed bg-gray-100 rounded px-2.5 py-1.5">
                          {buildInsight(t, status)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-1.5 text-[10px] text-content/85 italic flex-shrink-0 border-t border-gray-100">
        Slope = units/day regression · Confidence = R² of trend line · Units
        lost = total units, before period vs after
      </div>
    </div>
  );
};

export default TrendTab;
