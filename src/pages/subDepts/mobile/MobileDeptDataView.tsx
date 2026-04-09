import { useEffect, useMemo } from "react";
import { useSubMarginCtx } from "../hooks";

import { formatSubDate, reduceItemData } from ".";
import { calculateCogs } from "..";
import {
  setItemDataFilteredMobile,
  setItemDataMobile,
  setMobileMainView,
  setProcessMobileItemData,
  setSelectedSubDeptId,
  setViewDaily,
} from "../../../features/subMarginSlice";
import { gpm } from "../../../functions";
import { useAppDispatch } from "../../../hooks";
import type { BarData } from "../display/widgets";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import MarginDayCardOverview from "./MarginDayCardOverview";
import ItemsView from "./ItemsView";
import ScanView from "./ScanView";
import ItemHistoryModal from "./ItemHistoryModal";
import TotalsHeader from "./TotalsHeader";
import { setUpcCode } from "../../../features/itemScanSlice";

const MobileDeptDataView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  const handleMainView = (isResetting: boolean) => {
    if (!ctx.viewDaily) dispatch(setViewDaily(true));
    // dispatch(setViewDaily(false));
    dispatch(setMobileMainView("overview"));
    dispatch(setUpcCode(""));
    if (isResetting) dispatch(setSelectedSubDeptId(0));
  };

  const handleScanView = () => {
    dispatch(setViewDaily(false));
    dispatch(setMobileMainView("overview"));
    dispatch(setUpcCode(""));
  };

  useEffect(() => {
    if (ctx.processMobileItemData && ctx.margins.length) {
      const reduced = reduceItemData(ctx.margins);
      const newData = reduced.map((item) => ({
        ...item,
        margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
      }));

      dispatch(setItemDataMobile(newData));
      dispatch(setItemDataFilteredMobile(newData));
      dispatch(setProcessMobileItemData(false));
    }
  }, [ctx.processMobileItemData, ctx.margins]);

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
    const deptName = ctx.subDepts.find((d) => d.id === ctx.selectedSubDeptId)?.desc || "";
    return (
      <div className="relative h-[calc(100vh-3rem)]">
        <LoadingIndicator message={`Loading ${deptName}`} className="" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <ItemHistoryModal />
      <div className="w-full p-2 grid grid-cols-3 gap-2">
        <button
          className="btn-themeBlue py-1.5 px-0 text-[13.5px]"
          onClick={() => handleMainView(true)}
        >
          Sub Depts
        </button>
        <button
          className={`btn-themeBlue ${!ctx.viewDaily ? "opacity-50 pointer-events-none" : ""} py-1.5 px-0 text-[13.5px]`}
          onClick={handleScanView}
        >
          Search
        </button>
        <button
          className={`btn-themeBlue ${ctx.viewDaily ? "opacity-50 pointer-events-none" : ""} py-1.5 px-0 text-[13.5px]`}
          onClick={() => handleMainView(false)}
        >
          View Daily
        </button>
      </div>

      {/* Overview and Items views */}
      {ctx.mobileMainView === "overview" ? (
        <div className="px-2 rounded-lg">
          <TotalsHeader barData={barData} />
          <div className="mt-2">
            {ctx.viewDaily ? (
              <div className="shadow-md">
                {barData
                  .slice()
                  .reverse()
                  .map((data, i) => (
                    <MarginDayCardOverview key={i} margin={data} />
                  ))}
              </div>
            ) : (
              <ScanView dates={dates} />
            )}
          </div>
        </div>
      ) : (
        <ItemsView barData={barData} />
      )}
    </div>
  );
};

export default MobileDeptDataView;
