import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { formatCurrency2 } from "../../../../utils";
import { gpm } from "../../../../functions";
import { calculateCogs } from "../..";
import type { SubDeptCost } from "../../../../interfaces";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import SmDevDaySidebar from "./SmDevDaySidebar";
import SmDevItemsTable from "./SmDevItemsTable";
import SubDeptCostGrid from "../widgets/SubDeptCostGrid";
import AllWeeksTrend from "../allWeeks/AllWeeksTrend";

const SmDevRightPanel = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const subDeptName =
    ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc ?? "";

  const weekHeader = () => {
    if (ctx.selectedWeek === 5) return "All Weeks";
    const wkMargins = [
      ctx.weekOneMargins,
      ctx.weekTwoMargins,
      ctx.weekThreeMargins,
      ctx.weekFourMargins,
    ][ctx.selectedWeek - 1];
    if (!wkMargins?.length) return `Week ${ctx.selectedWeek}`;
    const dates = wkMargins.map((m) => m.sale_date.split("T")[0]).sort();
    return `Week ${ctx.selectedWeek} — ${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`;
  };

  const openExport = () => {
    if (ctx.subDeptGridView === "item")
      dispatch(actions.setOpenExportModal(true));
    else dispatch(actions.setOpenCostExportModal(true));
  };

  const computeKpis = (src: typeof ctx.margins) => {
    if (!src.length) return null;
    const sales = src.reduce(
      (acc, m) => acc + (m.total_sales - m.total_tax),
      0,
    );
    const cogsTotal = src.reduce(
      (acc, m) =>
        acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
      0,
    );
    const qty = src.reduce((acc, m) => acc + m.qty, 0);
    const items = new Set(src.map((m) => m.product_code)).size;
    const marginPct = sales > 0 ? ((sales - cogsTotal) / sales) * 100 : 0;
    return {
      sales: formatCurrency2(sales),
      cogs: formatCurrency2(cogsTotal),
      margin: gpm(sales, cogsTotal),
      qty: qty.toLocaleString(),
      items: items.toLocaleString(),
      rawSales: sales,
      rawCogs: cogsTotal,
      rawMargin: marginPct,
      rawQty: qty,
      rawItems: items,
    };
  };

  const weekKpis = useMemo(() => computeKpis(ctx.margins), [ctx.margins]);

  const lyWeekData = useMemo(() => {
    switch (ctx.selectedWeek) {
      case 1:
        return ctx.weekOneMarginsLY;
      case 2:
        return ctx.weekTwoMarginsLY;
      case 3:
        return ctx.weekThreeMarginsLY;
      case 4:
        return ctx.weekFourMarginsLY;
      case 5:
        return [
          ...ctx.weekOneMarginsLY,
          ...ctx.weekTwoMarginsLY,
          ...ctx.weekThreeMarginsLY,
          ...ctx.weekFourMarginsLY,
        ];
      default:
        return [];
    }
  }, [
    ctx.selectedWeek,
    ctx.weekOneMarginsLY,
    ctx.weekTwoMarginsLY,
    ctx.weekThreeMarginsLY,
    ctx.weekFourMarginsLY,
  ]);

  const lyKpis = useMemo(() => computeKpis(lyWeekData), [lyWeekData]);

  const dayMargins = useMemo(() => {
    if (!ctx.selectedWeekDay) return null;
    return ctx.margins.filter(
      (m) => formatDate(m.sale_date.split("T")[0]) === ctx.selectedWeekDay,
    );
  }, [ctx.margins, ctx.selectedWeekDay]);

  const dayKpis = useMemo(
    () => (dayMargins ? computeKpis(dayMargins) : null),
    [dayMargins],
  );

  const handleCostTab = () => {
    const fmtDate = (dte: string) => {
      const s = dte.split("T")[0].split("-");
      return `${s[1]}/${s[2]}/${s[0]}`;
    };
    const costData: SubDeptCost[] = ctx.margins.reduce(
      (acc: SubDeptCost[], curr) => {
        const found = acc.find((i) => i.product_code === curr.product_code);
        if (!found) {
          acc.push({
            date: fmtDate(curr.sale_date),
            product_code: curr.product_code,
            description: curr.product_description,
            calculated_cost: curr.calculated_cost,
            cost: curr.cost,
            qty: curr.qty,
            total_cost: calculateCogs(
              curr.net_cost,
              curr.cost,
              curr.case_size,
              curr.qty,
              curr.weight,
            ),
          });
        } else {
          found.qty += curr.qty;
          found.total_cost += calculateCogs(
            curr.net_cost,
            curr.cost,
            curr.case_size,
            curr.qty,
            curr.weight,
          );
        }
        return acc;
      },
      [],
    );
    dispatch(actions.setSubDeptCost(costData));
    dispatch(actions.setSubDeptGridView("cost"));
  };

  const KPI_LABELS = ["Net Sales", "COGS", "Margin", "Qty", "Unique Items"];
  const kpiValues = weekKpis
    ? [
        weekKpis.sales,
        weekKpis.cogs,
        weekKpis.margin,
        weekKpis.qty,
        weekKpis.items,
      ]
    : [];
  const lyKpiValues = lyKpis
    ? [lyKpis.sales, lyKpis.cogs, lyKpis.margin, lyKpis.qty, lyKpis.items]
    : [];
  const dayValues = dayKpis
    ? [dayKpis.sales, dayKpis.cogs, dayKpis.margin, dayKpis.qty, dayKpis.items]
    : [];

  // No sub dept selected yet
  if (!ctx.selectedSubDeptId) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-content/40">
            Select a sub department
          </p>
          <p className="text-[11px] text-content/25">
            Choose one from the list on the left
          </p>
        </div>
      </div>
    );
  }

  // Sub dept selected but no week clicked yet
  if (ctx.selectedWeek === 0) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-content/40">
            Select a week
          </p>
          <p className="text-[11px] text-content/25">
            {subDeptName
              ? `Viewing ${subDeptName}`
              : "Choose a week from the left panel"}
          </p>
        </div>
      </div>
    );
  }

  if (ctx.loadingMargins) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full relative">
          <LoadingIndicator message="Loading margins..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* ── Navy header ── */}
        <div className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between bg-[#1e2a4a]">
          <div>
            <div className="text-[13px] font-semibold text-custom-white">
              {weekHeader()}
              {subDeptName && (
                <span
                  className="ml-2 text-[11px] font-normal"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  — {subDeptName}
                </span>
              )}
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {weekKpis
                ? `${weekKpis.items} items · ${weekKpis.sales} net sales`
                : ctx.selectedWeek > 0
                  ? "Loading…"
                  : ""}
            </div>
          </div>
          <button
            className="text-custom-white/60 hover:text-custom-white transition-colors mt-0.5"
            onClick={openExport}
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {ctx.selectedWeek < 5 ? (
          <>
            {/* ── Summary KPI strip ── */}
            {weekKpis &&
              (() => {
                const twRaws = [
                  weekKpis.rawSales,
                  weekKpis.rawCogs,
                  weekKpis.rawMargin,
                  weekKpis.rawQty,
                  weekKpis.rawItems,
                ];
                const lyRaws = lyKpis
                  ? [
                      lyKpis.rawSales,
                      lyKpis.rawCogs,
                      lyKpis.rawMargin,
                      lyKpis.rawQty,
                      lyKpis.rawItems,
                    ]
                  : [];
                return (
                  <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
                    {KPI_LABELS.map((label, i) => {
                      const tw = twRaws[i];
                      const ly = lyRaws[i];
                      const isMargin = i === 2;
                      const delta = ly
                        ? isMargin
                          ? tw - ly
                          : ((tw - ly) / Math.abs(ly)) * 100
                        : null;
                      const isUp = delta !== null && delta > 0;
                      return (
                        <div
                          key={label}
                          className="px-3.5 py-[11px] bg-custom-white"
                        >
                          <div className="text-[8px] font-bold uppercase tracking-[.07em] text-content/40 mb-1">
                            {label}
                          </div>
                          <div className="text-[15px] font-bold text-[#1e2a4a] leading-none">
                            {kpiValues[i]}
                          </div>
                          <div className="text-[9px] text-content/40 mt-1">
                            LY{" "}
                            <span className="text-content/60 font-medium">
                              {lyKpiValues.length ? lyKpiValues[i] : "—"}
                            </span>
                          </div>
                          {delta !== null && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded mt-1.5"
                              style={
                                isUp
                                  ? {
                                      background: "rgba(220,38,38,0.09)",
                                      color: "#dc2626",
                                    }
                                  : {
                                      background: "rgba(22,163,74,0.09)",
                                      color: "#16a34a",
                                    }
                              }
                            >
                              {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
                              {isMargin ? " pts" : "%"} vs LY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            {/* ── Tabs ── */}
            <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
              <button
                className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                  ctx.subDeptGridView === "item"
                    ? "border-[#1e2a4a] text-content"
                    : "border-transparent text-content/70 hover:text-content/80"
                }`}
                onClick={() => dispatch(actions.setSubDeptGridView("item"))}
              >
                Items
              </button>
              <button
                className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                  ctx.subDeptGridView === "cost"
                    ? "border-[#1e2a4a] text-content"
                    : "border-transparent text-content/70 hover:text-content/80"
                }`}
                onClick={handleCostTab}
              >
                Cost
              </button>
            </div>

            {/* ── Day strip ── */}
            <div className="flex-shrink-0">
              <SmDevDaySidebar />
            </div>

            {/* ── Selected day KPI strip ── */}
            {dayKpis && (
              <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                {KPI_LABELS.map((label, i) => (
                  <div key={label} className="px-4 py-2">
                    <p className="text-[9px] font-medium uppercase tracking-wide text-content/70">
                      {label}
                    </p>
                    <p className="text-[12px] font-semibold text-content">
                      {dayValues[i]}
                    </p>
                    <p className="text-[8px] italic text-content/35">LY —</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {ctx.subDeptGridView === "item" ? (
                <SmDevItemsTable />
              ) : (
                <SubDeptCostGrid />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <AllWeeksTrend />
          </div>
        )}
      </div>
    </div>
  );
};

export default SmDevRightPanel;
