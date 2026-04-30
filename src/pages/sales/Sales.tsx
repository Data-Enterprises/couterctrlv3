// import { useState } from "react";
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
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SubsCompareModal from "./subsCompare/SubsCompareModal";
import SalesMobile from "./mobile/SalesMobile";
import SalesTracker from "./tracker/SalesTracker";
import WeekCards from "./tracker/WeekCards";
// import SalesTablet from "./tablet/SalesTablet";

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
  setPanelsLoading,
  setRefreshOverviewData,
  setRightSubCompare,
  setSalesPanels,
  setSelectedSalesPanel,
  type DashboardOption,
} from "../../features/salesSlice";

// utils
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../utils";
import type { JsonError } from "../../interfaces";
import SingleSelect from "../../components/SingleSelect";
import DatePickers from "../../components/datePickers/DatePickers";

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
  // const [noPanelsFound, setNoPanelsFound] = useState<boolean>(false);
  const { queryChecker, salesPanels, dashboardOption } = useAppSelector(
    (state) => state.sales,
  );

  const getSalesPanels = async () => {
    dispatch(reQuery());
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
      });
  };

  const getSubsTracker = () => {
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
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            dispatch(setLoadingTYTrackerData(false));
          }
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
                    }
                  }
                })
                .catch((err: JsonError) => toast.error(err.message));
            }
          } else {
            dispatch(setLoadingLYTrackerData(false));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  // Just render the mobile or tablet version and cut down on excessive operations
  if (context.isMobile) return <SalesMobile />;
  // if (context.isTablet) return <SalesTablet />; // commenting this out for publishing until it's ready

  // ///////////////////////////////////////////////////////////////////

  const pageContainer =
    "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none";
  const gridContainer =
    "grid grid-cols-[17%_83%] gap-2 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]";

  const isLoading =
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
          <div className="relative">
            {salesPanels.length ? (
              <LoadingIndicator message="Loading sales overview" />
            ) : null}
          </div>
        ) : (
          <>
            {dashboardOption !== "tracker" ? (
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
                  </div>
                </div>
              </div>
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
