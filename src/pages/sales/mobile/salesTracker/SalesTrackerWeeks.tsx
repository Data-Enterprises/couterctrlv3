import { ResponsivePie } from "@nivo/pie";
import type { WeekTotal } from "../../../../features/salesSlice";
import { addDays, formatCurrency2 } from "../../../../utils";
import { formatDate, changeTextColor, chunkData } from "../../tracker"; // 👈 Added missing import
import { useMobileSalesCtx } from "../hooks";
import ReducedTotalsHeader from "./ReducedTotalsHeader";
import {
  setSalesTrackerSelectedSubDept,
  setSalesTrackerSelectedWeek,
  setSalesTrackerView,
} from "../../../../features/salesMobileSlice";

const colors = [
  "#00CC55",
  "#0099AA",
  "#0066FF",
  "#3b82f6",
  "#6688FF",
  "#FF9900",
  "#CC8844",
];

const SalesTrackerWeeks = () => {
  const ctx = useMobileSalesCtx();

  const filteredSubs = () => {
    if (ctx.salesTrackerSelectedSubDept === -1) {
      return ctx.uniqueSubsMobile;
    }
    return [...ctx.uniqueSubsMobile].filter(
      (sub) => sub.id === ctx.salesTrackerSelectedSubDept,
    );
  };

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
    const atsTotalSales = totalTrans === 0 ? 0 : tyTotalSales / totalTrans;

    return {
      tyTotalSales,
      lyTotalSales,
      percentChange,
      dollarChange,
      atsTotalSales,
    };
  };

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] px-3 py-2 space-y-2">
      <ReducedTotalsHeader />
      <div className="flex-1 w-full grid overflow-y-hidden">
        <div className="grid grid-cols-2 gap-2 overflow-y-auto">
          {filteredSubs().map((sub) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filteredBySub = ctx.tyReducedTotalsMobile
              .filter((wg) => wg[0][0]?.subDept === subId)
              .flat();

            const storeName = filteredBySub[0][0]?.storeName || "";
            const storeId = filteredBySub[0][0]?.storeid || 0;
            const missingDates: WeekTotal[] = [];
            const flattened = [...filteredBySub].flat();

            flattened.flat().forEach((d, i) => {
              if (i < flattened.length - 1) {
                let currentDateCheck = addDays(new Date(d.sale_date), 1)
                  .toISOString()
                  .split("T")[0];

                while (
                  currentDateCheck !== flattened[i + 1].sale_date.split("T")[0]
                ) {
                  const defaultWekTotal: WeekTotal = {
                    sale_date: currentDateCheck + "T00:00:00",
                    subDept: subId,
                    subDesc: desc,
                    salesTY: 0,
                    salesLY: 0,
                    atsTotalSales: 0,
                    storeid: storeId,
                    storeName: storeName,
                    transaction_count: 0,
                    totalSalesDollarChange: 0,
                    totalSalesPercentChange: 0,
                  };
                  missingDates.push(defaultWekTotal);
                  currentDateCheck = addDays(new Date(currentDateCheck), 1)
                    .toISOString()
                    .split("T")[0];
                }
              }
            });

            const concatWithMissing = [...flattened, ...missingDates].sort(
              (a, b) => a.sale_date.localeCompare(b.sale_date),
            );

            const filteredWithMissing = chunkData(concatWithMissing);

            return filteredWithMissing.map((week, idx) => {
              const totalsWithMissing = calcTotals([concatWithMissing]);
              // const weekTotals = calcTotals([week]);
              const pieData = [
                {
                  id: "TY",
                  value: totalsWithMissing.tyTotalSales,
                  color: colors[0],
                },
                {
                  id: "LY",
                  value: totalsWithMissing.lyTotalSales,
                  color: colors[1],
                },
              ];
              return (
                <div
                  key={idx}
                  className="rounded-xl border bg-custom-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-2"
                  onClick={() => {
                    if (ctx.salesTrackerSelectedSubDept === subId) {
                      ctx.dispatch(setSalesTrackerSelectedWeek(idx));
                      ctx.dispatch(setSalesTrackerView("days"));
                    } else {
                      ctx.dispatch(setSalesTrackerSelectedSubDept(subId));
                    }
                  }}
                >
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex justify-between font-medium">
                        <div>{desc}</div>
                        <div>Week: {idx + 1}</div>
                      </div>
                      <div className="flex justify-between text-[10px] text-content/85">
                        <div>WS: {formatDate(week[0].sale_date)}</div>
                        <div
                          className={`font-bold ${changeTextColor(totalsWithMissing.dollarChange, 0)}`}
                        >
                          {formatCurrency2(totalsWithMissing.dollarChange)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end text-[10px]">
                        <div className="text-content/85">
                          WE: {formatDate(week[week.length - 1].sale_date)}
                        </div>
                        <div className="text-content/85">
                          ATS:{" "}
                          {formatCurrency2(totalsWithMissing.atsTotalSales)}
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
                          animate={true}
                        />
                      </div>
                      <div
                        className={`absolute bottom-1 flex items-center justify-center text-[10px] font-bold ${changeTextColor(totalsWithMissing.percentChange, 0)}`}
                      >
                        {totalsWithMissing.percentChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-[1.5px] grid grid-cols-2">
                      <div className="bg-gradient-to-r from-content/25 to-custom-white"></div>
                      <div className="bg-gradient-to-l from-content/25 to-custom-white"></div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-end justify-between gap-1 text-[9.5px]">
                        <div className="text-left min-w-0">
                          <div className="text-content/85 -mb-0.5 text-[9px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[0] }}
                            ></div>
                            <div>TY Sales</div>
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(totalsWithMissing.tyTotalSales)}
                          </div>
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-content/85 -mb-0.5 text-[9px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[1] }}
                            ></div>
                            <div>LY Sales</div>
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(totalsWithMissing.lyTotalSales)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerWeeks;
