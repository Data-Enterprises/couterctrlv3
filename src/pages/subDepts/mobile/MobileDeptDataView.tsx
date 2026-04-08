import { useMemo, useState } from "react";
import { formatSubDate } from ".";
import { calculateCogs } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import {
  setSelectedSubDeptId,
  setSelectedWeekDay,
} from "../../../features/subMarginSlice";
import { gpm } from "../../../functions";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";
import MarginDayCardOverview from "./MarginDayCardOverview";
import ItemsView from "./ItemsView";
const MobileDeptDataView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<"overview" | "items">("overview");
  const { assignedStores } = useAppSelector((state) => state.user);

  const handleReset = () => {
    // dispatch(resetSubMarginState());
    dispatch(setSelectedSubDeptId(0));
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

  const handleCardClick = (date: string) => {
    if (ctx.selectedWeekDay === date) {
      dispatch(setSelectedWeekDay(""));
    } else {
      dispatch(setSelectedWeekDay(date));
      setView("items");
    }
  };

  const findStoreName = () => {
    return (
      assignedStores.find((store) => store.storeid === ctx.searchValue)
        ?.store_name || ""
    );
  };

  const findSubDeptName = () => {
    const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);
    return subDept ? subDept.desc : "";
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="w-full p-2 grid grid-cols-2 gap-2">
        <button className="btn-themeBlue px-0" onClick={handleReset}>
          Sub Depts
        </button>
        <button className="btn-themeBlue px-0" onClick={handleViewToggle}>
          {view === "overview" ? "Items" : "Day Overview"}
        </button>
      </div>

      {/* Cards */}
      {view === "overview" ? (
        <div className="px-2">
          <div className="text-[13.5px] font-medium p-2">
            {/* <div className="flex gap-1.5">
              <div className="font-normal">Store:</div>
            </div>
            <div className="flex gap-1.5">
              <div className="font-normal">Sub Dept:</div>
            </div> */}
              <div>{findSubDeptName()}</div>
              <div>{findStoreName()}</div>
          </div>
          <div className="max-h-[calc(100vh-11.5rem)] overflow-y-auto rounded-lg space-y-2">
            {barData
              .slice()
              .reverse()
              .map((data, i) => (
                <MarginDayCardOverview
                  key={i}
                  margin={data}
                  onCardClick={() => handleCardClick(data.date)}
                />
              ))}
          </div>
        </div>
      ) : (
        <ItemsView />
      )}
    </div>
  );
};

export default MobileDeptDataView;
