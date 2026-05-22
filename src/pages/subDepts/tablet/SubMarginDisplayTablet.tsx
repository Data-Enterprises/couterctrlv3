import { useMemo } from "react";
import { useSubMarginCtx } from "../hooks";
import { useAppDispatch } from "../../../hooks";

import { formatDate, type BarData } from "../display/widgets";
import { gpm } from "../../../functions";
import { calculateCogs } from "..";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SubDeptCostGrid from "../display/widgets/SubDeptCostGrid";
import CostGridFilters from "../display/widgets/CostGridFilters";
import AllWeeksTrend from "../display/allWeeks/AllWeeksTrend";
import ItemsGridTablet from "./ItemsGridTablet";
import TotalsHeader from "./TotalsHeader";
import DayCardOverview from "./DayCardOverview";
import { setViewTabletCards } from "../../../features/subMarginSlice";

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
      return (
        <div className="grid grid-cols-[18%_81.5%] gap-2">
          <CostGridFilters />
          <SubDeptCostGrid />
        </div>
      );
    }

    return null;
  };

  const handleDailyBtnClick = () => {
    dispatch(setViewTabletCards(!viewTabletCards));
  };

  return (
    <div className="space-y-2">
      {selectedWeek < 5 ? (
        <div className="space-y-3 max-h-[calc(100vh-9.5rem)] overflow-y-auto p-2">
          <TotalsHeader data={barData} />
          <div className="bg-custom-white rounded-xl border border-slate-200/70 shadow-md p-2">
            <div className="grid grid-cols-3 gap-3">
              <button
                className="btn-themeBlue py-1 text-[13px] px-0 bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white"
                onClick={handleDailyBtnClick}
              >
                View Daily
              </button>
              <button className="btn-themeBlue py-1 text-[13px] px-0 bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white">
                View Items
              </button>
              <button className="btn-themeBlue py-1 text-[13px] px-0 bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white">
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
        <AllWeeksTrend />
      )}
    </div>
  );
};

export default SubMarginDisplayTablet;
