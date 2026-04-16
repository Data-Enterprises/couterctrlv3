import { useState } from "react";
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
  const { username } = useAppSelector((state) => state.user);
  const {
    queryChecker,
    weeklySales,
    hourlySales,
    subSales,
    topTenItems,
    salesPanels,
  } = useAppSelector((state) => state.sales);
  const [showLoading, setShowLoading] = useState<boolean>(false);

  // useEffect(() => {
  //   getSalesPanels();
  // }, []);

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
    setShowLoading(true);
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
        setShowLoading(false);
      });
  };

  // Just render the mobile version and cut down on excessive operations
  // if (context.isMobile) return <SalesMobile />;

  const pageContainer =
    "w-full min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-scroll no-scrollbar p-4 select-none";
  const gridContainer =
    "grid grid-cols-[18%_81%] gap-4 min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]";

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
      <div className={gridContainer}>
        <SubsCompareModal />
        <div className={`h-full md:grid-rows-[267px_1fr] md:gap-2`}>
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <StorePicker />
            <SingleDatePicker />
            <button className="btn-themeBlue w-full mt-2" onClick={getSalesPanels}>
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
          <div className="md:min-h-[calc(100vh-4.2rem)] md:max-h-[calc(100vh-4.2rem)] grid grid-rows-[152px_1fr] overflow-y-auto no-scrollbar md:space-y-2 overflow-hidden">
            <KpiHeader />
            <div className="grid grid-cols-[45%_1fr] gap-2 h-[calc(100vh-232px)]">
              <div className="grid grid-rows-[282px_1fr] gap-2 h-full">
                <HourlyGrid />
                <TopTen />
              </div>
              <div className="grid gap-2 h-full grid-rows-[180px_1fr]">
                <SubDeptComps />
                <SubDeptGrid />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Sales;
