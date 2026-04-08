import { useEffect, useMemo } from "react";
import { formatSubDate, reduceItemData } from ".";
import { calculateCogs } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import {
  setItemDataFilteredMobile,
  setItemDataMobile,
  setMobileMainView,
  setProcessMobileItemData,
  setSelectedSubDeptId,
  setSelectedWeekDay,
  setViewDaily,
} from "../../../features/subMarginSlice";
import { gpm } from "../../../functions";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";
import MarginDayCardOverview from "./MarginDayCardOverview";
import ItemsView from "./ItemsView";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ScanView from "./ScanView";
import ItemHistoryModal from "./ItemHistoryModal";
const MobileDeptDataView = () => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  // const [view, setView] = useState<"overview" | "items">("overview");
  const { assignedStores } = useAppSelector((state) => state.user);
  // const [viewDaily, setViewDaily] = useState<boolean>(false);

  const handleMainView = (isResetting: boolean) => {
    dispatch(setMobileMainView("overview"));
    if (isResetting) dispatch(setSelectedSubDeptId(0));
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
    return (
      <div className="relative h-[calc(100vh-3rem)]">
        <LoadingIndicator message="Loading margins..." className="" />
      </div>
    );
  }

  const handleCardClick = (date: string) => {
    dispatch(setSelectedWeekDay(date));
    dispatch(setMobileMainView("items"));
  };

  const findStoreName = () => {
    return (
      assignedStores.find((store) => store.storeid === ctx.searchValue)
        ?.store_name || ""
    );
  };

  const sales = barData.reduce((acc, data) => acc + data.sales, 0);
  const tax = barData.reduce((acc, data) => acc + data.tax, 0);
  const qty = barData.reduce((acc, data) => acc + data.qty, 0);
  const totalCogs = ctx.margins.reduce(
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
  const margin = gpm(sales, totalCogs);

  const findSubDeptName = () => {
    const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);
    return subDept ? subDept.desc : "";
  };

  const startDate = barData[0].date;
  const endDate = barData[barData.length - 1].date;

  const handleAllDates = () => {
    if (ctx.viewDaily) {
      dispatch(setMobileMainView("items"));
      dispatch(setSelectedWeekDay(""));
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <ItemHistoryModal />
      <div className="w-full p-2 grid grid-cols-2 gap-2">
        <button
          className="btn-themeBlue py-1.5 px-0 text-[13.5px]"
          onClick={() => handleMainView(true)}
        >
          Sub Depts
        </button>
        {ctx.mobileMainView === "overview" ? (
          <button
            className="btn-themeBlue py-1.5 px-0 text-[13.5px]"
            onClick={() => dispatch(setViewDaily(!ctx.viewDaily))}
          >
            {!ctx.viewDaily ? "View Daily" : "Scan"}
          </button>
        ) : (
          <button
            className="btn-themeBlue py-1.5 px-0 text-[13.5px]"
            onClick={() => handleMainView(false)}
          >
            Overview
          </button>
        )}
      </div>

      {/* Cards */}
      {ctx.mobileMainView === "overview" ? (
        <div className="mx-2">
          <div
            className="text-[13px] pb-2 px-2 grid grid-cols-2 bg-custom-white rounded-lg shadow-md"
            onClick={handleAllDates}
          >
            <div>
              <div className="font-medium">{findStoreName()}</div>
              <div className="font-medium">{findSubDeptName()}</div>
              <div className="flex gap-1.5">
                <div className="text-content/50">Sales:</div>
                <div className="font-medium">
                  {formatCurrency2(sales - tax)}
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="text-content/50">Qty:</div>
                <div className="font-medium">{formatBigNumber(qty, 0)}</div>
              </div>
            </div>
            <div className="">
              <div className="text-right font-medium">
                {startDate} - {endDate}
              </div>
              <div className="flex gap-1.5 justify-end">
                <div className="text-content/50">Tax:</div>
                <div className="font-medium">{formatCurrency2(tax)}</div>
              </div>
              <div className="flex gap-1.5 justify-end">
                <div className="text-content/50">COGS:</div>
                <div className="font-medium">{formatCurrency2(totalCogs)}</div>
              </div>
              <div className="flex gap-1.5 justify-end">
                <div className="text-content/50">GPM:</div>
                <div className="font-medium">{margin}</div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            {ctx.viewDaily ? (
              <div className="shadow-md">
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
            ) : (
              <ScanView />
            )}
          </div>
        </div>
      ) : (
        <ItemsView startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
};

export default MobileDeptDataView;
