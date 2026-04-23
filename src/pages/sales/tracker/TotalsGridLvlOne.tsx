import { useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { WeekTotal } from "../../../features/salesSlice";
import TotalsGridLvlTwo from "./TotalsGridLvlTwo";
import { changeTextColor } from ".";

interface TotalsGridLvlOneProps {
  desc: string;
  totals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
  };
  filtered: WeekTotal[][];
}

const TotalsGridLvlOne = ({
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
      <div className="grid grid-cols-6 gap-4 font-bold text-[13.5px] items-center">
        <div className="flex gap-1 items-center">
          <div
            className="hover:bg-blue-200 transition-all duration-200 rounded-full p-1 flex justify-center"
            onClick={chevronTurn}
          >
            <ChevronRightIcon
              className={`w-4 h-4 cursor-pointer transition-transform duration-100 ease-in-out ${chevronClass()}`}
            />
          </div>
          <div className="">{desc}</div>
        </div>
        <div>{formatCurrency2(totals.tyTotalSales)}</div>
        <div>{formatCurrency2(totals.lyTotalSales)}</div>
        <div className={`${changeTextColor(totals.dollarChange, 0)}`}>
          {formatCurrency2(totals.dollarChange)}
        </div>
        <div className={`${changeTextColor(totals.percentChange, 0)}`}>
          {totals.percentChange.toFixed(2)}%
        </div>
        <div>{formatBigNumber(0)}</div>
      </div>

      {/* Level 2 => weeks */}
      <div
        ref={ref}
        data-display="closed"
        className="data-[display=open]:block data-[display=closed]:hidden"
      >
        {filtered.map((week, widx) => {
          const weekTotals = calcTotals([week]);
          return (
            <TotalsGridLvlTwo key={widx} week={week} weekTotals={weekTotals} />
          );
        })}
      </div>
      <div className="border-b border-content"></div>
    </div>
  );
};

export default TotalsGridLvlOne;
