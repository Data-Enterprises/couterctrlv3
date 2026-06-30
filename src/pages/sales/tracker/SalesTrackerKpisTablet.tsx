import { useSalesState } from "../hooks/useSalesState";
import { useEffect } from "react";
import { useAppDispatch } from "../../../hooks";
import { useSalesActions } from "../hooks/useSalesActions";
import type { TrackerKpis } from "../../../features/salesSlice";
import { formatDate } from ".";
import { formatCurrency2 } from "../../../utils";
import {
  HandThumbDownIcon,
  HandThumbUpIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const SalesTrackerKpisTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSalesActions();
  const sales = useSalesState();

  useEffect(() => {
    if (sales.tyReducedTotals.length > 0) {
      const calcTotals = () => {
        const thisYear = sales.tyCollapsedSubSales.flat();
        const lastYear = sales.lyCollapsedSubSales.flat();

        const tyTotalSales = thisYear.reduce(
          (acc, sale) => acc + sale.total_sales - sale.total_tax,
          0,
        );
        const lyTotalSales = lastYear.reduce(
          (acc, sale) => acc + sale.total_sales - sale.total_tax,
          0,
        );

        const percentChange =
          lyTotalSales === 0
            ? 0
            : ((tyTotalSales - lyTotalSales) / lyTotalSales) * 100;

        const dollarChange = tyTotalSales - lyTotalSales;

        const justDates = Array.from(
          new Set(thisYear.map((sale) => sale.sale_date)),
        ).sort((a, b) => a.localeCompare(b));
        const dateRange = `${formatDate(justDates[0])} - ${formatDate(justDates[justDates.length - 1])}`;

        const result: TrackerKpis = {
          tyTotalSales,
          lyTotalSales,
          percentChange,
          dollarChange,
          dateRange,
        };
        console.log("Result Object:", result);
        dispatch(actions.setTrackerKpis(result));
      };
      calcTotals();
    }
  }, [sales.tyReducedTotals]);

  const textColorClass = (num: number) => {
    if (num > 0) {
      return "text-emerald-500";
    }
    if (num < 0) {
      return "text-orange-500";
    }
    return "text-content";
  };

  const renderIcon = (num: number) => {
    if (num > 0) {
      return <HandThumbUpIcon className="w-4 h-4 text-emerald-500" />;
    }
    if (num < 0) {
      return <HandThumbDownIcon className="w-4 h-4 text-orange-500" />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-2 font-medium">
      <div className="rounded-2xl bg-custom-white p-4 shadow-lg ring-1 ring-slate-200/70 md:col-span-2 xl:col-span-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Date Range
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarIcon className="h-5 w-5 shrink-0 text-slate-500 stroke-2" />
          <span className="truncate">{sales.trackerKpis.dateRange}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-custom-white p-4 shadow-lg ring-1 ring-slate-200/70">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Sales This Year
        </div>
        <div className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
          {formatCurrency2(sales.trackerKpis.tyTotalSales)}
        </div>
      </div>

      <div className="rounded-2xl bg-custom-white p-4 shadow-lg ring-1 ring-slate-200/70">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Sales Last Year
        </div>
        <div className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
          {formatCurrency2(sales.trackerKpis.lyTotalSales)}
        </div>
      </div>

      <div className="rounded-2xl bg-custom-white p-4 shadow-lg ring-1 ring-slate-200/70">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Sales $ Change
        </div>
        <div
          className={`mt-2 flex items-center gap-2 text-lg font-semibold tabular-nums ${textColorClass(sales.trackerKpis.dollarChange)}`}
        >
          {renderIcon(sales.trackerKpis.dollarChange)}
          {formatCurrency2(sales.trackerKpis.dollarChange)}
        </div>
      </div>

      <div className="rounded-2xl bg-custom-white p-4 shadow-lg ring-1 ring-slate-200/70">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total Sales % Change
        </div>
        <div
          className={`mt-2 flex items-center gap-2 text-lg font-semibold tabular-nums ${textColorClass(sales.trackerKpis.percentChange)}`}
        >
          {renderIcon(sales.trackerKpis.percentChange)}
          {sales.trackerKpis.percentChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerKpisTablet;
