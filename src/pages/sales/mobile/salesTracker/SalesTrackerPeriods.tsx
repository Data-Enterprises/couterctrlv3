import { useMobileSalesCtx } from "../hooks";
import type { SubTracker, WeekTotal } from "../../../../features/salesSlice";
import { useEffect } from "react";
import {
  setSalesTrackerSelectedSubDept,
  setTyReducedTotalsMobile,
  setUniqueSubsMobile,
} from "../../../../features/salesMobileSlice";
import type { SubSale } from "../../../../interfaces";
import { formatCurrency2, sameWeekDayLastYear } from "../../../../utils";
import { changeTextColor, chunkData } from "../../tracker";

import { ResponsivePie } from "@nivo/pie";
import ReducedTotalsHeader from "./ReducedTotalsHeader";
const colors = [
  "#00CC55",
  "#0099AA",
  "#0066FF",
  "#3b82f6",
  "#6688FF",
  "#FF9900",
  "#CC8844",
];

const SalesTrackerPeriods = () => {
  const ctx = useMobileSalesCtx();

  useEffect(() => {
    if (ctx.thisYrSubTrackerMobile.length > 0) {
      const uniqueSubs: SubTracker[] = ctx.thisYrSubTrackerMobile.reduce(
        (acc: SubTracker[], sale) => {
          const exists = acc.find((s) => s.id === sale.sub_department);
          if (!exists) {
            acc.push({
              id: sale.sub_department,
              desc: sale.sub_department_description,
            });
          }
          return acc;
        },
        [],
      );
      ctx.dispatch(setUniqueSubsMobile(uniqueSubs));

      const calcTotals = () => {
        const thisYear = ctx.tyCollapsedSubSalesMobile.flat();
        const lastYear = ctx.lyCollapsedSubSalesMobile.flat();

        const weekTotals: WeekTotal[] = thisYear.reduce(
          (acc: WeekTotal[], week: SubSale) => {
            const found = acc.find(
              (w) =>
                w.sale_date === week.sale_date &&
                w.storeid === week.storeid &&
                w.subDept === week.sub_department,
            );
            const saleDateLY = sameWeekDayLastYear(week.sale_date);

            const lySale = lastYear.find(
              (ly) =>
                ly.sale_date.split("T")[0] === saleDateLY.date &&
                ly.storeid === week.storeid &&
                ly.sub_department === week.sub_department,
            );

            const salesLY = lySale ? lySale.total_sales - lySale.total_tax : 0;

            if (found) {
              found.salesTY += week.total_sales;
              found.salesLY += salesLY;
              found.transaction_count += week.transaction_count;
            } else {
              acc.push({
                sale_date: week.sale_date,
                storeName: week.store_name,
                storeid: week.storeid,
                subDesc: week.sub_department_description,
                subDept: week.sub_department,
                salesTY: week.total_sales,
                salesLY,
                totalSalesDollarChange: 0,
                totalSalesPercentChange: 0,
                atsTotalSales: 0,
                transaction_count: week.transaction_count,
              });
            }
            return acc;
          },
          [],
        );

        const withChanges = weekTotals.map((week) => {
          const dollarChange = week.salesTY - week.salesLY;
          const percentChange =
            week.salesLY === 0 ? 0 : (dollarChange / week.salesLY) * 100;
          const atsTotalSales = week.salesTY / week.transaction_count;
          return {
            ...week,
            totalSalesDollarChange: dollarChange,
            totalSalesPercentChange: percentChange,
            atsTotalSales,
          };
        });

        const copy = [...withChanges];
        const subIds = Array.from(new Set(withChanges.map((w) => w.subDept)));

        const grouped = withChanges.reduce((acc: WeekTotal[][][], _, i) => {
          const subId = subIds[i];
          if (subId) {
            const filtered = copy
              .filter((w) => w.subDept === subId)
              .sort((a, b) => a.sale_date.localeCompare(b.sale_date));
            const grouped = chunkData(filtered);
            acc.push(grouped);
          }
          return acc;
        }, []);

        return grouped;
      };

      ctx.dispatch(setTyReducedTotalsMobile(calcTotals()));
    }
  }, [ctx.tyCollapsedSubSalesMobile, ctx.lyCollapsedSubSalesMobile]);

  const calcTotals = (data: WeekTotal[][]) => {
    const tyTotalSales = data.reduce((acc, weekGroup) => {
      return (
        acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesTY, 0)
      );
    }, 0);

    const lyTotalSales = data.reduce((acc, weekGroup) => {
      return (
        acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesLY, 0)
      );
    }, 0);

    const percentChange =
      lyTotalSales === 0
        ? 0
        : ((tyTotalSales - lyTotalSales) / lyTotalSales) * 100;
    const dollarChange = tyTotalSales - lyTotalSales;

    const totalTrans = data.reduce((acc, weekGroup) => {
      return (
        acc +
        weekGroup.reduce((weekAcc, week) => weekAcc + week.transaction_count, 0)
      );
    }, 0);

    const atsTotalSales = tyTotalSales / totalTrans;

    return {
      tyTotalSales,
      lyTotalSales,
      percentChange,
      dollarChange,
      atsTotalSales,
    };
  };

  const handleRowClick = (subId: number) => {
    ctx.dispatch(setSalesTrackerSelectedSubDept(subId));
  };

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="space-y-3 p-3">
      <ReducedTotalsHeader />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {ctx.uniqueSubsMobile.length > 0
          ? ctx.uniqueSubsMobile.map((sub, idx) => {
              const subId = sub.id;
              const desc = sub.desc;
              const filtered = ctx.tyReducedTotalsMobile
                .filter((week) => week[0][0].subDept === subId)
                .flat();
              const totals = calcTotals(filtered);
              const pieData = [
                { id: "TY", value: totals.tyTotalSales, color: colors[0] },
                { id: "LY", value: totals.lyTotalSales, color: colors[1] },
              ];

              return (
                <div
                  key={idx}
                  className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                    ctx.salesTrackerSelectedSubDept === subId
                      ? "bg-orange-100 shadow-orange-200"
                      : "bg-custom-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleRowClick(subId)}
                >
                  <div className="px-2 py-1.5 space-y-1.5">
                    <div>
                      <div className="font-semibold text-[11px] truncate">
                        {desc}
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="text-[10px]">
                          ATS: {formatCurrency2(totals.atsTotalSales)}
                        </div>
                        <div
                          className={`text-[9.8px] font-bold ${changeTextColor(totals.dollarChange, 0)}`}
                        >
                          {formatCurrency2(totals.dollarChange)}
                        </div>
                      </div>
                    </div>

                    {/* Half-pie + % overlay */}
                    <div className="relative h-14 w-full flex items-center justify-center">
                      <div className="w-full h-full min-w-0">
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
                            const compare =
                              found === 0 ? pieData[1].value : pieData[0].value;
                            if (data < compare)
                              return rgbaColor(colors[found], 0.3);

                            return colors[found];
                          }}
                          isInteractive={false}
                          animate={false}
                        />
                      </div>
                      <div
                        className={`absolute bottom-1 flex items-center justify-center text-[10px] font-bold ${changeTextColor(totals.percentChange, 0)}`}
                      >
                        {totals.percentChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-[1.5px] grid grid-cols-2">
                      <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
                      <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-end justify-between gap-1 text-[9.5px]">
                        <div className="text-left min-w-0">
                          <div className="text-content/60 block -mb-0.5 text-[9px] leading-tight">
                            TY Sales
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(totals.tyTotalSales)}
                          </div>
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-content/60 block -mb-0.5 text-[9px] leading-tight">
                            LY Sales
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(totals.lyTotalSales)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
};

export default SalesTrackerPeriods;
