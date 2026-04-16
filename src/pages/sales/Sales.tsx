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
// import SalesMobile from "./mobile/SalesMobile";

// Dispatchers
import {
  reQuery,
  setLeftSubCompare,
  setPanelsLoading,
  setRightSubCompare,
  setSalesPanels,
  setSelectedSalesPanel,
} from "../../features/salesSlice";

// utils
import { addDays, formatGoliathDate } from "../../utils";
import type { JsonError } from "../../interfaces";

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { queryChecker, salesPanels } = useAppSelector((state) => state.sales);

  const getSalesPanels = async () => {
    dispatch(reQuery());
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

  // Just render the mobile version and cut down on excessive operations
  // if (context.isMobile) return <SalesMobile />;

  // const pageContainer =
  //   "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none";
  // const gridContainer =
  //   "grid grid-cols-[17%_83%] gap-2 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]";

    const pageContainer = context.isDesktop
      ? "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none"
      : "min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 overflow-y-scroll bg-bkg";
    const gridContainer = context.isDesktop
      ? " grid grid-cols-[18%_81%] gap-4 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]"
      : "h-full";

  const isLoading =
    !queryChecker.hourly ||
    !queryChecker.subs ||
    !queryChecker.topTen ||
    !queryChecker.weekly;

  return (
    <div data-testid="sales-page" className={pageContainer}>
      {!context.isMobile ? (
        <div className={gridContainer}>
          <SubsCompareModal />
          <div className={`h-full md:grid-rows-[267px_1fr] md:gap-2`}>
            <div className="bg-custom-white rounded-lg p-2 shadow-lg">
              <StorePicker />
              <SingleDatePicker />
              <button
                className="btn-themeBlue w-full mt-2"
                onClick={getSalesPanels}
              >
                Search
              </button>
            </div>
            {salesPanels.length > 0 ? (
              <div
                className={`max-h-[calc(100vh-340px)] overflow-y-scroll no-scrollbar mt-2`}
              >
                <SalesPanels />
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="relative">
              {salesPanels.length ? (
                <LoadingIndicator message="Loading sales data" />
              ) : null}
            </div>
          ) : (
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
          )}
        </div>
      ) : (
        <div className={gridContainer}>
          {/* <ReportBuilder /> */}
          <div className="md:grid h-full md:grid-rows-[25%_74%] md:gap-4">
            <div className="bg-custom-white rounded-lg p-3 shadow-lg space-y-1">
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

          {isLoading ? (
            <div className="relative">
              {salesPanels.length ? (
                <LoadingIndicator message="Loading sales data..." />
              ): null}
            </div>
          ) : (
            <div className="overflow-hidden">
              <KpiHeader />
              <SubDeptGrid />
              <SubDeptComps />
              <HourlyGrid />
              <TopTen />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sales;
