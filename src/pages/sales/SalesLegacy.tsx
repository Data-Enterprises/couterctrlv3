import { useState } from "react";
// Hooks/API
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { getSubs, getWeekly } from "../../api/sales";

// Components
import StorePicker from "../../components/storePicker/StorePicker";
import SalesPanels from "./panels/SalesPanels";
import KpiHeader from "./components/KpiHeader";
import TopTen from "./charts/TopTen";
import HourlyGrid from "./charts/HourlyGrid";
import SubDeptGrid from "./charts/SubDeptGrid";
import SubDeptComps from "./charts/SubDeptComps";
// import SubDeptDistribution from "./charts/SubDeptDistribution";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SubsCompareModal from "./subsCompare/SubsCompareModal";
import SalesMobile from "./mobile/SalesMobile";
import SalesTracker from "./tracker/SalesTracker";
import WeekCards from "./tracker/WeekCards";
import SalesTablet from "./tablet/SalesTablet";

// Dispatchers
import {
  clearLYSubTracker,
  clearTYSubTracker,
  concatLYSubTracker,
  concatTYSubTracker,
  reQuery,
  setDashboardOption,
  setLeftSubCompare,
  setLoadingLYTrackerData,
  setLoadingTYTrackerData,
  setNoTrackerFound,
  setPanelsLoading,
  setRefreshOverviewData,
  setRightSubCompare,
  setSalesPanels,
  setSelectedSalesPanel,
  type DashboardOption,
} from "../../features/salesLegacySlice";

// utils
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../utils";
import type { JsonError } from "../../interfaces";
import SingleSelect from "../../components/SingleSelect";
import DatePickers from "../../components/datePickers/DatePickers";
import NoPanelsFound from "./NoPanelsFound";

const dashboardOptions = [
  { label: "Daily Sales", value: "daily" },
  { label: "Weekly Sales", value: "weekly" },
  { label: "Sales Tracker", value: "tracker" },
];

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [noPanelsFound, setNoPanelsFound] = useState<boolean>(false);
  // const [subView, setSubView] = useState<"grid" | "dist">("grid");
  const {
    hourlySales,
    weeklySales,
    subSales,
    salesPanels,
    dashboardOption,
    queryChecker,
  } = useAppSelector((state) => state.salesLegacy);

  const getSalesPanels = async () => {
    dispatch(reQuery());
    setIsLoading(true);
    dispatch(setSalesPanels([]));
    setNoPanelsFound(false);
    dispatch(setRefreshOverviewData(true));
    dispatch(setLeftSubCompare(null));
    dispatch(setRightSubCompare(null));
    dispatch(
      setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
    );

    if (dashboardOption === "tracker") {
      dispatch(clearLYSubTracker());
      dispatch(clearTYSubTracker());
      getSubsTracker();
      return;
    }

    const start =
      dashboardOption === "weekly"
        ? addDays(search.singleDate, -6).toISOString().split("T")[0]
        : formatGoliathDate(search.singleDate);

    const end = formatGoliathDate(search.singleDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    // Loading states
    dispatch(setPanelsLoading(true));

    await getWeekly(
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
        if (j.error === 0 && j.sales.length > 0) {
          const sorted = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
          );
          dispatch(setSalesPanels(sorted));
        } else {
          setNoPanelsFound(true);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      })
      .finally(() => {
        setIsLoading(false);
        dispatch(setPanelsLoading(false));
      });
  };

  const getSubsTracker = () => {
    dispatch(setNoTrackerFound(false));
    dispatch(setLoadingTYTrackerData(true));
    dispatch(setLoadingLYTrackerData(true));
    const end = formatGoliathDate(search.endDate);
    const start = formatGoliathDate(search.startDate);

    const endDateLY = sameWeekDayLastYear(search.endDate).date;
    const startDateLY = sameWeekDayLastYear(search.startDate).date;

    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    // This Year
    getSubs(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      1,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(concatTYSubTracker(j.subs));
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }

            for (let page = 2; page <= j.total_pages; page++) {
              getSubs(
                context.url,
                context.token,
                start,
                end,
                useGroups,
                searchValue,
                singleStore,
                0,
                0,
                page,
              )
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    dispatch(concatTYSubTracker(j.subs));
                    pages.find((p) => p.page === page)!.fetched = true;

                    if (pages.every((p) => p.fetched)) {
                      dispatch(setLoadingTYTrackerData(false));
                      setIsLoading(false);
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            dispatch(setLoadingTYTrackerData(false));
            setIsLoading(false);
          }
        } else {
          dispatch(setLoadingTYTrackerData(false));
          setIsLoading(false);
          dispatch(setNoTrackerFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    // Getting Last Year
    getSubs(
      context.url,
      context.token,
      startDateLY,
      endDateLY,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      1,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(concatLYSubTracker(j.subs));
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }

            for (let page = 2; page <= j.total_pages; page++) {
              getSubs(
                context.url,
                context.token,
                startDateLY,
                endDateLY,
                useGroups,
                searchValue,
                singleStore,
                0,
                0,
                page,
              )
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    dispatch(concatLYSubTracker(j.subs));
                    pages.find((p) => p.page === page)!.fetched = true;

                    if (pages.every((p) => p.fetched)) {
                      dispatch(setLoadingLYTrackerData(false));
                      setIsLoading(false);
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            dispatch(setLoadingLYTrackerData(false));
            setIsLoading(false);
          }
        } else {
          dispatch(setLoadingLYTrackerData(false));
          setIsLoading(false);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  // Just render the mobile or tablet version and cut down on excessive operations
  if (context.isMobile) return <SalesMobile />;
  if (context.isTablet) return <SalesTablet />; // commenting this out for publishing until it's ready

  // ///////////////////////////////////////////////////////////////////

  const pageContainer =
    "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none";
  const gridContainer =
    "grid grid-cols-[17%_83%] gap-2 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]";

  const hasData =
    dashboardOption !== "tracker" &&
    salesPanels.length > 0 &&
    hourlySales.length > 0 &&
    weeklySales.length > 0 &&
    subSales.length > 0
      ? true
      : false;

  const queryCheck =
    dashboardOption !== "tracker" &&
    (!queryChecker.hourly ||
      !queryChecker.subs ||
      !queryChecker.topTen ||
      !queryChecker.weekly);

  return (
    <div data-testid="sales-page" className={pageContainer}>
      <div className={gridContainer}>
        <SubsCompareModal />
        <div className={`h-full md:grid-rows-[267px_1fr] md:gap-2`}>
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <SingleSelect
              label="Views"
              data={dashboardOptions}
              valueKey="value"
              displayKey="label"
              onSelect={(val) =>
                dispatch(setDashboardOption(val as DashboardOption))
              }
              defaultValue={dashboardOption}
              defaultQuery={
                dashboardOptions.filter((o) => o.value === dashboardOption)[0]
                  .label
              }
              innerClass="py-1.5 text-sm"
            />
            <StorePicker />
            {dashboardOption !== "tracker" ? (
              <SingleDatePicker />
            ) : (
              <DatePickers showBtn={false} />
            )}
            <button
              className={`btn-themeBlue w-full mt-2 py-1.5 text-sm`}
              onClick={getSalesPanels}
            >
              Search
            </button>
          </div>
          {salesPanels.length > 0 && dashboardOption !== "tracker" ? (
            <div
              className={`max-h-[calc(100vh-378px)] overflow-y-scroll no-scrollbar mt-2`}
            >
              <SalesPanels />
            </div>
          ) : null}
          {dashboardOption === "tracker" ? <WeekCards /> : null}
        </div>

        {isLoading ? (
          <div className="relative md:min-h-[calc(100vh-4.2rem)] md:max-h-[calc(100vh-4.2rem)]">
            <LoadingIndicator
              message={
                dashboardOption !== "tracker"
                  ? "Loading sales overview"
                  : "Loading sales tracker"
              }
            />
          </div>
        ) : (
          <>
            {dashboardOption !== "tracker" ? (
              <>
                {!noPanelsFound && hasData ? (
                  <div className="md:min-h-[calc(100vh-4.2rem)] md:max-h-[calc(100vh-4.2rem)] grid grid-rows-[152px_1fr] overflow-y-auto no-scrollbar md:space-y-2 overflow-hidden">
                    <KpiHeader />
                    <div className="grid grid-cols-[42%_1fr] gap-2 h-[calc(100vh-232px)]">
                      <div className="grid grid-rows-[282px_1fr] gap-2 h-full">
                        <HourlyGrid />
                        <TopTen />
                      </div>
                      <div className="grid gap-2 h-full grid-rows-[220px_1fr]">
                        <SubDeptComps />
                        <SubDeptGrid />
                        {/* <div className="flex flex-col gap-1 h-full min-h-0">
                          <div className="flex gap-1 shrink-0">
                            <button
                              className={`px-3 py-0.5 text-xs rounded ${subView === "grid" ? "btn-themeBlue" : "bg-custom-white text-gray-500 border border-gray-200"}`}
                              onClick={() => setSubView("grid")}
                            >
                              Grid
                            </button>
                            <button
                              className={`px-3 py-0.5 text-xs rounded ${subView === "dist" ? "btn-themeBlue" : "bg-custom-white text-gray-500 border border-gray-200"}`}
                              onClick={() => setSubView("dist")}
                            >
                              Distribution
                            </button>
                          </div>
                          <div className="flex-1 min-h-0 overflow-hidden">
                            {subView === "grid" ? <SubDeptGrid /> : <SubDeptDistribution />}
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="md:min-h-[calc(100vh-4.2rem)] md:max-h-[calc(100vh-4.2rem)] relative flex items-center justify-center">
                    {queryCheck && !noPanelsFound && isLoading ? (
                      <LoadingIndicator message="Loading sales overview" />
                    ) : noPanelsFound ? (
                      <NoPanelsFound dashboardOption={dashboardOption} />
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <SalesTracker />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sales;
