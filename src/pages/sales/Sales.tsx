import { useEffect, useState } from "react";
// Hooks/API
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getWeekly } from "../../api/sales";

// Components
import StorePicker from "../../components/storePicker/StorePicker";
import SalesPanels from "./panels/SalesPanels";
import KpiHeader from "./components/KpiHeader";
import TopTen from "./charts/TopTen";
import HourlyGrid from "./charts/HourlyGrid";
import SubDeptGrid from "./charts/SubDeptGrid";
import SubDeptComps from "./charts/SubDeptComps";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SubsCompareModal from "./subsCompare/SubsCompareModal";
import SalesMobile from "./mobile/SalesMobile";

// Dispatchers
import {
  setLeftSubCompare,
  setPanelsLoading,
  setRightSubCompare,
  setSalesPanels,
  setSelectedSalesPanel,
} from "../../features/salesSlice";

// utils
import { addDays, formatGoliathDate } from "../../utils";
import type { JsonError } from "../../interfaces";
import { useLeftColHeight } from "./utils/hooks";

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { username } = useAppSelector((state) => state.user);
  const { queryChecker, weeklySales, hourlySales, subSales, topTenItems } =
    useAppSelector((state) => state.sales);
  const { height, topLeftRef, leftColRef } = useLeftColHeight();
  const [showLoading, setShowLoading] = useState<boolean>(false);

  // On mount, get data if user prefs has a last store or group, meaning there is a last search type as well
  useEffect(() => {
    if ((search.lastStore > 0 || search.lastGroup > 0) && context.isDesktop) {
      // if (search.lastStore > 0 || search.lastGroup > 0) {
      getSalesPanels();
    }
  }, []);

  const getSalesPanels = () => {
    dispatch(setLeftSubCompare(null));
    dispatch(setRightSubCompare(null));
    dispatch(
      setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
    );

    const start = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const end = formatGoliathDate(search.singleDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    dispatch(setPanelsLoading(true));
    setShowLoading(true);
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
      .finally(() => {
        dispatch(setPanelsLoading(false));
        setShowLoading(false);
      });
  };

  if (context.isMobile) return <SalesMobile />;

  const pageContainer = context.isDesktop
    ? "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none"
    : " p-4 overflow-y-scroll bg-bkg";
  const gridContainer = context.isDesktop
    ? " grid grid-cols-[18%_81%] gap-4 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]"
    : "h-full";

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

  const hasLastSearch = search.lastGroup === 0 && search.lastStore === 0;

  return (
    <div data-testid="sales-page" className={pageContainer}>
      {!context.isMobile ? (
        <div className={gridContainer}>
          <SubsCompareModal />
          <div
            ref={leftColRef}
            className={`h-full md:grid-rows-[25%_74%] md:gap-4`}
          >
            <div
              ref={topLeftRef}
              className="bg-custom-white rounded-lg p-3 shadow-lg space-y-1"
            >
              <StorePicker />
              <SingleDatePicker />
              <button className="btn-themeBlue w-full" onClick={getSalesPanels}>
                Search
              </button>
            </div>
            <div
              style={{ minHeight: height, maxHeight: height }}
              className="overflow-y-scroll no-scrollbar mt-4"
            >
              <SalesPanels />
            </div>
          </div>

          {hasLastSearch ? (
            <div className="flex justify-center items-center">
              <div className="bg-custom-white rounded-lg shadow-lg p-4 text-center text-sm font-medium">
                <div className="mb-1">
                  Welcome to your first login {username}!
                </div>
                <div className="mb-1">
                  Please select a store/group to show sales data
                </div>
                <div>Future successful logins will automatically</div>
                <div>pull data from your last search</div>
              </div>
            </div>
          ) : isLoading && !isReady ? (
            <div className="relative">
              {showLoading && (
                <LoadingIndicator message="Loading sales data..." />
              )}
            </div>
          ) : isReady ? (
            <div className="md:max-h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar md:grid-rows-[20%_78%] md:space-y-2 overflow-hidden">
              <KpiHeader />
              <div className="grid grid-cols-2 gap-2">
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
          {/* <ReportBuilder /> */}
          <div
            ref={leftColRef}
            className="md:grid h-full md:grid-rows-[25%_74%] md:gap-4"
          >
            <div
              ref={topLeftRef}
              className="bg-custom-white rounded-lg p-3 shadow-lg space-y-1"
            >
              <StorePicker />
              <SingleDatePicker />
              <button className="btn-themeBlue w-full" onClick={getSalesPanels}>
                Search
              </button>
            </div>
            <div className="overflow-y-scroll no-scrollbar my-2 max-h-56">
              <SalesPanels />
            </div>
          </div>

          {hasLastSearch ? (
            <div className="flex justify-center items-center">
              <div className="bg-custom-white rounded-lg shadow-lg p-4 text-center text-sm font-medium">
                <div className="mb-1">
                  Welcome to your first login {username}!
                </div>
                <div className="mb-1">
                  Please select a store/group to show sales data
                </div>
                <div>Future successful logins will automatically</div>
                <div>pull data from your last search</div>
              </div>
            </div>
          ) : isLoading && !isReady ? (
            <div className="relative">
              {showLoading && (
                <LoadingIndicator message="Loading sales data..." />
              )}
            </div>
          ) : isReady ? (
            <div className="overflow-hidden">
              <KpiHeader />
              <SubDeptComps />
              <HourlyGrid />
              <TopTen />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Sales;
