// HOOKS
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatGoliathDate } from "../../utils";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import { getSalesPanels } from "../../api/sales";
import {
  setSalesPanels,
  resetSalesSlice,
  setPanelsLoading,
  setSalesPanelSearchText,
  setSelectedSalesPanel,
} from "../../features/salesSlice";
import { useHeight } from "./utils/hooks";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import WeeklyNetSales from "./components/WeeklyNetSales";
import DepartmentSales from "./components/DepartmentSales";
import TopTenItems from "./components/TopTenItems";
import SalesPanels from "./panels/SalesPanels";
import Hourly from "./components/Hourly";
import Subs from "./subs/Subs";
import Carousel from "../../components/Carousel";

const Sales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);
  const { gridRef, height } = useHeight();

  useEffect(() => {
    // On mount
    if (context.token) {
      getData();
    }

    return () => {
      dispatch(resetSalesSlice());
    };
  }, [context.token]);

  const getData = () => {
    // Stops the line chart in WeeklyNetSales.tsx from going haywire
    dispatch(
      setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" })
    );

    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

    // If Stores is the search type, then both are 0 and we get all stores for salesTwoDates
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    dispatch(setPanelsLoading(true));
    getSalesPanels(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const sorted = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          );
          dispatch(setSalesPanels(sorted));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      })
      .finally(() => dispatch(setPanelsLoading(false)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSalesPanelSearchText(e.target.value));
  };

  const pageContainer = context.isDesktop
    ? "w-full h-[calc(100vh-3rem)] p-4 select-none"
    : "p-4 max-h-screen overflow-y-scroll";
  const gridContainer = context.isDesktop
    ? " grid grid-cols-[20%_79%] gap-4 h-full"
    : "";

  return (
    <div data-testid="sales-page" className={pageContainer}>
      <div ref={gridRef} className={gridContainer}>
        <div className="md:grid md:gap-1 md:max-h-[calc(100vh-7px)] md:grid-rows-[0.5fr_1fr_1fr] no-scrollbar">
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} />
          </div>
          {context.isDesktop && (
            <div className="md:row-span-2 rounded-lg">
              <div className="mb-2 flex items-end justify-between gap-2">
                <div className="w-full">
                  <label className="font-medium text-sm ml-1">
                    Search Store
                  </label>
                  <input
                    data-testid="sales-panel-filter-input"
                    className="basic-input focus:border bg-custom-white"
                    value={sales.salesPanelSearchText}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
              </div>
              <div
                className="md:overflow-scroll md:no-scrollbar md:rounded-lg"
                style={{ height: height, maxHeight: height }}
              >
                <SalesPanels />
              </div>
            </div>
          )}
        </div>
        <div className="md:grid md:grid-rows-2 md:gap-3">
          <div className="md:grid md:grid-cols-2 md:gap-3">
            <WeeklyNetSales />

            <div className="h-full shadow-lg">
              {context.isDesktop ? (
                <Carousel className="bg-custom-white h-[100%]">
                  <Hourly />
                  <TopTenItems />
                </Carousel>
              ) : (
                <TopTenItems />
              )}
            </div>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-3">
            {context.isDesktop && <DepartmentSales />}
            <Subs />
          </div>
          {!context.isDesktop && <SalesPanels />}
        </div>
      </div>
    </div>
  );
};

export default Sales;
