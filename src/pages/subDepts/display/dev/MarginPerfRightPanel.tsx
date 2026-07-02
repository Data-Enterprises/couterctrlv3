import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { formatCurrency2 } from "../../../../utils";
import { gpm } from "../../../../functions";
import { calculateCogs, setDates } from "../..";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import type { SubDeptCost } from "../../../../interfaces";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import SmDevDaySidebar from "./SmDevDaySidebar";
import MarginPerfWeekStrip from "./MarginPerfWeekStrip";
import MarginPerfItemsTable from "./MarginPerfItemsTable";
import SubDeptCostGrid from "../widgets/SubDeptCostGrid";

const MarginPerfRightPanel = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);
  const subDeptName = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc ?? "";

  const periodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 0)) : "";
  const periodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 6)) : "";
  const dateRange = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const computeKpis = (src: typeof ctx.margins) => {
    if (!src.length) return null;
    const sales = src.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
    const cogsTotal = src.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const marginPct = sales > 0 ? ((sales - cogsTotal) / sales) * 100 : 0;
    return { sales, cogs: cogsTotal, margin: gpm(sales, cogsTotal), rawMargin: marginPct };
  };

  const lyWeekData = useMemo(() => {
    switch (ctx.selectedWeek) {
      case 1: return ctx.weekOneMarginsLY;
      case 2: return ctx.weekTwoMarginsLY;
      case 3: return ctx.weekThreeMarginsLY;
      case 4: return ctx.weekFourMarginsLY;
      default: return ctx.weekOneMarginsLY;
    }
  }, [ctx.selectedWeek, ctx.weekOneMarginsLY, ctx.weekTwoMarginsLY, ctx.weekThreeMarginsLY, ctx.weekFourMarginsLY]);

  const weekKpis = useMemo(() => computeKpis(ctx.margins), [ctx.margins]);
  const lyKpis = useMemo(() => computeKpis(lyWeekData), [lyWeekData]);

  const noCostCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const m of ctx.margins) {
      if (!seen.has(m.product_code)) {
        seen.add(m.product_code);
        if (m.case_size === 0 || (m.net_cost === 0 && m.cost === 0)) count++;
      }
    }
    return count;
  }, [ctx.margins]);

  const openExport = () => {
    if (ctx.subDeptGridView === "item") dispatch(actions.setOpenExportModal(true));
    else dispatch(actions.setOpenCostExportModal(true));
  };

  const handleNoCostTab = () => {
    const fmtDate = (dte: string) => {
      const s = dte.split("T")[0].split("-");
      return `${s[1]}/${s[2]}/${s[0]}`;
    };
    const noCostItems = ctx.margins.filter(
      (m) => m.case_size === 0 || (m.net_cost === 0 && m.cost === 0),
    );
    const costData: SubDeptCost[] = noCostItems.reduce((acc: SubDeptCost[], curr) => {
      const found = acc.find((i) => i.product_code === curr.product_code);
      if (!found) {
        acc.push({
          date: fmtDate(curr.sale_date),
          product_code: curr.product_code,
          description: curr.product_description,
          calculated_cost: curr.calculated_cost,
          cost: curr.cost,
          qty: curr.qty,
          total_cost: 0,
        });
      } else {
        found.qty += curr.qty;
      }
      return acc;
    }, []);
    dispatch(actions.setSubDeptCost(costData));
    dispatch(actions.setSubDeptGridView("nocost"));
  };

  const handleCostTab = () => {
    const fmtDate = (dte: string) => {
      const s = dte.split("T")[0].split("-");
      return `${s[1]}/${s[2]}/${s[0]}`;
    };
    const costData: SubDeptCost[] = ctx.margins.reduce((acc: SubDeptCost[], curr) => {
      const found = acc.find((i) => i.product_code === curr.product_code);
      if (!found) {
        acc.push({
          date: fmtDate(curr.sale_date),
          product_code: curr.product_code,
          description: curr.product_description,
          calculated_cost: curr.calculated_cost,
          cost: curr.cost,
          qty: curr.qty,
          total_cost: calculateCogs(curr.net_cost, curr.cost, curr.case_size, curr.qty, curr.weight),
        });
      } else {
        found.qty += curr.qty;
        found.total_cost += calculateCogs(curr.net_cost, curr.cost, curr.case_size, curr.qty, curr.weight);
      }
      return acc;
    }, []);
    dispatch(actions.setSubDeptCost(costData));
    dispatch(actions.setSubDeptGridView("cost"));
  };

  const marginDelta = weekKpis && lyKpis ? weekKpis.rawMargin - lyKpis.rawMargin : null;
  const salesDelta = weekKpis && lyKpis && lyKpis.sales > 0
    ? ((weekKpis.sales - lyKpis.sales) / Math.abs(lyKpis.sales)) * 100
    : null;

  const lyPeriodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 364)) : "";
  const lyPeriodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 370)) : "";
  const lyDateRange = lyPeriodStart && lyPeriodEnd ? `${lyPeriodStart} – ${lyPeriodEnd}` : "";

  if (!ctx.selectedSubDeptId) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-content/40">Select a sub department</p>
          <p className="text-[11px] text-content/25">Choose one from the left panel</p>
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

        {/* ── 1-row navy header ── */}
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between bg-[#1e2a4a]">
          <div>
            <div className="text-[13px] font-semibold text-white leading-tight">{subDeptName}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.50)" }}>
              Weekly Margin Report{dateRange ? ` · ${dateRange}` : ""}
            </div>
          </div>
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={openExport}
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── 3-col KPI strip ── */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {/* TY metric */}
          <div className="px-4 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">
              {gradingMetric === "margin" ? "TY Margin" : "TY Net Sales"}
            </div>
            <div className="text-[8px] text-content/55 italic mb-0.5">{dateRange}</div>
            <div className="text-[13px] font-semibold text-content">
              {weekKpis
                ? gradingMetric === "margin"
                  ? weekKpis.margin
                  : formatCurrency2(weekKpis.sales)
                : "—"}
            </div>
          </div>

          {/* vs LY */}
          <div className="px-4 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">vs Last Year</div>
            <div className="text-[8px] text-content/55 italic mb-0.5">{lyDateRange}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-content">
                {lyKpis
                  ? gradingMetric === "margin"
                    ? lyKpis.margin
                    : formatCurrency2(lyKpis.sales)
                  : "—"}
              </span>
              {gradingMetric === "margin" && marginDelta !== null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${marginDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {marginDelta >= 0 ? "+" : ""}{marginDelta.toFixed(1)} pts
                </span>
              )}
              {gradingMetric === "sales" && salesDelta !== null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${salesDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {salesDelta >= 0 ? "+" : ""}{salesDelta.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* No cost items */}
          <div className="px-4 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">No Cost Items</div>
            <div className="text-[8px] text-content/55 italic mb-0.5">&nbsp;</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-[13px] font-semibold ${noCostCount > 0 ? "text-red-700" : "text-content"}`}>
                {noCostCount}
              </span>
              {noCostCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  data issue
                </span>
              )}
            </div>
          </div>
        </div>

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
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "nocost"
                ? "border-red-400 text-red-700"
                : "border-transparent text-content/70 hover:text-content/80"
            }`}
            onClick={handleNoCostTab}
          >
            No Cost
            {noCostCount > 0 && (
              <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">
                {noCostCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Week strip ── */}
        <MarginPerfWeekStrip />

        {/* ── Day strip ── */}
        <div className="flex-shrink-0">
          <SmDevDaySidebar />
        </div>

        {/* ── Items / Cost / No Cost grid (full width) ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {ctx.subDeptGridView === "item" ? (
            <MarginPerfItemsTable />
          ) : ctx.subDeptGridView === "nocost" && noCostCount === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content/30">
              No items missing cost data
            </div>
          ) : (
            <SubDeptCostGrid />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarginPerfRightPanel;
