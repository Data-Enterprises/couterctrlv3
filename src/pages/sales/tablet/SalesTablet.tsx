import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Components
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import Input from "../../../components/inputs/Input";
import StorePicker from "../../../components/storePicker/StorePicker";
import SalesPanels from "../panels/SalesPanels";
import WeekCards from "../tracker/WeekCards";
import {
  clearLYSubTracker,
  clearTYSubTracker,
  concatLYSubTracker,
  concatTYSubTracker,
  reQuery,
  setLeftSubCompare,
  setLoadingLYTrackerData,
  setLoadingTYTrackerData,
  setMainView,
  setPanelsLoading,
  setRefreshOverviewData,
  setRightSubCompare,
  setSalesPanels,
  setSelectedSalesPanel,
  setWeeksBack,
} from "../../../features/salesSlice";
import type { JsonError } from "../../../interfaces";
import { getSubs, getWeekly } from "../../../api/sales";
import { getWeeksBackDate } from "../utils";
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../utils";
import SubDeptComps from "../charts/SubDeptComps";
import SubDeptGrid from "../charts/SubDeptGrid";
import TopTen from "../charts/TopTen";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SalesWeeklyTotals from "./SalesWeeklyTotals";
import TotalsBarTablet from "./TotalsBarTablet";
import HourlyGridTablet from "./HourlyGridTablet";

const SalesTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { queryChecker, salesPanels, mainView, weeksBack } = useAppSelector(
    (state) => state.sales,
  );

  const getSalesPanels = async () => {
    if (mainView === "tracker") {
      dispatch(setMainView("overview"));
      return;
    }
    dispatch(reQuery());
    dispatch(setRefreshOverviewData(true));
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
    const end = formatGoliathDate(search.singleDate);
    const start = getWeeksBackDate(search.singleDate, Number(weeksBack));

    const endDateLY = sameWeekDayLastYear(search.singleDate).date;
    const startDateLY = getWeeksBackDate(
      sameWeekDayLastYear(search.singleDate).date,
      Number(weeksBack),
    );

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

  const handleWeeksBackChange = (value: string) => {
    const num = Number(value);
    if (!isNaN(num) && num >= 0) {
      dispatch(setWeeksBack(value));
    }
  };

  const handleTrackerBtnClick = () => {
    dispatch(setMainView("tracker"));
    dispatch(clearTYSubTracker());
    dispatch(clearLYSubTracker());
    dispatch(setLoadingTYTrackerData(true));
    dispatch(setLoadingLYTrackerData(true));
    // Getting the Subs Data for the tracker
    getSubsTracker();
  };

  const isLoading =
    mainView === "overview" &&
    (!queryChecker.hourly ||
      !queryChecker.subs ||
      !queryChecker.topTen ||
      !queryChecker.weekly);

  return (
    <div className="w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-2 select-none grid gap-2 grid-cols-[30%_69%]">
      <div className={`h-full grid-rows-[267px_1fr] gap-2`}>
        <div className="bg-custom-white rounded-lg p-2 shadow-lg">
          <StorePicker />
          <SingleDatePicker />
          <button
            className={`${mainView === "overview" ? "btn-themeGreen" : "btn-themeBlue"} w-full mt-2 py-1.5 text-sm`}
            onClick={getSalesPanels}
          >
            Weekly Sales
          </button>
          <div className={`grid grid-cols-2 gap-2 items-end text-sm`}>
            <Input
              label="Weeks Back"
              value={weeksBack}
              setValue={handleWeeksBackChange}
            />

            <button
              className={`${mainView === "tracker" ? "btn-themeGreen" : "btn-themeBlue"} py-1.5 px-0`}
              onClick={handleTrackerBtnClick}
            >
              Tracker
            </button>
          </div>
        </div>
        {salesPanels.length > 0 && mainView === "overview" ? (
          <div
            className={`max-h-[calc(100vh-377px)] overflow-y-scroll no-scrollbar mt-2`}
          >
            <SalesPanels />
          </div>
        ) : null}
        {mainView === "tracker" ? <WeekCards /> : null}
      </div>
      {isLoading ? (
        <div className="relative">
          {salesPanels.length ? (
            <LoadingIndicator message="Loading sales data" />
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-4.2rem)] overflow-y-scroll no-scrollbar">
          <SalesWeeklyTotals />
          <TotalsBarTablet />
          <HourlyGridTablet />
          <SubDeptComps />
          <SubDeptGrid />
          <TopTen />
        </div>
      )}
    </div>
  );
};

export default SalesTablet;
