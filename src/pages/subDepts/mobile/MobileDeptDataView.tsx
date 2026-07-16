import { useEffect, useMemo } from "react";
import { useSubMarginCtx } from "../hooks";

import { formatSubDate, reduceItemData } from ".";
import { calculateCogs } from "..";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
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
import DayTotalsHeader from "./DayTotalsHeader";

import {
  ArrowPathIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

const MobileDeptDataView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();

  const handleMainView = (isResetting: boolean) => {
    if (!ctx.viewDaily) dispatch(actions.setViewDaily(true));
    dispatch(actions.setScannedItemMobile(null));
    dispatch(actions.setMobileMainView("overview"));
    dispatch(setUpcCode(""));
    dispatch(actions.setSelectedWeekDay(""));
    if (isResetting) dispatch(actions.setSelectedSubDeptId(0));
  };

  const handleScanView = () => {
    dispatch(actions.setViewDaily(false));
    dispatch(actions.setMobileMainView("overview"));
    dispatch(setUpcCode(""));
    dispatch(actions.setSelectedWeekDay(""));
  };

  useEffect(() => {
    if (ctx.processMobileItemData && ctx.margins.length) {
      const reduced = reduceItemData(ctx.margins);
      const newData = reduced.map((item) => ({
        ...item,
        margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
      }));

      dispatch(actions.setItemDataMobile(newData));
      dispatch(actions.setItemDataFilteredMobile(newData));
      dispatch(actions.setProcessMobileItemData(false));
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
    const deptName =
      ctx.subDepts.find((d) => d.id === ctx.selectedSubDeptId)?.desc || "";
    return (
      <div className="relative h-[calc(100vh-3rem)]">
        <LoadingIndicator message={`Loading ${deptName}`} className="" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <ItemHistoryModal />
      <div className="w-full pb-2 grid grid-cols-3">
        <div
          className="bg-custom-white py-2 px-0 text-[12px] flex gap-2 justify-center items-center border-r border-content/15"
          onClick={() => handleMainView(true)}
        >
          <BuildingStorefrontIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/85">Sub Depts</div>
        </div>
        <div
          className={`${!ctx.viewDaily ? "text-orange-500" : "text-content/85"} bg-custom-white py-2 flex gap-2 justify-center items-center px-0 text-[12px] border-r border-content/15`}
          onClick={handleScanView}
        >
          <MagnifyingGlassIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/85">Search</div>
        </div>
        <div
          className={`${ctx.viewDaily ? "text-orange-500" : "text-content/85"} bg-custom-white py-2 flex gap-2 justify-center items-center px-0 text-[12px]`}
          onClick={() => handleMainView(false)}
        >
          {ctx.mobileMainView === "overview" ? (
            <ShoppingCartIcon className="w-6 h-6 transition-all duration-200" />
          ) : (
            <ArrowPathIcon className="w-6 h-6 transition-all duration-200" />
          )}
          <div className="text-content/85">
            {ctx.mobileMainView === "overview" ? "View Daily" : "Go Back"}
          </div>
        </div>
      </div>

      {/* Overview and Items views */}
      {ctx.mobileMainView === "overview" ? (
        <div className="px-2 rounded-lg">
          {/* <TotalsHeader barData={barData} /> */}
          {ctx.selectedWeekDay.length ? (
            <DayTotalsHeader
              barData={
                barData.filter((bd) => bd.date === ctx.selectedWeekDay)[0]
              }
            />
          ) : (
            <TotalsHeader barData={barData} />
          )}
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
