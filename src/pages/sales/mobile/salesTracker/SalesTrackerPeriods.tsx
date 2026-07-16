import { useMobileSalesCtx } from "../hooks";
import type { WeekTotal } from "../../../../features/salesSlice";
import {
  setSalesTrackerSelectedSubDept,
  setSalesTrackerView,
} from "../../../../features/salesMobileSlice";
import { formatCurrency2 } from "../../../../utils";
import { changeTextColor } from "../../tracker";

import { ResponsivePie } from "@nivo/pie";
import ReducedTotalsHeader from "./ReducedTotalsHeader";
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
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

    const atsTotalSales = !isNaN(tyTotalSales / totalTrans)
      ? tyTotalSales / totalTrans
      : 0;

    return {
      tyTotalSales,
      lyTotalSales,
      percentChange,
      dollarChange,
      atsTotalSales,
    };
  };

  const handleCardClick = (subId: number) => {
    ctx.dispatch(setSalesTrackerSelectedSubDept(subId));
    ctx.dispatch(setSalesTrackerView("weeks"));
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
          {ctx.uniqueSubsMobile.length > 0 ? (
            ctx.uniqueSubsMobile.map((sub, idx) => {
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
                  className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-2 ${
                    ctx.salesTrackerSelectedSubDept === subId
                      ? "bg-orange-100 shadow-orange-200 border-orange-300"
                      : "bg-custom-white hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => handleCardClick(subId)}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between gap-2 text-[10px]">
                      <div className="leading-tight">
                        <div className="font-semibold text-nowrap truncate">
                          {desc}
                        </div>
                        <div className="text-content/85 text-[10px]">
                          ID: {subId}
                        </div>
                      </div>

                      <div className="text-right leading-tight">
                        <div
                          className={`font-medium ${changeTextColor(totals.dollarChange, 0)}`}
                        >
                          {formatCurrency2(totals.dollarChange)}
                        </div>
                        <div className="text-[10px] text-content/85">
                          ATS: {formatCurrency2(totals.atsTotalSales)}
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
                        className={`absolute bottom-1 flex items-center justify-center text-[10px] font-bold ${changeTextColor(totals.percentChange, 0)}`}
                      >
                        {totals.percentChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-[1.5px] grid grid-cols-2">
                      <div className="bg-gradient-to-r from-content/25 to-custom-white"></div>
                      <div className="bg-gradient-to-l from-content/25 to-custom-white"></div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-end justify-between gap-1 text-[10px]">
                        <div className="text-left min-w-0">
                          <div className="text-content/85 -mb-0.5 text-[10px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[0] }}
                            ></div>
                            <div>TY Sales</div>
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(totals.tyTotalSales)}
                          </div>
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-content/85 -mb-0.5 text-[10px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[1] }}
                            ></div>
                            <div>LY Sales</div>
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
          ) : (
            <div className="flex-1 w-full grid overflow-y-hidden relative">
              <LoadingIndicator message="Processing subs period" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerPeriods;
