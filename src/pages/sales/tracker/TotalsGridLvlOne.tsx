import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { type WeekTotal } from "../../../features/salesSlice";
import { changeTextColor } from ".";
import TotalsGridLvlTwo from "./TotalsGridLvlTwo";

interface TotalsGridLvlOneProps {
  desc: string;
  totals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
    atsTotalSales: number;
  };
  filtered: WeekTotal[][];
  isLvlTwo?: boolean;
}

const TotalsGridLvlOne = ({
  desc,
  totals,
  filtered,
  isLvlTwo = false,
}: TotalsGridLvlOneProps) => {
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

  if (!isLvlTwo) {
    return (
      <div className="bg-custom-white cursor-pointer text-[13px] rounded-lg shadow-lg border border-content/15 px-3 py-1.5 w-full">
        <div className="flex justify-between items-start">
          <div className="font-medium">{desc}</div>
          <div className="flex gap-1 text-[10.5px]">
            <div
              className={`rounded-md ${changeTextColor(totals.dollarChange, 0)}`}
            >
              <div className="font-semibold">
                {formatCurrency2(totals.dollarChange)}
              </div>
            </div>
            <div
              className={`rounded-md ${changeTextColor(totals.percentChange, 0)}`}
            >
              <div className="font-semibold">
                ({totals.percentChange.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 mb-1.5">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-md bg-bkg/75 p-2">
            <div className="text-content/60">TY Sales</div>
            <div className="font-semibold">
              {formatCurrency2(totals.tyTotalSales)}
            </div>
          </div>

          <div className="rounded-md bg-bkg/75 p-2">
            <div className="text-content/60">LY Sales</div>
            <div className="font-semibold">
              {formatCurrency2(totals.lyTotalSales)}
            </div>
          </div>

          <div className="rounded-md bg-bkg/75 p-2 col-span-2">
            <div className="text-content/60">ATS Sales</div>
            <div className="font-semibold">
              {formatBigNumber(totals.atsTotalSales, 2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Level 2 => weeks */
  return (
    <div className="">
      <div
        data-display="closed"
        className="grid grid-cols-3 gap-2"
      >
        {filtered.map((week, widx) => {
          const desc = week[0].subDesc;
          const weekTotals = calcTotals([week]);
          return (
            <TotalsGridLvlTwo
              key={widx}
              idx={widx + 1}
              week={week}
              weekTotals={weekTotals}
              desc={desc}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TotalsGridLvlOne;
