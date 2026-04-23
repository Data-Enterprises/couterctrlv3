import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { chunkData } from ".";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { sameWeekDayLastYear } from "../../../utils";
import type { SubSale } from "../../../interfaces";
import { setTyReducedTotals, type WeekTotal } from "../../../features/salesSlice";
import TrackerKpis from "./TrackerKpis";
import TotalsCards from "./TotalsCards";

const SalesTracker = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    if (
      sales.thisYrSubTracker.length > 0
    ) {
      const calcTotals = () => {
        const thisYear = sales.tyCollapsedSubSales.flat();
        const lastYear = sales.lyCollapsedSubSales.flat();

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
            // console.log(lySale);

            const salesLY = lySale ? lySale.total_sales : 0;

            if (found) {
              found.salesTY += week.total_sales;
              found.salesLY += salesLY;
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
                atsTotalSales: week.total_sales / week.qty,
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
          return {
            ...week,
            totalSalesDollarChange: dollarChange,
            totalSalesPercentChange: percentChange,
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

      dispatch(setTyReducedTotals(calcTotals()));
    }
  }, [sales.tyCollapsedSubSales, sales.lyCollapsedSubSales]);

  if (sales.loadingLYTrackerData || sales.loadingTYTrackerData) {
    return (
      <div className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] grid text-sm">
        <div className="p-2 relative">
          <LoadingIndicator message="Loading sales tracker" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] space-y-2 text-sm">
      <TrackerKpis />
      <TotalsCards />
    </div>
  );
};

export default SalesTracker;
