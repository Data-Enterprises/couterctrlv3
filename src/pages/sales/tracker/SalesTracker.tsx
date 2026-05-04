import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { chunkData } from ".";
import { sameWeekDayLastYear } from "../../../utils";
import type { SubSale } from "../../../interfaces";
import {
  setTyReducedTotals,
  setUniqueSubs,
  type SubTracker,
  type WeekTotal,
} from "../../../features/salesSlice";
import SalesTrackerKpis from "./SalesTrackerKpis";
import TotalsGrid from "./TotalsGrid";
import NoPanelsFound from "../NoPanelsFound";

const SalesTracker = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    if (sales.thisYrSubTracker.length > 0) {
      const uniqueSubs: SubTracker[] = sales.thisYrSubTracker.reduce(
        (acc: SubTracker[], sale) => {
          const exists = acc.find((s) => s.id === sale.sub_department);
          if (!exists) {
            acc.push({
              id: sale.sub_department,
              desc: sale.sub_department_description,
            });
          }
          return acc;
        },
        [],
      );
      dispatch(setUniqueSubs(uniqueSubs));

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

            const salesLY = lySale ? lySale.total_sales - lySale.total_tax : 0;

            if (found) {
              found.salesTY += week.total_sales;
              found.salesLY += salesLY;
              found.transaction_count += week.transaction_count;
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
                atsTotalSales: 0,
                transaction_count: week.transaction_count,
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
          const atsTotalSales = week.salesTY / week.transaction_count;
          return {
            ...week,
            totalSalesDollarChange: dollarChange,
            totalSalesPercentChange: percentChange,
            atsTotalSales,
          };
        });

        const copy = [...withChanges];
        const subIds = Array.from(new Set(withChanges.map((w) => w.subDept)));

        const grouped = withChanges.reduce((acc: WeekTotal[][][], _, i) => {
          const subId = subIds[i];
          if (subId > -1) {
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

  if (sales.noTrackerFound) {
    return (
      <div className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex justify-center items-center">
        <NoPanelsFound dashboardOption={sales.dashboardOption} />
      </div>
    );
  }

  if (sales.tyReducedTotals.length === 0) return null;

  return (
    <div className="min-h-[calc(100vh-4.3rem)] max-h-[calc(100vh-4.3rem)] flex flex-col overflow-hidden">
      <SalesTrackerKpis />
      <TotalsGrid />
    </div>
  );
};

export default SalesTracker;
