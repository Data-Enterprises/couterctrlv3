// HOOKS
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { addDays, formatGoliathDate } from "../../utils";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";
import {
  getTopTen,
  getHourlyStoreDepts,
  salesTwoDates,
  getWeekly,
} from "../../api/sales";
import {
  setTopTenItems,
  setDepartmentSales,
  setSalesPanels,
  resetSalesSlice,
  setWeeklySales,
  setPanelsLoading,
  setSalesPanelSearchText,
  setSalesPanelDateText,
} from "../../features/salesSlice";
import { useHeight } from "./utils/hooks";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import WeeklyNetSales from "./components/WeeklyNetSales";
import DepartmentSales from "./components/DepartmentSales";
import TopTenItems from "./components/TopTenItems";
import SalesPanels from "./panels/SalesPanels";
import Windows from "./components/Windows";

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
    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

    const topTenId =
      search.type === "Store" ? search.lastStore : search.lastGroup;
    getTopTen(context.url, context.token, topTenId, search.type, start, end)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setTopTenItems(j.items));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Top Ten data: " + err.message);
      });

    // hourly store depts => working => needs to take in a group id as well???
    getHourlyStoreDepts(
      context.url,
      context.token,
      search.lastStore,
      start,
      end
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setDepartmentSales(j.sales));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Hourly Store Depts data: " + err.message);
      });

    // If Stores is the search type, then both are 0 and we get all stores for salesTwoDates
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    dispatch(setPanelsLoading(true));
    salesTwoDates(
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
          const sorted = [...j.items].sort(
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

    // Works for now, but will need to handle groups and all stores (once I get those api endpoints)
    const weeklyStart = addDays(search.endDate, -8).toISOString().split("T")[0];

    getWeekly(
      context.url,
      context.token,
      weeklyStart,
      end,
      useGroups,
      searchValue,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setWeeklySales(j.sales));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching weekly data: " + err.message)
      );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "store" | "date"
  ) => {
    if (type === "date") {
      dispatch(setSalesPanelDateText(e.target.value));
    } else {
      dispatch(setSalesPanelSearchText(e.target.value));
    }
  };

  return (
    <div
      data-testid="sales-page"
      className="w-full h-[calc(100vh-3rem)] p-4 select-none"
    >
      <Windows />
      <div ref={gridRef} className="grid grid-cols-4 gap-4 h-full">
        <div className="grid gap-1 max-h-[calc(100vh-7px)] grid-rows-[0.5fr_1fr_1fr] no-scrollbar">
          <div className="bg-custom-white rounded-lg p-2 shadow-lg">
            <StorePicker />
            <DatePickers handleQuery={getData} />
          </div>
          <div className="row-span-2 rounded-lg">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div className="w-full">
                <label className="font-medium text-sm ml-1">Search Store</label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  value={sales.salesPanelSearchText}
                  onChange={(e) => handleChange(e, "store")}
                />
              </div>
              <div className="w-full hidden">
                <label className="font-medium text-sm ml-1">Search Date</label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  value={sales.salesPanelDateText}
                  onChange={(e) => handleChange(e, "date")}
                />
              </div>
            </div>
            <div
              className="overflow-scroll no-scrollbar rounded-lg"
              style={{ height: height, maxHeight: height }}
            >
              <SalesPanels />
            </div>
          </div>
        </div>
        <div className="grid grid-rows-2 col-span-3 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <WeeklyNetSales />
            <TopTenItems />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DepartmentSales />
            <div className="bg-custom-white rounded-lg shadow-lg">Card</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
