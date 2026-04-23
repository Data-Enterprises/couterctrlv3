import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setTrackerKpis, type TrackerKpis } from "../../../features/salesSlice";
import { formatDate } from ".";
import { formatCurrency2 } from "../../../utils";
import {
  HandThumbDownIcon,
  HandThumbUpIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const SalesTrackerKpis = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);

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
        dispatch(setTrackerKpis(result));
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
    <div className="grid grid-cols-5 gap-4 mb-2 font-medium">
      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60">Date Range</div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-5 h-5 text-content stroke-2" />
          {sales.trackerKpis.dateRange}
        </div>
      </div>
      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60">Total Sales This Year</div>
        <div className="flex items-center gap-0.5">
          {formatCurrency2(sales.trackerKpis.tyTotalSales)}
        </div>
      </div>
      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60">Total Sales Last Year</div>
        <div className="flex items-center gap-0.5">
          {formatCurrency2(sales.trackerKpis.lyTotalSales)}
        </div>
      </div>
      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60">Total Sales $ Change</div>
        <div
          className={`${textColorClass(sales.trackerKpis.dollarChange)} flex items-center gap-1`}
        >
          {renderIcon(sales.trackerKpis.dollarChange)}
          {formatCurrency2(sales.trackerKpis.dollarChange)}
        </div>
      </div>
      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60">Total Sales % Change</div>
        <div
          className={`${textColorClass(sales.trackerKpis.percentChange)} flex items-center gap-1`}
        >
          {renderIcon(sales.trackerKpis.percentChange)}
          {sales.trackerKpis.percentChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerKpis;
