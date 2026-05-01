import { ResponsivePie } from "@nivo/pie";
import type { WeekTotal } from "../../../../features/salesSlice";
import { formatCurrency2 } from "../../../../utils";
import { formatDate, changeTextColor } from "../../tracker"; // 👈 Added missing import
import { useMobileSalesCtx } from "../hooks";
import ReducedTotalsHeader from "./ReducedTotalsHeader";
import { setSalesTrackerSelectedSubDept } from "../../../../features/salesMobileSlice";

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
    if (ctx.salesTrackerSelectedSubDept === 0) {
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
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            return filteredBySub.map((week, idx) => {
              const weekTotals = calcTotals([week]);
              const pieData = [
                {
                  id: "TY",
                  value: weekTotals.tyTotalSales,
                  color: colors[0],
                },
                {
                  id: "LY",
                  value: weekTotals.lyTotalSales,
                  color: colors[1],
                },
              ];
              return (
                <div
                  key={idx}
                  className="rounded-xl border bg-custom-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-2"
                  onClick={() =>
                    ctx.dispatch(setSalesTrackerSelectedSubDept(subId))
                  }
                >
                  {/* <div className="font-medium select-none">
                    <div className="grid grid-cols-2">
                      <div className="col-span-2 text-content/60 truncate">
                        {desc} Week {idx + 1}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-content/80">
                        {formatDate(week[0].sale_date)} –{" "}
                        {formatDate(week[week.length - 1].sale_date)}
                      </div>
                      <div
                        className={`text-right font-medium ${changeTextColor(weekTotals.dollarChange, 0)}`}
                      >
                        {formatCurrency2(weekTotals.dollarChange)} (
                        {weekTotals.percentChange.toFixed(2)}%)
                      </div>
                    </div>

                    <div className="h-px grid grid-cols-2 my-2">
                      <div className="bg-gradient-to-r from-content/15 to-custom-white" />
                      <div className="bg-gradient-to-l from-content/15 to-custom-white" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.3fr] items-start">
                      <div className="bg-bkg/70 px-2 py-2 rounded-lg border border-content/15 shadow-sm">
                        <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 text-[10px] sm:text-[11px] leading-tight">
                          <div className="text-content/60">TY Sales</div>
                          <div className="text-right font-medium">
                            {formatCurrency2(weekTotals.tyTotalSales)}
                          </div>

                          <div className="text-content/60">LY Sales</div>
                          <div className="text-right font-medium">
                            {formatCurrency2(weekTotals.lyTotalSales)}
                          </div>

                          <div className="text-content/60">ATS Sales</div>
                          <div className="text-right font-medium">
                            {formatCurrency2(weekTotals.atsTotalSales)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex justify-between font-medium">
                        <div>{desc}</div>
                        <div>Week: {idx + 1}</div>
                      </div>
                      <div className="flex justify-between text-[10px] text-content/60">
                        <div>WS: {formatDate(week[0].sale_date)}</div>
                        <div
                          className={`font-bold ${changeTextColor(weekTotals.dollarChange, 0)}`}
                        >
                          {formatCurrency2(weekTotals.dollarChange)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end text-[10px]">
                        <div className="text-content/60">
                          WE: {formatDate(week[week.length - 1].sale_date)}
                        </div>
                        <div className="text-content/60">
                          ATS: {formatCurrency2(weekTotals.atsTotalSales)}
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
                        className={`absolute bottom-1 flex items-center justify-center text-[10px] font-bold ${changeTextColor(weekTotals.percentChange, 0)}`}
                      >
                        {weekTotals.percentChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-[1.5px] grid grid-cols-2">
                      <div className="bg-gradient-to-r from-content/25 to-custom-white"></div>
                      <div className="bg-gradient-to-l from-content/25 to-custom-white"></div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-end justify-between gap-1 text-[9.5px]">
                        <div className="text-left min-w-0">
                          <div className="text-content/60 -mb-0.5 text-[9px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[0] }}
                            ></div>
                            <div>TY Sales</div>
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(weekTotals.tyTotalSales)}
                          </div>
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-content/60 -mb-0.5 text-[9px] flex gap-1 items-center leading-tight">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: colors[1] }}
                            ></div>
                            <div>LY Sales</div>
                          </div>
                          <div className="truncate font-medium">
                            {formatCurrency2(weekTotals.lyTotalSales)}
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
