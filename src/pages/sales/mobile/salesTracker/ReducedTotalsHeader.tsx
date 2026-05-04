import { useEffect, useState } from "react";
import { useMobileSalesCtx } from "../hooks";
import { formatDate } from "../../tracker";
import type { TrackerKpis } from "../../../../features/salesSlice";
import {
  setSalesTrackerSelectedSubDept,
  setTrackerKpisMobile,
} from "../../../../features/salesMobileSlice";
import { formatCurrency2 } from "../../../../utils";
import { ResponsivePie } from "@nivo/pie";

const colors = [
  "#00CC55",
  "#0099AA",
  "#0066FF",
  "#3b82f6",
  "#6688FF",
  "#FF9900",
  "#CC8844",
];

const ReducedTotalsHeader = () => {
  const ctx = useMobileSalesCtx();
  const [pieData, setPieData] = useState<
    { id: string; value: number; color: string }[]
  >([]);

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

        setPieData([
          { id: "TY", value: tyTotalSales, color: colors[0] },
          { id: "LY", value: lyTotalSales, color: colors[1] },
        ]);

        return result;
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
    ctx.dispatch(setSalesTrackerSelectedSubDept(-1));
  };

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div
      className="bg-custom-white px-3 py-1.5 rounded-lg font-medium shadow-sm border border-content/15"
      onClick={handleHeaderClick}
    >
      <div className="text-[11.5px] font-semibold text-content truncate flex justify-between">
        <div>
          {ctx.salesTrackerSelectedSubDept === 0
            ? "All Sub Departments"
            : findSubName()}
        </div>
        <div className="text-emerald-600 font-semibold">
          {formatCurrency2(ctx.trackerKpis.dollarChange)}
        </div>
      </div>
      <div className="h-[1.5px] grid grid-cols-2 mb-1.5">
        <div className="bg-gradient-to-r from-content/25 to-custom-white"></div>
        <div className="bg-gradient-to-l from-content/25 to-custom-white"></div>
      </div>
      <div className="grid grid-cols-[53%_46%] gap-2">
        {/* col 1 */}
        <div className="text-content/60 text-[10px] grid grid-cols-2 gap-y-1">
          <div className="text-content/60">
            <div>Period Start</div>
            <div className="text-content">
              {ctx.trackerKpis.dateRange.split(" - ")[0]}
            </div>
          </div>
          <div className="text-content/60">
            <div>Period End</div>
            <div className="text-content">
              {ctx.trackerKpis.dateRange.split(" - ")[1]}
            </div>
          </div>
          <div className="">
            <div className="flex gap-1 items-center">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: colors[0] }}
              ></div>
              TY Sales
            </div>
            <div className="font-semibold text-content">
              {formatCurrency2(ctx.trackerKpis.tyTotalSales)}
            </div>
          </div>
          <div className="">
            <div className="flex gap-1 items-center">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: colors[1] }}
              ></div>
              LY Sales
            </div>
            <div className="font-semibold text-content">
              {formatCurrency2(ctx.trackerKpis.lyTotalSales)}
            </div>
          </div>
        </div>

        {/* col 2 */}
        <div className="w-full min-h-14 relative">
          <ResponsivePie
            data={pieData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            startAngle={-90}
            endAngle={90}
            innerRadius={0.55}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            colors={(param) => {
              const data = param.data.value;
              const found = pieData.indexOf(param.data);
              const compare = found === 0 ? pieData[1].value : pieData[0].value;
              if (data < compare) return rgbaColor(colors[found], 0.3);
              return colors[found];
            }}
            isInteractive={false}
            animate={true}
          />
          <div
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold ${ctx.trackerKpis.dollarChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {ctx.trackerKpis.percentChange.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReducedTotalsHeader;
