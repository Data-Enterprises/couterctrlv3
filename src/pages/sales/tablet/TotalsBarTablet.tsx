import { useSalesState } from "../hooks/useSalesState";
import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { formatDateSimple, sameWeekDayLastYear } from "../../../utils";
import MetricCard from "./MetricCard";

type CompareData = {
  title: string;
  ty: number;
  ly: number;
};

const TotalsBarTablet = () => {
  const [barData, setBarData] = useState<CompareData[]>([]);
  const [dateRange, setDateRange] = useState<string>("");
  const state = useSalesState();

  useEffect(() => {
    const data =
      state.selectedSalesPanel.storeid > 0
        ? [...state.weeklySales].filter(
            (sale) => sale.storeid === state.selectedSalesPanel.storeid,
          )
        : [...state.weeklySales];

    const lyData =
      state.selectedSalesPanel.storeid > 0
        ? [...state.weeklySalesLastYear].filter(
            (sale) => sale.storeid === state.selectedSalesPanel.storeid,
          )
        : [...state.weeklySalesLastYear];

    const dates = Array.from(
      new Set(data.map((d) => d.sale_date.split("T")[0])),
    ).sort();

    setDateRange(
      `${formatDateSimple(dates[0])} - ${formatDateSimple(dates[dates.length - 1])}`,
    );

    const comparison: CompareData[] = data.map((d) => {
      const lyDate = sameWeekDayLastYear(d.sale_date).date;
      const found = lyData.find((ly) => ly.sale_date.split("T")[0] === lyDate);
      if (found) {
        return {
          title: d.sale_date,
          ty: d.total_sales,
          ly: found.total_sales,
        };
      } else {
        return {
          title: d.sale_date,
          ty: d.total_sales,
          ly: 0,
        };
      }
    });

    setBarData(comparison);
  }, [state.selectedSalesPanel, state.weeklySales]);
  return (
    <div className="bg-custom-white rounded-2xl shadow-lg ring-1 ring-slate-200/70 w-full overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <div className="text-lg font-semibold text-content">Daily Sales</div>
        <div className="flex items-center justify-between text-sm text-content/60">
          <div>Week day comparison for this year vs last year</div>
          <div className="font-medium text-content">{dateRange}</div>
        </div>
      </div>

      <div className="px-2 grid grid-cols-2">
        <div className="h-[1.5px] bg-gradient-to-r from-blue-200 to-custom-white" />
        <div className="h-[1.5px] bg-gradient-to-l from-blue-200 to-custom-white" />
      </div>

      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {barData.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
};

export default TotalsBarTablet;
