import { useMemo } from "react";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch } from "../../../hooks";
import {
  setSubDeptCost,
  setSubDeptGridView,
  setViewTabletCards,
} from "../../../features/subMarginSlice";

import { formatDate, type BarData } from "../display/widgets";
import { gpm } from "../../../functions";
import { calculateCogs } from "..";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import ItemsGridTablet from "./ItemsGridTablet";
import TotalsHeader from "./TotalsHeader";
import DayCardOverview from "./DayCardOverview";
import CostGridTablet from "./CostGridTablet";
import type { SubDeptCost } from "../../../interfaces";
import AllWeeksTablet from "./AllWeeksTablet";

const SubMarginDisplayTablet = () => {
  const dispatch = useAppDispatch();
  const {
    margins,
    loadingMargins,
    selectedWeek,
    subDeptGridView,
    viewTabletCards,
    selectedWeekDay,
  } = useSubMarginCtx();

  const dates = useMemo(() => {
    const result = Array.from(
      new Set(margins.map((margin) => margin.sale_date.split("T")[0])),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return result;
  }, [margins]);

  const barData: BarData[] = useMemo(() => {
    const result = dates.map((date) => {
      const dateMargins = margins.filter(
        (margin) => margin.sale_date.split("T")[0] === date,
      );

      const totalSales = dateMargins.reduce(
        (acc, margin) => acc + (margin.total_sales - margin.total_tax),
        0,
      );
      const netSales = dateMargins.reduce(
        (acc, margin) => acc + margin.net_sales,
        0,
      );
      const qty = dateMargins.reduce((acc, margin) => acc + margin.qty, 0);
      const tax = dateMargins.reduce(
        (acc, margin) => acc + margin.total_tax,
        0,
      );

      const cogs = dateMargins.reduce(
        (acc, curr) =>
          acc +
          calculateCogs(
            curr.net_cost,
            curr.cost,
            curr.case_size,
            curr.qty,
            curr.weight,
          ),
        0,
      );

      const margin = gpm(totalSales, cogs);

      return {
        sales: totalSales,
        net: netSales,
        qty,
        tax,
        cogs,
        date: formatDate(date),
        gpm: margin,
      };
    });
    return result;
  }, [dates]);

  if (loadingMargins) {
    return (
      <div className="absolute top-1/2 left-1/2">
        <LoadingIndicator
          message="Loading margins..."
          className="top-1/2 left-1/2 ml-28"
        />
      </div>
    );
  }

  const renderGrid = () => {
    if (subDeptGridView === "item") {
      return <ItemsGridTablet />;
    } else if (subDeptGridView === "cost") {
      return <CostGridTablet />;
    }

    return null;
  };

  const handleDailyBtnClick = () => {
    dispatch(setViewTabletCards(true));
  };

  const handleGridViewChange = (view: "item" | "cost") => {
    if (view === "cost") {
      const formatDate = (dte: string) => {
        const split = dte.split("T")[0].split("-");
        return `${split[1]}/${split[2]}/${split[0]}`;
      };

      const marginCosts: SubDeptCost[] = margins.reduce(
        (acc: SubDeptCost[], curr) => {
          const found = acc.find(
            (item) => item.product_code === curr.product_code,
          );
          if (!found) {
            acc.push({
              date: formatDate(curr.sale_date),
              product_code: curr.product_code,
              description: curr.product_description,
              calculated_cost: curr.calculated_cost,
              cost: curr.cost,
              qty: curr.qty,
              total_cost: calculateCogs(
                curr.net_cost,
                curr.cost,
                curr.case_size,
                curr.qty,
                curr.weight,
              ),
            });
          } else {
            found.qty += curr.qty;
            found.total_cost += calculateCogs(
              curr.net_cost,
              curr.cost,
              curr.case_size,
              curr.qty,
              curr.weight,
            );
          }
          return acc;
        },
        [],
      );

      dispatch(setSubDeptCost(marginCosts));
    }
    dispatch(setViewTabletCards(false));
    dispatch(setSubDeptGridView(view));
  };

  return (
    <div className="space-y-2">
      {selectedWeek < 5 ? (
        <div className="space-y-3 p-2">
          <TotalsHeader data={barData} />
          <div className="bg-custom-white rounded-xl border border-slate-200/70 shadow-md p-2">
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`btn-themeBlue py-1 text-[13px] px-0 ${viewTabletCards ? "bg-orange-200 border-orange-200 text-content" : "bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"}`}
                onClick={handleDailyBtnClick}
              >
                View Daily
              </button>
              <button
                className={`btn-themeBlue py-1 text-[13px] px-0 ${!viewTabletCards && subDeptGridView === "item" ? "bg-orange-200 border-orange-200 text-content" : "bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"}`}
                onClick={() => handleGridViewChange("item")}
              >
                View Items
              </button>
              <button
                className={`btn-themeBlue py-1 text-[13px] px-0 ${!viewTabletCards && subDeptGridView === "cost" ? "bg-orange-200 border-orange-200 text-content" : "bg-[rgb(30,45,80)] border-[rgb(30,45,80)]"}`}
                onClick={() => handleGridViewChange("cost")}
              >
                View Costs
              </button>
            </div>
          </div>
          {viewTabletCards ? (
            <div className="grid grid-cols-2 gap-3">
              {barData.map((d, i) => (
                <DayCardOverview
                  key={i}
                  data={d}
                  selectedWeekDay={selectedWeekDay}
                />
              ))}
            </div>
          ) : (
            renderGrid()
          )}
        </div>
      ) : (
        <AllWeeksTablet />
      )}
    </div>
  );
};

export default SubMarginDisplayTablet;
