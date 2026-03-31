import { useMemo, useState } from "react";
import { formatSubDate } from ".";
import { calculateCogs } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { resetSubMarginState } from "../../../features/subMarginSlice";
import { gpm } from "../../../functions";
import { useAppDispatch } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";
import { formatCurrency2 } from "../../../utils";
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
          {}{view === "overview" ? "View Items" : "View Overview"}
        </button>
      </div>

      {/* Cards */}
      {view === "overview" ? (
        <div className="grid grid-cols-1 gap-2 p-2 max-h-[calc(100vh-6.8rem)] overflow-y-auto">
          {barData
            .slice()
            .reverse()
            .map((data) => (
              <MarginDayCardOverview key={data.date} {...data} />
            ))}
        </div>
      ) : (
        <div>
          <div>Item cards here</div>
        </div>
      )}
    </div>
  );
};

const MarginDayCardOverview = (margin: BarData) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-md text-sm">
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2 font-medium">
        {margin.date}
      </div>
      <div className="grid grid-cols-3 gap-2 p-2">
        <div>
          <div className="text-content/60">Total $ </div>
          <div className="font-medium">{formatCurrency2(margin.sales)}</div>
        </div>
        <div>
          <div className="text-content/60">Net $</div>
          <div className="font-medium">{formatCurrency2(margin.net)}</div>
        </div>
        <div>
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{margin.qty}</div>
        </div>
        <div>
          <div className="text-content/60">Tax</div>
          <div className="font-medium">{formatCurrency2(margin.tax)}</div>
        </div>
        <div>
          <div className="text-content/60">COGS</div>
          <div className="font-medium">{formatCurrency2(margin.cogs)}</div>
        </div>
        <div>
          <div className="text-content/60">GPM</div>
          <div className="font-medium">{margin.gpm}%</div>
        </div>
      </div>
    </div>
  );
};

export default MobileDeptDataView;
