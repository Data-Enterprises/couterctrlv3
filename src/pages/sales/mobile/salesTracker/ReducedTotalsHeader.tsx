import { useEffect } from "react";
import { useMobileSalesCtx } from "../hooks";
import { formatDate } from "../../tracker";
import type { TrackerKpis } from "../../../../features/salesSlice";
import {
  setSalesTrackerSelectedSubDept,
  setTrackerKpisMobile,
} from "../../../../features/salesMobileSlice";
import { formatCurrency2 } from "../../../../utils";

const ReducedTotalsHeader = () => {
  const ctx = useMobileSalesCtx();

  useEffect(() => {
    if (ctx.tyReducedTotalsMobile.length > 0) {
      const calcTotals = () => {
        const thisYear = ctx.tyCollapsedSubSalesMobile.flat();
        const lastYear = ctx.lyCollapsedSubSalesMobile.flat();

        const tyTotalSales = thisYear
          .filter((s) =>
            ctx.salesTrackerSelectedSubDept > 0
              ? s.sub_department === ctx.salesTrackerSelectedSubDept
              : true,
          )
          .reduce((acc, sale) => acc + sale.total_sales - sale.total_tax, 0);
        const lyTotalSales = lastYear
          .filter((s) =>
            ctx.salesTrackerSelectedSubDept > 0
              ? s.sub_department === ctx.salesTrackerSelectedSubDept
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
        ctx.dispatch(setTrackerKpisMobile(result));
      };
      calcTotals();
    }
  }, [ctx.tyReducedTotalsMobile, ctx.salesTrackerSelectedSubDept]);

  const findSubName = () => {
    return ctx.uniqueSubsMobile.filter(
      (s) => s.id === ctx.salesTrackerSelectedSubDept,
    )[0]?.desc;
  };

  const handleHeaderClick = () => {
    ctx.dispatch(setSalesTrackerSelectedSubDept(0));
  };

  return (
    <div
      className="bg-custom-white px-3 py-2 rounded-lg font-medium shadow-sm border border-content/15"
      onClick={handleHeaderClick}
    >
      <div className="text-[13px] font-semibold text-content truncate">
        Viewing:{" "}
        {ctx.salesTrackerSelectedSubDept === 0
          ? "All Sub Departments"
          : findSubName()}
      </div>
      <div className="flex items-center justify-between text-xs text-content/60">
        <span className=" text-xs">{ctx.trackerKpis.dateRange}</span>
        <div className="flex gap-1 text-xs ">
          <span className="text-emerald-600 font-semibold">
            {formatCurrency2(ctx.trackerKpis.dollarChange)}
          </span>
          <span
            className={`font-semibold ${ctx.trackerKpis.dollarChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            ({ctx.trackerKpis.percentChange.toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className="pt-1 border-t border-content/15">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-content/60 text-[11px]">TY Sales</span>
            <div className=" font-semibold text-content">
              {formatCurrency2(ctx.trackerKpis.tyTotalSales)}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-content/60 text-[11px]">LY Sales</span>
            <div className=" font-semibold text-content">
              {formatCurrency2(ctx.trackerKpis.lyTotalSales)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReducedTotalsHeader;
