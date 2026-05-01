import type { WeekTotal } from "../../../../features/salesSlice";
import { formatCurrency2 } from "../../../../utils";
import { formatDate, changeTextColor } from "../../tracker"; // 👈 Added missing import
import { useMobileSalesCtx } from "../hooks";
import ReducedTotalsHeader from "./ReducedTotalsHeader";

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

  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] px-3 py-2 space-y-2">
      <ReducedTotalsHeader />
      <div className="flex-1 w-full grid overflow-y-hidden">
        <div className="grid gap-2 overflow-y-auto">
          {filteredSubs().map((sub) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filteredBySub = ctx.tyReducedTotalsMobile
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            const weekTotals = calcTotals(filteredBySub);

            return filteredBySub.map((week, idx) => (
              <div
                key={idx}
                className="w-full max-w-full rounded-lg border border-content/15 bg-custom-white shadow-md px-2.5 py-2 text-[11px] sm:text-[12px]"
              >
                <div className="font-medium select-none">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-content/60 truncate">
                      {desc} Week {idx + 1}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-content/80">
                      {formatDate(week[0].sale_date)} –{" "}
                      {formatDate(week[week.length - 1].sale_date)}
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

                        <div className="text-content/60">$ vs LY</div>
                        <div
                          className={`text-right font-medium ${changeTextColor(weekTotals.dollarChange, 0)}`}
                        >
                          {formatCurrency2(weekTotals.dollarChange)}
                        </div>

                        <div className="text-content/60">% vs LY</div>
                        <div
                          className={`text-right font-medium ${changeTextColor(weekTotals.percentChange, 0)}`}
                        >
                          {weekTotals.percentChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerWeeks;
