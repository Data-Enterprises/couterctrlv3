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
} from "@heroicons/react/24/outline";

const SalesTrackerKpis = () => {
  const dispatch = useAppDispatch();
  const actions = useSalesActions();
  const sales = useSalesState();

  useEffect(() => {
    if (sales.tyReducedTotals.length > 0) {
      const calcTotals = () => {
        const thisYear = sales.tyCollapsedSubSales.flat();
        const lastYear = sales.lyCollapsedSubSales.flat();

        const tyTotalSales = thisYear
          .filter((s) =>
            sales.salesTrackerSelectedSubDept > 0
              ? s.sub_department === sales.salesTrackerSelectedSubDept
              : true,
          )
          .reduce((acc, sale) => acc + sale.total_sales - sale.total_tax, 0);
        const lyTotalSales = lastYear
          .filter((s) =>
            sales.salesTrackerSelectedSubDept > 0
              ? s.sub_department === sales.salesTrackerSelectedSubDept
              : true,
          )
          .reduce((acc, sale) => acc + sale.total_sales - sale.total_tax, 0);

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
        dispatch(actions.setTrackerKpis(result));
      };
      calcTotals();
    }
  }, [sales.tyReducedTotals, sales.salesTrackerSelectedSubDept]);

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
    <div className="grid text-[12px] grid-cols-7 gap-3 mb-2 font-medium">
      <div className="py-2 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">Viewing</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="">
            {sales.salesTrackerSelectedSubDept === 0
              ? "All Sub Depts"
              : sales.uniqueSubs.filter(
                  (s) => s.id === sales.salesTrackerSelectedSubDept,
                )[0].desc}
          </span>
        </div>
      </div>
      <div className="py-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">Period Start</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="">
            {sales.trackerKpis.dateRange.split(" - ")[0]}
          </span>
        </div>
      </div>
      <div className="py-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">Period End</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="">
            {sales.trackerKpis.dateRange.split(" - ")[1]}
          </span>
        </div>
      </div>

      <div className="py-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">TY Total Sales</div>
        <div className="mt-1 font-semibold">
          {formatCurrency2(sales.trackerKpis.tyTotalSales)}
        </div>
      </div>

      <div className="p-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">LY Total Sales</div>
        <div className="mt-1 font-semibold">
          {formatCurrency2(sales.trackerKpis.lyTotalSales)}
        </div>
      </div>

      <div className="py-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">Total Sales $ Change</div>
        <div
          className={`${textColorClass(sales.trackerKpis.dollarChange)} flex items-center gap-1 mt-1`}
        >
          {renderIcon(sales.trackerKpis.dollarChange)}
          <span className="font-semibold">
            {formatCurrency2(sales.trackerKpis.dollarChange)}
          </span>
        </div>
      </div>

      <div className="py-4 bg-custom-white rounded-lg shadow-lg flex flex-col justify-center items-center">
        <div className="text-content/60 ">Total Sales % Change</div>
        <div
          className={`${textColorClass(sales.trackerKpis.percentChange)} flex items-center gap-1 mt-1`}
        >
          {renderIcon(sales.trackerKpis.percentChange)}
          <span className="font-semibold">
            {sales.trackerKpis.percentChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerKpis;
