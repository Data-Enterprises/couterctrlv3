import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { setDates, calculateCogs } from "../..";
import type { SubDeptMargin } from "../../../../interfaces";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const selectedStyle = { boxShadow: "inset 0 -4px 0 rgba(30, 42, 74, 0.5)" };

const agg = (rows: SubDeptMargin[]) => {
  const sales = rows.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const cogs = rows.reduce((acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
  return { sales, marginPct: sales > 0 ? ((sales - cogs) / sales) * 100 : 0 };
};

const DeltaBadge = ({ tyVal, lyVal, unit }: { tyVal: number; lyVal: number; unit: "pct" | "pts" }) => {
  if (!lyVal && unit === "pct") return <span className="text-[9px] font-semibold mt-0.5 text-content/25">—</span>;
  const delta = unit === "pts" ? tyVal - lyVal : ((tyVal - lyVal) / Math.abs(lyVal)) * 100;
  const isUp = delta >= 0;
  return (
    <span className="text-[9px] font-bold mt-0.5" style={{ color: isUp ? "#16a34a" : "#dc2626" }}>
      {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}{unit === "pts" ? " pts" : "%"}
    </span>
  );
};

const SmDevDaySidebar = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  const dates = useMemo(
    () => Array.from(new Set(ctx.margins.map((m) => m.sale_date.split("T")[0]))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [ctx.margins],
  );

  const lyMargins = useMemo(() => {
    switch (ctx.selectedWeek) {
      case 1: return ctx.weekOneMarginsLY;
      case 2: return ctx.weekTwoMarginsLY;
      case 3: return ctx.weekThreeMarginsLY;
      case 4: return ctx.weekFourMarginsLY;
      case 5: return [...ctx.weekOneMarginsLY, ...ctx.weekTwoMarginsLY, ...ctx.weekThreeMarginsLY, ...ctx.weekFourMarginsLY];
      default: return [];
    }
  }, [ctx.selectedWeek, ctx.weekOneMarginsLY, ctx.weekTwoMarginsLY, ctx.weekThreeMarginsLY, ctx.weekFourMarginsLY]);

  // LY lookup by date → { sales, marginPct }
  const lyByDate = useMemo(() => {
    const map: Record<string, { sales: number; cogs: number }> = {};
    for (const m of lyMargins) {
      const d = m.sale_date.split("T")[0];
      if (!map[d]) map[d] = { sales: 0, cogs: 0 };
      map[d].sales += m.total_sales - m.total_tax;
      map[d].cogs += calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    }
    const result: Record<string, { sales: number; marginPct: number }> = {};
    for (const [d, v] of Object.entries(map)) {
      result[d] = { sales: v.sales, marginPct: v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0 };
    }
    return result;
  }, [lyMargins]);

  const allSelected = ctx.selectedWeekDay === "";
  const unit = gradingMetric === "margin" ? "pts" : "pct";

  const handleDayClick = (isoDate: string) => {
    const formatted = formatDate(isoDate);
    dispatch(actions.setSelectedWeekDay(ctx.selectedWeekDay === formatted ? "" : formatted));
  };

  const rangeLabel =
    dates.length > 1
      ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
      : dates.length === 1 ? formatDate(dates[0]) : "";

  const twAll = useMemo(() => agg(ctx.margins), [ctx.margins]);
  const lyAll = useMemo(() => agg(lyMargins), [lyMargins]);

  return (
    <div className="flex border-b border-gray-100">
      {/* All week */}
      <div
        className={`flex flex-col items-center justify-center px-3 py-2 border-r-2 border-gray-200 transition-colors cursor-pointer select-none flex-[1.3] ${
          allSelected ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
        }`}
        style={allSelected ? selectedStyle : undefined}
        onClick={() => dispatch(actions.setSelectedWeekDay(""))}
      >
        <span className="text-[10px] font-semibold text-content">All week</span>
        <span className="text-[8px] mt-0.5 text-content/35">{rangeLabel}</span>
        <DeltaBadge
          tyVal={unit === "pts" ? twAll.marginPct : twAll.sales}
          lyVal={unit === "pts" ? lyAll.marginPct : lyAll.sales}
          unit={unit}
        />
      </div>

      {/* Individual days */}
      {dates.map((isoDate) => {
        const formatted = formatDate(isoDate);
        const isSelected = ctx.selectedWeekDay === formatted;
        const [year, month, day] = isoDate.split("-").map(Number);
        const dow = new Date(year, month - 1, day).getDay();
        const lyIsoDate = setDates(new Date(isoDate), 364);

        const twDay = agg(ctx.margins.filter((m) => m.sale_date.split("T")[0] === isoDate));
        const lyDay = lyByDate[lyIsoDate] ?? { sales: 0, marginPct: 0 };

        return (
          <div
            key={isoDate}
            className={`flex flex-col items-center justify-center px-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors cursor-pointer select-none flex-1 ${
              isSelected ? "bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
            style={isSelected ? selectedStyle : undefined}
            onClick={() => handleDayClick(isoDate)}
          >
            <span className="text-[10px] font-semibold text-content">{DAY_LABELS[dow]}</span>
            <span className="text-[8px] mt-0.5 text-content/35">{`${month}/${day}`}</span>
            <DeltaBadge
              tyVal={unit === "pts" ? twDay.marginPct : twDay.sales}
              lyVal={unit === "pts" ? lyDay.marginPct : lyDay.sales}
              unit={unit}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SmDevDaySidebar;
