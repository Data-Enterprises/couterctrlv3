import { useEffect, useRef } from "react";
import type { WeekTotal } from "../../../../features/salesSlice";
import { formatCurrency2 } from "../../../../utils";
import { changeTextColor, formatDate } from "../../tracker";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import { useMobileSalesCtx } from "../hooks";

interface WeekDayMobileProps {
  week: WeekTotal[];
  desc: string;
  idx: number;
}

const WeekDayMobile = ({ week, desc, idx }: WeekDayMobileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const targetWeekIndex = useMobileSalesCtx().salesTrackerSelectedWeek;

  // open the correct week card automatically when it becomes the selected week
  useEffect(() => {
    if (idx === targetWeekIndex && containerRef.current && contentRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      contentRef.current.setAttribute("data-display", "open");
    }
  }, [idx, targetWeekIndex]);

  const handleDayToggle = () => {
    if (contentRef.current && containerRef.current && iconRef.current) {
      const isClosed =
        contentRef.current.getAttribute("data-display") === "closed";
      if (isClosed) {
        contentRef.current.setAttribute("data-display", "open");
        iconRef.current.style.transform = "rotate(90deg)";
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        contentRef.current.setAttribute("data-display", "closed");
        iconRef.current.style.transform = "rotate(0deg)";
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-custom-white rounded-lg shadow-md p-2"
    >
      <div className="flex items-center justify-between font-medium pb-0.5 text-[11.5px]">
        <div className="flex gap-0.5 items-center">
          <ArrowRightCircleIcon
            ref={iconRef}
            className="w-6 h-6 text-content/60 transition-all duration-100 ease-in-out"
            onClick={handleDayToggle}
          />
          <div className="leading-tight">
            <div>{desc}</div>
            <div className="font-normal text-content/60 -mt-0.5">
              Week: {idx + 1}
            </div>
          </div>
        </div>
        <div className="text-content/60">
          {formatDate(week[0].sale_date)} -{" "}
          {formatDate(week[week.length - 1].sale_date)}
        </div>
      </div>

      <div
        ref={contentRef}
        data-display="closed"
        className={`text-[10px] data-[display=closed]:hidden transition-all duration-300 ease-in-out`}
      >
        {week.map((weekDay, widx) => {
          const percentChange =
            weekDay.salesLY === 0
              ? 0
              : ((weekDay.salesTY - weekDay.salesLY) / weekDay.salesLY) * 100;

          const dow = new Date(weekDay.sale_date).toLocaleDateString("en-US", {
            weekday: "short",
          });

          const totalSales = weekDay.salesTY;
          const totalTrans = weekDay.transaction_count;
          const atsTotalSales = totalTrans === 0 ? 0 : totalSales / totalTrans;

          return (
            <div
              key={widx}
              className="grid grid-cols-[1fr_1fr_0.7fr_1.3fr] px-1 pt-1"
            >
              <div className="flex gap-0.5 col-span-4 font-medium">
                <div>{dow},</div>
                <div>{formatDate(weekDay.sale_date)}</div>
              </div>

              <div className="col-span-4 grid grid-cols-2 mb-1">
                <div className="bg-gradient-to-r h-[1.5px] from-blue-200 to-custom0-white"></div>
                <div className="bg-gradient-to-l h-[1.5px] from-blue-200 to-custom0-white"></div>
              </div>

              <div className="">
                <div className="text-content/60">TY Sales</div>
                <div className="font-medium">
                  {formatCurrency2(weekDay.salesTY)}
                </div>
              </div>

              <div>
                <div className="text-content/60">LY Sales</div>
                <div className="font-medium">
                  {formatCurrency2(weekDay.salesLY)}
                </div>
              </div>

              <div>
                <div className="text-content/60">ATS Sales</div>
                <div className="font-medium">
                  {formatCurrency2(atsTotalSales)}
                </div>
              </div>

              <div>
                <div className="text-content/60 text-xs">TY vs LY</div>
                <div
                  className={`font-medium ${changeTextColor(
                    weekDay.salesTY - weekDay.salesLY,
                    0,
                  )}`}
                >
                  {formatCurrency2(weekDay.salesTY - weekDay.salesLY)} (
                  {percentChange.toFixed(2)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekDayMobile;
