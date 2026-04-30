import { useEffect } from "react";
import { useMobileSalesCtx } from "../hooks";
import { formatDate } from "../../tracker";
import type { TrackerKpis } from "../../../../features/salesSlice";
import { setTrackerKpisMobile } from "../../../../features/salesMobileSlice";
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

  return (
    <div className="bg-custom-white px-3 py-2 rounded-lg font-medium">
      <div>
        Viewing: {ctx.salesTrackerSelectedSubDept === 0 ? "All" : findSubName()}
      </div>
      <div>Period Start: {ctx.trackerKpis.dateRange.split(" - ")[0]}</div>
      <div>Period End: {ctx.trackerKpis.dateRange.split(" - ")[1]}</div>
      <div>TY Total Sales: {formatCurrency2(ctx.trackerKpis.tyTotalSales)}</div>
      <div>LY Total Sales: {formatCurrency2(ctx.trackerKpis.lyTotalSales)}</div>
      <div>Dollar Change: {formatCurrency2(ctx.trackerKpis.dollarChange)}</div>
      <div>Percent Change: {ctx.trackerKpis.percentChange.toFixed(2)}%</div>
    </div>
  );
};

export default ReducedTotalsHeader;
