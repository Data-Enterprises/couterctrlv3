import { useMemo } from "react";
import { useSubMarginCtx, useHeight } from "../hooks";

import { formatDate, type BarData } from "./widgets";
import { gpm } from "../../../functions";
import { calculateCogs } from "..";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import KpiContainer from "./KpiContainer";
import SalesGrid from "./widgets/SalesGrid";
import SalesBar from "./widgets/SalesBar";
import ItemsGrid from "./widgets/ItemsGrid";
import ItemsGridFilters from "./widgets/ItemsGridFilters";
import SubDeptCostGrid from "./widgets/SubDeptCostGrid";
import CostGridFilters from "./widgets/CostGridFilters";
import AllWeeksTrend from "./allWeeks/AllWeeksTrend";

const SubMarginDisplay = () => {
  const {
    margins,
    loadingMargins,
    selectedWeek,
    selectedWeekDay,
    subDeptGridView,
  } = useSubMarginCtx();
  const height = useHeight();

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
          acc + calculateCogs(curr.net_cost, curr.cost, curr.case_size, curr.qty, curr.weight),
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
    if (selectedWeekDay && subDeptGridView === "item") {
      return (
        <div className="grid grid-cols-[18%_81.5%] gap-2">
          <ItemsGridFilters />
          <ItemsGrid />
        </div>
      );
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

  return (
    <div className="space-y-2">
      <KpiContainer />
      {selectedWeek < 5 ? (
        <div
          className={`grid grid-rows-[32.6%_67.4%] ${height} gap-2 overflow-hidden p-2`}
        >
          <div className="grid grid-cols-[34%_65.5%] gap-2">
            <SalesBar barData={barData} />
            <SalesGrid gridData={barData.slice().reverse()} />
          </div>

          {renderGrid()}
        </div>
      ) : (
        <AllWeeksTrend />
      )}
    </div>
  );
};

export default SubMarginDisplay;
