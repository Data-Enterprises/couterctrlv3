import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatDate } from "../widgets";
import { setDates } from "../..";
import type { SubDeptMargin } from "../../../../interfaces";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const selectedStyle = { boxShadow: "inset 0 -4px 0 rgba(30, 42, 74, 0.5)" };

const netSales = (rows: SubDeptMargin[]) =>
  rows.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);

const DeltaBadge = ({ tw, ly }: { tw: number; ly: number }) => {
  if (!ly) return <span className="text-[9px] font-semibold mt-0.5 text-content/25">—</span>;
  const pct = ((tw - ly) / Math.abs(ly)) * 100;
  const isUp = pct >= 0;
  return (
    <span
      className="text-[9px] font-bold mt-0.5"
      style={{ color: isUp ? "#16a34a" : "#dc2626" }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const SmDevDaySidebar = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const dates = useMemo(
    () =>
      Array.from(
        new Set(ctx.margins.map((m) => m.sale_date.split("T")[0])),
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [ctx.margins],
  );

  // LY margins for the currently selected week
  const lyMargins = useMemo(() => {
    switch (ctx.selectedWeek) {
      case 1: return ctx.weekOneMarginsLY;
      case 2: return ctx.weekTwoMarginsLY;
      case 3: return ctx.weekThreeMarginsLY;
      case 4: return ctx.weekFourMarginsLY;
      case 5: return [
        ...ctx.weekOneMarginsLY,
        ...ctx.weekTwoMarginsLY,
        ...ctx.weekThreeMarginsLY,
        ...ctx.weekFourMarginsLY,
      ];
      default: return [];
    }
  }, [
    ctx.selectedWeek,
    ctx.weekOneMarginsLY,
    ctx.weekTwoMarginsLY,
    ctx.weekThreeMarginsLY,
    ctx.weekFourMarginsLY,
  ]);

  // Build a lookup: LY ISO date → net sales for that day
  const lyByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of lyMargins) {
      const d = m.sale_date.split("T")[0];
      map[d] = (map[d] ?? 0) + (m.total_sales - m.total_tax);
    }
    return map;
  }, [lyMargins]);

  const allSelected = ctx.selectedWeekDay === "";

  const handleDayClick = (isoDate: string) => {
    const formatted = formatDate(isoDate);
    dispatch(actions.setSelectedWeekDay(ctx.selectedWeekDay === formatted ? "" : formatted));
  };

  const rangeLabel =
    dates.length > 1
      ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
      : dates.length === 1
        ? formatDate(dates[0])
        : "";

  // All-week totals
  const twTotal = useMemo(() => netSales(ctx.margins), [ctx.margins]);
  const lyTotal = useMemo(() => netSales(lyMargins), [lyMargins]);

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
        <DeltaBadge tw={twTotal} ly={lyTotal} />
      </div>

      {/* Individual days */}
      {dates.map((isoDate) => {
        const formatted = formatDate(isoDate);
        const isSelected = ctx.selectedWeekDay === formatted;
        const [year, month, day] = isoDate.split("-").map(Number);
        const dow = new Date(year, month - 1, day).getDay();

        // LY date is 364 days before this TW date
        const lyIsoDate = setDates(new Date(isoDate), 364);
        const twDaySales = netSales(ctx.margins.filter((m) => m.sale_date.split("T")[0] === isoDate));
        const lyDaySales = lyByDate[lyIsoDate] ?? 0;

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
            <DeltaBadge tw={twDaySales} ly={lyDaySales} />
          </div>
        );
      })}
    </div>
  );
};

export default SmDevDaySidebar;
