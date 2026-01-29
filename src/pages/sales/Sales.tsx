// Hooks/API
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly } from "../../api/sales";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";

// Dispatchers
import {
  setPanelsLoading,
  setSalesPanels,
  setSelectedSalesPanel,
} from "../../features/salesSlice";

// utils
import { formatGoliathDate } from "../../utils";
import type { JsonError } from "../../interfaces";
import SalesPanels from "./panels/SalesPanels";
import { useLeftColHeight } from "./utils/hooks";
import KpiHeader from "./components/KpiHeader";
import TopTen from "./charts/TopTen";
import HourlyGrid from "./charts/HourlyGrid";
import SubDeptGrid from "./charts/SubDeptGrid";
import SubDeptComps from "./charts/SubDeptComps";
import { useEffect } from "react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { dateRange } from "../../functions";

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { queryChecker, weeklySales, hourlySales, subSales, topTenItems } =
    useAppSelector((state) => state.sales);
  const { height, topLeftRef, leftColRef } = useLeftColHeight();

  // On mount, get data if user prefs has a last store or group, meaning there is a last search type as well
  useEffect(() => {
    if (search.lastStore > 0 || search.lastGroup > 0) {
      getSalesPanels();
    }
  }, []);

  const getSalesPanels = () => {
    const dr = dateRange(search.startDate, search.endDate);
    if (dr > 7) {
      toast.warn("Date range cannot exceed 7 days for Sales data.");
      return;
    }
    dispatch(
      setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
    );

    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    dispatch(setPanelsLoading(true));
    getWeekly(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const sorted = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
          );
          dispatch(setSalesPanels(sorted));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      })
      .finally(() => dispatch(setPanelsLoading(false)));
  };

  const pageContainer = context.isDesktop
    ? "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4 select-none"
    : "p-4 max-h-screen overflow-y-scroll";
  const gridContainer = context.isDesktop
    ? " grid grid-cols-[18%_81%] gap-4 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]"
    : "";

  const isReady =
    queryChecker.hourly &&
    queryChecker.subs &&
    queryChecker.topTen &&
    queryChecker.weekly;

  const isLoading =
    !topTenItems.length &&
    !hourlySales.length &&
    !weeklySales.length &&
    !subSales.length;

  return (
    <div data-testid="sales-page" className={pageContainer}>
      {!context.isMobile ? (
        <div className={gridContainer}>
          <div
            ref={leftColRef}
            className="md:grid h-full md:grid-rows-[25%_74%] md:gap-4"
          >
            <div
              ref={topLeftRef}
              className="bg-custom-white rounded-lg p-3 shadow-lg space-y-1"
            >
              <StorePicker />
              <DatePickers handleQuery={getSalesPanels} />
            </div>
            <div
              style={{ minHeight: height, maxHeight: height }}
              className="overflow-y-scroll no-scrollbar"
            >
              <SalesPanels />
            </div>
          </div>

          {isLoading && !isReady ? (
            <div className="relative">
              <LoadingIndicator message="Loading sales data..." />
            </div>
          ) : isReady ? (
            <div className="md:grid h-full md:grid-rows-[20%_78%] md:gap-4 overflow-hidden">
              <KpiHeader />
              <div className="grid grid-cols-2  gap-2">
                <div className="grid grid-rows-2 gap-2">
                  <HourlyGrid />
                  <TopTen />
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <SubDeptComps />
                  <SubDeptGrid />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={gridContainer}>
          <div
            ref={leftColRef}
            className="md:grid h-full md:grid-rows-[25%_74%] md:gap-4"
          >
            <div
              ref={topLeftRef}
              className="bg-custom-white rounded-lg p-3 shadow-lg space-y-1"
            >
              <StorePicker />
              <DatePickers handleQuery={getSalesPanels} />
            </div>
            {/* <div
              style={{ minHeight: height, maxHeight: height }}
              className="overflow-y-scroll no-scrollbar"
            >
              <SalesPanels />
            </div> */}
          </div>

          {isLoading && !isReady ? (
            <div className="relative">
              <LoadingIndicator message="Loading sales data..." />
            </div>
          ) : isReady ? (
            <div className="md:grid h-full md:grid-rows-[20%_78%] md:gap-4 overflow-hidden">
              <KpiHeader />
              <div className="grid grid-cols-2  gap-2">
                <div className="grid grid-rows-2 gap-2">
                  {/* <HourlyGrid /> */}
                  {/* <TopTen /> */}
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <SubDeptComps />
                  {/* <SubDeptGrid /> */}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Sales;
