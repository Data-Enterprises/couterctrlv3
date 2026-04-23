import type { WeekTotal } from "../../../features/salesSlice";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

const TotalsCards = () => {
  const sales = useAppSelector((state) => state.sales);

  if (sales.tyReducedTotals.length === 0) {
    return null;
  }

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

    return { tyTotalSales, lyTotalSales, percentChange, dollarChange };
  };

  const changeTextColor = (num1: number, num2: number) => {
    if (num1 > num2) return "text-emerald-500";
    if (num1 < num2) return "text-orange-500";
    return "text-content";
  };

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  return (
    <div className="grid grid-cols-4 gap-2 text-[13px]">
      {sales.tyReducedTotals.map((wg) => {
        // const totals = calcTotals(wg);
        const sub = wg[0][0].subDesc;
        return wg.map((week, weekIndex) => {
          const totals = calcTotals([week]);
          return (
            <div
              key={weekIndex}
              className="bg-custom-white px-2 py-1 rounded-lg shadow-lg"
            >
              <div className="flex justify-between font-medium">
                <div>{sub}</div>
                <div>Week: {weekIndex + 1}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
                <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
              </div>

              <div className="grid grid-cols-[20%_25%_25%_15%_15%] text-content/60 font-medium">
                <div>Week: {weekIndex + 1}</div>
                <div>TY Totals</div>
                <div>LY Totals</div>
                <div className="text-right">$ Diff</div>
                <div className="text-right">% Diff</div>
              </div>

              <div className="text-[11.5px] grid grid-cols-[20%_25%_25%_15%_15%] font-medium">
                <div className="text-content/60">Total</div>
                <div>{formatCurrency2(totals.tyTotalSales)}</div>
                <div>{formatCurrency2(totals.lyTotalSales)}</div>
                <div
                  className={`text-right ${changeTextColor(totals.dollarChange, 0)}`}
                >
                  {formatCurrency2(totals.dollarChange)}
                </div>
                <div
                  className={`text-right ${changeTextColor(totals.percentChange, 0)}`}
                >
                  {totals.percentChange.toFixed(2)}%
                </div>
              </div>

              {week.map((day, dayIndex) => (
                <div key={dayIndex}>
                  <div className="text-[11.5px] grid grid-cols-[20%_25%_25%_15%_15%]">
                    <div className="text-content/60 font-medium">
                      {formatDate(day.sale_date)}
                    </div>
                    <div>{formatCurrency2(day.salesTY)}</div>
                    <div>{formatCurrency2(day.salesLY)}</div>
                    <div
                      className={`text-right ${changeTextColor(day.salesTY - day.salesLY, 0)}`}
                    >
                      {formatCurrency2(day.salesTY - day.salesLY)}
                    </div>
                    <div
                      className={`text-right ${changeTextColor(
                        ((day.salesTY - day.salesLY) / day.salesLY) * 100,
                        0,
                      )}`}
                    >
                      {(
                        ((day.salesTY - day.salesLY) / day.salesLY) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        });
      })}
    </div>
  );
};

export default TotalsCards;
