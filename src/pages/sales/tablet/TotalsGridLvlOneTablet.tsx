import { useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { WeekTotal } from "../../../features/salesSlice";
import TotalsGridLvlTwoTablet from "./TotalsGridLvlTwoTablet";
import { changeTextColor } from "../tracker";

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
}

const TotalsGridLvlOneTablet = ({
  desc,
  totals,
  filtered,
}: TotalsGridLvlOneProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

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

  const chevronTurn = () => {
    if (ref.current) {
      const display = ref.current.getAttribute("data-display");
      if (display === "closed") {
        ref.current.setAttribute("data-display", "open");
        setIsOpen(true);
      } else {
        ref.current.setAttribute("data-display", "closed");
        setIsOpen(false);
      }
    }
  };

  const chevronClass = () => {
    if (isOpen) {
      return "rotate-90 animate";
    } else {
      return "rotate-0 animate";
    }
  };

  return (
    <div className="">
      <div
        className="grid grid-cols-6 gap-2 rounded-xl px-3 py-2 font-semibold text-[12px] md:text-[13px] items-center cursor-pointer bg-custom-white hover:bg-blue-50 transition-colors duration-200"
        onClick={chevronTurn}
      >
        <div className="flex items-center gap-2 min-w-0 col-span-2 md:col-span-1">
          <div className="rounded-full p-1 bg-slate-50 ring-1 ring-slate-200 flex justify-center items-center shrink-0">
            <ChevronRightIcon
              className={`w-4 h-4 transition-transform duration-150 ease-in-out ${chevronClass()}`}
            />
          </div>
          <div className="truncate text-slate-800">{desc}</div>
        </div>

        <div className="text-right tabular-nums text-slate-800">
          {formatCurrency2(totals.tyTotalSales)}
        </div>

        <div className="text-right tabular-nums text-slate-800">
          {formatCurrency2(totals.lyTotalSales)}
        </div>

        <div
          className={`text-right tabular-nums ${changeTextColor(totals.dollarChange, 0)}`}
        >
          {formatCurrency2(totals.dollarChange)}
        </div>

        <div
          className={`text-right tabular-nums ${changeTextColor(totals.percentChange, 0)}`}
        >
          {totals.percentChange.toFixed(2)}%
        </div>

        <div className="text-right tabular-nums text-slate-800">
          {formatBigNumber(totals.atsTotalSales, 2)}
        </div>
      </div>

      <div
        ref={ref}
        data-display="closed"
        className="data-[display=open]:block data-[display=closed]:hidden"
      >
        {filtered.map((week, widx) => {
          const weekTotals = calcTotals([week]);
          return (
            <TotalsGridLvlTwoTablet
              key={widx}
              week={week}
              weekTotals={weekTotals}
            />
          );
        })}
      </div>

      <div className="border-b border-slate-200"></div>
    </div>
  );
};

export default TotalsGridLvlOneTablet;
