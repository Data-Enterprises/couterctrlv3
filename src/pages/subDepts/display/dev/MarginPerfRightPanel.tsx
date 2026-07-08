import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector, useStoreName } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { formatCurrency2, addDays } from "../../../../utils";
import { gpm } from "../../../../functions";
import { calculateCogs, setDates, getLYDate } from "../..";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import type { SubDeptCost, SubDeptMargin } from "../../../../interfaces";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import MarginPerfItemsTable from "./MarginPerfItemsTable";
import SubDeptCostGrid from "../widgets/SubDeptCostGrid";
import MarginPerfExportModal from "./MarginPerfExportModal";
import MarginPerfDaySidebar from "./MarginPerfDaySidebar";

const MarginPerfRightPanel = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);
  const subDeptName = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc ?? "";
  const storeName = useStoreName(ctx.searchValue);

  const periodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 0)) : "";
  const periodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 6)) : "";
  const dateRange = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const lyPeriodEnd = ctx.singleDate ? formatDate(getLYDate(ctx.singleDate)) : "";
  const lyPeriodStart = ctx.singleDate
    ? formatDate(getLYDate(setDates(new Date(ctx.singleDate), 6)))
    : "";
  const lyDateRange = lyPeriodStart && lyPeriodEnd ? `${lyPeriodStart} – ${lyPeriodEnd}` : "";

  const lwPeriodEnd = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 7)) : "";
  const lwPeriodStart = ctx.singleDate ? formatDate(setDates(new Date(ctx.singleDate), 13)) : "";
  const lwDateRange = lwPeriodStart && lwPeriodEnd ? `${lwPeriodStart} – ${lwPeriodEnd}` : "";

  // When a single day is selected in the day sidebar, the KPI strip scopes
  // down to that day (TY the day itself, LW/LY that day's mapped date,
  // holiday- and leap-year-aware for LY via getLYDate) instead of the week.
  const byDate = (src: SubDeptMargin[], dateStr: string) =>
    src.filter((m) => m.sale_date.split("T")[0] === dateStr);
  const fmtDayLabel = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const selectedLwDate = ctx.selectedWeekDay
    ? addDays(ctx.selectedWeekDay, -7).toISOString().split("T")[0]
    : null;
  const selectedLyDate = ctx.selectedWeekDay ? getLYDate(ctx.selectedWeekDay) : null;

  const kpiTyLabel = ctx.selectedWeekDay ? fmtDayLabel(ctx.selectedWeekDay) : dateRange;
  const kpiLwLabel = selectedLwDate ? fmtDayLabel(selectedLwDate) : lwDateRange;
  const kpiLyLabel = selectedLyDate ? fmtDayLabel(selectedLyDate) : lyDateRange;

  const computeKpis = (src: typeof ctx.weekOneMargins) => {
    if (!src.length) return null;
    const sales = src.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
    const cogsTotal = src.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const marginPct = sales > 0 ? ((sales - cogsTotal) / sales) * 100 : 0;
    return { sales, cogs: cogsTotal, margin: gpm(sales, cogsTotal), rawMargin: marginPct };
  };

  const tyKpis = useMemo(() => {
    const src = ctx.selectedWeekDay ? byDate(ctx.weekOneMargins, ctx.selectedWeekDay) : ctx.weekOneMargins;
    return computeKpis(src);
  }, [ctx.selectedWeekDay, ctx.weekOneMargins]);

  const lwKpis = useMemo(() => {
    const src = selectedLwDate ? byDate(ctx.weekTwoMargins, selectedLwDate) : ctx.weekTwoMargins;
    return computeKpis(src);
  }, [selectedLwDate, ctx.weekTwoMargins]);

  const lyKpis = useMemo(() => {
    const src = selectedLyDate ? byDate(ctx.weekOneMarginsLY, selectedLyDate) : ctx.weekOneMarginsLY;
    return computeKpis(src);
  }, [selectedLyDate, ctx.weekOneMarginsLY]);

  const noCostCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const m of ctx.weekOneMargins) {
      if (!seen.has(m.product_code)) {
        seen.add(m.product_code);
        if (m.case_size === 0 || (m.net_cost === 0 && m.cost === 0)) count++;
      }
    }
    return count;
  }, [ctx.weekOneMargins]);

  const marginDelta = tyKpis && lyKpis ? tyKpis.rawMargin - lyKpis.rawMargin : null;
  const salesDelta = tyKpis && lyKpis && lyKpis.sales > 0
    ? ((tyKpis.sales - lyKpis.sales) / Math.abs(lyKpis.sales)) * 100
    : null;
  const lwMarginDelta = tyKpis && lwKpis ? tyKpis.rawMargin - lwKpis.rawMargin : null;
  const lwSalesDelta = tyKpis && lwKpis && lwKpis.sales > 0
    ? ((tyKpis.sales - lwKpis.sales) / Math.abs(lwKpis.sales)) * 100
    : null;

  const [exportOpen, setExportOpen] = useState(false);

  const handleNoCostTab = () => {
    const fmtDate = (dte: string) => dte.split("T")[0];
    const noCostItems = ctx.weekOneMargins.filter(
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
    const fmtDate = (dte: string) => dte.split("T")[0];
    const costData: SubDeptCost[] = ctx.weekOneMargins.reduce((acc: SubDeptCost[], curr) => {
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

  if (!ctx.selectedSubDeptId) {
    return (
      <div className="flex-1 min-w-0 shadow-lg">
        <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-content">Select a sub department</p>
          <p className="text-[11px] text-content">Choose one from the left panel</p>
        </div>
      </div>
    );
  }

  if (!ctx.weekOneMargins.length) {
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
            <div className="text-[10px] mt-0.5 text-white">
              Weekly Margin Report{dateRange ? ` · ${dateRange}` : ""}
            </div>
          </div>
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setExportOpen(true)}
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── 3-col KPI strip ── */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {/* TY metric */}
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">
              {gradingMetric === "margin" ? "TY Margin" : "TY Net Sales"}
            </div>
            <div className="text-[8px] text-content mb-0.5">{kpiTyLabel}</div>
            <div className="text-[13px] font-semibold text-content">
              {tyKpis ? gradingMetric === "margin" ? tyKpis.margin : formatCurrency2(tyKpis.sales) : "—"}
            </div>
          </div>

          {/* vs LW */}
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">vs Last Week</div>
            <div className="text-[8px] text-content mb-0.5">{kpiLwLabel}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold text-content">
                {lwKpis ? gradingMetric === "margin" ? lwKpis.margin : formatCurrency2(lwKpis.sales) : "—"}
              </span>
              {gradingMetric === "margin" && lwMarginDelta !== null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${lwMarginDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {lwMarginDelta >= 0 ? "+" : ""}{lwMarginDelta.toFixed(1)} pts
                </span>
              )}
              {gradingMetric === "sales" && lwSalesDelta !== null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${lwSalesDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {lwSalesDelta >= 0 ? "+" : ""}{lwSalesDelta.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* vs LY */}
          <div className="px-3 py-2.5">
            <div className="text-[9px] font-medium uppercase tracking-wide text-content">vs Last Year</div>
            <div className="text-[8px] text-content mb-0.5">{kpiLyLabel}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold text-content">
                {lyKpis ? gradingMetric === "margin" ? lyKpis.margin : formatCurrency2(lyKpis.sales) : "—"}
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

        </div>

        {/* ── Day sidebar ── */}
        <MarginPerfDaySidebar />

        {/* ── Tabs ── */}
        <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "item"
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
            onClick={() => dispatch(actions.setSubDeptGridView("item"))}
          >
            Items
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "cost"
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
            onClick={handleCostTab}
          >
            Cost
          </button>
          <button
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              ctx.subDeptGridView === "nocost"
                ? "border-red-400 text-red-700"
                : "border-transparent text-content"
            }`}
            onClick={handleNoCostTab}
          >
            No Cost
          </button>
        </div>

        {/* ── Items / Cost / No Cost grid ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {ctx.subDeptGridView === "item" ? (
            <MarginPerfItemsTable
              tyMargins={ctx.weekOneMargins}
              lwMargins={ctx.weekTwoMargins}
              lyMargins={ctx.weekOneMarginsLY}
            />
          ) : ctx.subDeptGridView === "nocost" && noCostCount === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content">
              No items missing cost data
            </div>
          ) : (
            <SubDeptCostGrid />
          )}
        </div>
      </div>

      {exportOpen && (
        <MarginPerfExportModal
          onClose={() => setExportOpen(false)}
          storeName={storeName}
          subDeptName={subDeptName}
          dateRange={dateRange}
          tyMargins={ctx.weekOneMargins}
          lyMargins={ctx.weekOneMarginsLY}
        />
      )}
    </div>
  );
};

export default MarginPerfRightPanel;
