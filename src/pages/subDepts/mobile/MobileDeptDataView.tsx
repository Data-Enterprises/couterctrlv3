import { useMemo, useState } from "react";
import { formatSubDate } from ".";
import { calculateCogs } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { resetSubMarginState } from "../../../features/subMarginSlice";
import { gpm } from "../../../functions";
import { useAppDispatch } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";
import MarginDayCardOverview from "./MarginDayCardOverview";
import ItemsView from "./ItemsView";
const MobileDeptDataView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<"overview" | "items">("overview");

  const handleReset = () => {
    dispatch(resetSubMarginState());
  };

  const dates = useMemo(() => {
    const result = Array.from(
      new Set(ctx.margins.map((margin) => margin.sale_date.split("T")[0])),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return result;
  }, [ctx.margins]);

  const barData: BarData[] = useMemo(() => {
    const result = dates.map((date) => {
      const dateMargins = ctx.margins.filter(
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
        date: formatSubDate(date),
        gpm: margin,
      };
    });
    return result;
  }, [dates]);

  if (!ctx.margins.length && !ctx.loadingMargins) return null;

  if (ctx.loadingMargins) {
    return (
      <div className="relative h-[calc(100vh-3rem)]">
        <LoadingIndicator message="Loading margins..." className="" />
      </div>
    );
  }

  const handleViewToggle = () => {
    setView((prev) => (prev === "overview" ? "items" : "overview"));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="w-full p-2 grid grid-cols-2 gap-2">
        <button className="btn-themeBlue px-0" onClick={handleReset}>
          Reset Search
        </button>
        <button className="btn-themeBlue px-0" onClick={handleViewToggle}>
          {view === "overview" ? "View Items" : "View Overview"}
        </button>
      </div>

      {/* Cards */}
      {view === "overview" ? (
        <div className="grid grid-cols-1 gap-2 p-2 max-h-[calc(100vh-6.8rem)] overflow-y-auto">
          {barData
            .slice()
            .reverse()
            .map((data, i) => (
              <MarginDayCardOverview key={i} {...data} />
            ))}
        </div>
      ) : (
        <ItemsView />
      )}
    </div>
  );
};

export default MobileDeptDataView;
